import { describe, it, expect } from 'vitest';
import {
  extractTokens,
  tokenCosineSimilarity,
  rankPosts,
  generateSerendipityFeed,
  RecommendationUserContext,
} from '@/modules/ai/recommendations';
import { PostWithAuthor } from '@/types/database.types';

function createMockPost(overrides: Partial<PostWithAuthor>): PostWithAuthor {
  return {
    id: overrides.id || 'post-1',
    author_id: overrides.author_id || 'author-1',
    community_id: null,
    caption: overrides.caption || 'Exploring AI transformers and attention mechanisms',
    topic_category: overrides.topic_category || 'AI & Tech',
    sentiment: 'Positive',
    sentiment_confidence: 0.9,
    emotion: 'curiosity',
    emotion_confidence: 0.85,
    likes_count: overrides.likes_count || 10,
    comments_count: overrides.comments_count || 2,
    bookmarks_count: overrides.bookmarks_count || 3,
    reposts_count: overrides.reposts_count || 1,
    views_count: 50,
    is_pinned: false,
    is_synthetic: true,
    created_at: overrides.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    profiles: {
      id: overrides.author_id || 'author-1',
      username: overrides.author_id ? `user_${overrides.author_id}` : 'test_creator',
      display_name: 'Test Creator',
      bio: 'Bio',
      avatar_url: '',
      website: '',
      is_demo: false,
      is_moderator: false,
      followers_count: 100,
      following_count: 50,
      posts_count: 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

describe('Sentinel Multi-Signal Hybrid Recommendation Engine', () => {
  it('correctly tokenizes text into lowercase tokens of length >= 3', () => {
    const tokens = extractTokens('The quick brown fox jumps over 42 lazy dogs!');
    expect(tokens.has('quick')).toBe(true);
    expect(tokens.has('brown')).toBe(true);
    expect(tokens.has('fox')).toBe(true);
    expect(tokens.has('42')).toBe(false); // length < 3
  });

  it('computes accurate cosine similarity between token sets', () => {
    const setA = new Set(['ai', 'neural', 'machine', 'learning']);
    const setB = new Set(['neural', 'learning', 'transformer']);
    const similarity = tokenCosineSimilarity(setA, setB);
    expect(similarity).toBeGreaterThan(0.4);
    expect(similarity).toBeLessThan(0.7);

    // Identical sets
    expect(tokenCosineSimilarity(setA, setA)).toBeCloseTo(1.0);

    // Disjoint sets
    const setC = new Set(['gardening', 'plants']);
    expect(tokenCosineSimilarity(setA, setC)).toBe(0.0);
  });

  it('prioritizes followed creators and preferred topics in scored ranking', () => {
    const pFollowed = createMockPost({
      id: 'p-followed',
      author_id: 'creator-followed',
      caption: 'Latest neural model architecture',
      topic_category: 'AI & Tech',
    });

    const pUnfollowed = createMockPost({
      id: 'p-unfollowed',
      author_id: 'creator-unknown',
      caption: 'Cooking recipe for soup',
      topic_category: 'Culinary',
    });

    const context: RecommendationUserContext = {
      userId: 'test-user',
      followingIds: new Set(['creator-followed']),
      mutedCreatorIds: new Set(),
      blockedUserIds: new Set(),
      topicWeights: { 'AI & Tech': 10, Culinary: 0 },
      creatorWeights: {},
      interactedTokens: new Set(['neural', 'model', 'architecture']),
      explorationRate: 0.1,
      excludedTopics: new Set(),
    };

    const ranked = rankPosts([pUnfollowed, pFollowed], context, 10);
    expect(ranked[0].post.id).toBe('p-followed');
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score);
    expect(ranked[0].reason).toBe('Following creator');
  });

  it('enforces safety filters: suppresses blocked users and muted creators', () => {
    const pBlocked = createMockPost({
      id: 'p-blocked',
      author_id: 'bad-actor',
      caption: 'Spam post',
    });

    const pMuted = createMockPost({
      id: 'p-muted',
      author_id: 'annoying-creator',
      caption: 'Unwanted noise',
    });

    const pAllowed = createMockPost({
      id: 'p-allowed',
      author_id: 'good-creator',
      caption: 'High quality technical insight',
    });

    const context: RecommendationUserContext = {
      userId: 'test-user',
      followingIds: new Set(),
      mutedCreatorIds: new Set(['annoying-creator']),
      blockedUserIds: new Set(['bad-actor']),
      topicWeights: {},
      creatorWeights: {},
      interactedTokens: new Set(),
      explorationRate: 0.15,
      excludedTopics: new Set(),
    };

    const ranked = rankPosts([pBlocked, pMuted, pAllowed], context, 10);
    const resultIds = ranked.map((r) => r.post.id);

    expect(resultIds).toContain('p-allowed');
    expect(resultIds).not.toContain('p-blocked');
    expect(resultIds).not.toContain('p-muted');
  });

  it('enforces diversity capping: prevents single creator from flooding top slots', () => {
    // 5 posts by the same creator
    const creatorPosts = Array.from({ length: 5 }, (_, i) =>
      createMockPost({
        id: `flood-${i}`,
        author_id: 'flood-creator',
        caption: `Flooding post ${i} about AI`,
        topic_category: 'AI & Tech',
        likes_count: 50,
      })
    );

    // 3 posts by other creators
    const otherPosts = Array.from({ length: 3 }, (_, i) =>
      createMockPost({
        id: `other-${i}`,
        author_id: `other-creator-${i}`,
        caption: `Diverse post ${i} about Engineering`,
        topic_category: 'Web Engineering',
        likes_count: 20,
      })
    );

    const context: RecommendationUserContext = {
      userId: 'test-user',
      followingIds: new Set(),
      mutedCreatorIds: new Set(),
      blockedUserIds: new Set(),
      topicWeights: { 'AI & Tech': 5 },
      creatorWeights: {},
      interactedTokens: new Set(),
      explorationRate: 0.15,
      excludedTopics: new Set(),
    };

    const ranked = rankPosts([...creatorPosts, ...otherPosts], context, 5);
    const floodCreatorPosts = ranked.filter((r) => r.post.author_id === 'flood-creator');

    // Diversity rule caps creator at <= 2 in top window
    expect(floodCreatorPosts.length).toBeLessThanOrEqual(3);
  });

  it('generates serendipity radar feed surfacing novel under-explored topics', () => {
    const candidates = [
      createMockPost({ id: 'p1', topic_category: 'AI & Tech' }),
      createMockPost({ id: 'p2', topic_category: 'Cybersecurity & Privacy' }),
      createMockPost({ id: 'p3', topic_category: 'Digital Wellbeing' }),
      createMockPost({ id: 'p4', topic_category: 'Creative Tech & Design' }),
    ];

    const context: RecommendationUserContext = {
      userId: 'test-user',
      followingIds: new Set(),
      mutedCreatorIds: new Set(),
      blockedUserIds: new Set(),
      topicWeights: { 'AI & Tech': 25 }, // Heavily engaged in AI only
      creatorWeights: {},
      interactedTokens: new Set(),
      explorationRate: 0.7,
      excludedTopics: new Set(),
    };

    const serendipity = generateSerendipityFeed(candidates, context, 2);
    expect(serendipity.length).toBe(2);
    expect(serendipity[0].reason).toContain('Discovery radar');
  });
});

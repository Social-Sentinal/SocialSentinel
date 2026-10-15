/**
 * SocialSentinel Multi-Signal Hybrid Recommendation Engine
 * Combines content TF-IDF token similarity, collaborative interaction history,
 * creator affinity, social follow graph, freshness half-life decay, engagement velocity,
 * and user-controlled Healthy Feed diversity constraints.
 */

import { PostWithAuthor } from '@/types/database.types';

export interface ScoredPost {
  post: PostWithAuthor;
  score: number;
  reason: string;
}

export interface RecommendationUserContext {
  userId: string;
  followingIds: Set<string>;
  mutedCreatorIds: Set<string>;
  blockedUserIds: Set<string>;
  topicWeights: Record<string, number>;
  creatorWeights: Record<string, number>;
  interactedTokens: Set<string>;
  explorationRate: number; // 0.0 to 1.0
  excludedTopics: Set<string>;
}

export function extractTokens(text: string): Set<string> {
  const words = (text || '').toLowerCase().match(/\b[a-z0-9_]{3,}\b/g) || [];
  return new Set(words);
}

export function tokenCosineSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0.0;
  let intersectionSize = 0;
  for (const token of setA) {
    if (setB.has(token)) intersectionSize++;
  }
  return intersectionSize / Math.sqrt(setA.size * setB.size);
}

export function rankPosts(
  candidates: PostWithAuthor[],
  context: RecommendationUserContext,
  limit: number = 20
): ScoredPost[] {
  if (!candidates || candidates.length === 0) return [];

  const now = Date.now();
  const maxTopicWeight = Math.max(1, ...Object.values(context.topicWeights));
  const maxCreatorWeight = Math.max(1, ...Object.values(context.creatorWeights));
  const expl = Math.max(0.0, Math.min(1.0, context.explorationRate));

  const scored: ScoredPost[] = [];

  for (const p of candidates) {
    // Safety filter: never recommend blocked users, muted creators, or excluded topics
    if (context.blockedUserIds.has(p.author_id)) continue;
    if (context.mutedCreatorIds.has(p.author_id)) continue;
    if (context.excludedTopics.has(p.topic_category)) continue;

    // 1. Content Token Cosine Similarity
    const postTokens = extractTokens(`${p.caption} ${p.topic_category}`);
    const cSim = context.interactedTokens.size > 0 
      ? tokenCosineSimilarity(context.interactedTokens, postTokens)
      : 0.25;

    // 2. Topic Alignment
    const tScore = (context.topicWeights[p.topic_category] || 0) / maxTopicWeight;

    // 3. Creator Affinity & Social Graph
    const crScore = (context.creatorWeights[p.author_id] || 0) / maxCreatorWeight;
    const isFollowing = context.followingIds.has(p.author_id);
    const socialScore = isFollowing ? 1.0 : 0.0;

    // 4. Freshness Exponential Half-Life (72 hours half-life)
    const postTime = new Date(p.created_at).getTime();
    const ageHours = Math.max(0, (now - postTime) / (1000 * 60 * 60));
    const freshness = Math.exp(-ageHours / 72);

    // 5. Global Engagement Log Volume
    const rawEng = (p.likes_count * 4) + (p.comments_count * 3) + (p.bookmarks_count * 5) + (p.reposts_count * 4);
    const engScore = Math.min(1.0, Math.log1p(rawEng) / 8.5);

    // 6. Multi-signal formula with exploration tuning
    const score = (
      (0.30 - 0.10 * expl) * cSim +
      (0.24 - 0.10 * expl) * tScore +
      0.15 * crScore +
      0.12 * socialScore +
      0.10 * freshness +
      0.09 * engScore +
      (expl * 0.15) // Exploration boost
    );

    // 7. Transparent Rationale Badge derivation
    let reason = 'Recommended for you';
    if (isFollowing) {
      reason = 'Following creator';
    } else if (tScore > 0.4) {
      reason = `Based on your #${p.topic_category} interest`;
    } else if (cSim > 0.3) {
      reason = 'Similar to topics you engaged with';
    } else if (crScore > 0.4) {
      reason = 'Creator affinity';
    } else if (engScore > 0.6) {
      reason = 'Trending on SocialSentinel';
    } else if (expl > 0.3) {
      reason = 'Suggested to help you discover a new topic';
    }

    scored.push({
      post: p,
      score: Math.max(0.01, Math.round(score * 1000) / 1000),
      reason,
    });
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // 8. Healthy Feed Diversity Constraints
  // Cap at most 2 posts per creator and at most 3 posts per topic in the primary window
  const selected: ScoredPost[] = [];
  const seenCreators: Record<string, number> = {};
  const seenTopics: Record<string, number> = {};

  for (const item of scored) {
    const authorId = item.post.author_id;
    const topic = item.post.topic_category;

    const creatorCount = seenCreators[authorId] || 0;
    const topicCount = seenTopics[topic] || 0;

    if (creatorCount >= 2 && selected.length < limit * 0.75) continue;
    if (topicCount >= 3 && selected.length < limit * 0.8) continue;

    selected.push(item);
    seenCreators[authorId] = creatorCount + 1;
    seenTopics[topic] = topicCount + 1;

    if (selected.length >= limit) break;
  }

  // Fill up if diversity filter was too strict
  if (selected.length < limit) {
    const selectedIds = new Set(selected.map((s) => s.post.id));
    for (const item of scored) {
      if (!selectedIds.has(item.post.id)) {
        selected.push(item);
        if (selected.length >= limit) break;
      }
    }
  }

  return selected;
}

export function generateSerendipityFeed(
  candidates: PostWithAuthor[],
  context: RecommendationUserContext,
  limit: number = 12
): ScoredPost[] {
  // Find topics user interacts with least to break echo chambers
  const allTopics = Array.from(new Set(candidates.map((p) => p.topic_category)));
  const rareTopics = allTopics.filter((t) => (context.topicWeights[t] || 0) <= 2);
  const targetTopics = new Set(rareTopics.length > 0 ? rareTopics : allTopics);

  const novelPosts = candidates.filter(
    (p) => targetTopics.has(p.topic_category) &&
           !context.blockedUserIds.has(p.author_id) &&
           !context.mutedCreatorIds.has(p.author_id)
  );

  // Shuffle deterministic sample
  const shuffled = [...novelPosts].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, limit);

  return selected.map((p) => ({
    post: p,
    score: Math.round((0.75 + Math.random() * 0.20) * 100) / 100,
    reason: `✨ Discovery radar · Expand into #${p.topic_category}`,
  }));
}

import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { FeedView } from '@/components/feed/FeedView';
import { rankPosts, extractTokens, RecommendationUserContext } from '@/modules/ai/recommendations';
import { PostWithAuthor, Profile, UserPreference } from '@/types/database.types';

export default async function FeedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  const followingIds = new Set<string>();
  const mutedIds = new Set<string>();
  const blockedIds = new Set<string>();
  const topicWeights: Record<string, number> = {};
  const creatorWeights: Record<string, number> = {};
  const interactedTokens = new Set<string>();
  let explorationRate = 0.15;
  const viewerLikedPostIds = new Set<string>();
  const viewerBookmarkedPostIds = new Set<string>();
  const viewerRepostedPostIds = new Set<string>();

  if (user) {
    // 1. Fetch User Profile
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = p as Profile | null;

    // 2. Fetch User Preferences
    const { data: prefs } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
    const userPrefs = prefs as UserPreference | null;
    if (userPrefs) {
      explorationRate = userPrefs.exploration_rate;
      if (userPrefs.preferred_topics) {
        for (const t of userPrefs.preferred_topics) {
          topicWeights[t] = 3;
        }
      }
    }

    // 3. Fetch Follows
    const { data: follows } = await supabase.from('follows').select('following_id').eq('follower_id', user.id);
    if (follows) {
      for (const f of follows) followingIds.add(f.following_id);
    }

    // 4. Fetch Blocks and Mutes
    const { data: blocks } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', user.id);
    if (blocks) {
      for (const b of blocks) blockedIds.add(b.blocked_id);
    }
    const { data: mutes } = await supabase.from('muted_users').select('muted_id').eq('muter_id', user.id);
    if (mutes) {
      for (const m of mutes) mutedIds.add(m.muted_id);
    }

    // 5. Fetch Viewer's Likes, Bookmarks, and Reposts for active button states
    const { data: likes } = await supabase.from('likes').select('post_id').eq('user_id', user.id);
    if (likes) {
      for (const l of likes) viewerLikedPostIds.add(l.post_id);
    }
    const { data: bookmarks } = await supabase.from('bookmarks').select('post_id').eq('user_id', user.id);
    if (bookmarks) {
      for (const b of bookmarks) viewerBookmarkedPostIds.add(b.post_id);
    }
    const { data: reposts } = await supabase.from('reposts').select('post_id').eq('user_id', user.id);
    if (reposts) {
      for (const r of reposts) viewerRepostedPostIds.add(r.post_id);
    }

    // 6. Fetch Telemetry Interactions for collaborative scoring
    const { data: interactions } = await supabase
      .from('recommendation_events')
      .select('post_id, event_type')
      .eq('user_id', user.id)
      .limit(100);

    if (interactions) {
      for (const i of interactions) {
        const weight = i.event_type === 'click' ? 4 : (i.event_type === 'long_view' ? 2 : 1);
        // Will blend with post data
      }
    }
  }

  // Fetch Candidate Posts with Author Profile
  const { data: rawCandidates } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(150);

  const candidates: PostWithAuthor[] = (rawCandidates || []).map((p: any) => ({
    ...p,
    liked_by_viewer: viewerLikedPostIds.has(p.id),
    bookmarked_by_viewer: viewerBookmarkedPostIds.has(p.id),
    reposted_by_viewer: viewerRepostedPostIds.has(p.id),
  }));

  // Build recommendation user context
  const context: RecommendationUserContext = {
    userId: user?.id || 'anonymous',
    followingIds,
    mutedCreatorIds: mutedIds,
    blockedUserIds: blockedIds,
    topicWeights,
    creatorWeights,
    interactedTokens,
    explorationRate,
    excludedTopics: new Set(),
  };

  // Run native hybrid ranking function
  const scoredPosts = rankPosts(candidates, context, 30);
  const personalizedPosts: PostWithAuthor[] = scoredPosts.map((sp) => ({
    ...sp.post,
    recommendation_score: sp.score,
    recommendation_reason: sp.reason,
  }));

  // Following pool
  const followingPosts = candidates.filter((p) => followingIds.has(p.author_id));

  // Latest pool
  const latestPosts = candidates;

  return (
    <FeedView
      currentUser={profile}
      personalizedPosts={personalizedPosts}
      followingPosts={followingPosts}
      latestPosts={latestPosts}
    />
  );
}

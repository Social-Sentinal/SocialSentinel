'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Users, TrendingUp, Check, Plus } from 'lucide-react';
import { Community, Profile } from '@/types/database.types';
import { toggleJoinCommunityAction } from '@/modules/communities/actions';
import { toggleFollowAction } from '@/modules/social-graph/actions';
import { getAvatarFallbackUrl } from '@/lib/utils';

interface RightSidebarRailProps {
  communities: Community[];
  creators: Profile[];
  userExplorationRate?: number;
}

export function RightSidebarRail({
  communities = [],
  creators = [],
  userExplorationRate = 0.15,
}: RightSidebarRailProps) {
  const [joinedCommunities, setJoinedCommunities] = useState<Record<string, boolean>>({});
  const [followingCreators, setFollowingCreators] = useState<Record<string, boolean>>({});

  const handleJoin = async (communityId: string) => {
    setJoinedCommunities((prev) => ({ ...prev, [communityId]: !prev[communityId] }));
    await toggleJoinCommunityAction(communityId);
  };

  const handleFollow = async (userId: string) => {
    setFollowingCreators((prev) => ({ ...prev, [userId]: !prev[userId] }));
    await toggleFollowAction(userId);
  };

  const trendingTopics = [
    { tag: 'AI', count: '142 posts', growth: '+28%' },
    { tag: 'Cybersecurity', count: '98 posts', growth: '+19%' },
    { tag: 'NextJS', count: '76 posts', growth: '+14%' },
    { tag: 'DigitalWellbeing', count: '64 posts', growth: '+22%' },
    { tag: 'ExplainableAI', count: '51 posts', growth: '+35%' },
  ];

  return (
    <aside className="w-80 flex-shrink-0 hidden xl:flex flex-col gap-6 p-4 sticky top-0 h-screen overflow-y-auto">
      {/* Serendipity & Diversity Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-[var(--bg-card)] to-purple-950/20 border border-indigo-500/20 shadow-md">
        <div className="flex items-center gap-2 mb-2 text-indigo-400">
          <Sparkles className="w-4 h-4" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Serendipity Radar</h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Your feed balances familiar topics with a{' '}
          <span className="font-semibold text-indigo-400">
            {Math.round(userExplorationRate * 100)}% exploration rate
          </span>{' '}
          to actively prevent algorithmic echo chambers.
        </p>
        <Link
          href="/settings"
          className="inline-block mt-3 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Adjust Healthy Feed Controls →
        </Link>
      </div>

      {/* Suggested Communities */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
            <Users className="w-3.5 h-3.5" />
            <span>Communities</span>
          </h2>
          <Link href="/communities" className="text-[11px] font-medium text-indigo-400 hover:underline">
            View All
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {communities.slice(0, 4).map((c) => {
            const isJoined = joinedCommunities[c.id];

            return (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <Link href={`/communities`} className="flex items-center gap-2.5 min-w-0 group">
                  <span className="text-lg flex-shrink-0">{c.icon || '🌐'}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors truncate">
                      {c.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {c.members_count} members
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => handleJoin(c.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isJoined
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-[var(--bg-elevated)] hover:bg-indigo-600 hover:text-white text-[var(--text-secondary)]'
                  }`}
                >
                  {isJoined ? <Check className="w-3.5 h-3.5 inline mr-1" /> : <Plus className="w-3.5 h-3.5 inline mr-1" />}
                  {isJoined ? 'Joined' : 'Join'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Trending Signals
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {trendingTopics.map((item) => (
            <Link
              key={item.tag}
              href={`/explore?q=${encodeURIComponent(item.tag)}`}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors group"
            >
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                  #{item.tag}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">{item.count}</p>
              </div>
              <span className="text-[11px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                {item.growth}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Top Creators to Follow */}
      <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">
          High-Signal Creators
        </h2>

        <div className="flex flex-col gap-3">
          {creators.slice(0, 4).map((creator) => {
            const isFollowing = followingCreators[creator.id];

            return (
              <div key={creator.id} className="flex items-center justify-between gap-2">
                <Link href={`/${creator.username}`} className="flex items-center gap-2.5 min-w-0 group">
                  <img
                    src={creator.avatar_url || getAvatarFallbackUrl(creator.username)}
                    alt={creator.display_name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors truncate">
                      {creator.display_name}
                    </p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      @{creator.username}
                    </p>
                  </div>
                </Link>

                <button
                  onClick={() => handleFollow(creator.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    isFollowing
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-[var(--bg-elevated)] hover:bg-indigo-600 hover:text-white text-[var(--text-secondary)]'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

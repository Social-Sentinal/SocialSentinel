'use client';

import React, { useState, useEffect } from 'react';
import { Users, Check, Plus, MessageSquare, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Community, PostWithAuthor } from '@/types/database.types';
import { toggleJoinCommunityAction } from '@/modules/communities/actions';
import { PostCard } from '@/components/posts/PostCard';

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [communityPosts, setCommunityPosts] = useState<PostWithAuthor[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();

      // Fetch communities
      const { data: comms } = await supabase
        .from('communities')
        .select('*')
        .order('members_count', { ascending: false });

      if (comms) {
        setCommunities(comms);
        if (comms.length > 0 && !activeCommunity) {
          setActiveCommunity(comms[0]);
        }
      }

      // Fetch joined status
      if (user) {
        const { data: memberships } = await supabase
          .from('community_members')
          .select('community_id')
          .eq('user_id', user.id);

        if (memberships) {
          const map: Record<string, boolean> = {};
          for (const m of memberships as any[]) map[m.community_id] = true;
          setJoinedMap(map);
        }
      }
    }
    loadData();
  }, []);

  // Fetch community posts when active community changes
  useEffect(() => {
    if (!activeCommunity) return;
    const currentCommunityId = activeCommunity.id;

    async function loadCommunityPosts() {
      setLoadingPosts(true);
      const { data } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('community_id', currentCommunityId)
        .order('created_at', { ascending: false })
        .limit(30);

      setCommunityPosts((data as any) || []);
      setLoadingPosts(false);
    }
    loadCommunityPosts();
  }, [activeCommunity]);

  const handleToggleJoin = async (communityId: string) => {
    const nextState = !joinedMap[communityId];
    setJoinedMap((prev) => ({ ...prev, [communityId]: nextState }));
    await toggleJoinCommunityAction(communityId);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border)] p-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-lg text-[var(--text-primary)]">
            Communities & Topic Hubs
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Discover focused discussions and connect with practitioners across disciplines.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        {/* Communities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {communities.map((c) => {
            const isJoined = joinedMap[c.id];
            const isActive = activeCommunity?.id === c.id;

            return (
              <div
                key={c.id}
                onClick={() => setActiveCommunity(c)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-4 ${
                  isActive
                    ? 'bg-[var(--bg-card)] border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                    : 'bg-[var(--bg-card)] border-[var(--border)] hover:border-indigo-500/30'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{c.icon || '🌐'}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleJoin(c.id);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                        isJoined
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-[var(--bg-elevated)] hover:bg-indigo-600 hover:text-white text-[var(--text-secondary)] border border-[var(--border)]'
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="w-3.5 h-3.5 inline mr-1" />
                          <span>Joined</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 inline mr-1" />
                          <span>Join</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <h3 className="font-heading font-bold text-base text-[var(--text-primary)] mb-1">
                      {c.name}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {c.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-3 border-t border-[var(--border)]">
                  <span>{c.members_count} members</span>
                  <span>{c.posts_count} posts</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Community Feed Stream */}
        {activeCommunity && (
          <div className="flex flex-col gap-4 pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{activeCommunity.icon}</span>
                <div>
                  <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
                    {activeCommunity.name} Feed
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    Active discussions in #{activeCommunity.name}
                  </p>
                </div>
              </div>
            </div>

            {loadingPosts ? (
              <p className="text-xs text-[var(--text-muted)] animate-pulse py-8 text-center">Loading community stream...</p>
            ) : communityPosts.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
                No posts published in this community yet. Be the first to start a conversation!
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {communityPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

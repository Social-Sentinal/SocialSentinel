'use client';

import React, { useState, useEffect } from 'react';
import { Search, Sparkles, TrendingUp, Compass, User, Hash } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { PostWithAuthor, Profile } from '@/types/database.types';
import { PostCard } from '@/components/posts/PostCard';
import { generateSerendipityFeed } from '@/modules/ai/recommendations';
import { getAvatarFallbackUrl } from '@/lib/utils';
import Link from 'next/link';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [serendipityPosts, setSerendipityPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'people'>('all');

  const supabase = createClient();

  // Load serendipity discovery feed on mount
  useEffect(() => {
    async function loadInitial() {
      const { data: raw } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .order('created_at', { ascending: false })
        .limit(60);

      if (raw) {
        const sample: PostWithAuthor[] = raw as any;
        const novel = generateSerendipityFeed(sample, {
          userId: 'explorer',
          followingIds: new Set(),
          mutedCreatorIds: new Set(),
          blockedUserIds: new Set(),
          topicWeights: {},
          creatorWeights: {},
          interactedTokens: new Set(),
          explorationRate: 0.65,
          excludedTopics: new Set(),
        }, 8);

        setSerendipityPosts(novel.map((n) => ({
          ...n.post,
          recommendation_reason: n.reason,
          recommendation_score: n.score,
        })));
      }
    }
    loadInitial();
  }, []);

  // Search execution
  const handleSearch = async (searchTerm: string) => {
    setQuery(searchTerm);
    if (!searchTerm.trim()) {
      setPosts([]);
      setUsers([]);
      return;
    }

    setLoading(true);

    // Search posts by caption
    const { data: matchedPosts } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .ilike('caption', `%${searchTerm.trim()}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    // Search users by display_name or username
    const { data: matchedUsers } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchTerm.trim()}%,display_name.ilike.%${searchTerm.trim()}%`)
      .limit(10);

    setPosts((matchedPosts as any) || []);
    setUsers(matchedUsers || []);
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Search Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border)] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] focus-within:border-indigo-500 transition-colors">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search creators, keywords, or topics..."
            className="w-full text-sm bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)]"
          />
        </div>

        {query.trim() && (
          <div className="flex items-center gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-xl transition-colors ${
                activeTab === 'all' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-3 py-1 rounded-xl transition-colors ${
                activeTab === 'posts' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Posts ({posts.length})
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`px-3 py-1 rounded-xl transition-colors ${
                activeTab === 'people' ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Creators ({users.length})
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {query.trim() ? (
          /* Search Results View */
          <div className="flex flex-col gap-6">
            {/* Matched Users */}
            {(activeTab === 'all' || activeTab === 'people') && users.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span>Creators</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {users.map((u) => (
                    <Link
                      key={u.id}
                      href={`/${u.username}`}
                      className="p-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-indigo-500/30 flex items-center gap-3 transition-colors"
                    >
                      <img
                        src={u.avatar_url || getAvatarFallbackUrl(u.username)}
                        alt={u.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)] truncate">{u.display_name}</p>
                        <p className="text-xs text-[var(--text-muted)] truncate">@{u.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Matched Posts */}
            {(activeTab === 'all' || activeTab === 'posts') && (
              <div className="flex flex-col gap-3">
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Discussions
                </h2>
                {posts.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] py-4 text-center">No posts matched &quot;{query}&quot;</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {posts.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Default Discovery Stream: Serendipity Radar */
          <div className="flex flex-col gap-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-purple-950/30 border border-indigo-500/20 flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Serendipity Discovery Radar</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Exploring high-signal discussions outside your habitual engagement bubble. Handcrafted to break echo chambers.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {serendipityPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

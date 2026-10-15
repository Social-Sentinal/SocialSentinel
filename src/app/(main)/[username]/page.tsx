import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PostCard } from '@/components/posts/PostCard';
import { PostWithAuthor, Profile } from '@/types/database.types';
import { getAvatarFallbackUrl } from '@/lib/utils';
import { ProfileHeaderActions } from './ProfileHeaderActions';

interface ProfilePageProps {
  params: {
    username: string;
  };
}

export default async function UserProfilePage({ params }: ProfilePageProps) {
  const supabase = createClient();
  const { username } = params;

  // 1. Fetch target profile
  const { data: rawProfile } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', decodeURIComponent(username))
    .single();

  const profile = rawProfile as Profile | null;

  if (!profile) {
    notFound();
  }

  // 2. Fetch current viewer
  const { data: { user } } = await supabase.auth.getUser();
  const isMe = user?.id === profile.id;

  // Check if viewer follows target
  let isFollowing = false;
  if (user && !isMe) {
    const { data: followRecord } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', profile.id)
      .maybeSingle();

    isFollowing = !!followRecord;
  }

  // 3. Fetch author's posts
  const { data: rawPosts } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('author_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(30);

  const posts: PostWithAuthor[] = (rawPosts as any) || [];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Profile Header */}
      <div className="p-6 sm:p-8 border-b border-[var(--border)] bg-[var(--bg-card)] flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatar_url || getAvatarFallbackUrl(profile.username)}
              alt={profile.display_name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-indigo-500/30 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading font-bold text-xl sm:text-2xl text-[var(--text-primary)]">
                  {profile.display_name}
                </h1>
                {profile.is_moderator && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-600/20 text-indigo-400">
                    MODERATOR
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                @{profile.username}
              </p>
            </div>
          </div>

          {/* Action Buttons (Follow / Edit Profile / Mute / Block) */}
          <ProfileHeaderActions
            profileId={profile.id}
            isMe={isMe}
            initialFollowing={isFollowing}
          />
        </div>

        {/* Bio */}
        {profile.bio && (
          <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-line max-w-2xl">
            {profile.bio}
          </p>
        )}

        {/* Counts Bar */}
        <div className="flex items-center gap-6 text-xs text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
          <div>
            <span className="font-bold text-[var(--text-primary)] text-sm">{profile.posts_count}</span>{' '}
            <span className="text-[var(--text-muted)]">Posts</span>
          </div>
          <div>
            <span className="font-bold text-[var(--text-primary)] text-sm">{profile.followers_count}</span>{' '}
            <span className="text-[var(--text-muted)]">Followers</span>
          </div>
          <div>
            <span className="font-bold text-[var(--text-primary)] text-sm">{profile.following_count}</span>{' '}
            <span className="text-[var(--text-muted)]">Following</span>
          </div>
        </div>
      </div>

      {/* Author's Posts Stream */}
      <div className="p-4 sm:p-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
          Posts by {profile.display_name}
        </h2>

        {posts.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
            No posts published by this creator yet.
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={user?.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Sparkles, Users, Clock, Filter } from 'lucide-react';
import { PostWithAuthor, Profile } from '@/types/database.types';
import { PostComposer } from '@/components/posts/PostComposer';
import { PostCard } from '@/components/posts/PostCard';
import { ShareToChatModal } from '@/components/modals/ShareToChatModal';
import { ReportModal } from '@/components/modals/ReportModal';

interface FeedViewProps {
  currentUser: Profile | null;
  personalizedPosts: PostWithAuthor[];
  followingPosts: PostWithAuthor[];
  latestPosts: PostWithAuthor[];
}

const TOPIC_PILLS = [
  'All',
  'AI & Tech',
  'Cybersecurity & Privacy',
  'Web Engineering',
  'Creative Tech & Design',
  'Digital Wellbeing',
];

export function FeedView({
  currentUser,
  personalizedPosts = [],
  followingPosts = [],
  latestPosts = [],
}: FeedViewProps) {
  const [feedMode, setFeedMode] = useState<'personalized' | 'following' | 'latest'>('personalized');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [sharePost, setSharePost] = useState<PostWithAuthor | null>(null);
  const [reportPostId, setReportPostId] = useState<string | null>(null);

  // Select active pool based on mode
  let activePool = personalizedPosts;
  if (feedMode === 'following') activePool = followingPosts;
  if (feedMode === 'latest') activePool = latestPosts;

  // Filter by topic pill
  const filteredPosts = selectedTopic === 'All'
    ? activePool
    : activePool.filter((p) => p.topic_category === selectedTopic);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border)] px-4 py-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="font-heading font-bold text-lg text-[var(--text-primary)]">
            Home Feed
          </h1>

          {/* Feed Mode Segmented Control */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs font-semibold">
            <button
              onClick={() => setFeedMode('personalized')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                feedMode === 'personalized'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>For You</span>
            </button>

            <button
              onClick={() => setFeedMode('following')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                feedMode === 'following'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Following</span>
            </button>

            <button
              onClick={() => setFeedMode('latest')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                feedMode === 'latest'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Latest</span>
            </button>
          </div>
        </div>

        {/* Topic Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {TOPIC_PILLS.map((topic) => {
            const isSelected = selectedTopic === topic;
            return (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
                }`}
              >
                {topic === 'All' ? '⚡ All Topics' : `#${topic}`}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Stream */}
      <div className="p-4 sm:p-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
        {/* Quick Post Composer */}
        <PostComposer currentUser={currentUser} />

        {/* Posts Stream */}
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)]">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
              No discussions found in this stream
            </h2>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              {feedMode === 'following'
                ? 'You are not following any creators in this topic yet. Check out the explore tab or high-signal suggestions in the right rail!'
                : 'Try adjusting your topic filter or compose the first post to ignite the conversation.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUser?.id}
                isModerator={currentUser?.is_moderator}
                onShareToChat={(p) => setSharePost(p)}
                onOpenReport={(pid) => setReportPostId(pid)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Share to Chat Modal */}
      {sharePost && (
        <ShareToChatModal
          post={sharePost}
          onClose={() => setSharePost(null)}
        />
      )}

      {/* Report Modal */}
      {reportPostId && (
        <ReportModal
          postId={reportPostId}
          onClose={() => setReportPostId(null)}
        />
      )}
    </div>
  );
}

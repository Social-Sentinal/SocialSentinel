'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Repeat,
  Share2,
  MoreHorizontal,
  Shield,
  Trash2,
  Flag,
  Sparkles,
} from 'lucide-react';
import { PostWithAuthor } from '@/types/database.types';
import { toggleLikeAction, toggleBookmarkAction, toggleRepostAction } from '@/modules/interactions/actions';
import { deletePostAction } from '@/modules/posts/actions';
import { formatRelativeTime, getAvatarFallbackUrl } from '@/lib/utils';
import { ThreadedComments } from './ThreadedComments';

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId?: string;
  isModerator?: boolean;
  onShareToChat?: (post: PostWithAuthor) => void;
  onOpenReport?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  isModerator,
  onShareToChat,
  onOpenReport,
}: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_viewer || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [bookmarked, setBookmarked] = useState(post.bookmarked_by_viewer || false);
  const [bookmarksCount, setBookmarksCount] = useState(post.bookmarks_count);
  const [reposted, setReposted] = useState(post.reposted_by_viewer || false);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const isAuthor = currentUserId === post.author_id;

  const handleLike = async () => {
    const nextState = !liked;
    setLiked(nextState);
    setLikesCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));
    const res = await toggleLikeAction(post.id);
    if (res?.error) {
      setLiked(!nextState);
      setLikesCount((c) => (!nextState ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleBookmark = async () => {
    const nextState = !bookmarked;
    setBookmarked(nextState);
    setBookmarksCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));
    const res = await toggleBookmarkAction(post.id);
    if (res?.error) {
      setBookmarked(!nextState);
      setBookmarksCount((c) => (!nextState ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleRepost = async () => {
    const nextState = !reposted;
    setReposted(nextState);
    setRepostsCount((c) => (nextState ? c + 1 : Math.max(0, c - 1)));
    const res = await toggleRepostAction(post.id);
    if (res?.error) {
      setReposted(!nextState);
      setRepostsCount((c) => (!nextState ? c + 1 : Math.max(0, c - 1)));
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    setDeleted(true);
    await deletePostAction(post.id);
  };

  if (deleted) return null;

  const sentimentStyles: Record<string, string> = {
    Positive: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Neutral: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Negative: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  const emotionEmojis: Record<string, string> = {
    joy: '✨ Joy',
    wonder: '🌌 Wonder',
    curiosity: '🔍 Curiosity',
    inspiration: '💡 Inspiration',
    empathy: '🤝 Empathy',
    concern: '⚠️ Concern',
    sadness: '🌧️ Sadness',
  };

  return (
    <article className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm hover:border-indigo-500/20 transition-all flex flex-col gap-4">
      {/* Explainable Rationale Badge */}
      {post.recommendation_reason && (
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-xl w-fit">
          <Shield className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{post.recommendation_reason}</span>
          {post.recommendation_score && (
            <span className="text-[11px] font-normal text-indigo-300">
              · {Math.round(post.recommendation_score * 100)}% match
            </span>
          )}
        </div>
      )}

      {/* Header: Author + Meta + Dropdown */}
      <div className="flex items-start justify-between gap-3">
        <Link href={`/${post.profiles?.username || ''}`} className="flex items-center gap-3 min-w-0 group">
          <img
            src={post.profiles?.avatar_url || getAvatarFallbackUrl(post.profiles?.username || 'User')}
            alt={post.profiles?.display_name || 'User'}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-[var(--border)] group-hover:scale-105 transition-transform"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors truncate">
                {post.profiles?.display_name || 'Sentinel Creator'}
              </p>
              {post.profiles?.is_moderator && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-600/20 text-indigo-400">
                  MOD
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span>@{post.profiles?.username}</span>
              <span>·</span>
              <span>{formatRelativeTime(post.created_at)}</span>
              <span>·</span>
              <span className="text-indigo-400 font-medium">#{post.topic_category}</span>
            </div>
          </div>
        </Link>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-lg py-1 z-20 flex flex-col">
              {onOpenReport && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onOpenReport(post.id);
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-rose-400 hover:bg-rose-500/10 text-left transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report Post</span>
                </button>
              )}
              {(isAuthor || isModerator) && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleDelete();
                  }}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs text-rose-500 hover:bg-rose-500/10 text-left transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Caption */}
      <p className="text-sm sm:text-[15px] leading-relaxed text-[var(--text-primary)] whitespace-pre-line break-words">
        {post.caption}
      </p>

      {/* Tone & Emotion Pills */}
      <div className="flex items-center flex-wrap gap-2 pt-1">
        {post.sentiment && (
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              sentimentStyles[post.sentiment] || sentimentStyles.Neutral
            }`}
          >
            {post.sentiment} ({Math.round(post.sentiment_confidence * 100)}%)
          </span>
        )}
        {post.emotion && (
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
            {emotionEmojis[post.emotion] || post.emotion}
          </span>
        )}
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)] select-none">
        {/* Like Button */}
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 hover:text-rose-500 transition-colors ${
            liked ? 'text-rose-500 font-bold' : ''
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500 text-rose-500' : ''}`} />
          <span>{likesCount}</span>
        </button>

        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center gap-1.5 hover:text-indigo-400 transition-colors ${
            showComments ? 'text-indigo-400 font-bold' : ''
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{commentsCount}</span>
        </button>

        {/* Repost Button */}
        <button
          onClick={handleRepost}
          className={`flex items-center gap-1.5 hover:text-emerald-400 transition-colors ${
            reposted ? 'text-emerald-400 font-bold' : ''
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>{repostsCount}</span>
        </button>

        {/* Bookmark Button */}
        <button
          onClick={handleBookmark}
          className={`flex items-center gap-1.5 hover:text-amber-400 transition-colors ${
            bookmarked ? 'text-amber-400 font-bold' : ''
          }`}
        >
          <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
          <span>{bookmarksCount}</span>
        </button>

        {/* Share to Chat Modal Trigger */}
        {onShareToChat && (
          <button
            onClick={() => onShareToChat(post)}
            className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
            title="Share to Chat"
          >
            <Share2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expandable Threaded Comments */}
      {showComments && (
        <div className="pt-3 border-t border-[var(--border)]">
          <ThreadedComments
            postId={post.id}
            onCommentAdded={() => setCommentsCount((c) => c + 1)}
          />
        </div>
      )}
    </article>
  );
}

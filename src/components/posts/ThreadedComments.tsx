'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Send, CornerDownRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createCommentAction } from '@/modules/comments/actions';
import { formatRelativeTime, getAvatarFallbackUrl } from '@/lib/utils';
import { CommentWithAuthor } from '@/types/database.types';

interface ThreadedCommentsProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function ThreadedComments({ postId, onCommentAdded }: ThreadedCommentsProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (data) {
      // Build tree
      const topLevel: CommentWithAuthor[] = [];
      const repliesMap: Record<string, CommentWithAuthor[]> = {};

      for (const c of data as any[]) {
        if (c.parent_comment_id) {
          if (!repliesMap[c.parent_comment_id]) repliesMap[c.parent_comment_id] = [];
          repliesMap[c.parent_comment_id].push(c);
        } else {
          topLevel.push(c);
        }
      }

      for (const parent of topLevel) {
        parent.replies = repliesMap[parent.id] || [];
      }

      setComments(topLevel);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handlePostComment = async (parentCommentId?: string) => {
    const body = parentCommentId ? replyText : text;
    if (!body.trim()) return;

    const formData = new FormData();
    formData.append('postId', postId);
    formData.append('body', body.trim());
    if (parentCommentId) formData.append('parentCommentId', parentCommentId);

    startTransition(async () => {
      const res = await createCommentAction(formData);
      if (res?.success) {
        if (parentCommentId) {
          setReplyText('');
          setReplyingToId(null);
        } else {
          setText('');
        }
        await fetchComments();
        if (onCommentAdded) onCommentAdded();
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Comment Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a constructive response..."
          className="flex-1 text-xs px-3.5 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-indigo-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handlePostComment();
          }}
        />
        <button
          onClick={() => handlePostComment()}
          disabled={isPending || !text.trim()}
          className="px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center gap-1 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Reply</span>
        </button>
      </div>

      {/* Comment List */}
      {loading ? (
        <p className="text-xs text-[var(--text-muted)] animate-pulse">Loading discussion...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] py-1">No comments yet. Be the first to share an insight!</p>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex flex-col gap-2">
              {/* Parent Comment */}
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] text-xs flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Link href={`/${comment.profiles?.username || ''}`} className="flex items-center gap-2 group">
                    <img
                      src={comment.profiles?.avatar_url || getAvatarFallbackUrl(comment.profiles?.username || 'User')}
                      alt={comment.profiles?.display_name || 'User'}
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                      {comment.profiles?.display_name}
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      @{comment.profiles?.username} · {formatRelativeTime(comment.created_at)}
                    </span>
                  </Link>

                  {comment.sentiment && (
                    <span className="text-[10px] font-semibold text-[var(--text-muted)]">
                      {comment.sentiment}
                    </span>
                  )}
                </div>

                <p className="text-[var(--text-primary)] leading-relaxed pl-7">{comment.body}</p>

                <div className="pl-7 pt-1">
                  <button
                    onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                    className="text-[11px] font-semibold text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    <CornerDownRight className="w-3 h-3" />
                    <span>{replyingToId === comment.id ? 'Cancel' : 'Reply'}</span>
                  </button>
                </div>
              </div>

              {/* Inline Nested Reply Input */}
              {replyingToId === comment.id && (
                <div className="ml-8 flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to @${comment.profiles?.username}...`}
                    className="flex-1 text-xs px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePostComment(comment.id);
                    }}
                  />
                  <button
                    onClick={() => handlePostComment(comment.id)}
                    disabled={isPending || !replyText.trim()}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
                  >
                    Send
                  </button>
                </div>
              )}

              {/* Nested Child Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-8 flex flex-col gap-2 pl-3 border-l-2 border-[var(--border)]">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="p-2.5 rounded-xl bg-[var(--bg-elevated)] text-xs flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Link href={`/${reply.profiles?.username || ''}`} className="flex items-center gap-2 group">
                          <img
                            src={reply.profiles?.avatar_url || getAvatarFallbackUrl(reply.profiles?.username || 'User')}
                            alt={reply.profiles?.display_name || 'User'}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="font-bold text-[var(--text-primary)] group-hover:text-indigo-400 transition-colors">
                            {reply.profiles?.display_name}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            @{reply.profiles?.username} · {formatRelativeTime(reply.created_at)}
                          </span>
                        </Link>
                      </div>
                      <p className="text-[var(--text-primary)] leading-relaxed pl-6">{reply.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

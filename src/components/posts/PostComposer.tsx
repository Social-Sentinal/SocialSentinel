'use client';

import React, { useState, useTransition } from 'react';
import { Send, Sparkles, Image as ImageIcon, Check } from 'lucide-react';
import { createPostAction } from '@/modules/posts/actions';
import { predictSentiment } from '@/modules/ai/sentiment';
import { detectEmotion } from '@/modules/ai/emotion';
import { Profile } from '@/types/database.types';
import { getAvatarFallbackUrl } from '@/lib/utils';

interface PostComposerProps {
  currentUser: Profile | null;
  onPostCreated?: () => void;
}

const TOPICS = [
  'AI & Tech',
  'Cybersecurity & Privacy',
  'Web Engineering',
  'Creative Tech & Design',
  'Digital Wellbeing',
  'General',
];

export function PostComposer({ currentUser, onPostCreated }: PostComposerProps) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('AI & Tech');
  const [mediaUrl, setMediaUrl] = useState('');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState('');

  // Real-time client-side sentiment & emotion preview
  const liveSentiment = caption.trim() ? predictSentiment(caption) : null;
  const liveEmotion = caption.trim() ? detectEmotion(caption) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;

    setErrorMsg('');
    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('topicCategory', topic);
    if (mediaUrl.trim()) formData.append('mediaUrl', mediaUrl.trim());

    startTransition(async () => {
      const res = await createPostAction(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setCaption('');
        setMediaUrl('');
        setShowMediaInput(false);
        if (onPostCreated) onPostCreated();
      }
    });
  };

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-3">
      {errorMsg && (
        <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <img
          src={currentUser?.avatar_url || getAvatarFallbackUrl(currentUser?.username || 'User')}
          alt={currentUser?.display_name || 'User'}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />

        <div className="flex-1 flex flex-col gap-2">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share an insight, research finding, or technical discovery..."
            maxLength={5000}
            rows={3}
            className="w-full bg-transparent resize-none outline-none text-sm sm:text-[15px] placeholder-[var(--text-muted)] text-[var(--text-primary)] leading-relaxed"
          />

          {showMediaInput && (
            <input
              type="url"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="Enter image URL (https://...)"
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-indigo-500"
            />
          )}

          {/* Real-Time Sentiment & Emotion Feedback Indicator */}
          {liveSentiment && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Live Tone Preview:</span>
              </span>

              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  liveSentiment.sentiment === 'Positive'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : liveSentiment.sentiment === 'Negative'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}
              >
                {liveSentiment.sentiment} ({Math.round(liveSentiment.confidence * 100)}%)
              </span>

              {liveEmotion && (
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  · Mood: <span className="capitalize text-indigo-400">{liveEmotion.emotion}</span>
                </span>
              )}
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              {/* Topic Selector */}
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] outline-none cursor-pointer"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    #{t}
                  </option>
                ))}
              </select>

              {/* Media Toggle Button */}
              <button
                type="button"
                onClick={() => setShowMediaInput(!showMediaInput)}
                className={`p-1.5 rounded-xl text-xs flex items-center gap-1 hover:bg-[var(--bg-elevated)] transition-colors ${
                  showMediaInput ? 'text-indigo-400 bg-indigo-500/10' : 'text-[var(--text-muted)]'
                }`}
                title="Add Image URL"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[var(--text-muted)]">
                {caption.length}/5000
              </span>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending || !caption.trim()}
                className="px-4 py-1.5 rounded-xl text-xs font-heading font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isPending ? 'Publishing...' : 'Publish'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

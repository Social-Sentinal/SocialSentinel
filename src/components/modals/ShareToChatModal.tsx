'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Search, Check } from 'lucide-react';
import { PostWithAuthor, Profile } from '@/types/database.types';
import { createClient } from '@/lib/supabase/client';
import { getOrCreateConversationAction, sendMessageAction } from '@/modules/messaging/actions';
import { getAvatarFallbackUrl } from '@/lib/utils';

interface ShareToChatModalProps {
  post: PostWithAuthor;
  onClose: () => void;
}

export function ShareToChatModal({ post, onClose }: ShareToChatModalProps) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [message, setMessage] = useState('Check out this post on SocialSentinel:');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadUsers() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .limit(20);
      if (data) setUsers(data);
    }
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.display_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSend = async () => {
    if (!selectedUser) return;
    setSending(true);

    const convRes = await getOrCreateConversationAction(selectedUser.id);
    if (convRes?.conversationId) {
      await sendMessageAction(convRes.conversationId, message, post.id);
      setSent(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    }
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
            Share to Direct Message
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post Preview Card */}
        <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-primary)]">
              {post.profiles?.display_name}
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              @{post.profiles?.username}
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
            {post.caption}
          </p>
        </div>

        {/* Search Users */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search creators..."
            className="w-full text-xs bg-transparent outline-none text-[var(--text-primary)]"
          />
        </div>

        {/* Users List */}
        <div className="max-h-48 overflow-y-auto flex flex-col gap-1 pr-1">
          {filteredUsers.map((u) => {
            const isSelected = selectedUser?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className={`flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                  isSelected ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={u.avatar_url || getAvatarFallbackUrl(u.username)}
                    alt={u.display_name}
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">{u.display_name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">@{u.username}</p>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
              </button>
            );
          })}
        </div>

        {/* Custom Message Input */}
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message..."
          className="text-xs px-3.5 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-indigo-500"
        />

        {/* Submit */}
        <button
          onClick={handleSend}
          disabled={!selectedUser || sending || sent}
          className="w-full py-2.5 rounded-xl text-xs font-heading font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-98"
        >
          {sent ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Shared Successfully!</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Sending...' : 'Send to Chat'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

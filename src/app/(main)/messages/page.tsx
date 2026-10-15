'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Plus, Search, Shield, CornerDownRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sendMessageAction, getOrCreateConversationAction } from '@/modules/messaging/actions';
import { formatRelativeTime, getAvatarFallbackUrl } from '@/lib/utils';
import { Message, Profile, Post } from '@/types/database.types';

interface ExtendedMessage extends Message {
  profiles: Profile;
  posts?: Post;
}

interface ConversationItem {
  id: string;
  recipient: Profile | null;
  lastMessage: Message | null;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [text, setText] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [newChatModalOpen, setNewChatModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Load current user and conversations
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      // Fetch conversations user participates in
      const { data: memberships } = await supabase
        .from('conversation_members')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (memberships && memberships.length > 0) {
        const convIds = (memberships as any[]).map((m) => m.conversation_id);
        const convItems: ConversationItem[] = [];

        for (const cid of convIds) {
          // Find other participant
          const { data: members } = await supabase
            .from('conversation_members')
            .select('user_id, profiles(*)')
            .eq('conversation_id', cid)
            .neq('user_id', user.id)
            .limit(1)
            .maybeSingle();

          // Find last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', cid)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          convItems.push({
            id: cid,
            recipient: (members as any)?.profiles || null,
            lastMessage: (lastMsg as any) || null,
          });
        }

        setConversations(convItems);
        if (convItems.length > 0 && !activeConvId) {
          setActiveConvId(convItems[0].id);
        }
      }

      // Preload all users for starting chats
      const { data: users } = await supabase.from('profiles').select('*').limit(30);
      if (users) setAllUsers(users.filter((u) => u.id !== user.id));
    }
    init();
  }, []);

  // Fetch messages when active conversation changes
  useEffect(() => {
    const convId = activeConvId;
    if (!convId) return;

    async function loadMessages(currentConvId: string) {
      const { data } = await supabase
        .from('messages')
        .select('*, profiles(*), posts(*)')
        .eq('conversation_id', currentConvId)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as any);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
    loadMessages(convId);

    // Subscribe to live Realtime updates if supported
    const channel = supabase
      .channel(`chat_${activeConvId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeConvId}` },
        (payload) => {
          loadMessages(convId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvId]);

  const handleSend = async () => {
    if (!text.trim() || !activeConvId) return;
    const msgText = text.trim();
    setText('');

    await sendMessageAction(activeConvId, msgText);

    // Refresh messages
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(*), posts(*)')
      .eq('conversation_id', activeConvId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as any);
  };

  const handleStartChat = async (targetUserId: string) => {
    const res = await getOrCreateConversationAction(targetUserId);
    if (res?.conversationId) {
      setActiveConvId(res.conversationId);
      setNewChatModalOpen(false);
      // Reload conversations
      window.location.reload();
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="flex h-screen bg-[var(--bg-app)]">
      {/* Conversations Column */}
      <div className="w-80 flex-shrink-0 border-r border-[var(--border)] flex flex-col h-full bg-[var(--bg-card)]">
        {/* Header */}
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h1 className="font-heading font-bold text-base text-[var(--text-primary)]">
            Direct Messages
          </h1>
          <button
            onClick={() => setNewChatModalOpen(true)}
            className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] p-4 text-center">No active chats yet. Click + to begin a discussion!</p>
          ) : (
            conversations.map((c) => {
              const isActive = c.id === activeConvId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveConvId(c.id)}
                  className={`w-full p-3 rounded-2xl flex items-center gap-3 text-left transition-colors ${
                    isActive ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <img
                    src={c.recipient?.avatar_url || getAvatarFallbackUrl(c.recipient?.username || 'User')}
                    alt={c.recipient?.display_name || 'User'}
                    className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {c.recipient?.display_name || 'Creator'}
                      </p>
                      {c.lastMessage && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {formatRelativeTime(c.lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                      {c.lastMessage?.body || 'Started conversation'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Chat Thread */}
      <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)]">
        {activeConv ? (
          <>
            {/* Thread Header */}
            <header className="p-4 border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={activeConv.recipient?.avatar_url || getAvatarFallbackUrl(activeConv.recipient?.username || 'User')}
                  alt={activeConv.recipient?.display_name || 'User'}
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-primary)]">
                    {activeConv.recipient?.display_name}
                  </h2>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    @{activeConv.recipient?.username}
                  </p>
                </div>
              </div>
            </header>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
              {messages.map((m) => {
                const isMe = m.sender_id === currentUserId;

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[80%] sm:max-w-[70%] ${
                      isMe ? 'self-end items-end' : 'self-start items-start'
                    }`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                        isMe
                          ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                          : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-none shadow-sm'
                      }`}
                    >
                      {/* Shared Post Attachment Preview Card */}
                      {m.posts && (
                        <div className="mb-2 p-2.5 rounded-xl bg-black/20 border border-white/10 text-xs flex flex-col gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>Shared Post</span>
                          </span>
                          <p className="line-clamp-2 text-white/90">{m.posts.caption}</p>
                        </div>
                      )}

                      <p className="whitespace-pre-line">{m.body}</p>
                    </div>

                    <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1">
                      {formatRelativeTime(m.created_at)}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-card)] flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a direct message..."
                className="flex-1 text-sm px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition-all shadow-sm"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] gap-3">
            <MessageSquare className="w-12 h-12 text-indigo-400/50" />
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Select or start a conversation
            </h2>
            <p className="text-xs max-w-sm">
              Connect directly with AI researchers, engineers, and creators on SocialSentinel.
            </p>
          </div>
        )}
      </div>

      {/* Start New Chat Modal */}
      {newChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl p-5 flex flex-col gap-4">
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
              Start a Conversation
            </h2>
            <div className="max-h-60 overflow-y-auto flex flex-col gap-1.5">
              {allUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleStartChat(u.id)}
                  className="p-2.5 rounded-xl flex items-center gap-3 hover:bg-[var(--bg-elevated)] transition-colors text-left"
                >
                  <img
                    src={u.avatar_url || getAvatarFallbackUrl(u.username)}
                    alt={u.display_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{u.display_name}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setNewChatModalOpen(false)}
              className="py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

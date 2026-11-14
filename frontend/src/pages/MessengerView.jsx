import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { ArrowLeft, Send, Search, X } from 'lucide-react';

export function MessengerView({ user, sharePost, onClearShare }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const endRef = useRef(null);

  const loadConvs = async () => {
    try {
      const res = await api.conversations();
      setConversations(res.data || []);
      if (!activeConvId && res.data?.length > 0 && window.innerWidth >= 768) {
        setActiveConvId(res.data[0].id);
      }
    } catch (err) {}
  };

  const loadMessages = async (cid) => {
    if (!cid) return;
    try {
      const res = await api.messages(cid);
      setMessages(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    loadConvs();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
      const interval = setInterval(() => loadMessages(activeConvId), 4000);
      return () => clearInterval(interval);
    }
  }, [activeConvId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearchUser = async (val) => {
    setUserSearch(val);
    if (!val.trim()) {
      setUserResults([]);
      return;
    }
    try {
      const res = await api.search(val);
      setUserResults((res.users || []).filter(u => u.id !== user.id));
    } catch (err) {}
  };

  const startNewChat = async (targetUser) => {
    try {
      const res = await api.createConversation([targetUser.id]);
      setUserSearch('');
      setUserResults([]);
      await loadConvs();
      setActiveConvId(res.conversation_id);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSend = async () => {
    if ((!text.trim() && !sharePost) || !activeConvId) return;
    const msgText = text.trim();
    const sharedId = sharePost?.id || null;
    setText('');
    if (onClearShare) onClearShare();

    try {
      await api.sendMessage(activeConvId, msgText || 'Shared a post with you', sharedId);
      loadMessages(activeConvId);
      loadConvs();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const otherMember = activeConv?.members?.find(m => m.id !== user.id) || activeConv?.members?.[0];

  return (
    <div className="messenger-layout">
      {/* Conversations Left Pane */}
      <div className={`messenger-convs ${activeConvId ? 'hide-on-mobile' : ''}`}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 15 }}>
          Direct Messages
        </div>

        {/* Search for users */}
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ paddingLeft: 30, fontSize: 13 }}
              placeholder="Search creator to chat…"
              value={userSearch}
              onChange={e => handleSearchUser(e.target.value)}
            />
          </div>

          {userResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: 50,
              left: 14,
              right: 14,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              zIndex: 30,
              maxHeight: 180,
              overflowY: 'auto'
            }}>
              {userResults.map(u => (
                <div
                  key={u.id}
                  onClick={() => startNewChat(u)}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)'
                  }}
                >
                  <MediaImage src={u.avatar_url} fallbackText={u.display_name} isAvatar style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{u.display_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Conversation List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No conversations yet. Search a creator to begin!
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.members?.find(m => m.id !== user.id) || conv.members?.[0];
              const isSelected = conv.id === activeConvId;
              return (
                <div
                  key={conv.id}
                  className={`conv-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => setActiveConvId(conv.id)}
                >
                  <MediaImage src={other?.avatar_url} fallbackText={other?.display_name || 'U'} isAvatar style={{ width: 36, height: 36, borderRadius: '50%' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {other?.display_name || 'Conversation'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {conv.last_message ? conv.last_message.body : 'Start chatting…'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Chat Right Pane */}
      <div className={`messenger-chat ${!activeConvId ? 'hide-on-mobile' : ''}`}>
        {activeConvId ? (
          <>
            <div className="chat-header">
              <button
                className="btn-secondary"
                style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center' }}
                onClick={() => setActiveConvId(null)}
                title="Back to conversations list"
              >
                <ArrowLeft size={16} />
              </button>

              <MediaImage src={otherMember?.avatar_url} fallbackText={otherMember?.display_name || 'U'} isAvatar style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{otherMember?.display_name || 'Creator'}</div>
                <div style={{ fontSize: 11, color: 'var(--status-positive)' }}>● Online</div>
              </div>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  Send a message to start this discussion.
                </div>
              ) : (
                messages.map(m => {
                  const isMine = m.sender?.id === user.id;
                  return (
                    <div key={m.id} className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      <div>{m.body}</div>

                      {m.shared_post && (
                        <div style={{
                          marginTop: 6,
                          padding: 8,
                          borderRadius: 'var(--radius-sm)',
                          background: isMine ? 'rgba(0,0,0,0.18)' : 'var(--bg-elevated)',
                          fontSize: 12
                        }}>
                          <div style={{ fontWeight: 600 }}>📌 Post by @{m.shared_post.author?.username}</div>
                          <div style={{ marginTop: 2, opacity: 0.9 }}>{m.shared_post.caption.slice(0, 80)}…</div>
                        </div>
                      )}

                      <div style={{ fontSize: 10, opacity: 0.65, marginTop: 4, textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {sharePost && (
              <div style={{ padding: '8px 14px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--primary)' }}>
                  📎 Attached: "{sharePost.caption.slice(0, 50)}…"
                </span>
                <button onClick={onClearShare} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                  <X size={15} />
                </button>
              </div>
            )}

            <div className="chat-input-row">
              <input
                className="input-field"
                placeholder="Type a message…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <button className="btn-primary" onClick={handleSend} disabled={!text.trim() && !sharePost}>
                <Send size={15} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)', fontSize: 13.5 }}>
            Select a conversation on the left to start messaging.
          </div>
        )}
      </div>
    </div>
  );
}

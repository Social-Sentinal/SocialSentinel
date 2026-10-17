import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { X, Send } from 'lucide-react';

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
      if (!activeConvId && res.data?.length > 0) {
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

  const handleSearchUser = async val => {
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
    <div className="messenger-frame">
      <div className="conversations-pane">
        <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: 16 }}>
          Direct Conversations
        </div>

        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
          <input
            placeholder="Search creator to message…"
            value={userSearch}
            onChange={e => handleSearchUser(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none', fontSize: 13 }}
          />
          {userResults.length > 0 && (
            <div style={{ position: 'absolute', top: 52, left: 14, right: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-md)', zIndex: 30, maxHeight: 180, overflowY: 'auto' }}>
              {userResults.map(u => (
                <div
                  key={u.id}
                  onClick={() => startNewChat(u)}
                  style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                >
                  <MediaImage src={u.avatar_url} fallbackText={u.display_name} isAvatar style={{ width: 28, height: 28, borderRadius: '50%' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{u.display_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              No active conversations yet.
            </div>
          ) : (
            conversations.map(conv => {
              const other = conv.members?.find(m => m.id !== user.id) || conv.members?.[0];
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: conv.id === activeConvId ? 'var(--primary-light)' : 'transparent'
                  }}
                >
                  <MediaImage src={other?.avatar_url} fallbackText={other?.display_name || 'U'} isAvatar style={{ width: 38, height: 38, borderRadius: '50%' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {other?.display_name || 'Conversation'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.last_message ? conv.last_message.body : 'Start chatting…'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="chat-stage-pane">
        {activeConvId ? (
          <>
            <div className="chat-stage-header">
              <MediaImage src={otherMember?.avatar_url} fallbackText={otherMember?.display_name || 'U'} isAvatar style={{ width: 34, height: 34, borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{otherMember?.display_name || 'Direct Chat'}</div>
                <div style={{ fontSize: 11, color: 'var(--status-positive)' }}>● Active on SocialSentinel</div>
              </div>
            </div>

            <div className="chat-scroll-area">
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  Send a message to start communicating!
                </div>
              ) : (
                messages.map(m => {
                  const isMine = m.sender?.id === user.id;
                  return (
                    <div key={m.id} className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
                      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.8, marginBottom: 4 }}>
                        {isMine ? 'You' : m.sender?.display_name || 'Creator'}
                      </div>
                      <div>{m.body}</div>

                      {m.shared_post && (
                        <div style={{ marginTop: 8, padding: 8, borderRadius: 6, background: isMine ? 'rgba(0,0,0,0.12)' : 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>📌 Post by @{m.shared_post.author?.username}</div>
                          <div style={{ fontSize: 12, marginTop: 2 }}>{m.shared_post.caption.slice(0, 100)}…</div>
                        </div>
                      )}

                      <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4, textAlign: 'right' }}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={endRef} />
            </div>

            {sharePost && (
              <div style={{ padding: '8px 18px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                  📎 Attached post: "{sharePost.caption.slice(0, 60)}…"
                </span>
                <button onClick={onClearShare} style={{ color: 'var(--primary)' }}><X size={15} /></button>
              </div>
            )}

            <div className="chat-composer-strip">
              <input
                placeholder="Write a message…"
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                style={{ flex: 1, padding: '10px 16px', borderRadius: 99, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
              />
              <button className="btn-primary" onClick={handleSend} disabled={!text.trim() && !sharePost}>
                <Send size={15} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
            Select a conversation to begin chatting.
          </div>
        )}
      </div>
    </div>
  );
}


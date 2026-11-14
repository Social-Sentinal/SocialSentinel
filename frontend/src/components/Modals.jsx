import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TOPICS } from '../constants';
import MediaImage from './MediaImage';
import { X, Sparkles, Image, Send } from 'lucide-react';

export function CreatePostModal({ user, onClose, onCreated }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('AI & Tech');
  const [hashtags, setHashtags] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (caption.trim().length > 6) {
      const timer = setTimeout(async () => {
        try {
          const s = await api.predictSentiment(caption);
          setSentiment(s);
        } catch (err) {}
      }, 350);
      return () => clearTimeout(timer);
    } else {
      setSentiment(null);
    }
  }, [caption]);

  const handleSubmit = async () => {
    if (!caption.trim()) return;
    setSubmitting(true);
    try {
      await api.post({ caption, topic, hashtags, media_url: mediaUrl });
      onCreated();
    } catch (err) {
      alert(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} color="var(--primary)" />
            <span>Create New Post</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            className="input-field"
            placeholder="Share your insight or discovery with SocialSentinel…"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ minHeight: 100, resize: 'vertical' }}
          />

          {sentiment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>Predicted tone:</span>
              <span className={`sentiment-badge ${(sentiment.sentiment || 'neutral').toLowerCase()}`}>
                {sentiment.sentiment} ({Math.round(sentiment.confidence * 100)}%)
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Topic Category</label>
              <select
                className="input-field"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                style={{ marginTop: 4 }}
              >
                {TOPICS.slice(1).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Hashtags</label>
              <input
                className="input-field"
                placeholder="#AI #Dev"
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                style={{ marginTop: 4 }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Image size={13} />
              <span>Image URL (Optional)</span>
            </label>
            <input
              className="input-field"
              placeholder="https://images.unsplash.com/..."
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>

          {mediaUrl && (
            <div style={{ maxHeight: 160, borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={mediaUrl} alt="Preview" style={{ width: '100%', height: 160, objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !caption.trim()}>
              {submitting ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShareToChatModal({ user, post, onClose, onSuccess }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.conversations().then(res => {
      setConversations(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSendToConv = async (cid) => {
    try {
      await api.sendMessage(cid, `Check this out: "${post.caption.slice(0, 80)}…"`, post.id);
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Share Post to Chat</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 10, borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)', fontSize: 13, border: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Attached: </span>
            <span>"{post.caption.slice(0, 80)}…"</span>
          </div>

          <div style={{ fontSize: 13, fontWeight: 600 }}>Select Conversation:</div>
          {loading ? (
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading chats…</p>
          ) : conversations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No open conversations yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
              {conversations.map(conv => {
                const other = conv.members?.find(m => m.id !== user.id) || conv.members?.[0];
                return (
                  <button
                    key={conv.id}
                    onClick={() => handleSendToConv(conv.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      color: 'var(--text-primary)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MediaImage src={other?.avatar_url} fallbackText={other?.display_name || 'U'} isAvatar style={{ width: 30, height: 30, borderRadius: '50%' }} />
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{other?.display_name || 'Creator'}</span>
                    </div>
                    <span className="btn-primary" style={{ padding: '3px 8px', fontSize: 11 }}>Send</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function PostDetailModal({ user, post, onClose, onUpdate, onOpenShare }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await api.comments(post.id);
      setComments(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    load();
  }, [post.id]);

  const handleAdd = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.comment(post.id, text);
      setText('');
      load();
      if (onUpdate) onUpdate();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div className="modal-title">Post & Discussion</div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Post Author Bar */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <MediaImage src={post.author?.avatar_url} fallbackText={post.author?.display_name} isAvatar style={{ width: 38, height: 38, borderRadius: '50%' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{post.author?.display_name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>@{post.author?.username} · #{post.topic_category || post.topic || 'Tech'}</div>
            </div>
          </div>

          <p style={{ fontSize: 14.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
            {post.caption}
          </p>

          {post.media_url && (
            <div style={{ maxHeight: 240, borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
              <img src={post.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <hr style={{ borderColor: 'var(--border)', margin: '4px 0' }} />

          {/* Comments list with sentiment badges */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>Comments ({comments.length})</div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Sentiment-tracked</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, padding: '14px 0', textAlign: 'center' }}>
                No comments yet. Share your thoughts!
              </div>
            ) : (
              comments.map(c => {
                const sTone = (c.sentiment || 'neutral').toLowerCase();
                return (
                  <div key={c.id} style={{ padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{c.user?.display_name || 'Creator'}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{c.user?.username || 'user'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        {c.sentiment && (
                          <span className={`sentiment-badge ${sTone}`} style={{ fontSize: 10, padding: '1px 6px' }}>
                            {c.sentiment}
                          </span>
                        )}
                        {c.emotion && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'var(--primary-subtle)', color: 'var(--primary)', fontWeight: 500 }}>
                            {c.emotion}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 13, marginTop: 4, lineHeight: 1.4, color: 'var(--text-primary)' }}>{c.text}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add comment input */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              className="input-field"
              placeholder="Add your reply…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
            <button className="btn-primary" onClick={handleAdd} disabled={submitting || !text.trim()}>
              <Send size={13} />
              <span>{submitting ? 'Posting…' : 'Reply'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { TOPICS } from '../constants';
import MediaImage from './MediaImage';
import { X } from 'lucide-react';

export function CreatePostModal({ user, onClose, onCreated }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('AI & Tech');
  const [hashtags, setHashtags] = useState('');
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
    }
  }, [caption]);

  const handleSubmit = async () => {
    if (!caption.trim()) return;
    setSubmitting(true);
    try {
      await api.post({ caption, topic, hashtags });
      onCreated();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Create New Post</div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="modal-body-content">
          <textarea
            placeholder="Share your insight with SocialSentinel…"
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ width: '100%', minHeight: 110, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          {sentiment && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600 }}>
              <span>Tone:</span>
              <span className={`chip ${sentiment.sentiment.toLowerCase()}`}>
                {sentiment.sentiment} ({Math.round(sentiment.confidence * 100)}%)
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Topic</label>
              <select
                value={topic}
                onChange={e => setTopic(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', marginTop: 4 }}
              >
                {TOPICS.slice(1).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Hashtags</label>
              <input
                placeholder="#AI #Dev"
                value={hashtags}
                onChange={e => setHashtags(e.target.value)}
                style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', marginTop: 4 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !caption.trim()}>
              {submitting ? 'Publishing…' : 'Publish Post'}
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
    });
  }, []);

  const handleSendToConv = async cid => {
    try {
      await api.sendMessage(cid, `Check this out: "${post.caption.slice(0, 80)}…"`, post.id);
      onSuccess();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header-bar">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Share to Chat</div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="modal-body-content">
          <div style={{ padding: 10, borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 13 }}>
            <b>Attached:</b> "{post.caption.slice(0, 100)}…"
          </div>

          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 6 }}>Select recipient:</div>
          {loading ? (
            <p style={{ fontSize: 13 }}>Loading…</p>
          ) : conversations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No open conversations yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                      padding: 10,
                      borderRadius: 8,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MediaImage src={other?.avatar_url} fallbackText={other?.display_name || 'U'} isAvatar style={{ width: 30, height: 30, borderRadius: '50%' }} />
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{other?.display_name || 'Creator'}</span>
                    </div>
                    <span className="btn-primary" style={{ padding: '3px 9px', fontSize: 11 }}>Send</span>
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
      <div className="modal-content-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-header-bar">
          <div style={{ fontWeight: 700, fontSize: 16 }}>Post Discussion</div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>
        <div className="modal-body-content">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <MediaImage src={post.author?.avatar_url} fallbackText={post.author?.display_name} isAvatar style={{ width: 40, height: 40, borderRadius: '50%' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{post.author?.display_name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{post.author?.username}</div>
            </div>
          </div>

          <p style={{ fontSize: 15, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {post.caption}
          </p>

          <hr style={{ borderColor: 'var(--border)' }} />

          <div style={{ fontWeight: 700, fontSize: 14 }}>Comments ({comments.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>No comments yet. Start the conversation!</div>
            ) : (
              comments.map(c => (
                <div key={c.id} style={{ padding: 8, background: 'var(--bg-elevated)', borderRadius: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{c.user?.display_name || 'Creator'}</div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>{c.text}</div>
                </div>
              ))
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              placeholder="Add your reply…"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
            <button className="btn-primary" onClick={handleAdd} disabled={submitting || !text.trim()}>
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




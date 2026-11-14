import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { TOPICS } from '../constants';
import MediaImage from './MediaImage';
import { X, Sparkles, Image, Film, FileText, Send, Hash } from 'lucide-react';

const MODAL_TAGS = ['#SocialSentinel', '#AI', '#Photography', '#Space', '#LifeStories', '#Nature', '#Reels'];

export function CreatePostModal({ user, onClose, onCreated }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('AI & Tech');
  const [hashtags, setHashtags] = useState('');
  const [mediaType, setMediaType] = useState('image'); // 'story' | 'image' | 'video'
  const [mediaUrl, setMediaUrl] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (caption.trim().length > 5) {
      const timer = setTimeout(async () => {
        try {
          const s = await api.predictSentiment(caption);
          setSentiment(s);
        } catch (err) {}
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSentiment(null);
    }
  }, [caption]);

  const handleAddTag = (tag) => {
    if (hashtags.includes(tag)) return;
    setHashtags(prev => (prev ? `${prev} ${tag}` : tag).trim());
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setMediaUrl(previewUrl);
      if (file.type.startsWith('video/')) {
        setMediaType('video');
      } else {
        setMediaType('image');
      }
    }
  };

  const handleSubmit = async () => {
    if (!caption.trim()) return;
    setSubmitting(true);
    try {
      await api.post({
        caption,
        topic,
        hashtags,
        media_url: mediaType === 'image' ? mediaUrl : '',
        video_url: mediaType === 'video' ? mediaUrl : '',
        media_type: mediaType === 'video' ? 'video' : (mediaUrl ? 'image' : 'text')
      });
      onCreated();
    } catch (err) {
      alert(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <div className="modal-header">
          <div className="modal-title">
            <Sparkles size={18} color="var(--primary)" />
            <span>Create New Post / Reel</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Media Type Tabs */}
        <div className="composer-tab-bar" style={{ marginBottom: 12 }}>
          <button
            type="button"
            className={`composer-tab-btn ${mediaType === 'story' ? 'active' : ''}`}
            onClick={() => { setMediaType('story'); setMediaUrl(''); }}
          >
            <FileText size={14} />
            <span>Story</span>
          </button>
          <button
            type="button"
            className={`composer-tab-btn ${mediaType === 'image' ? 'active' : ''}`}
            onClick={() => setMediaType('image')}
          >
            <Image size={14} />
            <span>Photo</span>
          </button>
          <button
            type="button"
            className={`composer-tab-btn ${mediaType === 'video' ? 'active' : ''}`}
            onClick={() => setMediaType('video')}
          >
            <Film size={14} />
            <span>Video / Reel</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            className="input-field"
            placeholder={
              mediaType === 'video'
                ? "Describe your reel, video dispatch, or story…"
                : mediaType === 'image'
                ? "Write a caption for your image…"
                : "Share your insight or discovery with SocialSentinel…"
            }
            value={caption}
            onChange={e => setCaption(e.target.value)}
            style={{ minHeight: 90, resize: 'vertical' }}
          />

          {sentiment && (
            <div className="composer-sentiment-meter" style={{ marginTop: 0 }}>
              <span style={{ color: 'var(--text-muted)' }}>Tone Predictor:</span>
              <span className={`sentiment-badge ${(sentiment.sentiment || 'neutral').toLowerCase()}`}>
                {sentiment.sentiment} ({Math.round(sentiment.confidence * 100)}%)
              </span>
              {sentiment.emotion && (
                <span className="emotion-pill">{sentiment.emotion}</span>
              )}
            </div>
          )}

          {/* Media URL / Upload Input for Photo & Video */}
          {mediaType !== 'story' && (
            <div className="composer-media-box" style={{ marginTop: 0 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="composer-media-url-input"
                  placeholder={mediaType === 'video' ? "Paste MP4 or Reel URL…" : "Paste Image URL…"}
                  value={mediaUrl}
                  onChange={e => setMediaUrl(e.target.value)}
                />
                <label className="btn-file-upload">
                  <span>Upload</span>
                  <input type="file" accept={mediaType === 'video' ? "video/*" : "image/*"} onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
                {mediaUrl && (
                  <button className="btn-clear-media" onClick={() => setMediaUrl('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {mediaUrl && (
                <div className="composer-preview-container">
                  {mediaType === 'video' ? (
                    <video src={mediaUrl} controls playsInline muted className="composer-video-preview" />
                  ) : (
                    <img src={mediaUrl} alt="Preview" referrerPolicy="no-referrer" crossOrigin="anonymous" className="composer-image-preview" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Topic Community Selection */}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
              Topic Community
            </label>
            <div className="composer-topic-pills">
              {TOPICS.slice(1).map(t => (
                <button
                  key={t}
                  type="button"
                  className={`composer-topic-chip ${topic === t ? 'active' : ''}`}
                  onClick={() => setTopic(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Hashtags Input & Suggested Chips */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)' }}>Hashtags</label>
              <span className="composer-char-count">{caption.length} / 2000</span>
            </div>
            <input
              className="input-field"
              placeholder="#AI #Photography #Space"
              value={hashtags}
              onChange={e => setHashtags(e.target.value)}
            />
            <div className="composer-tag-chips" style={{ marginTop: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Suggestions:</span>
              {MODAL_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  className={`tag-chip-btn ${hashtags.includes(tag) ? 'selected' : ''}`}
                  onClick={() => handleAddTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !caption.trim()}>
              <Send size={13} />
              <span>{submitting ? 'Publishing…' : 'Publish Dispatch'}</span>
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
  const initialComments = (post.comments && post.comments.length > 0) ? post.comments : [];
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await api.comments(post.id);
      if (res.data && res.data.length > 0) {
        setComments(res.data);
      } else if (post.comments && post.comments.length > 0) {
        setComments(post.comments);
      }
    } catch (err) {
      if (post.comments && post.comments.length > 0) {
        setComments(post.comments);
      }
    }
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

          {(post.video_url || post.videoUrl) ? (
            <div style={{ maxHeight: 320, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
              <video
                src={post.video_url || post.videoUrl}
                poster={post.media_url}
                controls
                playsInline
                autoPlay
                muted
                style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
              />
            </div>
          ) : post.media_url ? (
            <div style={{ maxHeight: 280, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: '#000' }}>
              <img
                src={post.media_url}
                alt=""
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
                style={{ width: '100%', maxHeight: 280, objectFit: 'contain' }}
              />
            </div>
          ) : null}

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

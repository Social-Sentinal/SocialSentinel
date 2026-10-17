import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from './MediaImage';
import { Heart, MessageSquare, Bookmark, Share2, Sparkles } from 'lucide-react';

export function PostCardItem({ post, user, refresh, onOpenShare, onOpenDetail, onExplain }) {
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.counts?.likes || 0);
  const [saved, setSaved] = useState(post.saved);
  const [savesCount, setSavesCount] = useState(post.counts?.saves || 0);

  const handleLike = async () => {
    try {
      const res = await api.action(post.id, 'like');
      setLiked(res.result);
      setLikesCount(c => (res.result ? c + 1 : Math.max(0, c - 1)));
    } catch (err) {}
  };

  const handleSave = async () => {
    try {
      const res = await api.action(post.id, 'save');
      setSaved(res.result);
      setSavesCount(c => (res.result ? c + 1 : Math.max(0, c - 1)));
    } catch (err) {}
  };

  const handleExplain = async () => {
    try {
      const res = await api.explain(post.id);
      onExplain(res);
    } catch (err) {
      alert('Recommended based on your activity graph and content affinity.');
    }
  };

  return (
    <article className="post-item">
      <div className="post-author-row">
        <div className="post-author-info">
          <MediaImage
            src={post.author?.avatar_url}
            fallbackText={post.author?.display_name || 'A'}
            isAvatar
            className="post-author-avatar"
          />
          <div>
            <div className="post-author-name">{post.author?.display_name || 'Creator'}</div>
            <div className="post-author-sub">
              <span>@{post.author?.username || 'user'}</span>
              <span>·</span>
              <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        {post.recommendation_reason && (
          <div className="post-justification-chip">
            <Sparkles size={12} />
            <span>{post.recommendation_reason}</span>
          </div>
        )}
      </div>

      <p className="post-body-text" onClick={() => onOpenDetail(post)} style={{ cursor: 'pointer' }}>
        {post.caption}
      </p>

      {post.hashtags && (
        <div className="post-tags-list">
          {post.hashtags.split(' ').map((t, idx) => (
            <span key={idx}>{t.startsWith('#') ? t : '#' + t}</span>
          ))}
        </div>
      )}

      {post.media_url && (
        <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: 420, cursor: 'pointer' }} onClick={() => onOpenDetail(post)}>
          <MediaImage src={post.media_url} fallbackText={post.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      <div className="post-chips-bar">
        <span className="chip">#{post.topic}</span>
        {post.sentiment && (
          <span className={`chip ${post.sentiment.toLowerCase()}`}>
            {post.sentiment === 'Positive' ? '✨' : post.sentiment === 'Negative' ? '⚠️' : '⚖️'} {post.sentiment}
            {post.sentiment_confidence ? ` (${Math.round(post.sentiment_confidence * 100)}%)` : ''}
          </span>
        )}
        {post.emotion && (
          <span className="chip">
            🌿 {post.emotion.charAt(0).toUpperCase() + post.emotion.slice(1)}
          </span>
        )}
      </div>

      <div className="post-actions-row">
        <button className={`action-pill-btn ${liked ? 'active-like' : ''}`} onClick={handleLike}>
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>

        <button className="action-pill-btn" onClick={() => onOpenDetail(post)}>
          <MessageSquare size={16} />
          <span>{post.counts?.comments || 0}</span>
        </button>

        <button className={`action-pill-btn ${saved ? 'active-save' : ''}`} onClick={handleSave}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          <span>{savesCount}</span>
        </button>

        <button className="action-pill-btn" onClick={() => onOpenShare(post)}>
          <Share2 size={16} />
          <span>Share</span>
        </button>

        <button className="action-pill-btn" onClick={handleExplain} title="Explain why this post was recommended">
          <Sparkles size={14} />
          <span>Why?</span>
        </button>
      </div>
    </article>
  );
}


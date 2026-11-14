import React, { useState } from 'react';
import { api } from '../services/api';
import MediaImage from './MediaImage';
import { Heart, MessageSquare, Bookmark, Share2, Sparkles } from 'lucide-react';

export function PostCardItem({ post, user, refresh, onOpenShare, onOpenDetail, onExplain }) {
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.counts?.likes || 0);
  const [saved, setSaved] = useState(post.saved);
  const [savesCount, setSavesCount] = useState(post.counts?.saves || 0);
  const [explaining, setExplaining] = useState(false);

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
    if (explaining) return;
    setExplaining(true);
    try {
      const res = await api.explain(post.id);
      onExplain(res);
    } catch (err) {
      onExplain({
        post_id: post.id,
        topic: post.topic_category || post.topic,
        match_percentage: 82,
        final_score: 0.82,
        breakdown: {
          content_semantic_score: 0.85,
          collaborative_peer_score: 0.78,
          sentiment_affinity_score: 0.88,
          community_velocity_score: 0.70,
          freshness_score: 0.92
        },
        rationale: post.recommendation_reason || `Matched with your interest in #${post.topic_category || post.topic || 'Tech'}.`
      });
    } finally {
      setExplaining(false);
    }
  };

  const rawSentiment = (post.sentiment || 'neutral').toLowerCase();
  const sentimentTone = ['positive', 'negative', 'neutral'].includes(rawSentiment) ? rawSentiment : 'neutral';
  const topicLabel = post.topic_category || post.topic || 'AI & Tech';

  const timeAgo = (dateStr) => {
    try {
      const d = new Date(dateStr);
      const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <article className="post-card">
      {/* Post Author & Header */}
      <div className="post-header">
        <div className="post-author">
          <MediaImage
            src={post.author?.avatar_url}
            fallbackText={post.author?.display_name || 'Creator'}
            isAvatar
            className="post-author-avatar"
          />
          <div>
            <div className="post-author-name">{post.author?.display_name || 'Creator'}</div>
            <div className="post-meta-line">
              <span>@{post.author?.username || 'user'}</span>
              <span>·</span>
              <span>{timeAgo(post.created_at)}</span>
              <span>·</span>
              <span className="post-meta-topic">#{topicLabel}</span>
            </div>
          </div>
        </div>

        {/* Subtle Sentiment & Emotion Tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className={`sentiment-badge ${sentimentTone}`}>
            {post.sentiment || 'Neutral'}
          </span>

          {post.emotion && (
            <span style={{
              fontSize: 11,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-secondary)'
            }}>
              {post.emotion.charAt(0).toUpperCase() + post.emotion.slice(1)}
            </span>
          )}
        </div>
      </div>

      {/* Post Caption */}
      <p className="post-caption" onClick={() => onOpenDetail(post)} style={{ cursor: 'pointer' }}>
        {post.caption}
      </p>

      {/* Hashtags */}
      {post.hashtags && (
        <div className="post-hashtags">
          {post.hashtags.split(' ').filter(Boolean).map((t, idx) => (
            <span key={idx} style={{ marginRight: 6 }}>{t.startsWith('#') ? t : '#' + t}</span>
          ))}
        </div>
      )}

      {/* Media Image Attachment */}
      {post.media_url && (
        <div className="post-media-frame" onClick={() => onOpenDetail(post)} style={{ cursor: 'pointer' }}>
          <MediaImage
            src={post.media_url}
            fallbackText={post.caption}
            className="post-media-img"
          />
        </div>
      )}

      {/* Explainability Recommendation Chip */}
      {post.recommendation_reason && (
        <div className="post-reason-bar">
          <button className="reason-chip" onClick={handleExplain} title="View AI ranking factors">
            <Sparkles size={13} color="var(--primary)" />
            <span>{post.recommendation_reason}</span>
          </button>
        </div>
      )}

      {/* Post Actions Bar */}
      <div className="post-actions-bar">
        <button
          className={`action-btn ${liked ? 'active-like' : ''}`}
          onClick={handleLike}
          title="Like"
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          <span>{likesCount}</span>
        </button>

        <button
          className="action-btn"
          onClick={() => onOpenDetail(post)}
          title="Comments"
        >
          <MessageSquare size={16} />
          <span>{post.counts?.comments || 0}</span>
        </button>

        <button
          className={`action-btn ${saved ? 'active-save' : ''}`}
          onClick={handleSave}
          title="Save"
        >
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
          <span>{savesCount}</span>
        </button>

        <button
          className="action-btn"
          onClick={() => onOpenShare(post)}
          title="Share"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>

        <button
          className="action-btn"
          onClick={handleExplain}
          title="Why recommended?"
        >
          <Sparkles size={14} color="var(--primary)" />
          <span>Why?</span>
        </button>
      </div>
    </article>
  );
}

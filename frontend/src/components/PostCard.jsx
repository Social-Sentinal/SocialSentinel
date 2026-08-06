import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, CheckCircle2, Clock, Sparkles, Send } from 'lucide-react';
import { toggleLikePost, addCommentToPost, logUserInteraction } from '../services/api';

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(post.comments_list || []);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [viewTime, setViewTime] = useState(0);

  const timerRef = useRef(null);

  // Track dwell time for user interactions
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setViewTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Handle Like toggle
  const handleLike = async () => {
    const nextState = !liked;
    setLiked(nextState);
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      await toggleLikePost(post.id, nextState);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  // Handle Save toggle
  const handleSave = async () => {
    const nextState = !saved;
    setSaved(nextState);
    try {
      await logUserInteraction({
        post_id: post.id,
        saved: nextState,
        duration: viewTime,
        caption: post.caption,
        hashtags: post.hashtags,
      });
    } catch (err) {
      console.error('Failed to log save:', err);
    }
  };

  // Handle Submit Comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    const textToSend = commentInput.trim();
    setCommentInput('');

    try {
      const res = await addCommentToPost(post.id, textToSend, 'social_explorer');
      if (res.status === 'success' && res.data) {
        setComments((prev) => [...prev, res.data]);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Helper for Sentiment class and label
  const getSentimentBadge = (sentiment) => {
    const s = (sentiment || '').toLowerCase();
    if (s === 'positive') {
      return <span className="badge badge-positive">Positive {post.score ? `(${Math.round(post.score * 100)}%)` : ''}</span>;
    } else if (s === 'negative') {
      return <span className="badge badge-negative">Negative {post.score ? `(${Math.round(post.score * 100)}%)` : ''}</span>;
    }
    return <span className="badge badge-neutral">Neutral {post.score ? `(${Math.round(post.score * 100)}%)` : ''}</span>;
  };

  return (
    <div className="glass-card-interactive" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header Info */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src={post.user_avatar} 
            alt={post.username}
            style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(139, 92, 246, 0.4)' }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFF' }}>
                @{post.username}
              </span>
              {post.is_verified && <CheckCircle2 size={16} color="#06B6D4" />}
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              {post.location} • {post.timestamp}
            </span>
          </div>
        </div>

        <div>
          {getSentimentBadge(post.sentiment)}
        </div>
      </div>

      {/* Media Content */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16/10', backgroundColor: '#000', overflow: 'hidden' }}>
        <img 
          src={post.image_url} 
          alt="Post content" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
          loading="lazy"
        />
        <div style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          padding: '4px 10px',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <Clock size={12} color="#06B6D4" />
          <span>Dwell: {viewTime}s</span>
        </div>
      </div>

      {/* Card Content & Action Bar */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flexGrow: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handleLike}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: liked ? '#F43F5E' : 'var(--text-muted)', transition: 'var(--transition-fast)' }}
            >
              <Heart size={22} fill={liked ? '#F43F5E' : 'none'} color={liked ? '#F43F5E' : 'currentColor'} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{likesCount}</span>
            </button>

            <button 
              onClick={() => setCommentsOpen(!commentsOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', color: commentsOpen ? '#A78BFA' : 'var(--text-muted)' }}
            >
              <MessageCircle size={22} color={commentsOpen ? '#A78BFA' : 'currentColor'} />
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{comments.length || post.comments_count}</span>
            </button>

            <button 
              style={{ color: 'var(--text-muted)' }}
              onClick={() => alert(`Shared post link: ${post.url || 'https://instagram.com'}`)}
            >
              <Share2 size={20} />
            </button>
          </div>

          <button 
            onClick={handleSave}
            style={{ color: saved ? '#06B6D4' : 'var(--text-muted)' }}
          >
            <Bookmark size={22} fill={saved ? '#06B6D4' : 'none'} />
          </button>
        </div>

        {/* Caption & Hashtags */}
        <div>
          <p style={{ fontSize: '0.92rem', color: '#E2E8F0', lineHeight: 1.5, marginBottom: '6px' }}>
            {post.caption}
          </p>
          {post.hashtags && (
            <p style={{ fontSize: '0.82rem', color: '#06B6D4', fontWeight: 500 }}>
              {post.hashtags}
            </p>
          )}
        </div>

        {/* Prediction Insights Note */}
        {post.prediction && (
          <div style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed var(--border-glass)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={14} color="#A78BFA" />
            <span><strong>ML Prediction:</strong> {post.prediction}</span>
          </div>
        )}

        {/* Comment Section Drawer */}
        {commentsOpen && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {comments.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No comments yet. Be the first to comment!</span>
              ) : (
                comments.map((c, i) => (
                  <div key={c.id || i} style={{ display: 'flex', gap: '8px', fontSize: '0.84rem' }}>
                    <span style={{ fontWeight: 700, color: '#A78BFA' }}>@{c.username || 'user'}:</span>
                    <span style={{ color: 'var(--text-main)', flex: 1 }}>{c.text}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="input-field"
                style={{ padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ padding: '8px 14px' }}
                disabled={isSubmittingComment}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

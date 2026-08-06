import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, CheckCircle2, Send, Sparkles } from 'lucide-react';
import { toggleLikePost, addCommentToPost, logUserInteraction } from '../services/api';

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(post.comments_list || []);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Like Toggle
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

  // Save Toggle
  const handleSave = async () => {
    const nextState = !saved;
    setSaved(nextState);
    try {
      await logUserInteraction({
        post_id: post.id,
        saved: nextState,
        caption: post.caption,
        hashtags: post.hashtags,
      });
    } catch (err) {
      console.error('Failed to log save:', err);
    }
  };

  // Submit Comment
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

  // Sentiment Pill Helper
  const getSentimentBadge = (sentiment) => {
    const s = (sentiment || '').toLowerCase();
    if (s === 'positive') {
      return <span className="badge badge-positive">Positive</span>;
    } else if (s === 'negative') {
      return <span className="badge badge-negative">Negative</span>;
    }
    return <span className="badge badge-neutral">Neutral</span>;
  };

  return (
    <div className="insta-card" style={{ marginBottom: '24px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img 
            src={post.user_avatar} 
            alt={post.username}
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255, 255, 255, 0.15)' }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#FFF' }}>
                {post.username}
              </span>
              {post.is_verified && <CheckCircle2 size={14} color="#06B6D4" />}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {post.location}
            </span>
          </div>
        </div>

        <div>
          {getSentimentBadge(post.sentiment)}
        </div>
      </div>

      {/* Post Image */}
      <div style={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#000', overflow: 'hidden' }}>
        <img 
          src={post.image_url} 
          alt="Post content" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </div>

      {/* Action Bar */}
      <div style={{ padding: '12px 16px 8px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handleLike}
              style={{ color: liked ? '#F43F5E' : '#FFF', transition: 'var(--transition-fast)' }}
            >
              <Heart size={24} fill={liked ? '#F43F5E' : 'none'} color={liked ? '#F43F5E' : 'currentColor'} />
            </button>

            <button 
              onClick={() => setCommentsOpen(!commentsOpen)}
              style={{ color: '#FFF' }}
            >
              <MessageCircle size={24} />
            </button>

            <button 
              style={{ color: '#FFF' }}
              onClick={() => alert(`Shared post: ${post.url || 'https://instagram.com'}`)}
            >
              <Share2 size={22} />
            </button>
          </div>

          <button 
            onClick={handleSave}
            style={{ color: saved ? '#06B6D4' : '#FFF' }}
          >
            <Bookmark size={24} fill={saved ? '#06B6D4' : 'none'} />
          </button>
        </div>

        {/* Likes Count */}
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#FFF' }}>
          {likesCount.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div style={{ fontSize: '0.88rem', color: '#E2E8F0', lineHeight: 1.45 }}>
          <span style={{ fontWeight: 700, color: '#FFF', marginRight: '6px' }}>{post.username}</span>
          {post.caption}
          {post.hashtags && (
            <div style={{ fontSize: '0.82rem', color: '#06B6D4', fontWeight: 500, marginTop: '4px' }}>
              {post.hashtags}
            </div>
          )}
        </div>

        {/* View Comments Toggle */}
        <button 
          onClick={() => setCommentsOpen(!commentsOpen)}
          style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'left', marginTop: '2px' }}
        >
          View all {comments.length || post.comments_count} comments
        </button>

        {/* Comment Drawer */}
        {commentsOpen && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {comments.map((c, i) => (
                <div key={c.id || i} style={{ fontSize: '0.82rem' }}>
                  <span style={{ fontWeight: 700, color: '#A78BFA', marginRight: '6px' }}>@{c.username}:</span>
                  <span style={{ color: 'var(--text-main)' }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Comment Input Form */}
        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <input 
            type="text" 
            placeholder="Add a comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#FFF',
              fontSize: '0.84rem',
              outline: 'none',
            }}
          />
          {commentInput.trim() && (
            <button type="submit" style={{ color: '#8B5CF6', fontWeight: 700, fontSize: '0.84rem' }}>
              Post
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

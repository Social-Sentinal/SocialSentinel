import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, CheckCircle2, Play } from 'lucide-react';
import MediaImage from './MediaImage';
import { toggleLikePost, addCommentToPost, logUserInteraction } from '../services/api';

export default function PostCard({ post, onOpenUser, onInspectPost }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState(post.comments_list || []);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const triggerInspect = () => {
    if (onInspectPost) {
      onInspectPost(post);
    }
  };

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

  const triggerUserModal = () => {
    if (onOpenUser && post.username) {
      onOpenUser(post.username);
    }
  };

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
        <div 
          onClick={triggerUserModal}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          title="Click to view Instagram user details"
        >
          <MediaImage 
            src={post.user_avatar} 
            alt={post.username}
            isAvatar={true}
            style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #8B5CF6' }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                {post.username}
              </span>
              {post.is_verified && <CheckCircle2 size={14} color="#3B82F6" />}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {post.location || 'New York, NY'} • {post.follower_count ? `${(post.follower_count / 1000).toFixed(0)}k followers` : 'Verified Creator'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {post.recommendation_reason && (
            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
              {post.recommendation_reason}
            </span>
          )}
          {getSentimentBadge(post.sentiment)}
        </div>
      </div>

      {/* Post Media (Image/Video Overlay) */}
      <div 
        className="post-media-container" 
        onClick={triggerInspect} 
        style={{ cursor: 'pointer', position: 'relative' }}
        title="Click post to view details & NLP sentiment analysis"
      >
        <MediaImage 
          src={post.image_url} 
          alt="Post content" 
          loading="lazy"
        />
        
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 40%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}>
            <Play size={20} color="#FFF" style={{ marginLeft: '3px' }} />
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ padding: '12px 16px 8px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button 
              onClick={handleLike}
              style={{ color: liked ? '#F43F5E' : 'var(--text-main)', transition: 'var(--transition-fast)' }}
            >
              <Heart size={24} fill={liked ? '#F43F5E' : 'none'} color={liked ? '#F43F5E' : 'currentColor'} />
            </button>

            <button 
              onClick={() => setCommentsOpen(!commentsOpen)}
              style={{ color: 'var(--text-main)' }}
            >
              <MessageCircle size={24} />
            </button>

            <button 
              style={{ color: 'var(--text-main)' }}
              onClick={() => alert(`Shared post: ${post.url || 'https://socialsentinel.ai'}`)}
            >
              <Share2 size={22} />
            </button>
          </div>

          <button 
            onClick={handleSave}
            style={{ color: saved ? '#3B82F6' : 'var(--text-main)' }}
          >
            <Bookmark size={24} fill={saved ? '#3B82F6' : 'none'} />
          </button>
        </div>

        {/* Likes Count */}
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
          {likesCount.toLocaleString()} likes
        </div>

        {/* Caption */}
        <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.45 }}>
          <span 
            onClick={triggerUserModal}
            style={{ fontWeight: 700, color: 'var(--text-main)', marginRight: '6px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {post.username}
          </span>
          {post.caption}
          {post.hashtags && (
            <div style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 600, marginTop: '4px' }}>
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
                  <span style={{ fontWeight: 700, color: '#EC4899', marginRight: '6px' }}>@{c.username}:</span>
                  <span style={{ color: 'var(--text-main)' }}>{c.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inline Comment Input Form */}
        <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
          <input 
            type="text" 
            placeholder="Add a comment..."
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '0.84rem',
              outline: 'none',
            }}
          />
          {commentInput.trim() && (
            <button type="submit" style={{ color: '#EC4899', fontWeight: 700, fontSize: '0.84rem' }}>
              Post
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

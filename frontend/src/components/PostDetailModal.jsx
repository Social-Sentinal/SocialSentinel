import React, { useState } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Heart, Share2, Bookmark, CheckCircle2, Cpu } from 'lucide-react';
import { toggleLikePost, addCommentToPost, logUserInteraction } from '../services/api';

export default function PostDetailModal({ post, onClose, onOpenUser }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'extraction'
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [saved, setSaved] = useState(false);
  const [comments, setComments] = useState(post.comments_list || []);
  const [commentInput, setCommentInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NLP Token Extraction Calculation
  const cleanedText = (post.caption || '').toLowerCase().replace(/[^\w\s#]/gi, '');
  const tokens = cleanedText.split(/\s+/).filter(Boolean);
  const keyWords = tokens.filter(t => !t.startsWith('#') && t.length > 3).slice(0, 8);

  const handleLike = async () => {
    const nextState = !liked;
    setLiked(nextState);
    setLikesCount(prev => nextState ? prev + 1 : Math.max(0, prev - 1));
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
      });
    } catch (err) {
      console.error('Failed to log save:', err);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const textToSend = commentInput.trim();
    setCommentInput('');

    try {
      const res = await addCommentToPost(post.id, textToSend, 'social_explorer');
      if (res.status === 'success' && res.data) {
        setComments(prev => [...prev, res.data]);
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 200,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div className="insta-card post-detail-modal" style={{
        maxWidth: '960px',
        width: '100%',
        maxHeight: '90vh',
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
      }}>
        
        {/* Left Side: Media Player */}
        <div style={{
          position: 'relative',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: '400px',
        }}>
          <img 
            src={post.image_url} 
            alt="Post content" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />

          {/* Media Player Controls Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
          }}>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              style={{ color: '#FFF', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{isPlaying ? 'Playing' : 'Paused'}</span>
            </button>

            <button 
              onClick={() => setIsMuted(!isMuted)}
              style={{ color: '#FFF' }}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>

        {/* Right Side: Details & AI Extraction Panel */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          height: '100%',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border-color)',
          }}>
            <div 
              onClick={() => { onOpenUser && onOpenUser(post.username); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            >
              <img 
                src={post.user_avatar} 
                alt={post.username}
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #8B5CF6' }} 
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFF' }}>
                    {post.username}
                  </span>
                  {post.is_verified && <CheckCircle2 size={14} color="#06B6D4" />}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {post.location || 'New York, NY'}
                </span>
              </div>
            </div>

            <button onClick={onClose} className="btn-icon">
              <X size={20} />
            </button>
          </div>

          {/* Toggle Tabs: Comments vs AI Extraction */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
          }}>
            <button
              onClick={() => setActiveTab('comments')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: activeTab === 'comments' ? '#A78BFA' : 'var(--text-muted)',
                borderBottom: activeTab === 'comments' ? '2px solid #8B5CF6' : '2px solid transparent',
              }}
            >
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setActiveTab('extraction')}
              style={{
                flex: 1,
                padding: '10px',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: activeTab === 'extraction' ? '#06B6D4' : 'var(--text-muted)',
                borderBottom: activeTab === 'extraction' ? '2px solid #06B6D4' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Cpu size={14} />
              AI Extraction & Sentiment
            </button>
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Caption */}
            <div style={{ fontSize: '0.88rem', color: '#E2E8F0', lineHeight: 1.45 }}>
              <span style={{ fontWeight: 700, color: '#FFF', marginRight: '6px' }}>@{post.username}:</span>
              {post.caption}
            </div>

            {activeTab === 'comments' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                {comments.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                    No comments yet. Start the conversation!
                  </div>
                ) : (
                  comments.map((c, i) => (
                    <div key={c.id || i} style={{ display: 'flex', gap: '10px', fontSize: '0.84rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.72rem', color: '#FFF' }}>
                        {(c.username || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, color: '#A78BFA', marginRight: '6px' }}>@{c.username}:</span>
                        <span style={{ color: 'var(--text-main)' }}>{c.text}</span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '2px' }}>{c.timestamp || 'Just now'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* AI Content Extraction Pipeline View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#06B6D4', textTransform: 'uppercase', marginBottom: '6px' }}>
                    NLP Vector Breakdown
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#FFF', fontFamily: 'var(--font-mono)' }}>
                    <strong>Word2Vec Embedding Dimension:</strong> 100-D continuous vector space
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#FFF', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    <strong>TF-IDF Topic Cluster:</strong> {post.topic_category || 'General Growth'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Extracted Preprocessed Tokens
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {keyWords.map((kw, i) => (
                      <span key={i} style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', color: '#E2E8F0', fontFamily: 'var(--font-mono)' }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Sentiment Steering Metric
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.84rem', color: '#FFF' }}>Predicted Sentiment</span>
                    <span className={`badge ${post.sentiment === 'Positive' ? 'badge-positive' : (post.sentiment === 'Negative' ? 'badge-negative' : 'badge-neutral')}`}>
                      {post.sentiment || 'Neutral'} ({Math.round((post.score || 0.85) * 100)}% Confidence)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar & Comment Form */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <button onClick={handleLike} style={{ color: liked ? '#F43F5E' : '#FFF' }}>
                  <Heart size={22} fill={liked ? '#F43F5E' : 'none'} color={liked ? '#F43F5E' : 'currentColor'} />
                </button>
                <button onClick={() => alert(`Shared post link: ${post.url || 'https://socialsentinel.ai'}`)} style={{ color: '#FFF' }}>
                  <Share2 size={22} />
                </button>
              </div>

              <button onClick={handleSave} style={{ color: saved ? '#06B6D4' : '#FFF' }}>
                <Bookmark size={22} fill={saved ? '#06B6D4' : 'none'} />
              </button>
            </div>

            <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#FFF', marginBottom: '8px' }}>
              {likesCount.toLocaleString()} likes
            </div>

            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '8px' }}>
              <input 
                type="text" 
                placeholder="Add a comment..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                className="input-field"
                style={{ flex: 1, fontSize: '0.84rem' }}
              />
              {commentInput.trim() && (
                <button type="submit" className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.82rem' }}>
                  Post
                </button>
              )}
            </form>
          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 767px) {
          .post-detail-modal {
            grid-template-columns: 1fr !important;
            max-height: 95vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
}

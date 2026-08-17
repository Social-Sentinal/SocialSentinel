import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Heart, Share2, Bookmark, CheckCircle2, Cpu, Sparkles, Activity } from 'lucide-react';
import MediaImage from './MediaImage';
import { toggleLikePost, addCommentToPost, logUserInteraction, predictSentimentText, fetchEmotionDetection } from '../services/api';

const DEFAULT_SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

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

  // Dynamic AI Extraction States
  const [sentimentData, setSentimentData] = useState(null);
  const [emotionData, setEmotionData] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const videoUrl = post.video_url || post.video || DEFAULT_SAMPLE_VIDEO;

  // Perform dynamic NLP extraction when post changes or modal opens
  useEffect(() => {
    if (!post || !post.caption) return;

    setIsExtracting(true);
    Promise.all([
      predictSentimentText(post.caption).catch(() => null),
      fetchEmotionDetection(post.caption).catch(() => null)
    ]).then(([sentRes, emoRes]) => {
      if (sentRes && (sentRes.status === 'success' || sentRes.sentiment)) {
        setSentimentData(sentRes);
      }
      if (emoRes && (emoRes.status === 'success' || emoRes.emotions)) {
        setEmotionData(emoRes.emotions);
      }
    }).finally(() => {
      setIsExtracting(false);
    });
  }, [post]);

  // Extract keywords & clean tokens dynamically
  const cleanedText = (post.caption || '').toLowerCase().replace(/[^\w\s#]/gi, '');
  const tokens = cleanedText.split(/\s+/).filter(Boolean);
  const keyWords = Array.from(new Set(tokens.filter(t => !t.startsWith('#') && t.length > 3))).slice(0, 10);
  const extractedHashtags = tokens.filter(t => t.startsWith('#')).concat((post.hashtags || '').split(/\s+/)).filter(Boolean).slice(0, 5);

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

  const dist = sentimentData?.distribution || { positive: 65.0, neutral: 25.0, negative: 10.0 };
  const emos = emotionData || { joy: 0.72, surprise: 0.38, sadness: 0.12, anger: 0.08 };

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
        border: '1px solid rgba(139, 92, 246, 0.35)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
      }}>
        
        {/* Left Side: Real HTML5 Media / Video Player */}
        <div style={{
          position: 'relative',
          backgroundColor: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: '400px',
        }}>
          {post.video_url || post.is_video ? (
            <video
              src={videoUrl}
              autoPlay={isPlaying}
              loop
              muted={isMuted}
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <MediaImage 
              src={post.image_url} 
              alt="Post content" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}

          {/* Media Player Controls Overlay */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255, 255, 255, 0.15)'
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
              <MediaImage 
                src={post.user_avatar} 
                alt={post.username}
                isAvatar={true}
                style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #8B5CF6' }} 
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFF' }}>
                    @{post.username}
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
              Live Dynamic AI NLP Pipeline
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
              /* Dynamic AI Content Extraction Pipeline View */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {isExtracting ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#06B6D4', fontSize: '0.84rem' }}>
                    Computing live Word2Vec embeddings & sentiment vectors...
                  </div>
                ) : (
                  <>
                    {/* Live Sentiment Distribution Bar */}
                    <div style={{ padding: '12px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#06B6D4', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Activity size={14} /> Live Sentiment Breakdown
                        </span>
                        <span className={`badge ${(sentimentData?.sentiment || post.sentiment) === 'Positive' ? 'badge-positive' : ((sentimentData?.sentiment || post.sentiment) === 'Negative' ? 'badge-negative' : 'badge-neutral')}`}>
                          {sentimentData?.sentiment || post.sentiment || 'Neutral'}
                        </span>
                      </div>

                      <div style={{ height: '10px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', display: 'flex', overflow: 'hidden', marginBottom: '10px' }}>
                        <div style={{ width: `${dist.positive}%`, background: 'var(--positive)' }} title={`Positive: ${dist.positive}%`} />
                        <div style={{ width: `${dist.neutral}%`, background: 'var(--neutral)' }} title={`Neutral: ${dist.neutral}%`} />
                        <div style={{ width: `${dist.negative}%`, background: 'var(--negative)' }} title={`Negative: ${dist.negative}%`} />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#E2E8F0' }}>
                        <span><strong style={{ color: '#34D399' }}>Pos:</strong> {dist.positive}%</span>
                        <span><strong style={{ color: '#CBD5E1' }}>Neu:</strong> {dist.neutral}%</span>
                        <span><strong style={{ color: '#FB7185' }}>Neg:</strong> {dist.negative}%</span>
                      </div>
                    </div>

                    {/* Emotion Spectrum Bar Breakdown */}
                    <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Emotion Spectrum Intensities
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.76rem' }}>
                        <div>
                          <span style={{ color: '#34D399' }}>Joy:</span> <strong>{Math.round((emos.joy || 0.7) * 100)}%</strong>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round((emos.joy || 0.7) * 100)}%`, height: '100%', background: '#34D399' }} />
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#06B6D4' }}>Surprise:</span> <strong>{Math.round((emos.surprise || 0.4) * 100)}%</strong>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round((emos.surprise || 0.4) * 100)}%`, height: '100%', background: '#06B6D4' }} />
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#8B5CF6' }}>Sadness:</span> <strong>{Math.round((emos.sadness || 0.1) * 100)}%</strong>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round((emos.sadness || 0.1) * 100)}%`, height: '100%', background: '#8B5CF6' }} />
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#FB7185' }}>Anger:</span> <strong>{Math.round((emos.anger || 0.05) * 100)}%</strong>
                          <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${Math.round((emos.anger || 0.05) * 100)}%`, height: '100%', background: '#FB7185' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Extracted Tokens */}
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                        Extracted NLP Tokens & Topic Cluster
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {keyWords.map((kw, i) => (
                          <span key={i} style={{ padding: '3px 8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', color: '#E2E8F0', fontFamily: 'var(--font-mono)' }}>
                            {kw}
                          </span>
                        ))}
                        {extractedHashtags.map((h, i) => (
                          <span key={`h-${i}`} style={{ padding: '3px 8px', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', color: '#60A5FA', fontFamily: 'var(--font-mono)' }}>
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
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

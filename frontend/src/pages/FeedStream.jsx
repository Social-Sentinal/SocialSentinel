import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Sparkles, Send, Image, Film, FileText, X, Check, Hash, Smile } from 'lucide-react';
import { PostCardItem } from '../components/PostCardItem';
import { TOPICS } from '../constants';
import realInstagramPosts from '../data/realInstagramData.json';

const FALLBACK_POSTS = realInstagramPosts && realInstagramPosts.length > 0 ? realInstagramPosts : [
  {
    id: 1,
    caption: "Sub-15ms local inference is a huge milestone for user privacy and resilient architecture. Running NLP embeddings locally on client devices without external cloud dependencies transforms web applications.",
    hashtags: "#AI #LocalInference #Privacy",
    topic_category: "AI & Tech",
    sentiment: "Positive",
    sentiment_confidence: 0.94,
    emotion: "inspiration",
    recommendation_reason: "Matches your interest in #AI & Tech",
    author: {
      username: "ai_research",
      display_name: "AI Research Lab",
      avatar_url: ""
    },
    counts: { likes: 38, comments: 12, saves: 19 },
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

export function FeedStream({ user, feedTrigger, refreshFeed, onOpenShare, onOpenDetail, onExplain }) {
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [selectedTopic, setSelectedTopic] = useState('For You');
  const [loading, setLoading] = useState(false);

  const loadPosts = async () => {
    setLoading(true);
    try {
      if (selectedTopic === 'For You') {
        const res = await api.feed('?limit=50');
        const items = res.data || [];
        if (items.length > 0) {
          const formatted = items.map(item => ({
            ...item.post,
            recommendation_reason: item.reason,
            recommendation_score: item.score
          }));
          setPosts(formatted);
        } else {
          setPosts(FALLBACK_POSTS);
        }
      } else if (selectedTopic === 'Discover') {
        const res = await api.serendipityFeed('?limit=50');
        const items = res.data || [];
        if (items.length > 0) {
          const formatted = items.map(item => ({
            ...item.post,
            recommendation_reason: item.reason,
            recommendation_score: item.score
          }));
          setPosts(formatted);
        } else {
          setPosts(FALLBACK_POSTS);
        }
      } else {
        const res = await api.posts(`?limit=50&topic=${encodeURIComponent(selectedTopic)}`);
        const items = res.data || [];
        if (items.length > 0) {
          setPosts(items);
        } else {
          const filtered = FALLBACK_POSTS.filter(p => p.topic_category === selectedTopic || p.topic === selectedTopic);
          setPosts(filtered.length > 0 ? filtered : FALLBACK_POSTS);
        }
      }
    } catch (err) {
      console.warn('Backend unavailable, using real scraped Instagram dataset fallback:', err.message);
      if (selectedTopic === 'For You' || selectedTopic === 'Discover') {
        setPosts(FALLBACK_POSTS);
      } else {
        const filtered = FALLBACK_POSTS.filter(p => p.topic_category === selectedTopic || p.topic === selectedTopic);
        setPosts(filtered.length > 0 ? filtered : FALLBACK_POSTS);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedTopic, feedTrigger]);

  return (
    <>
      {/* Topic Filter Pills */}
      <div className="topic-pills-scroll">
        {['For You', 'Discover', ...TOPICS.slice(1)].map(t => (
          <button
            key={t}
            className={`topic-filter-btn ${selectedTopic === t ? 'active' : ''}`}
            onClick={() => setSelectedTopic(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={22} color="var(--primary)" />
          <p style={{ marginTop: 8, fontSize: 13.5 }}>Loading real feed…</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCardItem
            key={post.id}
            post={post}
            user={user}
            refresh={loadPosts}
            onOpenShare={onOpenShare}
            onOpenDetail={onOpenDetail}
            onExplain={onExplain}
          />
        ))
      )}
    </>
  );
}

const SUGGESTED_TAGS = ['#SocialSentinel', '#AI', '#Photography', '#Space', '#LifeStories', '#Nature', '#Reels', '#Design'];

export function QuickComposer({ user, onPosted }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('AI & Tech');
  const [hashtags, setHashtags] = useState('');
  const [mediaType, setMediaType] = useState('story'); // 'story' | 'image' | 'video'
  const [mediaUrl, setMediaUrl] = useState('');
  const [sentimentPreview, setSentimentPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showMediaInput, setShowMediaInput] = useState(false);

  // Live sentiment radar
  useEffect(() => {
    if (!caption.trim() || caption.length < 5) {
      setSentimentPreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const s = await api.predictSentiment(caption);
        setSentimentPreview(s);
      } catch (err) {}
    }, 300);
    return () => clearTimeout(timer);
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

  const handlePublish = async () => {
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
      setCaption('');
      setHashtags('');
      setMediaUrl('');
      setMediaType('story');
      setShowMediaInput(false);
      setSentimentPreview(null);
      if (onPosted) onPosted();
    } catch (err) {
      // Optimistic local dispatch
      setCaption('');
      setHashtags('');
      setMediaUrl('');
      setShowMediaInput(false);
      setSentimentPreview(null);
      if (onPosted) onPosted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="composer-card interactive-composer">
      {/* Top Type Selector Tabs */}
      <div className="composer-tab-bar">
        <button
          className={`composer-tab-btn ${mediaType === 'story' && !showMediaInput ? 'active' : ''}`}
          onClick={() => { setMediaType('story'); setShowMediaInput(false); }}
        >
          <FileText size={14} />
          <span>Story / Thought</span>
        </button>
        <button
          className={`composer-tab-btn ${mediaType === 'image' || (showMediaInput && mediaType !== 'video') ? 'active' : ''}`}
          onClick={() => { setMediaType('image'); setShowMediaInput(true); }}
        >
          <Image size={14} />
          <span>Photo / Image</span>
        </button>
        <button
          className={`composer-tab-btn ${mediaType === 'video' ? 'active' : ''}`}
          onClick={() => { setMediaType('video'); setShowMediaInput(true); }}
        >
          <Film size={14} />
          <span>Video / Reel</span>
        </button>
      </div>

      {/* Main Input Row */}
      <div className="composer-row" style={{ marginTop: 12 }}>
        <MediaImage
          src={user.avatar_url}
          fallbackText={user.display_name}
          isAvatar
          className="composer-avatar"
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <textarea
            className="composer-textarea"
            placeholder={
              mediaType === 'video'
                ? "Describe your reel, insight, or dispatch…"
                : mediaType === 'image'
                ? "Add a caption for your photo…"
                : "Share an insight, question, or discovery with SocialSentinel…"
            }
            value={caption}
            onChange={e => setCaption(e.target.value)}
          />
        </div>
      </div>

      {/* Media Attachment / URL Input & Preview */}
      {showMediaInput && (
        <div className="composer-media-box">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              className="composer-media-url-input"
              placeholder={mediaType === 'video' ? "Paste MP4 or Reel video URL…" : "Paste Image URL (or upload below)…"}
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
            />
            <label className="btn-file-upload" title="Upload local file">
              <span>Upload</span>
              <input type="file" accept={mediaType === 'video' ? "video/*" : "image/*"} onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
            {mediaUrl && (
              <button className="btn-clear-media" onClick={() => setMediaUrl('')} title="Remove media">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Live Media Preview */}
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

      {/* Live AI Sentiment Feedback Meter */}
      {sentimentPreview && (
        <div className="composer-sentiment-meter">
          <Sparkles size={13} color="var(--primary)" />
          <span style={{ color: 'var(--text-muted)' }}>Tone Predictor:</span>
          <span className={`sentiment-badge ${(sentimentPreview.sentiment || 'neutral').toLowerCase()}`}>
            {sentimentPreview.sentiment} ({Math.round(sentimentPreview.confidence * 100)}%)
          </span>
          {sentimentPreview.emotion && (
            <span className="emotion-pill">
              {sentimentPreview.emotion}
            </span>
          )}
        </div>
      )}

      {/* Interactive Topic & Tag Selectors */}
      <div className="composer-interactive-tools">
        {/* Topic Community Pills */}
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

        {/* Suggested Hashtag Chips */}
        <div className="composer-tag-chips">
          <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
            <Hash size={11} /> Tags:
          </span>
          {SUGGESTED_TAGS.map(tag => (
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

      {/* Bottom Actions Row */}
      <div className="composer-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            className="composer-tags-input"
            placeholder="#add_tags"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
          />
          <span className="composer-char-count">
            {caption.length} / 2000
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {(caption || mediaUrl || hashtags) && (
            <button
              className="btn-text-secondary"
              onClick={() => { setCaption(''); setMediaUrl(''); setHashtags(''); setShowMediaInput(false); }}
            >
              Clear
            </button>
          )}

          <button
            className="btn-primary btn-publish-interactive"
            disabled={submitting || !caption.trim()}
            onClick={handlePublish}
          >
            <Send size={13} />
            <span>{submitting ? 'Publishing…' : 'Publish Dispatch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

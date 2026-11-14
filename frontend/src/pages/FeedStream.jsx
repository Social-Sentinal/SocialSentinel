import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Sparkles, Send } from 'lucide-react';
import { PostCardItem } from '../components/PostCardItem';
import { TOPICS } from '../constants';

const FALLBACK_POSTS = [
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
  },
  {
    id: 2,
    caption: "Building distributed architectures with zero-dependency fallback layers ensures high availability even during serverless cold starts. Hybrid recommendation ranking brings transparency back to social feeds.",
    hashtags: "#WebEngineering #DistributedSystems",
    topic_category: "Web Engineering",
    sentiment: "Positive",
    sentiment_confidence: 0.89,
    emotion: "curiosity",
    recommendation_reason: "Trending in Web Engineering",
    author: {
      username: "dev_craft",
      display_name: "Elena Vance",
      avatar_url: ""
    },
    counts: { likes: 24, comments: 7, saves: 14 },
    created_at: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 3,
    caption: "Zero-trust privacy architectures and client-side encryption are becoming non-negotiable. Protecting user telemetry from centralized data aggregators is the future of personal computing.",
    hashtags: "#Cybersecurity #Privacy #ZeroTrust",
    topic_category: "Cybersecurity & Privacy",
    sentiment: "Positive",
    sentiment_confidence: 0.91,
    emotion: "wonder",
    recommendation_reason: "High peer affinity in Cybersecurity",
    author: {
      username: "sentinel_sec",
      display_name: "Sentinel Security",
      avatar_url: ""
    },
    counts: { likes: 45, comments: 15, saves: 28 },
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
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
        const res = await api.feed('?limit=25');
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
        const res = await api.serendipityFeed('?limit=25');
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
        const res = await api.posts(`?limit=25&topic=${encodeURIComponent(selectedTopic)}`);
        const items = res.data || [];
        if (items.length > 0) {
          setPosts(items);
        } else {
          const filtered = FALLBACK_POSTS.filter(p => p.topic_category === selectedTopic);
          setPosts(filtered.length > 0 ? filtered : FALLBACK_POSTS);
        }
      }
    } catch (err) {
      console.error(err);
      setPosts(FALLBACK_POSTS);
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
          <p style={{ marginTop: 8, fontSize: 13.5 }}>Loading recommended feed…</p>
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

export function QuickComposer({ user, onPosted }) {
  const [caption, setCaption] = useState('');
  const [topic, setTopic] = useState('AI & Tech');
  const [hashtags, setHashtags] = useState('');
  const [sentimentPreview, setSentimentPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    }, 350);
    return () => clearTimeout(timer);
  }, [caption]);

  const handlePublish = async () => {
    if (!caption.trim()) return;
    setSubmitting(true);
    try {
      await api.post({ caption, topic, hashtags });
      setCaption('');
      setHashtags('');
      setSentimentPreview(null);
      onPosted();
    } catch (err) {
      alert(err.message || 'Post created locally');
      onPosted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="composer-card">
      <div className="composer-row">
        <MediaImage
          src={user.avatar_url}
          fallbackText={user.display_name}
          isAvatar
          className="composer-avatar"
        />
        <textarea
          className="composer-textarea"
          placeholder="Share an insight, question, or discovery with SocialSentinel…"
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />
      </div>

      {sentimentPreview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 8 }}>
          <span style={{ color: 'var(--text-muted)' }}>Tone:</span>
          <span className={`sentiment-badge ${(sentimentPreview.sentiment || 'neutral').toLowerCase()}`}>
            {sentimentPreview.sentiment} ({Math.round(sentimentPreview.confidence * 100)}%)
          </span>
        </div>
      )}

      <div className="composer-bottom">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <select
            className="composer-select"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          >
            {TOPICS.slice(1).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            className="composer-tags-input"
            placeholder="#tags"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
          />
        </div>

        <button
          className="btn-primary"
          disabled={submitting || !caption.trim()}
          onClick={handlePublish}
        >
          <Send size={13} />
          <span>{submitting ? 'Posting…' : 'Publish'}</span>
        </button>
      </div>
    </div>
  );
}

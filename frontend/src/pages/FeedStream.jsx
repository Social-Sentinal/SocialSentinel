import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Heart, MessageCircle, Share2, Sparkles, X, Send, Compass, Search, Users, Brain, Shield, BarChart3, TrendingUp } from 'lucide-react';

import { PostCardItem } from '../components/PostCardItem';
import { TOPICS } from '../constants';
export function FeedStream({ user, feedTrigger, refreshFeed, onOpenShare, onOpenDetail, onExplain }) {
  const [posts, setPosts] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState('For You');
  const [loading, setLoading] = useState(true);

  const loadPosts = async () => {
    setLoading(true);
    try {
      if (selectedTopic === 'For You') {
        const res = await api.feed('?limit=25');
        const formatted = (res.data || []).map(item => ({
          ...item.post,
          recommendation_reason: item.reason,
          recommendation_score: item.score
        }));
        setPosts(formatted);
      } else if (selectedTopic === 'Discover') {
        const res = await api.serendipityFeed('?limit=25');
        const formatted = (res.data || []).map(item => ({
          ...item.post,
          recommendation_reason: item.reason,
          recommendation_score: item.score
        }));
        setPosts(formatted);
      } else {
        const res = await api.posts(`?limit=25&topic=${encodeURIComponent(selectedTopic)}`);
        setPosts(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [selectedTopic, feedTrigger]);

  return (
    <>
      <div className="topic-pills-row">
        {['For You', 'Discover', ...TOPICS.slice(1)].map(t => (
          <button
            key={t}
            className={`topic-pill ${selectedTopic === t ? 'active' : ''}`}
            onClick={() => setSelectedTopic(t)}
          >
            {t === 'For You' ? '🎯 For You' : t === 'Discover' ? '✨ Discover' : t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={24} />
          <p style={{ marginTop: 8, fontSize: 14 }}>Calculating intelligent recommendations…</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="sentinel-card" style={{ textAlign: 'center', padding: 36 }}>
          <h3>No posts found in this section</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 14 }}>
            Be the first to share an insight in #{selectedTopic}!
          </p>
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
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="composer-card">
      <div className="composer-input-row">
        <MediaImage
          src={user.avatar_url}
          fallbackText={user.display_name}
          isAvatar
          className="composer-avatar"
        />
        <textarea
          className="composer-textarea"
          placeholder="Share your thoughts, discoveries, or questions on SocialSentinel…"
          value={caption}
          onChange={e => setCaption(e.target.value)}
        />
      </div>

      {sentimentPreview && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 99, background: 'var(--bg-elevated)', width: 'fit-content' }}>
          <span>{sentimentPreview.sentiment === 'Positive' ? '✨' : sentimentPreview.sentiment === 'Negative' ? '⚠️' : '⚖️'}</span>
          <span>Tone: <b>{sentimentPreview.sentiment}</b> ({Math.round(sentimentPreview.confidence * 100)}%)</span>
        </div>
      )}

      <div className="composer-footer">
        <div className="composer-controls">
          <select
            value={topic}
            onChange={e => setTopic(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12, outline: 'none' }}
          >
            {TOPICS.slice(1).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            placeholder="#tags"
            value={hashtags}
            onChange={e => setHashtags(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: 'var(--bg-elevated)', fontSize: 12, outline: 'none', width: 130 }}
          />
        </div>

        <button className="btn-primary" disabled={submitting || !caption.trim()} onClick={handlePublish}>
          <Send size={14} /> {submitting ? 'Posting…' : 'Publish'}
        </button>
      </div>
    </div>
  );
}




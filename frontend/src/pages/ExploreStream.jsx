import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Heart, MessageCircle, Share2, Sparkles, X, Send, Compass, Search, Users, Brain, Shield, BarChart3, TrendingUp } from 'lucide-react';

import { PostCardItem } from '../components/PostCardItem';
export function ExploreStream({ user, onOpenShare, onOpenDetail, onExplain }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All');
  const [sentiment, setSentiment] = useState('All');
  const [author, setAuthor] = useState('');
  
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('search'); // 'search', 'recommend', 'serendipity'

  const doSearch = async (val, t, s, a, overrideMode = mode) => {
    setQuery(val !== undefined ? val : query);
    const finalTopic = t !== undefined ? t : topic;
    const finalSentiment = s !== undefined ? s : sentiment;
    const finalAuthor = a !== undefined ? a : author;
    
    setLoading(true);
    setMode(overrideMode);
    
    try {
      if (overrideMode === 'search') {
        const res = await api.posts({ q: val !== undefined ? val : query, topic: finalTopic, sentiment: finalSentiment, author: finalAuthor });
        // posts endpoint returns just an array, we map it to results format
        setResults({ users: [], posts: res.data || [] });
      } else if (overrideMode === 'recommend') {
        const res = await api.feed({ limit: 20 });
        setResults({ users: [], posts: res.data.map(item => item.post || item) || [] });
      } else if (overrideMode === 'serendipity') {
        const res = await api.serendipityFeed({ limit: 20 });
        setResults({ users: [], posts: res.data.map(item => item.post || item) || [] });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    doSearch(query, topic, sentiment, author, 'recommend');
  }, []);

  return (
    <>
      <div className="sentinel-card">
        <h2 className="card-heading"><Compass size={20} color="var(--primary)" /> SocialSentinel Explorer</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 12 }}>
          Find technical insights, research updates, security advisories, and creators across the network.
        </p>
        
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button className={`btn-${mode === 'recommend' ? 'primary' : 'secondary'}`} onClick={() => doSearch(query, topic, sentiment, author, 'recommend')}>Smart Feed</button>
          <button className={`btn-${mode === 'serendipity' ? 'primary' : 'secondary'}`} onClick={() => doSearch(query, topic, sentiment, author, 'serendipity')}>Surprise Me</button>
          <button className={`btn-${mode === 'search' ? 'primary' : 'secondary'}`} onClick={() => doSearch(query, topic, sentiment, author, 'search')}>Search & Filter</button>
        </div>

        {mode === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: 12, color: 'var(--text-muted)' }} />
              <input
                style={{ width: '100%', padding: '10px 14px 10px 38px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none', fontSize: 14 }}
                placeholder="Search keywords, #hashtags…"
                value={query}
                onChange={e => doSearch(e.target.value, topic, sentiment, author, 'search')}
              />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <select value={topic} onChange={e => { setTopic(e.target.value); doSearch(query, e.target.value, sentiment, author, 'search'); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none', flex: 1 }}>
                <option value="All">All Topics</option>
                <option value="Technology & AI">Technology & AI</option>
                <option value="Astrophysics & Cosmos">Astrophysics</option>
                <option value="Health & Wellness">Health</option>
                <option value="Finance & Crypto">Finance</option>
              </select>
              <select value={sentiment} onChange={e => { setSentiment(e.target.value); doSearch(query, topic, e.target.value, author, 'search'); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none', flex: 1 }}>
                <option value="All">All Sentiments</option>
                <option value="positive">Positive</option>
                <option value="neutral">Neutral</option>
                <option value="negative">Negative</option>
              </select>
              <input placeholder="Filter by author..." value={author} onChange={e => { setAuthor(e.target.value); doSearch(query, topic, sentiment, e.target.value, 'search'); }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none', flex: 1 }} />
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Sparkles size={20} /> Searching SocialSentinel…
        </div>
      )}

      {results.users.length > 0 && mode === 'search' && (
        <div className="sentinel-card">
          <h3 className="card-heading">Creators</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {results.users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, borderRadius: 8, background: 'var(--bg-elevated)' }}>
                <MediaImage src={u.avatar_url} fallbackText={u.display_name} isAvatar style={{ width: 34, height: 34, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{u.display_name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.posts.map(p => (
        <PostCardItem
          key={p.id}
          post={p}
          user={user}
          refresh={() => doSearch(query, topic, sentiment, author, mode)}
          onOpenShare={onOpenShare}
          onOpenDetail={onOpenDetail}
          onExplain={onExplain}
        />
      ))}
    </>
  );
}


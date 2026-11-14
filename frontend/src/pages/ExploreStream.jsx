import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Compass, Search, Sparkles } from 'lucide-react';
import { PostCardItem } from '../components/PostCardItem';

export function ExploreStream({ user, onOpenShare, onOpenDetail, onExplain }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('All');
  const [sentiment, setSentiment] = useState('All');
  const [author, setAuthor] = useState('');
  
  const [results, setResults] = useState({ users: [], posts: [] });
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('recommend'); // 'recommend', 'serendipity', 'search'

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
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header-row">
          <div className="card-title">
            <Compass size={18} color="var(--primary)" />
            <span>Explore & Discover</span>
          </div>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <button
            className={mode === 'recommend' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => doSearch(query, topic, sentiment, author, 'recommend')}
          >
            Recommendations
          </button>
          <button
            className={mode === 'serendipity' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => doSearch(query, topic, sentiment, author, 'serendipity')}
          >
            Serendipity
          </button>
          <button
            className={mode === 'search' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => doSearch(query, topic, sentiment, author, 'search')}
          >
            Search & Filter
          </button>
        </div>

        {mode === 'search' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
              <input
                className="input-field"
                style={{ paddingLeft: 34 }}
                placeholder="Search keywords, hashtags…"
                value={query}
                onChange={e => doSearch(e.target.value, topic, sentiment, author, 'search')}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                className="input-field"
                value={topic}
                onChange={e => { setTopic(e.target.value); doSearch(query, e.target.value, sentiment, author, 'search'); }}
                style={{ flex: 1, minWidth: 130 }}
              >
                <option value="All">All Topics</option>
                <option value="AI & Tech">AI & Tech</option>
                <option value="Cybersecurity & Privacy">Cybersecurity</option>
                <option value="Web Engineering">Web Engineering</option>
                <option value="Creative Tech & Design">Creative Tech</option>
                <option value="Digital Wellbeing">Digital Wellbeing</option>
              </select>

              <select
                className="input-field"
                value={sentiment}
                onChange={e => { setSentiment(e.target.value); doSearch(query, topic, e.target.value, author, 'search'); }}
                style={{ flex: 1, minWidth: 130 }}
              >
                <option value="All">All Sentiments</option>
                <option value="positive">Positive Tone</option>
                <option value="neutral">Neutral Tone</option>
                <option value="negative">Critical Tone</option>
              </select>

              <input
                className="input-field"
                placeholder="Filter by author…"
                value={author}
                onChange={e => { setAuthor(e.target.value); doSearch(query, topic, sentiment, e.target.value, 'search'); }}
                style={{ flex: 1, minWidth: 130 }}
              />
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
          <Sparkles size={20} color="var(--primary)" />
          <p style={{ marginTop: 6, fontSize: 13 }}>Searching…</p>
        </div>
      )}

      {results.users.length > 0 && mode === 'search' && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-title" style={{ marginBottom: 10 }}>Matching Creators</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {results.users.map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 8, borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)' }}>
                <MediaImage src={u.avatar_url} fallbackText={u.display_name} isAvatar style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{u.display_name}</div>
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

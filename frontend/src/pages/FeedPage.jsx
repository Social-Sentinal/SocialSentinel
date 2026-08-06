import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Radar, Sparkles } from 'lucide-react';
import PostCard from '../components/PostCard';
import { fetchPosts } from '../services/api';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetchPosts();
      if (res.status === 'success' && Array.isArray(res.data)) {
        setPosts(res.data);
        setFilteredPosts(res.data);
      }
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    let result = posts;

    // Apply Sentiment Filter
    if (sentimentFilter !== 'ALL') {
      result = result.filter((p) => (p.sentiment || '').toUpperCase() === sentimentFilter);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          (p.caption || '').toLowerCase().includes(q) ||
          (p.username || '').toLowerCase().includes(q) ||
          (p.hashtags || '').toLowerCase().includes(q)
      );
    }

    setFilteredPosts(result);
  }, [searchQuery, sentimentFilter, posts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Banner Header */}
      <div className="glass-card" style={{ padding: '32px 28px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: '700px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', fontSize: '0.78rem', color: '#A78BFA', fontWeight: 600, marginBottom: '12px' }}>
            <Sparkles size={14} /> Real-Time Social Media Sentinel
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }} className="gradient-text">
            Social Intelligence & Sentiment Radar
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Monitor real-time Instagram dataset posts, analyze automated NLP sentiment tags, track dwell time, and explore AI recommendations.
          </p>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '240px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search captions, usernames, or #hashtags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{ paddingLeft: '42px' }}
          />
        </div>

        {/* Sentiment Category Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Filter:
          </span>
          {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSentimentFilter(filter)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: sentimentFilter === filter ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: sentimentFilter === filter ? '#FFFFFF' : 'var(--text-muted)',
                border: sentimentFilter === filter ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-glass)',
                transition: 'var(--transition-fast)'
              }}
            >
              {filter}
            </button>
          ))}

          <button 
            onClick={loadPosts} 
            className="btn-icon" 
            title="Refresh Feed"
            style={{ marginLeft: '8px' }}
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Post Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
          <p>Analyzing social intelligence stream...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No posts matched your criteria.</p>
          <p style={{ fontSize: '0.85rem' }}>Try searching for another keyword or clearing sentiment filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

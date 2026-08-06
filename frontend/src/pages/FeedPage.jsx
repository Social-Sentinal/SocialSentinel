import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Activity, Heart, Eye, TrendingUp, Sparkles } from 'lucide-react';
import PostCard from '../components/PostCard';
import { fetchPosts, fetchAnalyticsOverview } from '../services/api';

export default function FeedPage() {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const [postRes, analyticsRes] = await Promise.all([
        fetchPosts(),
        fetchAnalyticsOverview()
      ]);
      if (postRes.status === 'success' && Array.isArray(postRes.data)) {
        setPosts(postRes.data);
        setFilteredPosts(postRes.data);
      }
      if (analyticsRes.status === 'success') {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    let result = posts;

    if (sentimentFilter !== 'ALL') {
      result = result.filter((p) => (p.sentiment || '').toUpperCase() === sentimentFilter);
    }

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
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '32px',
      maxWidth: '1000px',
      margin: '0 auto',
    }} className="feed-layout">

      {/* Main Social Feed Column */}
      <div style={{ maxWidth: '600px', width: '100%', margin: '0 auto' }}>
        {/* Compact Search & Filter Toolbar */}
        <div className="insta-card" style={{ padding: '12px 16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Search posts, users, #hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '38px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Sentiment Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'POSITIVE', 'NEUTRAL', 'NEGATIVE'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSentimentFilter(filter)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: sentimentFilter === filter ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                    color: sentimentFilter === filter ? '#FFFFFF' : 'var(--text-muted)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button 
              onClick={loadPosts} 
              className="btn-icon" 
              style={{ width: 28, height: 28 }}
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Post Feed List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading social stream...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="insta-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No posts found for your criteria.
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>

      {/* Right Sidebar (Desktop Insights Panel like Instagram) */}
      <div className="sidebar-column" style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* User Account / System Card */}
        <div className="insta-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={22} color="#FFF" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#FFF' }}>SocialSentinel AI</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Automated Radar Active</div>
          </div>
        </div>

        {/* Quick Platform Metrics */}
        {analytics && (
          <div className="insta-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Activity
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Feed Posts</span>
              <span style={{ fontWeight: 700, color: '#FFF' }}>{analytics.total_posts}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Positive Sentiment</span>
              <span style={{ fontWeight: 700, color: '#34D399' }}>{analytics.positive_percentage}%</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Impressions</span>
              <span style={{ fontWeight: 700, color: '#06B6D4' }}>{(analytics.total_views || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Top Trending Hashtags */}
        <div className="insta-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trending Hashtags
          </div>

          {(analytics?.top_hashtags || [
            { hashtag: '#adventure', count: 14 },
            { hashtag: '#nature', count: 12 },
            { hashtag: '#morning', count: 9 },
            { hashtag: '#coffee', count: 8 },
          ]).map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
              <span style={{ color: '#06B6D4', fontWeight: 600 }}>{h.hashtag}</span>
              <span style={{ color: 'var(--text-dim)' }}>{h.count} posts</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .feed-layout {
            grid-template-columns: 1fr 320px !important;
          }
          .sidebar-column {
            display: flex !important;
          }
        }
        @media (max-width: 899px) {
          .feed-layout {
            grid-template-columns: 1fr !important;
          }
          .sidebar-column {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

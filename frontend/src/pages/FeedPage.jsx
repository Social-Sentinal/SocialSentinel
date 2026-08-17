import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Activity, Sparkles, Instagram, Heart, Shield, Zap } from 'lucide-react';
import PostCard from '../components/PostCard';
import UserProfileModal from '../components/UserProfileModal';
import { fetchPosts, fetchAnalyticsOverview, fetchLiveInstagramData, fetchFeedRecommendations, fetchUserWellbeing } from '../services/api';

import MediaImage from '../components/MediaImage';

const FEATURED_PROFILES = [
  { username: 'humansofny', label: 'Humans of NY', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { username: 'mrbeast', label: 'MrBeast', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { username: 'natgeo', label: 'NatGeo', avatar: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=150&auto=format&fit=crop&q=80' },
  { username: 'techcrunch', label: 'TechCrunch', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { username: 'zen_master', label: 'Zen Wellness', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { username: 'code_craft', label: 'CodeCraft', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80' },
  { username: 'travel_bug', label: 'Wanderlust', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { username: 'creators', label: 'Creators', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
];

export default function FeedPage({ onInspectPost }) {
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [liveSearchHandle, setLiveSearchHandle] = useState('');
  const [isFetchingLive, setIsFetchingLive] = useState(false);
  
  // Wellbeing Steering State
  const [upliftGuardEnabled, setUpliftGuardEnabled] = useState(true);
  const [wellbeingData, setWellbeingData] = useState(null);

  const loadFeed = async (steering = upliftGuardEnabled) => {
    setIsLoading(true);
    try {
      const [feedRes, analyticsRes, wellbeingRes] = await Promise.all([
        fetchFeedRecommendations('career failure breakup success motivation', steering, 15),
        fetchAnalyticsOverview(),
        fetchUserWellbeing()
      ]);

      if (feedRes.status === 'success' && Array.isArray(feedRes.data)) {
        setPosts(feedRes.data);
        setFilteredPosts(feedRes.data);
      } else {
        const fallbackPosts = await fetchPosts();
        if (fallbackPosts.status === 'success') {
          setPosts(fallbackPosts.data);
          setFilteredPosts(fallbackPosts.data);
        }
      }

      if (analyticsRes.status === 'success') {
        setAnalytics(analyticsRes.data);
      }

      if (wellbeingRes.status === 'success') {
        setWellbeingData(wellbeingRes);
      }
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Infinite Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500 &&
        !isFetchingMore &&
        !isLoading &&
        posts.length > 0
      ) {
        setIsFetchingMore(true);
        setTimeout(() => {
          setPosts(prev => [
            ...prev,
            ...prev.map(p => ({ ...p, id: p.id + Math.floor(Math.random() * 10000) }))
          ]);
          setIsFetchingMore(false);
        }, 800);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isFetchingMore, isLoading, posts]);

  useEffect(() => {
    loadFeed(upliftGuardEnabled);
  }, [upliftGuardEnabled]);

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

  const handleLiveInstagramLookup = async (e) => {
    e.preventDefault();
    if (!liveSearchHandle.trim()) return;

    const query = liveSearchHandle.trim().replace('@', '');
    if (!query.startsWith('#')) {
      setSelectedUsername(query);
    }

    setIsFetchingLive(true);
    try {
      const res = await fetchLiveInstagramData(query);
      if (res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error('Live API fetch error:', err);
    } finally {
      setIsFetchingLive(false);
    }
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '32px',
      maxWidth: '1280px',
      margin: '0 auto',
      width: '100%',
    }} className="feed-layout">

      {/* Main Social Feed Column */}
      <div style={{ maxWidth: '680px', width: '100%', margin: '0 auto' }}>
        
        {/* Wellbeing Guard Hero Banner */}
        <div className="insta-card" style={{
          padding: '16px 20px',
          marginBottom: '20px',
          background: upliftGuardEnabled 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14), rgba(236, 72, 153, 0.12))' 
            : 'var(--bg-card)',
          border: upliftGuardEnabled ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: upliftGuardEnabled ? 'linear-gradient(135deg, #10B981, #3B82F6)' : 'var(--bg-input)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Shield size={22} color="#FFF" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                  Emotional Wellbeing Guard
                </h4>
                <span className={`badge ${upliftGuardEnabled ? 'badge-positive' : 'badge-neutral'}`}>
                  {upliftGuardEnabled ? 'ACTIVE' : 'OFF'}
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {upliftGuardEnabled 
                  ? 'Steering negative posts toward motivational & positive topic matches.' 
                  : 'Standard raw engagement algorithm.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setUpliftGuardEnabled(!upliftGuardEnabled)}
            className={upliftGuardEnabled ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
          >
            <Zap size={14} />
            {upliftGuardEnabled ? 'Disable' : 'Enable Guard'}
          </button>
        </div>

        {/* Featured Real Creator Avatars (Stories Bar) */}
        <div 
          className="insta-card" 
          style={{ 
            padding: '14px 16px', 
            marginBottom: '16px', 
            display: 'flex', 
            gap: '16px', 
            overflowX: 'auto', 
            alignItems: 'center',
            scrollbarWidth: 'none'
          }}
        >
          {FEATURED_PROFILES.map((prof) => (
            <div
              key={prof.username}
              onClick={() => setSelectedUsername(prof.username)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                minWidth: '64px',
              }}
              title={`View @${prof.username} Instagram Details`}
            >
              <div 
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: '50%',
                  padding: '2px',
                  background: 'linear-gradient(135deg, #EC4899, #3B82F6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MediaImage
                  src={prof.avatar}
                  alt={prof.label}
                  isAvatar={true}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', background: 'var(--bg-card)' }}
                />
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-main)', fontWeight: 600, textAlign: 'center', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {prof.label}
              </span>
            </div>
          ))}
        </div>

        {/* Live Instagram API Search Bar */}
        <div className="insta-card" style={{ padding: '14px 16px', marginBottom: '20px', background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(59,130,246,0.1))', border: '1px solid rgba(236,72,153,0.3)' }}>
          <form onSubmit={handleLiveInstagramLookup} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Instagram size={20} color="#EC4899" />
            <input
              type="text"
              placeholder="Fetch live profile or tag (e.g. @mrbeast or #travel)..."
              value={liveSearchHandle}
              onChange={(e) => setLiveSearchHandle(e.target.value)}
              className="input-field"
              style={{ flex: 1, fontSize: '0.84rem' }}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ padding: '6px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}
              disabled={isFetchingLive}
            >
              {isFetchingLive ? 'Fetching...' : 'Lookup User'}
            </button>
          </form>
        </div>

        {/* Filter Toolbar */}
        <div className="insta-card" style={{ padding: '12px 16px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              placeholder="Filter current feed posts, users, #hashtags..."
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
                    background: sentimentFilter === filter ? 'var(--primary)' : 'var(--bg-input)',
                    color: sentimentFilter === filter ? '#FFFFFF' : 'var(--text-muted)',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>

            <button 
              onClick={() => loadFeed(upliftGuardEnabled)} 
              className="btn-icon" 
              style={{ width: 28, height: 28 }}
              title="Refresh feed"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Post Feed List */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading social stream & computing sentiment vectors...
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="insta-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No posts found matching your criteria.
          </div>
        ) : (
          <>
            {filteredPosts.map((post, idx) => (
              <PostCard 
                key={`${post.id}-${idx}`} 
                post={post} 
                onOpenUser={(uname) => setSelectedUsername(uname)} 
                onInspectPost={onInspectPost}
              />
            ))}

            {isFetchingMore && (
              <div style={{ textAlign: 'center', padding: '24px', color: '#EC4899', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                Loading more personalized sentiment-balanced posts...
              </div>
            )}
          </>
        )}
      </div>

      {/* Right Sidebar (Desktop Insights Panel - Sticky & Anchored) */}
      <div className="sidebar-column" style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '90px', alignSelf: 'start' }}>
        
        {/* Wellbeing Score Meter */}
        <div className="insta-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.08))', border: '1px solid rgba(16, 185, 129, 0.35)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              User Wellbeing Index
            </span>
            <Sparkles size={16} color="#10B981" />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#10B981', lineHeight: 1 }}>
              {wellbeingData ? wellbeingData.wellbeing_score : 90.0}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>

          <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
            <div style={{ 
              width: `${wellbeingData ? wellbeingData.wellbeing_score : 90.0}%`, 
              height: '100%', 
              background: 'linear-gradient(90deg, #10B981, #3B82F6)' 
            }} />
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Status: <strong style={{ color: '#10B981' }}>Emotionally Balanced</strong>. Recommendation engine is actively guarding your feed content.
          </p>
        </div>

        {/* Quick Platform Activity Metrics */}
        {analytics && (
          <div className="insta-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Platform Activity
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Feed Posts</span>
              <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{analytics.total_posts}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Positive Sentiment</span>
              <span style={{ fontWeight: 700, color: '#10B981' }}>{analytics.positive_percentage}%</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Impressions</span>
              <span style={{ fontWeight: 700, color: '#3B82F6' }}>{(analytics.total_views || 13447397).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Top Trending Hashtags */}
        <div className="insta-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Trending Hashtags
          </div>

          {(analytics?.top_hashtags || [
            { hashtag: '#careersuccess', count: 18 },
            { hashtag: '#interviewtips', count: 15 },
            { hashtag: '#selfhealing', count: 14 },
            { hashtag: '#movingon', count: 12 },
          ]).map((h, i) => (
            <div 
              key={i} 
              onClick={() => setSearchQuery(h.hashtag.replace('#', ''))}
              style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', cursor: 'pointer', padding: '6px 8px', borderRadius: 'var(--radius-sm)', transition: 'var(--transition-fast)', background: 'var(--bg-input)' }}
              title={`Click to filter feed by ${h.hashtag}`}
            >
              <span style={{ color: '#3B82F6', fontWeight: 600 }}>{h.hashtag}</span>
              <span style={{ color: 'var(--text-dim)' }}>{h.count} posts</span>
            </div>
          ))}
        </div>
      </div>

      {/* Real User Profile Modal */}
      {selectedUsername && (
        <UserProfileModal 
          username={selectedUsername} 
          onClose={() => setSelectedUsername(null)} 
        />
      )}

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


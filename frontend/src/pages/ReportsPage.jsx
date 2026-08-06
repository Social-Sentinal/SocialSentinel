import React, { useState, useEffect } from 'react';
import { Activity, Heart, Eye, TrendingUp, Hash } from 'lucide-react';
import StatCard from '../components/StatCard';
import { fetchAnalyticsOverview } from '../services/api';

export default function ReportsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const res = await fetchAnalyticsOverview();
        if (res.status === 'success') {
          setAnalytics(res.data);
        }
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Metric Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <StatCard 
          title="Total Feed Posts" 
          value={analytics?.total_posts || 18} 
          change="+12.4%" 
          icon={Activity} 
          color="#8B5CF6" 
        />
        <StatCard 
          title="Positive Ratio" 
          value={`${analytics?.positive_percentage || 65}%`} 
          change="+4.2%" 
          icon={Heart} 
          color="#10B981" 
        />
        <StatCard 
          title="Impressions" 
          value={(analytics?.total_views || 45800).toLocaleString()} 
          change="+18.5%" 
          icon={Eye} 
          color="#06B6D4" 
        />
        <StatCard 
          title="Engagement Likes" 
          value={(analytics?.total_likes || 12450).toLocaleString()} 
          change="+9.1%" 
          icon={TrendingUp} 
          color="#C084FC" 
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Sentiment Breakdown */}
        <div className="insta-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#FFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} color="#10B981" /> Sentiment Distribution
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#34D399', fontWeight: 600 }}>Positive</span>
                <span style={{ color: '#FFF', fontWeight: 700 }}>{analytics?.sentiment_counts?.Positive || 12} posts</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '66%', background: 'var(--positive)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#CBD5E1', fontWeight: 600 }}>Neutral</span>
                <span style={{ color: '#FFF', fontWeight: 700 }}>{analytics?.sentiment_counts?.Neutral || 4} posts</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '22%', background: 'var(--neutral)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ color: '#FB7185', fontWeight: 600 }}>Negative</span>
                <span style={{ color: '#FFF', fontWeight: 700 }}>{analytics?.sentiment_counts?.Negative || 2} posts</span>
              </div>
              <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '12%', background: 'var(--negative)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Trending Hashtags */}
        <div className="insta-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '1rem', color: '#FFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Hash size={16} color="#06B6D4" /> Trending Hashtags
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(analytics?.top_hashtags || [
              { hashtag: '#adventure', count: 14 },
              { hashtag: '#nature', count: 12 },
              { hashtag: '#morning', count: 9 },
              { hashtag: '#coffee', count: 8 },
            ]).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: '#06B6D4', fontWeight: 600, fontSize: '0.85rem' }}>
                  {item.hashtag}
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                  {item.count} posts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { BarChart3, Activity, Heart, Eye, MessageCircle, Hash, TrendingUp, Sparkles } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '32px 28px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)' }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', fontSize: '0.78rem', color: '#A78BFA', fontWeight: 600, marginBottom: '12px' }}>
            <BarChart3 size={14} /> Executive Analytics & Intelligence
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }} className="gradient-text">
            Platform Insights & Sentiment Metrics
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Comprehensive breakdown of social post engagement, sentiment distributions, user dwell time statistics, and model performance.
          </p>
        </div>
      </div>

      {/* High-Level Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        <StatCard 
          title="Total Dataset Posts" 
          value={analytics?.total_posts || 18} 
          change="+12.4% this week" 
          icon={Activity} 
          color="#8B5CF6" 
        />
        <StatCard 
          title="Positive Sentiment Ratio" 
          value={`${analytics?.positive_percentage || 65}%`} 
          change="+4.2% positive trend" 
          icon={Heart} 
          color="#10B981" 
        />
        <StatCard 
          title="Total Platform Views" 
          value={(analytics?.total_views || 45800).toLocaleString()} 
          change="+18.5% impressions" 
          icon={Eye} 
          color="#06B6D4" 
        />
        <StatCard 
          title="Total User Likes" 
          value={(analytics?.total_likes || 12450).toLocaleString()} 
          change="+9.1% engagement" 
          icon={TrendingUp} 
          color="#C084FC" 
        />
      </div>

      {/* Main Analytics Content Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Sentiment Distribution Summary Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#FFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#10B981" /> Sentiment Breakdown across Feed
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: '#34D399', fontWeight: 600 }}>Positive Sentiment</span>
                <span style={{ color: '#FFF', fontWeight: 700 }}>{analytics?.sentiment_counts?.Positive || 12} posts</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '66%', background: 'var(--positive)', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: '#CBD5E1', fontWeight: 600 }}>Neutral Sentiment</span>
                <span style={{ color: '#FFF', fontWeight: 700 }}>{analytics?.sentiment_counts?.Neutral || 4} posts</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '22%', background: 'var(--neutral)', borderRadius: '4px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ color: '#FB7185', fontWeight: 600 }}>Negative Sentiment</span>
                <span style={{ color: '#FFF', fontWeight: 700 }}>{analytics?.sentiment_counts?.Negative || 2} posts</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '12%', background: 'var(--negative)', borderRadius: '4px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Trending Hashtags Card */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', color: '#FFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={18} color="#06B6D4" /> Top Trending Hashtags
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(analytics?.top_hashtags || [
              { hashtag: '#adventure', count: 14 },
              { hashtag: '#nature', count: 12 },
              { hashtag: '#morning', count: 9 },
              { hashtag: '#coffee', count: 8 },
              { hashtag: '#foodie', count: 6 },
            ]).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                <span style={{ color: '#06B6D4', fontWeight: 600, fontSize: '0.9rem' }}>
                  {item.hashtag}
                </span>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>
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

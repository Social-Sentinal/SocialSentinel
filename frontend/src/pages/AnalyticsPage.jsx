import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Heart, MessageCircle, Share2, Sparkles, X, Send, Compass, Search, Users, Brain, Shield, BarChart3, TrendingUp } from 'lucide-react';

export function AnalyticsPage({ user }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.analytics().then(res => setData(res.data)).catch(console.error);
  }, []);

  const topics = data?.topics || {};
  const maxVal = Math.max(1, ...Object.values(topics));

  return (
    <div className="fullwidth-page">
      <div className="sentinel-card">
        <h2 className="card-heading"><BarChart3 size={22} color="var(--primary)" /> Engagement & Telemetry</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Live metrics from your likes, views, saves, follows, and topic engagements on SocialSentinel.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Total Interactions', val: data?.interactions || 0 },
          { label: 'Posts Created', val: data?.posts_created || 0 },
          { label: 'Followers', val: data?.followers_count || 0 },
          { label: 'Following', val: data?.following_count || 0 }
        ].map(m => (
          <div key={m.label} className="sentinel-card" style={{ textAlign: 'center', padding: 18 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--primary)', marginTop: 4 }}>{m.val}</div>
          </div>
        ))}
      </div>

      <div className="sentinel-card">
        <h3 className="card-heading">Topic Engagement Signals</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
          {Object.entries(topics).map(([topic, count]) => (
            <div key={topic}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>#{topic}</span>
                <span style={{ color: 'var(--text-muted)' }}>{count} signals</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                <div style={{ width: `${Math.round((count / maxVal) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Sliders, Users, Flame } from 'lucide-react';

export function RightSidebarRail({ user, onTopicClick, onRefreshFeed }) {
  const [explorationRate, setExplorationRate] = useState(25);
  const [communities, setCommunities] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);

  useEffect(() => {
    // Load communities
    api.communities().then(res => {
      setCommunities((res.data || []).slice(0, 3));
    }).catch(() => {});

    // Load trending hashtags
    api.trending().then(res => {
      if (res.hashtags && res.hashtags.length > 0) {
        setTrendingTags(res.hashtags.slice(0, 5));
      } else {
        setTrendingTags([
          { tag: '#SocialSentinel', count: 48 },
          { tag: '#MachineLearning', count: 35 },
          { tag: '#WebEngineering', count: 28 },
          { tag: '#Cybersecurity', count: 19 },
          { tag: '#DigitalWellbeing', count: 14 }
        ]);
      }
    }).catch(() => {
      setTrendingTags([
        { tag: '#SocialSentinel', count: 48 },
        { tag: '#MachineLearning', count: 35 },
        { tag: '#WebEngineering', count: 28 },
        { tag: '#Cybersecurity', count: 19 },
        { tag: '#DigitalWellbeing', count: 14 }
      ]);
    });
  }, []);

  const handleSlider = async (val) => {
    setExplorationRate(val);
    try {
      await api.prefs({ exploration_rate: val / 100 });
      onRefreshFeed();
    } catch (err) {}
  };

  const handleJoin = async (cid) => {
    try {
      await api.joinCommunity(cid);
      const res = await api.communities();
      setCommunities((res.data || []).slice(0, 3));
    } catch (err) {}
  };

  return (
    <>
      {/* Discovery Steerer Slider */}
      <div className="card">
        <div className="card-header-row">
          <span className="card-title">
            <Sliders size={15} color="var(--primary)" />
            <span>Discovery Steerer</span>
          </span>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--primary-subtle)',
            color: 'var(--primary)'
          }}>
            {explorationRate}%
          </span>
        </div>
        <p className="card-subtext" style={{ marginBottom: 10 }}>
          Adjust topic diversity vs personalized profile exploitation.
        </p>
        <input
          type="range"
          min="5"
          max="80"
          value={explorationRate}
          onChange={e => handleSlider(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>
          <span>Focused (5%)</span>
          <span>Serendipity (80%)</span>
        </div>
      </div>

      {/* Suggested Communities */}
      <div className="card">
        <div className="card-header-row">
          <span className="card-title">
            <Users size={15} color="var(--primary)" />
            <span>Topic Communities</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {communities.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.members_count} members</div>
                </div>
              </div>
              <button
                className={c.is_member ? 'btn-secondary' : 'btn-primary'}
                style={{ padding: '3px 10px', fontSize: 11 }}
                onClick={() => handleJoin(c.id)}
              >
                {c.is_member ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Hashtags */}
      <div className="card">
        <div className="card-header-row">
          <span className="card-title">
            <Flame size={15} color="var(--status-negative)" />
            <span>Trending Hashtags</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trendingTags.map(item => (
            <div
              key={item.tag}
              style={{ cursor: 'pointer', padding: '3px 0' }}
              onClick={() => onTopicClick && onTopicClick(item.tag)}
            >
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--primary)' }}>{item.tag}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.count} discussions</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

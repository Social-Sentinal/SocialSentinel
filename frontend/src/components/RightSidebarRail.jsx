import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from './MediaImage';
import { Sliders, Users, Flame } from 'lucide-react';

export function RightSidebarRail({ user, onTopicClick, onRefreshFeed }) {
  const [explorationRate, setExplorationRate] = useState(20);
  const [communities, setCommunities] = useState([]);

  useEffect(() => {
    api.communities().then(res => {
      setCommunities((res.data || []).slice(0, 3));
    });
  }, []);

  const handleSlider = async val => {
    setExplorationRate(val);
    try {
      await api.prefs({ exploration_rate: val / 100 });
      onRefreshFeed();
    } catch (err) {}
  };

  const handleJoin = async cid => {
    try {
      await api.joinCommunity(cid);
      const res = await api.communities();
      setCommunities((res.data || []).slice(0, 3));
    } catch (err) {}
  };

  return (
    <aside className="side-column">
      {/* Exploration Slider Widget */}
      <div className="sentinel-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-primary)' }}>
            <Sliders size={14} color="var(--primary)" /> Discovery Steerer
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'var(--primary-gradient)', color: 'white' }}>
            {explorationRate}%
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.4 }}>
          Fine-tune topic diversity & serendipity.
        </p>
        <input
          type="range"
          min="5"
          max="80"
          value={explorationRate}
          onChange={e => handleSlider(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
      </div>

      {/* Suggested Communities */}
      <div className="sentinel-card">
        <div className="card-heading">
          <Users size={16} color="var(--primary)" />
          <span>Recommended Communities</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {communities.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.members_count} members</div>
                </div>
              </div>
              <button
                className={c.is_member ? 'btn-secondary' : 'btn-primary'}
                style={{ padding: '4px 12px', fontSize: 11 }}
                onClick={() => handleJoin(c.id)}
              >
                {c.is_member ? 'Joined' : 'Join'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Topics */}
      <div className="sentinel-card">
        <div className="card-heading">
          <Flame size={16} color="var(--primary)" />
          <span>Trending Topics</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { tag: '#SocialSentinel', count: '5.1k discussions' },
            { tag: '#MachineLearning', count: '4.3k posts' },
            { tag: '#WebEngineering', count: '2.8k updates' },
            { tag: '#Cybersecurity', count: '1.9k alerts' },
            { tag: '#DigitalWellbeing', count: '1.2k reflections' }
          ].map(item => (
            <div key={item.tag} style={{ cursor: 'pointer' }} onClick={() => onTopicClick(item.tag)}>
              <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>{item.tag}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.count}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}



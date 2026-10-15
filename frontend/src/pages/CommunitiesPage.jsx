import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { PostCardItem } from '../components/PostCardItem';
import { Heart, MessageCircle, Share2, Sparkles, X, Send, Compass, Search, Users, Brain, Shield, BarChart3, TrendingUp } from 'lucide-react';

export function CommunitiesPage({ user, onOpenShare, onOpenDetail, onExplain }) {
  const [communities, setCommunities] = useState([]);
  const [activeCommunity, setActiveCommunity] = useState(null);
  const [posts, setPosts] = useState([]);

  const load = async () => {
    try {
      const res = await api.communities();
      setCommunities(res.data || []);
    } catch (err) {}
  };

  const loadPosts = async (slug) => {
    try {
      const res = await api.communityPosts(slug);
      setPosts(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (e, cid) => {
    e.stopPropagation();
    try {
      await api.joinCommunity(cid);
      load();
    } catch (err) {}
  };

  const handleSelect = (c) => {
    setActiveCommunity(c);
    loadPosts(c.slug);
  };

  if (activeCommunity) {
    return (
      <div className="fullwidth-page">
        <button className="btn-secondary" onClick={() => setActiveCommunity(null)} style={{ marginBottom: 16 }}>&larr; Back to Communities</button>
        <div className="sentinel-card">
          <div className="community-banner-strip" style={{ background: activeCommunity.banner_gradient, height: 100, borderRadius: 8, display: 'flex', alignItems: 'center', padding: 20 }}>
            <span style={{ fontSize: 40 }}>{activeCommunity.icon}</span>
          </div>
          <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>{activeCommunity.name}</h2>
              <p style={{ color: 'var(--text-secondary)' }}>{activeCommunity.description}</p>
            </div>
            <button
              className={activeCommunity.is_member ? 'btn-secondary' : 'btn-primary'}
              onClick={(e) => { handleToggle(e, activeCommunity.id); setActiveCommunity({ ...activeCommunity, is_member: !activeCommunity.is_member }) }}
            >
              {activeCommunity.is_member ? 'Joined' : '+ Join Community'}
            </button>
          </div>
        </div>
        
        <h3 style={{ marginTop: 24, marginBottom: 16 }}>Community Posts</h3>
        {posts.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No posts in this community yet.</p> : posts.map(p => (
          <PostCardItem
            key={p.id}
            post={p}
            user={user}
            refresh={() => loadPosts(activeCommunity.slug)}
            onOpenShare={onOpenShare}
            onOpenDetail={onOpenDetail}
            onExplain={onExplain}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="fullwidth-page">
      <div className="sentinel-card">
        <h2 className="card-heading"><Users size={22} color="var(--primary)" /> SocialSentinel Communities</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Join focused clusters of creators and researchers exploring specialized domains of technology and digital wellbeing.
        </p>
      </div>

      <div className="communities-collection">
        {communities.map(c => (
          <div key={c.id} className="community-panel" onClick={() => handleSelect(c)} style={{ cursor: 'pointer' }}>
            <div className="community-banner-strip" style={{ background: c.banner_gradient }}>
              {c.icon}
            </div>
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{c.description}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>👥 {c.members_count} members</span>
                <button
                  className={c.is_member ? 'btn-secondary' : 'btn-primary'}
                  style={{ padding: '5px 12px', fontSize: 12 }}
                  onClick={(e) => handleToggle(e, c.id)}
                >
                  {c.is_member ? 'Joined' : '+ Join'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


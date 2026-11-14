import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PostCardItem } from '../components/PostCardItem';
import { Users, ArrowLeft } from 'lucide-react';

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
        <button
          className="btn-secondary"
          onClick={() => setActiveCommunity(null)}
          style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ArrowLeft size={15} /> Back to Communities
        </button>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 36 }}>{activeCommunity.icon}</span>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>{activeCommunity.name}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13.5, marginTop: 2 }}>{activeCommunity.description}</p>
            </div>
            <button
              className={activeCommunity.is_member ? 'btn-secondary' : 'btn-primary'}
              onClick={(e) => {
                handleToggle(e, activeCommunity.id);
                setActiveCommunity({ ...activeCommunity, is_member: !activeCommunity.is_member });
              }}
            >
              {activeCommunity.is_member ? 'Joined' : 'Join Community'}
            </button>
          </div>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 12 }}>Community Posts</h3>
        {posts.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
            No posts in this community yet. Be the first to start a conversation!
          </div>
        ) : (
          posts.map(p => (
            <PostCardItem
              key={p.id}
              post={p}
              user={user}
              refresh={() => loadPosts(activeCommunity.slug)}
              onOpenShare={onOpenShare}
              onOpenDetail={onOpenDetail}
              onExplain={onExplain}
            />
          ))
        )}
      </div>
    );
  }

  return (
    <div className="fullwidth-page">
      <div className="card">
        <div className="card-title">
          <Users size={18} color="var(--primary)" />
          <span>Topic Communities</span>
        </div>
        <p className="card-subtext">
          Join topic hubs to steer and discover conversations in your areas of interest.
        </p>
      </div>

      <div className="communities-grid">
        {communities.map(c => (
          <div
            key={c.id}
            className="community-card"
            onClick={() => handleSelect(c)}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>{c.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.members_count} members</div>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.4, flex: 1 }}>
              {c.description}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                className={c.is_member ? 'btn-secondary' : 'btn-primary'}
                style={{ padding: '4px 12px', fontSize: 12 }}
                onClick={(e) => handleToggle(e, c.id)}
              >
                {c.is_member ? 'Joined' : 'Join'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

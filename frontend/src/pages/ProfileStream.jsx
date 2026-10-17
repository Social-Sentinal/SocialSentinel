import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { PostCardItem } from '../components/PostCardItem';
export function ProfileStream({ user, setUser, onOpenShare, onOpenDetail, onExplain }) {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [form, setForm] = useState({
    display_name: user.display_name || '',
    bio: user.bio || '',
    avatar_url: user.avatar_url || ''
  });

  const loadPosts = async () => {
    try {
      const res = await api.posts(`?author=${user.username}`);
      setPosts(res.data || []);
    } catch (err) {}
  };

  useEffect(() => {
    loadPosts();
  }, [user]);

  const handleSave = async () => {
    try {
      const res = await api.updateUser(form);
      setUser(res.user);
      setEditing(false);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="sentinel-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ height: 160, background: 'var(--primary-gradient)', position: 'relative' }}>
        </div>
        <div style={{ padding: '0 24px 24px 24px', position: 'relative', marginTop: -40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
            <MediaImage
              src={user.avatar_url}
              fallbackText={user.display_name}
              isAvatar
              style={{ width: 100, height: 100, borderRadius: '50%', border: '4px solid var(--bg-card)', background: 'var(--bg-card)' }}
            />
            <button className="btn-secondary" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 24, margin: 0 }}>{user.display_name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>@{user.username}</div>
            <p style={{ marginTop: 12, fontSize: 15, color: 'var(--text-secondary)' }}>
              {user.bio || 'No bio yet. Tap Edit Profile to customize.'}
            </p>
          </div>

          {editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <input
                placeholder="Display Name"
                value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
              />
              <textarea
                placeholder="Bio"
                value={form.bio}
                onChange={e => setForm({ ...form, bio: e.target.value })}
                style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', minHeight: 80, outline: 'none', resize: 'none' }}
              />
              <button className="btn-primary" onClick={handleSave} style={{ alignSelf: 'flex-start' }}>
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, margin: 0 }}>Your Published Posts</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn-${viewMode === 'list' ? 'primary' : 'secondary'}`} style={{ padding: '6px 12px' }} onClick={() => setViewMode('list')}>List</button>
          <button className={`btn-${viewMode === 'grid' ? 'primary' : 'secondary'}`} style={{ padding: '6px 12px' }} onClick={() => setViewMode('grid')}>Grid</button>
        </div>
      </div>
      
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No posts published yet.</div>
      ) : viewMode === 'list' ? (
        posts.map(p => (
          <PostCardItem
            key={p.id}
            post={p}
            user={user}
            refresh={loadPosts}
            onOpenShare={onOpenShare}
            onOpenDetail={onOpenDetail}
            onExplain={onExplain}
          />
        ))
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {posts.map(p => (
            <div key={p.id} onClick={() => onOpenDetail(p)} style={{ aspectRatio: '1', background: 'var(--bg-elevated)', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)' }}>
              {p.media_url ? (
                <img src={p.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ padding: 16, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 14 }}>
                  {p.caption.length > 80 ? p.caption.slice(0, 80) + '...' : p.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}


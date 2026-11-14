import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { PostCardItem } from '../components/PostCardItem';
import { User, Edit3, Grid, List } from 'lucide-react';

export function ProfileStream({ user, setUser, onOpenShare, onOpenDetail, onExplain }) {
  const [posts, setPosts] = useState([]);
  const [editing, setEditing] = useState(false);
  const [viewMode, setViewMode] = useState('list');
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
      {/* Profile Header Card */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <MediaImage
              src={user.avatar_url}
              fallbackText={user.display_name}
              isAvatar
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
            />
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{user.display_name}</h2>
              <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>@{user.username}</div>
              <div style={{ display: 'flex', gap: 14, marginTop: 6, fontSize: 12.5, color: 'var(--text-secondary)' }}>
                <span><b>{user.posts_count || posts.length}</b> Posts</span>
                <span><b>{user.followers_count || 0}</b> Followers</span>
                <span><b>{user.following_count || 0}</b> Following</span>
              </div>
            </div>
          </div>

          <button
            className="btn-secondary"
            onClick={() => setEditing(!editing)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            <Edit3 size={14} />
            <span>{editing ? 'Cancel' : 'Edit Profile'}</span>
          </button>
        </div>

        {user.bio && !editing && (
          <p style={{ marginTop: 14, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {user.bio}
          </p>
        )}

        {editing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <input
              className="input-field"
              placeholder="Display Name"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
            />
            <textarea
              className="input-field"
              placeholder="Bio"
              value={form.bio}
              onChange={e => setForm({ ...form, bio: e.target.value })}
              style={{ minHeight: 70, resize: 'vertical' }}
            />
            <input
              className="input-field"
              placeholder="Avatar Image URL (Optional)"
              value={form.avatar_url}
              onChange={e => setForm({ ...form, avatar_url: e.target.value })}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <button className="btn-primary" onClick={handleSave}>
                Save Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Published Posts Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Published Posts</h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '5px 10px', fontSize: 12 }}
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List size={14} />
          </button>
          <button
            className={viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '5px 10px', fontSize: 12 }}
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <Grid size={14} />
          </button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
          No posts published yet.
        </div>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {posts.map(p => (
            <div
              key={p.id}
              onClick={() => onOpenDetail(p)}
              style={{
                aspectRatio: '1',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                cursor: 'pointer',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: p.media_url ? 0 : 12,
                textAlign: 'center',
                fontSize: 13
              }}
            >
              {p.media_url ? (
                <img src={p.media_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{p.caption.slice(0, 70)}…</span>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

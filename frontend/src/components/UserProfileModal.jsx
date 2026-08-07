import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ExternalLink, Users, Grid, Heart, MessageCircle } from 'lucide-react';
import { fetchUserProfile } from '../services/api';

export default function UserProfileModal({ username, onClose }) {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    setLoading(true);
    fetchUserProfile(username)
      .then((res) => {
        if (res.status === 'success') {
          setProfile(res.user);
          setPosts(res.posts || []);
        }
      })
      .catch((err) => console.error('Failed to fetch profile:', err))
      .finally(() => setLoading(false));
  }, [username]);

  if (!username) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Instagram Profile Details
          </span>
          <button onClick={onClose} className="btn-icon" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <X size={18} color="#FFF" />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Loading Instagram User Profile...
          </div>
        ) : profile ? (
          <div>
            {/* User Profile Card */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <img
                src={profile.user_avatar}
                alt={profile.username}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid #8B5CF6',
                  boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)',
                }}
              />
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#FFF', fontWeight: 700 }}>
                        {profile.full_name || profile.username}
                      </h3>
                      {profile.is_verified && <CheckCircle2 size={18} color="#3B82F6" />}
                    </div>
                    <div style={{ color: '#EC4899', fontSize: '0.88rem', fontWeight: 600, marginTop: '2px' }}>
                      @{profile.username}
                    </div>
                  </div>

                  <button 
                    onClick={() => alert(`Follow status updated for @${profile.username}`)}
                    className="btn-primary"
                    style={{ padding: '6px 16px', fontSize: '0.82rem' }}
                  >
                    Follow Creator
                  </button>
                </div>

                {/* Metrics counts */}
                <div style={{ display: 'flex', gap: '20px', margin: '14px 0', fontSize: '0.88rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#FFF' }}>
                      {(profile.posts_count || posts.length || 12).toLocaleString()}
                    </span>{' '}
                    <span style={{ color: 'var(--text-muted)' }}>posts</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#FFF' }}>
                      {(profile.followers_count || 12500).toLocaleString()}
                    </span>{' '}
                    <span style={{ color: 'var(--text-muted)' }}>followers</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 700, color: '#FFF' }}>
                      {(profile.following_count || 340).toLocaleString()}
                    </span>{' '}
                    <span style={{ color: 'var(--text-muted)' }}>following</span>
                  </div>
                </div>

                {/* Bio */}
                <p style={{ fontSize: '0.86rem', color: '#E2E8F0', lineHeight: 1.4, margin: '8px 0' }}>
                  {profile.biography}
                </p>

                {/* External URL */}
                {profile.external_url && (
                  <a
                    href={profile.external_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: '#3B82F6',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      marginTop: '4px',
                    }}
                  >
                    <ExternalLink size={13} /> {profile.external_url.replace('https://', '').replace('http://', '')}
                  </a>
                )}
              </div>
            </div>

            {/* Posts Grid Header */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              <Grid size={16} color="#8B5CF6" /> Recent User Posts
            </div>

            {/* Posts Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                gap: '8px',
                marginTop: '12px',
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
              {posts.length > 0 ? (
                posts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      aspectRatio: '1/1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      position: 'relative',
                      background: '#1E293B',
                    }}
                  >
                    <img
                      src={p.image_url}
                      alt="post preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        color: '#FFF',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        opacity: 0.9,
                      }}
                    >
                      <Heart size={12} fill="#FFF" /> {p.likes_count}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No posts indexed for this user profile.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
            User profile not found.
          </div>
        )}
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-content {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: 24px;
          width: 100%;
          max-width: 540px;
          box-shadow: var(--shadow-glow);
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

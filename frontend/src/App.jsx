import React, { useEffect, useState } from 'react';
import {
  Home,
  Compass,
  MessageSquare,
  Users,
  Brain,
  BarChart2,
  User,
  Plus,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  X,
  Zap,
  Clock,
  HeartHandshake,
  Activity,
  LogIn
} from 'lucide-react';
import { api } from './services/api';
import MediaImage from './components/MediaImage';

const NAV_ITEMS = [
  { id: 'feed', label: 'Feed', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'ai-studio', label: 'AI Studio', icon: Brain },
  { id: 'analytics', label: 'Insights', icon: BarChart2 },
  { id: 'profile', label: 'Profile', icon: User }
];

import { FeedStream, QuickComposer } from './pages/FeedStream';
import { MessengerView } from './pages/MessengerView';
import { ExploreStream } from './pages/ExploreStream';
import { CommunitiesPage } from './pages/CommunitiesPage';
import { AIStudioPage } from './pages/AIStudioPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ProfileStream } from './pages/ProfileStream';
import { CreatePostModal, ShareToChatModal, PostDetailModal } from './components/Modals';
import { AuthView } from './pages/AuthView';

export const TOPICS = [
  'All',
  'AI & Tech',
  'Cybersecurity & Privacy',
  'Web Engineering',
  'Creative Tech & Design',
  'Digital Wellbeing'
];

export default function App() {
  // Always initialize with active explorer state so main page renders instantly
  const [user, setUser] = useState({
    id: 1,
    username: 'demo',
    display_name: 'Sentinel Explorer',
    avatar_url: ''
  });
  const [activeTab, setActiveTab] = useState('feed');
  const [theme, setTheme] = useState(localStorage.getItem('sentinel_theme') || 'dark');
  const [unreadCount, setUnreadCount] = useState(0);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [detailPost, setDetailPost] = useState(null);
  const [explainData, setExplainData] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Feed refresh trigger
  const [feedTrigger, setFeedTrigger] = useState(0);
  const refreshFeed = () => setFeedTrigger(t => t + 1);

  // Authenticate silently or restore session
  useEffect(() => {
    if (api.token) {
      api.me()
        .then(res => setUser(res.user))
        .catch(() => {
          // Token expired or invalid, re-init demo session
          api.demoLogin()
            .then(res => setUser(res.user))
            .catch(() => {});
        });
    } else {
      // Auto-connect guest to demo explorer session for instant interactive capabilities
      api.demoLogin()
        .then(res => setUser(res.user))
        .catch(() => {});
    }
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('sentinel_theme', theme);
  }, [theme]);

  // Check unread messages
  useEffect(() => {
    if (!user) return;
    const checkUnread = async () => {
      try {
        const res = await api.conversations();
        const unread = (res.data || []).reduce((acc, conv) => acc + (conv.unread_count || 0), 0);
        setUnreadCount(unread);
      } catch (err) {}
    };
    checkUnread();
    const timer = setInterval(checkUnread, 15000);
    return () => clearInterval(timer);
  }, [user]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  const handleLogout = () => {
    api.logout();
    api.demoLogin().then(res => setUser(res.user)).catch(() => {
      setUser({ id: 1, username: 'demo', display_name: 'Sentinel Explorer', avatar_url: '' });
    });
  };

  return (
    <div className="app-shell">
      {/* Clean Sticky Top Navbar */}
      <header className="app-navbar">
        <div className="navbar-inner">
          {/* Brand Logo & Name */}
          <div className="brand-link" onClick={() => setActiveTab('feed')}>
            <img src="/logo.png" alt="SocialSentinel" className="brand-icon-img" />
            <span className="brand-title">SocialSentinel</span>
          </div>

          {/* Desktop & Laptop Navigation Tabs */}
          <nav className="navbar-nav">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                className={`nav-link-btn ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={16} />
                <span>{label}</span>
                {id === 'messages' && unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount}</span>
                )}
              </button>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="navbar-actions">
            <button className="btn-new-post" onClick={() => setCreateModalOpen(true)}>
              <Plus size={15} />
              <span>Post</span>
            </button>

            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user.username === 'demo' ? (
              <button
                className="btn-secondary"
                onClick={() => setAuthModalOpen(true)}
                style={{ padding: '6px 12px', fontSize: 12.5 }}
                title="Sign in with an existing account or register"
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            ) : null}

            <div className="user-profile-chip" onClick={() => setActiveTab('profile')} title={`Profile: @${user.username}`}>
              <MediaImage
                src={user.avatar_url}
                fallbackText={user.display_name}
                isAvatar
                className="user-chip-avatar"
              />
              <span className="user-chip-name">{user.display_name}</span>
              <button
                className="logout-icon-btn"
                title="Switch account / Sign in"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                  setAuthModalOpen(true);
                }}
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="app-container">
        {activeTab === 'feed' && (
          <div className="feed-container">
            <QuickComposer user={user} onPosted={refreshFeed} />
            <FeedStream
              user={user}
              feedTrigger={feedTrigger}
              refreshFeed={refreshFeed}
              onOpenShare={setSharePost}
              onOpenDetail={setDetailPost}
              onExplain={setExplainData}
            />
          </div>
        )}

        {activeTab === 'explore' && (
          <div className="feed-container">
            <ExploreStream
              user={user}
              onOpenShare={setSharePost}
              onOpenDetail={setDetailPost}
              onExplain={setExplainData}
            />
          </div>
        )}

        {activeTab === 'messages' && (
          <MessengerView
            user={user}
            sharePost={sharePost}
            onClearShare={() => setSharePost(null)}
          />
        )}

        {activeTab === 'communities' && (
          <div className="fullwidth-page">
            <CommunitiesPage
              user={user}
              onOpenShare={setSharePost}
              onOpenDetail={setDetailPost}
              onExplain={setExplainData}
            />
          </div>
        )}

        {activeTab === 'ai-studio' && (
          <div className="fullwidth-page">
            <AIStudioPage user={user} />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="fullwidth-page">
            <AnalyticsPage user={user} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="feed-container">
            <ProfileStream
              user={user}
              setUser={setUser}
              onOpenShare={setSharePost}
              onOpenDetail={setDetailPost}
              onExplain={setExplainData}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Phones & Small Tablets) */}
      <nav className="bottom-nav-bar">
        {[
          { id: 'feed', label: 'Feed', icon: Home },
          { id: 'explore', label: 'Explore', icon: Compass },
          { id: 'messages', label: 'Messages', icon: MessageSquare },
          { id: 'communities', label: 'Hubs', icon: Users },
          { id: 'profile', label: 'Profile', icon: User }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`bottom-nav-btn ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {id === 'messages' && unreadCount > 0 && (
              <span className="bottom-badge">{unreadCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Modals */}
      {createModalOpen && (
        <CreatePostModal
          user={user}
          onClose={() => setCreateModalOpen(false)}
          onCreated={() => {
            setCreateModalOpen(false);
            refreshFeed();
          }}
        />
      )}

      {sharePost && (
        <ShareToChatModal
          user={user}
          post={sharePost}
          onClose={() => setSharePost(null)}
          onSuccess={() => {
            setSharePost(null);
            setActiveTab('messages');
          }}
        />
      )}

      {detailPost && (
        <PostDetailModal
          user={user}
          post={detailPost}
          onClose={() => setDetailPost(null)}
          onUpdate={refreshFeed}
          onOpenShare={(p) => {
            setDetailPost(null);
            setSharePost(p);
          }}
        />
      )}

      {/* Auth Modal (Login / Register without leaving the main page) */}
      {authModalOpen && (
        <div className="modal-overlay" onClick={() => setAuthModalOpen(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title">Sign In or Register</div>
              <button
                onClick={() => setAuthModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <AuthView onLogin={(newUser) => {
              setUser(newUser);
              setAuthModalOpen(false);
              refreshFeed();
            }} />
          </div>
        </div>
      )}

      {/* Recommendation Explainability Modal */}
      {explainData && (
        <div className="modal-overlay" onClick={() => setExplainData(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Sparkles size={18} color="var(--primary)" />
                <span>Why Was This Recommended?</span>
              </div>
              <button
                onClick={() => setExplainData(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                background: 'var(--bg-elevated)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Match Score
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                    {explainData.match_percentage ?? Math.round((explainData.final_score || 0.75) * 100)}% Match
                  </div>
                </div>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--primary)',
                  background: 'var(--primary-subtle)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)'
                }}>
                  #{explainData.topic || 'AI & Tech'}
                </div>
              </div>

              <div style={{
                background: 'var(--bg-elevated)',
                padding: 12,
                borderRadius: 'var(--radius-sm)',
                fontSize: 13.5,
                lineHeight: 1.5,
                color: 'var(--text-primary)'
              }}>
                {explainData.rationale || explainData.response || 'Recommended based on your content preferences, sentiment signals, and creator graph.'}
              </div>

              {explainData.breakdown && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Scoring Breakdown
                  </div>

                  {[
                    { label: 'Content Semantic Similarity (35%)', val: explainData.breakdown.content_semantic_score, icon: Zap },
                    { label: 'Collaborative Peer Filtering (25%)', val: explainData.breakdown.collaborative_peer_score, icon: HeartHandshake },
                    { label: 'Sentiment Topic Affinity (20%)', val: explainData.breakdown.sentiment_affinity_score, icon: Activity },
                    { label: 'Community Velocity (10%)', val: explainData.breakdown.community_velocity_score, icon: Sparkles },
                    { label: 'Freshness / Recency (10%)', val: explainData.breakdown.freshness_score, icon: Clock }
                  ].map(factor => (
                    <div key={factor.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span style={{ color: 'var(--text-secondary)' }}>{factor.label}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{Math.round((factor.val || 0) * 100)}%</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg-elevated)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${Math.round((factor.val || 0) * 100)}%`, height: '100%', background: 'var(--primary)', borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
                <button className="btn-primary" onClick={() => setExplainData(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

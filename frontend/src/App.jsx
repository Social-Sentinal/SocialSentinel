import React, { useEffect, useState, useRef } from 'react';
import {
  Home,
  Compass,
  MessageSquare,
  Users,
  Brain,
  BarChart3,
  User,
  Plus,
  Heart,
  Bookmark,
  Share2,
  Send,
  LogOut,
  Search,
  Sun,
  Moon,
  Shield,
  Sparkles,
  X,
  Flame,
  Sliders,
  Check
} from 'lucide-react';
import { api } from './services/api';
import MediaImage from './components/MediaImage';

const NAV_TABS = [
  { id: 'feed', label: 'Home Feed', icon: Home },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'communities', label: 'Communities', icon: Users },
  { id: 'ai-studio', label: 'AI Studio', icon: Brain },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'profile', label: 'Profile', icon: User }
];

import { FeedStream, QuickComposer } from './pages/FeedStream';
import { PostCardItem } from './components/PostCardItem';
import { RightSidebarRail } from './components/RightSidebarRail';
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
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [theme, setTheme] = useState(localStorage.getItem('sentinel_theme') || 'dark');
  const [unreadCount, setUnreadCount] = useState(0);

  // Global modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [detailPost, setDetailPost] = useState(null);
  const [explainModalData, setExplainModalData] = useState(null);

  // Feed trigger
  const [feedTrigger, setFeedTrigger] = useState(0);
  const refreshFeed = () => setFeedTrigger(t => t + 1);

  // Load user
  useEffect(() => {
    if (api.token) {
      api.me()
        .then(res => setUser(res.user))
        .catch(() => {
          api.logout();
          setUser(null);
        });
    }
  }, []);

  // Sync theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('sentinel_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'));

  if (!user) {
    return <AuthView onLogin={setUser} />;
  }

  return (
    <div className="app-container">
      {/* Left Sidebar Rail */}
      <aside className="app-sidebar">
        <div className="brand-section" onClick={() => setActiveTab('feed')}>
          <div className="brand-shield-icon">
            <Shield size={22} />
          </div>
          <div className="brand-text-block">
            <div className="brand-name">SocialSentinel</div>
            <span className="brand-sub">AI Social Network</span>
          </div>
        </div>

        <button className="sidebar-action-btn" onClick={() => setCreateModalOpen(true)}>
          <Plus size={18} /> Create Post
        </button>

        <nav className="sidebar-nav">
          {NAV_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`sidebar-nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === 'messages' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--accent-pink)', color: 'white', padding: '2px 7px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-user-footer">
          <button className="theme-button" onClick={toggleTheme}>
            <span>Theme Mode</span>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="user-profile-summary" onClick={() => setActiveTab('profile')}>
            <MediaImage
              src={user.avatar_url}
              fallbackText={user.display_name}
              isAvatar
              className="user-summary-avatar"
            />
            <div className="user-summary-text">
              <div className="user-summary-name">{user.display_name}</div>
              <div className="user-summary-handle">@{user.username}</div>
            </div>
            <button
              title="Log out"
              onClick={(e) => {
                e.stopPropagation();
                api.logout();
                setUser(null);
              }}
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Viewport */}
      <div className="app-viewport">
        <header className="viewport-header">
          <div className="header-title-text">
            {NAV_TABS.find(t => t.id === activeTab)?.label || 'SocialSentinel'}
          </div>

          <div className="header-search-container">
            <Search size={15} className="header-search-icon" />
            <input
              className="header-search-field"
              placeholder="Search posts, topics, creators…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') setActiveTab('explore');
              }}
            />
          </div>
        </header>

        {/* Content Views */}
        {activeTab === 'feed' && (
          <div className="page-layout-split">
            <div className="main-column">
              <QuickComposer user={user} onPosted={refreshFeed} />
              <FeedStream
                user={user}
                feedTrigger={feedTrigger}
                refreshFeed={refreshFeed}
                onOpenShare={setSharePost}
                onOpenDetail={setDetailPost}
                onExplain={setExplainModalData}
              />
            </div>
            <RightSidebarRail
              user={user}
              onTopicClick={() => setActiveTab('feed')}
              onRefreshFeed={refreshFeed}
            />
          </div>
        )}

        {activeTab === 'explore' && (
          <div className="page-layout-split">
            <div className="main-column">
              <ExploreStream
                user={user}
                onOpenShare={setSharePost}
                onOpenDetail={setDetailPost}
                onExplain={setExplainModalData}
              />
            </div>
            <RightSidebarRail
              user={user}
              onTopicClick={() => setActiveTab('feed')}
              onRefreshFeed={refreshFeed}
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
          <CommunitiesPage
            user={user}
            onSelectTopic={() => setActiveTab('feed')}
          />
        )}

        {activeTab === 'ai-studio' && <AIStudioPage user={user} />}

        {activeTab === 'analytics' && <AnalyticsPage user={user} />}

        {activeTab === 'profile' && (
          <div className="page-layout-split">
            <div className="main-column">
              <ProfileStream
                user={user}
                setUser={setUser}
                onOpenShare={setSharePost}
                onOpenDetail={setDetailPost}
                onExplain={setExplainModalData}
              />
            </div>
            <RightSidebarRail
              user={user}
              onTopicClick={() => setActiveTab('feed')}
              onRefreshFeed={refreshFeed}
            />
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-bar">
        {NAV_TABS.slice(0, 5).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`mobile-nav-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>

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

      {explainModalData && (
        <div className="modal-overlay" onClick={() => setExplainModalData(null)}>
          <div className="modal-content-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 16 }}>
                <Shield size={18} color="var(--primary)" /> Why Was This Recommended?
              </div>
              <button onClick={() => setExplainModalData(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body-content">
              <div style={{ background: 'var(--bg-elevated)', padding: 16, borderRadius: 'var(--radius-md)', fontSize: 14, lineHeight: 1.6 }}>
                {explainModalData.response}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Signals: Engine verified TF-IDF vector alignment, collaborative weights, and your active topic preferences.
              </div>
              <button className="btn-primary" style={{ alignSelf: 'flex-end' }} onClick={() => setExplainModalData(null)}>
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




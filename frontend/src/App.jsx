import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FeedPage from './pages/FeedPage';
import EnginePage from './pages/EnginePage';
import SentimentLabPage from './pages/SentimentLabPage';
import ReportsPage from './pages/ReportsPage';
import CreatePostModal from './components/CreatePostModal';
import NotificationsModal from './components/NotificationsModal';
import PostDetailModal from './components/PostDetailModal';

export default function App() {
  const getTabFromPath = () => {
    const path = window.location.pathname.toLowerCase().replace('/', '');
    if (path.includes('engine')) return 'engine';
    if (path.includes('sentiment')) return 'sentiments';
    if (path.includes('report')) return 'reports';
    return 'feed';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedPostDetail, setSelectedPostDetail] = useState(null);
  
  // Dark & Light Theme State
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const renderActivePage = () => {
    switch (activeTab) {
      case 'engine':
        return <EnginePage onInspectPost={(post) => setSelectedPostDetail(post)} />;
      case 'sentiments':
        return <SentimentLabPage />;
      case 'reports':
        return <ReportsPage />;
      case 'feed':
      default:
        return <FeedPage onInspectPost={(post) => setSelectedPostDetail(post)} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-dark)', color: 'var(--text-main)' }}>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCreatePost={() => setCreateModalOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
      />
      
      <main style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', flexGrow: 1, padding: '0 16px 40px 16px' }}>
        {renderActivePage()}
      </main>

      <Footer />

      {/* Dynamic Modals */}
      {createModalOpen && (
        <CreatePostModal 
          onClose={() => setCreateModalOpen(false)}
          onPostCreated={() => window.location.reload()}
        />
      )}

      {notificationsOpen && (
        <NotificationsModal 
          onClose={() => setNotificationsOpen(false)}
        />
      )}

      {selectedPostDetail && (
        <PostDetailModal
          post={selectedPostDetail}
          onClose={() => setSelectedPostDetail(null)}
        />
      )}
    </div>
  );
}


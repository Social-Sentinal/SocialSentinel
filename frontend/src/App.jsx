import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FeedPage from './pages/FeedPage';
import EnginePage from './pages/EnginePage';
import SentimentLabPage from './pages/SentimentLabPage';
import ReportsPage from './pages/ReportsPage';
import ApiPortalPage from './pages/ApiPortalPage';

export default function App() {
  const getTabFromPath = () => {
    const path = window.location.pathname.toLowerCase().replace('/', '');
    if (path.includes('engine')) return 'engine';
    if (path.includes('sentiment')) return 'sentiments';
    if (path.includes('report')) return 'reports';
    if (path.includes('api')) return 'api';
    return 'feed';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath);

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
        return <EnginePage />;
      case 'sentiments':
        return <SentimentLabPage />;
      case 'reports':
        return <ReportsPage />;
      case 'api':
        return <ApiPortalPage />;
      case 'feed':
      default:
        return <FeedPage />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main style={{ maxWidth: '1280px', width: '95%', margin: '0 auto', flexGrow: 1 }}>
        {renderActivePage()}
      </main>

      <Footer />
    </div>
  );
}

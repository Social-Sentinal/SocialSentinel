import React, { useState } from 'react';
import { Shield, Home, Cpu, Activity, BarChart3, PlusSquare, Bell, Sun, Moon, Menu, X } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, theme, onToggleTheme, onOpenCreatePost, onOpenNotifications }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'feed', label: 'Feed', icon: Home },
    { id: 'engine', label: 'ML Engine', icon: Cpu },
    { id: 'sentiments', label: 'Sentiment Lab', icon: Activity },
    { id: 'reports', label: 'Analytics', icon: BarChart3 },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.history.pushState({}, '', id === 'feed' ? '/' : `/${id}`);
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'var(--bg-card)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '24px',
      width: '100%',
    }}>
      <div style={{
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        {/* Brand Logo - Sleek Pink & Royal Blue Typography */}
        <div 
          onClick={() => handleNavClick('feed')}
          style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
            <span style={{ color: '#EC4899' }}>Social</span>
            <span style={{ color: '#3B82F6' }}>Sentinel</span>
          </span>
          <span style={{ fontSize: '0.68rem', color: '#60A5FA', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: '2px' }}>
            Emotional Wellbeing AI
          </span>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--text-main)' : 'var(--text-muted)',
                  background: isActive ? 'rgba(236, 72, 153, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(236, 72, 153, 0.35)' : '1px solid transparent',
                  transition: 'var(--transition-fast)',
                }}
              >
                <Icon size={16} color={isActive ? '#EC4899' : 'var(--text-muted)'} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Actions: + Create Post, Theme Switcher, Notifications & Live Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Theme Toggle Button (Dark / Light) */}
          <button 
            onClick={onToggleTheme}
            className="btn-icon"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}
          >
            {theme === 'dark' ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#3B82F6" />}
          </button>

          <button 
            onClick={onOpenCreatePost}
            className="btn-primary"
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
          >
            <PlusSquare size={16} />
            <span className="desktop-only-text">Create Post</span>
          </button>

          <button 
            onClick={onOpenNotifications}
            className="btn-icon"
            title="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={20} />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#EC4899' }} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-full)', border: '1px solid var(--positive-border)' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 600 }}>Live</span>
          </div>

          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: 'var(--text-main)', padding: '4px' }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={{ padding: '12px 20px 16px 20px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <Icon size={18} color={isActive ? '#A78BFA' : 'var(--text-muted)'} />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-only-text { display: inline !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .desktop-only-text { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}


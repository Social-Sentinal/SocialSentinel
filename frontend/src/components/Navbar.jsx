import React, { useState } from 'react';
import { Shield, Radar, Cpu, Activity, BarChart3, Terminal, Menu, X, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'feed', label: 'Live Radar Feed', icon: Radar },
    { id: 'engine', label: 'ML Engine', icon: Cpu },
    { id: 'sentiments', label: 'Sentiment Lab', icon: Activity },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'api', label: 'Developer API', icon: Terminal },
  ];

  const handleNavClick = (id) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
    window.history.pushState({}, '', id === 'feed' ? '/' : `/${id}`);
  };

  return (
    <nav className="glass-card" style={{
      position: 'sticky',
      top: 16,
      zIndex: 100,
      margin: '0 auto 24px auto',
      maxWidth: '1280px',
      width: '95%',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 24px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <div 
          onClick={() => handleNavClick('feed')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent-cyan) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-neon)'
          }}>
            <Shield size={24} color="#FFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                SocialSentinel
              </span>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                v2.0 PROD
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              AI Intelligence & Sentiment Engine
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div style={{ display: 'none', mdDisplay: 'flex', alignItems: 'center', gap: '6px' }} className="desktop-nav">
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
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                  transition: 'var(--transition-fast)',
                }}
              >
                <Icon size={16} color={isActive ? '#A78BFA' : 'var(--text-muted)'} />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* System Status & Mobile Menu Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: 'var(--radius-full)', border: '1px solid var(--positive-border)' }}>
            <span className="pulse-dot"></span>
            <span style={{ fontSize: '0.78rem', color: '#34D399', fontWeight: 600 }}>API Online</span>
          </div>

          <button 
            className="mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{ color: 'var(--text-main)', padding: '6px' }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-muted)',
                  background: isActive ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-glass)',
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
        @media (min-width: 840px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 839px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </nav>
  );
}

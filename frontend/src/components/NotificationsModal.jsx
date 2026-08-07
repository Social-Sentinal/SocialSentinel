import React from 'react';
import { X, Bell, ShieldCheck, Heart, Sparkles } from 'lucide-react';

export default function NotificationsModal({ onClose, notifications = [] }) {
  const defaultNotifications = notifications.length > 0 ? notifications : [
    {
      id: 1,
      title: 'Wellbeing Guard Active',
      message: 'Detected negative sentiment trend in recent views. Sentiment steering active: recommending career success & self healing posts.',
      type: 'wellbeing',
      timestamp: '10m ago'
    },
    {
      id: 2,
      title: 'New Uplift Recommendation',
      message: '@interview_pro posted a new guide: "How I Cracked Top Tech Offers After 10 Rejections".',
      type: 'recommendation',
      timestamp: '1h ago'
    },
    {
      id: 3,
      title: 'Interaction Streak',
      message: 'Your emotional balance score increased to 85.0 (+4.2%).',
      type: 'stats',
      timestamp: '3h ago'
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 250,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      justifyContent: 'flex-end',
    }}>
      <div className="insta-card" style={{
        width: '380px',
        height: '100vh',
        borderRadius: 0,
        borderLeft: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-dark)',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bell size={20} color="#8B5CF6" />
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFF' }}>Notifications</h3>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {defaultNotifications.map((n) => (
            <div key={n.id} style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              background: n.type === 'wellbeing' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: n.type === 'wellbeing' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
              display: 'flex',
              gap: '12px',
            }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.type === 'wellbeing' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {n.type === 'wellbeing' ? <ShieldCheck size={18} color="#34D399" /> : <Sparkles size={18} color="#A78BFA" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#FFF' }}>{n.title}</div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 6px 0', lineHeight: 1.4 }}>{n.message}</p>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{n.timestamp}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

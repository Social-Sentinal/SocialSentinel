import React from 'react';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      maxWidth: '1000px',
      width: '100%',
      margin: '40px auto 20px auto',
      padding: '16px 20px',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      color: 'var(--text-muted)',
      fontSize: '0.78rem',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={16} color="#8B5CF6" />
        <span style={{ fontWeight: 700, color: '#FFF' }}>SocialSentinel AI</span>
      </div>

      <div>
        © {new Date().getFullYear()} SocialSentinel. Built with React JS & Flask.
      </div>
    </footer>
  );
}

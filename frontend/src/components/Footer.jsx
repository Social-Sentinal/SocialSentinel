import React from 'react';
import { Shield, Github, Heart, Cpu } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{
      maxWidth: '1280px',
      width: '95%',
      margin: '40px auto 20px auto',
      padding: '24px',
      borderTop: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      fontSize: '0.85rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={20} color="#8B5CF6" />
        <span style={{ fontWeight: 700, color: '#FFF' }}>SocialSentinel AI</span>
        <span>— Industry Standard Social Media Intelligence & Recommendation Engine</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <span className="badge badge-neutral">Python Flask REST API</span>
        <span className="badge badge-neutral">React 18 + Vite</span>
        <span className="badge badge-neutral">Word2Vec & Cosine Similarity</span>
        <span className="badge badge-neutral">Render Cloud Deployed</span>
      </div>

      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
        © {new Date().getFullYear()} SocialSentinel Platform. Built for high performance & scalability.
      </div>
    </footer>
  );
}

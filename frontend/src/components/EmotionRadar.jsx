import React from 'react';
import { Sparkles } from 'lucide-react';

export default function EmotionRadar({ emotions }) {
  const defaultEmotions = { joy: 0.75, anger: 0.12, sadness: 0.08, surprise: 0.45 };
  const data = emotions || defaultEmotions;

  const emotionList = [
    { key: 'joy', label: 'Joy', color: '#10B981', bg: 'rgba(16, 185, 129, 0.2)' },
    { key: 'surprise', label: 'Surprise', color: '#06B6D4', bg: 'rgba(6, 182, 212, 0.2)' },
    { key: 'anger', label: 'Anger', color: '#F43F5E', bg: 'rgba(244, 63, 94, 0.2)' },
    { key: 'sadness', label: 'Sadness', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.2)' },
  ];

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Sparkles size={18} color="#C084FC" />
        <div>
          <h4 style={{ fontSize: '1rem', color: '#FFF' }}>Emotion Detection Spectrum</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Granular Nuance Intensity</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {emotionList.map((item) => {
          const intensity = Math.round((data[item.key] || 0) * 100);
          return (
            <div key={item.key}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px', fontWeight: 600 }}>
                <span style={{ color: item.color }}>{item.label}</span>
                <span style={{ color: 'var(--text-main)' }}>{intensity}%</span>
              </div>
              <div style={{
                height: '8px',
                width: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${intensity}%`,
                  backgroundColor: item.color,
                  boxShadow: `0 0 8px ${item.color}`,
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.6s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

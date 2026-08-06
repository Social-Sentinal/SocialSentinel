import React from 'react';
import { Smile, Meh, Frown } from 'lucide-react';

export default function SentimentGauge({ distribution, mainSentiment, confidence }) {
  const pos = distribution?.positive || 33.33;
  const neu = distribution?.neutral || 33.34;
  const neg = distribution?.negative || 33.33;

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h4 style={{ fontSize: '1rem', color: '#FFF' }}>Sentiment Distribution</h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>NLP Classification & Confidence</p>
        </div>
        {mainSentiment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              Confidence: {Math.round((confidence || 0.85) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar Gauge */}
      <div style={{
        height: '14px',
        width: '100%',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
        marginBottom: '20px'
      }}>
        <div style={{ width: `${pos}%`, background: 'var(--positive)', transition: 'width 0.6s ease' }} title={`Positive: ${pos}%`} />
        <div style={{ width: `${neu}%`, background: 'var(--neutral)', transition: 'width 0.6s ease' }} title={`Neutral: ${neu}%`} />
        <div style={{ width: `${neg}%`, background: 'var(--negative)', transition: 'width 0.6s ease' }} title={`Negative: ${neg}%`} />
      </div>

      {/* Metric Cards Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <div style={{ background: 'var(--positive-bg)', border: '1px solid var(--positive-border)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#34D399', marginBottom: '4px' }}>
            <Smile size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Positive</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34D399' }}>{pos}%</span>
        </div>

        <div style={{ background: 'var(--neutral-bg)', border: '1px solid var(--neutral-border)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#CBD5E1', marginBottom: '4px' }}>
            <Meh size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Neutral</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#CBD5E1' }}>{neu}%</span>
        </div>

        <div style={{ background: 'var(--negative-bg)', border: '1px solid var(--negative-border)', padding: '12px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#FB7185', marginBottom: '4px' }}>
            <Frown size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Negative</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FB7185' }}>{neg}%</span>
        </div>
      </div>
    </div>
  );
}

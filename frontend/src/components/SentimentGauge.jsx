import React from 'react';
import { Smile, Meh, Frown, Sparkles } from 'lucide-react';

export default function SentimentGauge({ distribution, mainSentiment, confidence }) {
  const posVal = parseFloat(distribution?.positive ?? 33.3);
  const neuVal = parseFloat(distribution?.neutral ?? 33.4);
  const negVal = parseFloat(distribution?.negative ?? 33.3);

  const posStr = posVal.toFixed(1);
  const neuStr = neuVal.toFixed(1);
  const negStr = negVal.toFixed(1);

  const getBadgeClass = () => {
    const s = (mainSentiment || '').toLowerCase();
    if (s === 'positive') return 'badge badge-positive';
    if (s === 'negative') return 'badge badge-negative';
    return 'badge badge-neutral';
  };

  return (
    <div className="insta-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
        <div>
          <h4 style={{ fontSize: '1.05rem', color: '#FFF', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="#EC4899" /> Sentiment Classification Breakdown
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            NLP Vector Distribution & Confidence Scoring
          </p>
        </div>
        {mainSentiment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={getBadgeClass()}>
              {mainSentiment} ({Math.round((confidence || 0.85) * 100)}%)
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar Gauge */}
      <div style={{
        height: '16px',
        width: '100%',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.5)',
        marginBottom: '24px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ width: `${posVal}%`, background: 'var(--positive)', transition: 'width 0.6s ease' }} title={`Positive: ${posStr}%`} />
        <div style={{ width: `${neuVal}%`, background: 'var(--neutral)', transition: 'width 0.6s ease' }} title={`Neutral: ${neuStr}%`} />
        <div style={{ width: `${negVal}%`, background: 'var(--negative)', transition: 'width 0.6s ease' }} title={`Negative: ${negStr}%`} />
      </div>

      {/* Metric Cards Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        <div style={{ background: 'var(--positive-bg)', border: '1px solid var(--positive-border)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#34D399', marginBottom: '6px' }}>
            <Smile size={18} />
            <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Positive</span>
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34D399' }}>{posStr}%</span>
        </div>

        <div style={{ background: 'var(--neutral-bg)', border: '1px solid var(--neutral-border)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#CBD5E1', marginBottom: '6px' }}>
            <Meh size={18} />
            <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Neutral</span>
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#CBD5E1' }}>{neuStr}%</span>
        </div>

        <div style={{ background: 'var(--negative-bg)', border: '1px solid var(--negative-border)', padding: '14px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#FB7185', marginBottom: '6px' }}>
            <Frown size={18} />
            <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>Negative</span>
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FB7185' }}>{negStr}%</span>
        </div>
      </div>
    </div>
  );
}

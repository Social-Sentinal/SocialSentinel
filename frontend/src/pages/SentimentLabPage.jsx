import React, { useState } from 'react';
import { Activity, Sparkles, Send, RefreshCcw, FileText, Image as ImageIcon } from 'lucide-react';
import SentimentGauge from '../components/SentimentGauge';
import EmotionRadar from '../components/EmotionRadar';
import { predictSentimentText, fetchEmotionDetection } from '../services/api';

export default function SentimentLabPage() {
  const [inputText, setInputText] = useState('SocialSentinel platform offers an incredible AI sentiment analysis experience with ultra high accuracy!');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [emotionResult, setEmotionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sampleInputs = [
    'SocialSentinel platform offers an incredible AI sentiment analysis experience with ultra high accuracy!',
    'The application latency is terrible, extremely buggy, and constantly crashing.',
    'The annual report was published online today at 9:00 AM.',
    'I am absolutely thrilled about the new feature updates launched today!'
  ];

  const handleAnalyze = async (overrideText) => {
    const textToAnalyze = overrideText || inputText;
    if (!textToAnalyze.trim()) return;

    setIsLoading(true);
    try {
      const [sentRes, emoRes] = await Promise.all([
        predictSentimentText(textToAnalyze),
        fetchEmotionDetection(textToAnalyze)
      ]);

      if (sentRes.status === 'success' || sentRes.sentiment) {
        setAnalysisResult(sentRes);
      }
      if (emoRes.status === 'success' || emoRes.emotions) {
        setEmotionResult(emoRes.emotions);
      }
    } catch (err) {
      console.error('Sentiment analysis failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '32px 28px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', fontSize: '0.78rem', color: '#34D399', fontWeight: 600, marginBottom: '12px' }}>
            <Activity size={14} /> NLP Sentiment & Emotion Studio
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }} className="gradient-text-emerald">
            Text Classification & Emotion Radar
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Input custom text, social media captions, or user reviews to analyze real-time sentiment distribution and emotion intensities.
          </p>
        </div>
      </div>

      {/* Analyzer Card */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label style={{ fontSize: '0.88rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={16} color="#A78BFA" /> Input Text for Sentiment Analysis:
        </label>

        <textarea 
          rows={4}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste or type text here..."
          className="input-field"
          style={{ resize: 'vertical' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', alignSelf: 'center' }}>Sample texts:</span>
            {sampleInputs.map((sample, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(sample);
                  handleAnalyze(sample);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-glass)'
                }}
              >
                Sample {i + 1}
              </button>
            ))}
          </div>

          <button 
            onClick={() => handleAnalyze()} 
            className="btn-primary"
            disabled={isLoading}
          >
            <Sparkles size={16} />
            {isLoading ? 'Analyzing...' : 'Run Sentiment Classifier'}
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {analysisResult && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Sentiment Gauge Card */}
            <SentimentGauge 
              distribution={analysisResult.distribution} 
              mainSentiment={analysisResult.sentiment}
              confidence={analysisResult.confidence}
            />

            {/* Emotion Radar Card */}
            <EmotionRadar emotions={emotionResult} />
          </div>

          {/* Classification Banner */}
          <div className="glass-card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: `4px solid ${analysisResult.sentiment === 'Positive' ? '#10B981' : analysisResult.sentiment === 'Negative' ? '#F43F5E' : '#94A3B8'}` }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Primary Classifier Output
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: analysisResult.sentiment === 'Positive' ? '#34D399' : analysisResult.sentiment === 'Negative' ? '#FB7185' : '#CBD5E1' }}>
                {analysisResult.sentiment} ({Math.round((analysisResult.confidence || 0.85) * 100)}% Confidence)
              </h3>
            </div>

            <div className="badge badge-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              TF-IDF Vectorized Model
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

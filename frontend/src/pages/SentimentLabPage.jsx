import React, { useState, useEffect } from 'react';
import { Sparkles, Cpu, Layers } from 'lucide-react';
import SentimentGauge from '../components/SentimentGauge';
import EmotionRadar from '../components/EmotionRadar';
import { predictSentimentText, fetchEmotionDetection } from '../services/api';

export default function SentimentLabPage() {
  const [inputText, setInputText] = useState('SocialSentinel AI provides instant, highly accurate sentiment predictions.');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [emotionResult, setEmotionResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const sampleInputs = [
    'SocialSentinel AI provides instant, highly accurate sentiment predictions.',
    'The application latency is high and constantly crashing.',
    'The official report was updated this morning at 9:00 AM.'
  ];

  const handleAnalyze = async (overrideText) => {
    const textToAnalyze = overrideText !== undefined ? overrideText : inputText;
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

  useEffect(() => {
    handleAnalyze('SocialSentinel AI provides instant, highly accurate sentiment predictions.');
  }, []);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="insta-card" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.12))', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={26} color="#10B981" /> NLP Sentiment & Emotion Lab
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Test live text sentences against our NLP classification pipeline and emotion intensity detector.
            </p>
          </div>
        </div>
      </div>

      {/* Input Card */}
      <div className="insta-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <label style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-main)' }}>
          Enter Input Sentence for NLP Analysis
        </label>

        <textarea 
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type any sentence to compute Positive, Neutral, and Negative probabilities..."
          className="input-field"
          style={{ resize: 'vertical', fontSize: '0.92rem' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Preset Samples:</span>
            {sampleInputs.map((sample, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(sample);
                  handleAnalyze(sample);
                }}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border-color)',
                  transition: 'var(--transition-fast)'
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
            style={{ padding: '10px 24px' }}
          >
            <Sparkles size={16} />
            {isLoading ? 'Analyzing...' : 'Run Analysis'}
          </button>
        </div>
      </div>

      {/* Output Results */}
      {analysisResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          <SentimentGauge 
            distribution={analysisResult.distribution} 
            mainSentiment={analysisResult.sentiment}
            confidence={analysisResult.confidence}
          />
          <EmotionRadar emotions={emotionResult} />
        </div>
      )}
    </div>
  );
}

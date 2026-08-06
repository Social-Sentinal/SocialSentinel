import React, { useState } from 'react';
import { Activity, Sparkles, FileText } from 'lucide-react';
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
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Input Card */}
      <div className="insta-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <textarea 
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text to analyze sentiment..."
          className="input-field"
          style={{ resize: 'vertical' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {sampleInputs.map((sample, i) => (
              <button
                key={i}
                onClick={() => {
                  setInputText(sample);
                  handleAnalyze(sample);
                }}
                style={{
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.72rem',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)'
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
            {isLoading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Output Results */}
      {analysisResult && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
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

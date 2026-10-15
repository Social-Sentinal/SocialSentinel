import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Heart, MessageCircle, Share2, Sparkles, X, Send, Compass, Search, Users, Brain, Shield, BarChart3, TrendingUp } from 'lucide-react';

export function AIStudioPage({ user }) {
  const [text, setText] = useState('Sub-15ms local inference is a huge milestone for user privacy and resilient architecture.');
  const [sentiment, setSentiment] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [prompt, setPrompt] = useState('Why am I seeing these recommendations in my feed?');
  const [copilotReply, setCopilotReply] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

  // New settings state
  const [settings, setSettings] = useState({ autoModerate: true, suggestHashtags: true, strictTone: false });

  const runNlp = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    try {
      const [s, e] = await Promise.all([
        api.predictSentiment(text),
        api.predictEmotion(text)
      ]);
      setSentiment(s);
      setEmotion(e);
    } catch (err) {}
    finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    runNlp();
  }, []);

  const handleAsk = async () => {
    if (!prompt.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await api.ask(prompt);
      setCopilotReply(res.response);
    } catch (err) {
      alert(err.message);
    } finally {
      setCopilotLoading(false);
    }
  };

  const toggleSetting = (key) => setSettings({ ...settings, [key]: !settings[key] });

  return (
    <div className="fullwidth-page">
      <div className="sentinel-card">
        <h2 className="card-heading"><Brain size={22} color="var(--primary)" /> SocialSentinel AI Studio</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
          Real-time Scikit-Learn TF-IDF classification and grounded conversational intelligence.
        </p>
      </div>

      <div className="ai-columns-grid">
        <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="card-heading"><Sparkles size={16} color="var(--accent-cyan)" /> NLP Sentiment Analyzer</h3>
          <textarea
            style={{ width: '100%', minHeight: 100, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <button className="btn-primary" onClick={runNlp} disabled={analyzing} style={{ alignSelf: 'flex-start' }}>
            {analyzing ? 'Analyzing…' : 'Run Scikit-Learn Prediction'}
          </button>

          {sentiment && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Classification:</span>
                <span className={`chip ${sentiment.sentiment.toLowerCase()}`} style={{ fontSize: 13 }}>
                  {sentiment.sentiment} ({Math.round(sentiment.confidence * 100)}%)
                </span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Positive: {Math.round((sentiment.probabilities?.positive || 0) * 100)}%</span>
                  <span>Neutral: {Math.round((sentiment.probabilities?.neutral || 0) * 100)}%</span>
                  <span>Negative: {Math.round((sentiment.probabilities?.negative || 0) * 100)}%</span>
                </div>
                <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', background: 'var(--bg-elevated)', marginTop: 6 }}>
                  <div style={{ width: `${(sentiment.probabilities?.positive || 0) * 100}%`, background: '#059669' }} />
                  <div style={{ width: `${(sentiment.probabilities?.neutral || 0) * 100}%`, background: '#64748b' }} />
                  <div style={{ width: `${(sentiment.probabilities?.negative || 0) * 100}%`, background: '#ef4444' }} />
                </div>
              </div>

              {emotion && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>Emotion:</span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 700 }}>
                    🌿 {emotion.emotion.toUpperCase()} ({Math.round(emotion.confidence * 100)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 className="card-heading"><Shield size={16} color="var(--primary)" /> Grounded AI Copilot</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Ask questions about recommendations, topic affinity trends, or platform mechanics.
            </p>

            <textarea
              style={{ width: '100%', minHeight: 70, padding: 12, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />

            <button className="btn-primary" onClick={handleAsk} disabled={copilotLoading} style={{ alignSelf: 'flex-start' }}>
              {copilotLoading ? 'Consulting…' : 'Ask Copilot'}
            </button>

            {copilotReply && (
              <div style={{ padding: 14, borderRadius: 8, background: 'var(--bg-elevated)', fontSize: 13, lineHeight: 1.6, borderLeft: '3px solid var(--primary)' }}>
                {copilotReply}
              </div>
            )}
          </div>

          <div className="sentinel-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 className="card-heading">Agent Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Auto-Moderate Comments</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Automatically hide negative sentiment comments.</div>
                </div>
                <input type="checkbox" checked={settings.autoModerate} onChange={() => toggleSetting('autoModerate')} />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Suggest Hashtags</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Copilot will recommend hashtags while you type.</div>
                </div>
                <input type="checkbox" checked={settings.suggestHashtags} onChange={() => toggleSetting('suggestHashtags')} />
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Strict Tone Enforcement</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Prevent posting if sentiment drops below neutral.</div>
                </div>
                <input type="checkbox" checked={settings.strictTone} onChange={() => toggleSetting('strictTone')} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


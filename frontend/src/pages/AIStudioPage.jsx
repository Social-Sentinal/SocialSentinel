import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Brain, Sparkles, MessageSquare } from 'lucide-react';

export function AIStudioPage({ user }) {
  const [text, setText] = useState('Sub-15ms local inference is a huge milestone for user privacy and resilient architecture.');
  const [sentiment, setSentiment] = useState(null);
  const [emotion, setEmotion] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [prompt, setPrompt] = useState('How does sentiment tracking personalize my feed recommendations?');
  const [copilotReply, setCopilotReply] = useState('');
  const [copilotLoading, setCopilotLoading] = useState(false);

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
      <div className="card">
        <div className="card-title">
          <Brain size={20} color="var(--primary)" />
          <span>AI Sentiment & Tone Studio</span>
        </div>
        <p className="card-subtext">
          Test real-time sentiment inference, emotion classification, and consult the intelligence copilot.
        </p>
      </div>

      {/* Tone & Emotion Analyzer Card */}
      <div className="card">
        <div className="card-title" style={{ fontSize: 14 }}>
          <Sparkles size={16} color="var(--primary)" />
          <span>Sentence Tone & Emotion Analyzer</span>
        </div>
        <textarea
          className="input-field"
          style={{ minHeight: 85, marginTop: 10, resize: 'vertical' }}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type any sentence to inspect predicted tone and emotion..."
        />
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-start' }}>
          <button className="btn-primary" onClick={runNlp} disabled={analyzing}>
            {analyzing ? 'Analyzing…' : 'Analyze Tone'}
          </button>
        </div>

        {sentiment && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Classification:</span>
              <span className={`sentiment-badge ${(sentiment.sentiment || 'neutral').toLowerCase()}`}>
                {sentiment.sentiment} ({Math.round(sentiment.confidence * 100)}%)
              </span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Positive: {Math.round((sentiment.probabilities?.positive || 0) * 100)}%</span>
                <span>Neutral: {Math.round((sentiment.probabilities?.neutral || 0) * 100)}%</span>
                <span>Negative: {Math.round((sentiment.probabilities?.negative || 0) * 100)}%</span>
              </div>
              <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', background: 'var(--bg-elevated)', marginTop: 4 }}>
                <div style={{ width: `${(sentiment.probabilities?.positive || 0) * 100}%`, background: 'var(--status-positive)' }} />
                <div style={{ width: `${(sentiment.probabilities?.neutral || 0) * 100}%`, background: 'var(--status-neutral)' }} />
                <div style={{ width: `${(sentiment.probabilities?.negative || 0) * 100}%`, background: 'var(--status-negative)' }} />
              </div>
            </div>

            {emotion && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Dominant Emotion:</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>
                  🌿 {emotion.emotion.toUpperCase()} ({Math.round(emotion.confidence * 100)}%)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Copilot Assistant Card */}
      <div className="card">
        <div className="card-title" style={{ fontSize: 14 }}>
          <MessageSquare size={16} color="var(--primary)" />
          <span>Intelligence Copilot</span>
        </div>
        <p className="card-subtext" style={{ marginBottom: 10 }}>
          Ask questions about your feed mechanics, topic graphs, or algorithm weights.
        </p>

        <textarea
          className="input-field"
          style={{ minHeight: 65, resize: 'vertical' }}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />

        <div style={{ marginTop: 10 }}>
          <button className="btn-primary" onClick={handleAsk} disabled={copilotLoading}>
            {copilotLoading ? 'Consulting…' : 'Ask Copilot'}
          </button>
        </div>

        {copilotReply && (
          <div style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 'var(--radius-sm)',
            background: 'var(--bg-elevated)',
            fontSize: 13,
            lineHeight: 1.6,
            borderLeft: '3px solid var(--primary)'
          }}>
            {copilotReply}
          </div>
        )}
      </div>

      {/* Moderation Settings */}
      <div className="card">
        <div className="card-title" style={{ fontSize: 14, marginBottom: 12 }}>
          <span>Preference Controls</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Auto-Moderate High Toxicity</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filter hostile comments automatically.</div>
            </div>
            <input type="checkbox" checked={settings.autoModerate} onChange={() => toggleSetting('autoModerate')} />
          </label>

          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Suggest Hashtags</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Recommend relevant topic hashtags while typing.</div>
            </div>
            <input type="checkbox" checked={settings.suggestHashtags} onChange={() => toggleSetting('suggestHashtags')} />
          </label>
        </div>
      </div>
    </div>
  );
}

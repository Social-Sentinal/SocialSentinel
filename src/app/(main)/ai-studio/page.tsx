'use client';

import React, { useState } from 'react';
import { Brain, Sparkles, Activity, Shield, BarChart3, CheckCircle, Info } from 'lucide-react';
import { predictSentiment, SentimentResult } from '@/modules/ai/sentiment';
import { detectEmotion, EmotionResult } from '@/modules/ai/emotion';

export default function AIStudioPage() {
  const [inputText, setInputText] = useState(
    'Our team just published our latest benchmarks on explainable attention mechanisms. By preserving feature attribution paths through the transformer layers, we achieve 94% alignment with human reasoning!'
  );

  const sentimentRes: SentimentResult = predictSentiment(inputText);
  const emotionRes: EmotionResult = detectEmotion(inputText);

  const modelMetrics = [
    {
      name: 'Sentinel Sentiment Engine',
      type: 'Lexicon-Enhanced Polarity & TF-IDF Vectorizer',
      version: 'v5.0.0-native',
      status: 'Active (Edge Optimized)',
      latency: '< 1ms',
      offline: '100% Offline Compatible',
    },
    {
      name: 'Sentinel Emotion Detector',
      type: 'Multi-Pattern Social Emotion Engine',
      version: 'v3.0.0-native',
      status: 'Active',
      latency: '< 1ms',
      offline: '100% Offline Compatible',
    },
    {
      name: 'Sentinel Hybrid Recommender',
      type: 'Content TF-IDF + Collaborative Velocity + Diversity Capping',
      version: 'v4.2.0',
      status: 'Active',
      latency: '2-4ms',
      offline: 'Deterministic SQL + In-Memory Ranking',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border)] p-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-400" />
            <span>Sentinel AI Studio</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Interactive natural language processing laboratory and model explainability inspector.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        {/* Live NLP Playground */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-md flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Real-Time NLP Inspector</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>Zero-API Latency</span>
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-[var(--text-secondary)]">
              Input Text to Analyze:
            </label>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={4}
              placeholder="Type any phrase or post caption here..."
              className="w-full text-sm p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Sentiment Box */}
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  Sentiment Polarity
                </span>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    sentimentRes.sentiment === 'Positive'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : sentimentRes.sentiment === 'Negative'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {sentimentRes.sentiment} ({Math.round(sentimentRes.confidence * 100)}%)
                </span>
              </div>

              {/* Confidence Bars */}
              <div className="flex flex-col gap-2 pt-1 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[var(--text-secondary)]">Positive</span>
                    <span className="font-semibold text-emerald-400">
                      {Math.round(sentimentRes.probabilities.positive * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${sentimentRes.probabilities.positive * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[var(--text-secondary)]">Neutral</span>
                    <span className="font-semibold text-blue-400">
                      {Math.round(sentimentRes.probabilities.neutral * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${sentimentRes.probabilities.neutral * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-[var(--text-secondary)]">Negative</span>
                    <span className="font-semibold text-rose-400">
                      {Math.round(sentimentRes.probabilities.negative * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all duration-300"
                      style={{ width: `${sentimentRes.probabilities.negative * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Emotion Box */}
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                    Detected Emotion
                  </span>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 capitalize">
                    {emotionRes.emotion} ({Math.round(emotionRes.confidence * 100)}%)
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Evaluated across the 7 social intelligence dimensions: Joy, Wonder, Curiosity, Inspiration, Empathy, Concern, and Sadness.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-[11px] text-[var(--text-muted)] flex items-start gap-2">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-indigo-400" />
                <span>
                  Predictions are calculated deterministically on the client/server using calibrated lexical and semantic vectors without external API calls.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Model Registry & Operational Metrics */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Active Model Specifications</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modelMetrics.map((m) => (
              <div
                key={m.name}
                className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] flex flex-col justify-between gap-4"
              >
                <div>
                  <h3 className="font-heading font-bold text-sm text-[var(--text-primary)] mb-1">
                    {m.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mb-3">{m.type}</p>
                  <div className="flex flex-col gap-1 text-[11px] text-[var(--text-secondary)]">
                    <div>Version: <span className="font-semibold text-indigo-400">{m.version}</span></div>
                    <div>Latency: <span className="font-semibold text-emerald-400">{m.latency}</span></div>
                    <div>Mode: <span className="font-semibold text-[var(--text-primary)]">{m.offline}</span></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span>{m.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Cpu, Sparkles, Sliders, ArrowRight, Layers, Heart, Compass } from 'lucide-react';
import { fetchContentRecommendations, fetchCollaborativeRecommendations } from '../services/api';

export default function EnginePage() {
  const [activeModel, setActiveModel] = useState('content');
  const [userInput, setUserInput] = useState('exploring mountains and nature adventure');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const sampleQueries = [
    'exploring mountains and nature adventure',
    'delicious coffee morning vibes',
    'fitness workout motivation gym',
    'sunset beach ocean waves',
    'tech innovation code artificial intelligence',
  ];

  const handleRunRecommendation = async (overrideQuery) => {
    const queryToUse = overrideQuery || userInput;
    setIsLoading(true);
    setHasRun(true);

    try {
      if (activeModel === 'content') {
        const res = await fetchContentRecommendations(queryToUse);
        if (res.status === 'success' && Array.isArray(res.data)) {
          setRecommendations(res.data);
        }
      } else {
        const res = await fetchCollaborativeRecommendations();
        if (res.status === 'success' && Array.isArray(res.data)) {
          setRecommendations(res.data);
        }
      }
    } catch (err) {
      console.error('Recommendation request failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '32px 28px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)' }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid rgba(6, 182, 212, 0.4)', fontSize: '0.78rem', color: '#06B6D4', fontWeight: 600, marginBottom: '12px' }}>
            <Cpu size={14} /> AI Recommendation Engine Studio
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }} className="gradient-text">
            Vector Similarity & Collaborative Filtering
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Test our Word2Vec continuous bag-of-words vector space embeddings and collaborative user interaction prediction models.
          </p>
        </div>
      </div>

      {/* Model Selection & Inputs */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Switch Model Tabs */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveModel('content')}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.92rem',
              background: activeModel === 'content' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: activeModel === 'content' ? '#FFFFFF' : 'var(--text-muted)',
              border: activeModel === 'content' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid var(--border-glass)',
              transition: 'var(--transition-fast)'
            }}
          >
            <Compass size={18} color={activeModel === 'content' ? '#A78BFA' : 'currentColor'} />
            Content-Based Similarity (Word2Vec + Cosine)
          </button>

          <button
            onClick={() => setActiveModel('collaborative')}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              fontWeight: 600,
              fontSize: '0.92rem',
              background: activeModel === 'collaborative' ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: activeModel === 'collaborative' ? '#FFFFFF' : 'var(--text-muted)',
              border: activeModel === 'collaborative' ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid var(--border-glass)',
              transition: 'var(--transition-fast)'
            }}
          >
            <Layers size={18} color={activeModel === 'collaborative' ? '#06B6D4' : 'currentColor'} />
            Collaborative Filtering (User Interaction Matrix)
          </button>
        </div>

        {/* Query Input Section */}
        {activeModel === 'content' ? (
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
              User Interest Query / Semantic Context:
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input 
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g. coffee morning sunrise..."
                className="input-field"
              />
              <button 
                onClick={() => handleRunRecommendation()} 
                className="btn-primary"
                disabled={isLoading}
                style={{ flexShrink: 0 }}
              >
                <Sparkles size={16} />
                {isLoading ? 'Computing...' : 'Generate Recommendations'}
              </button>
            </div>

            {/* Quick Preset Badges */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', alignSelf: 'center' }}>Presets:</span>
              {sampleQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setUserInput(q);
                    handleRunRecommendation(q);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border-glass)'
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
            <span style={{ fontSize: '0.88rem', color: '#06B6D4' }}>
              Collaborative model predicts items based on recent user dwell times, likes, and saved interactions.
            </span>
            <button 
              onClick={() => handleRunRecommendation()} 
              className="btn-primary"
              disabled={isLoading}
            >
              <Sparkles size={16} />
              {isLoading ? 'Computing...' : 'Predict Recommendations'}
            </button>
          </div>
        )}
      </div>

      {/* Recommendation Results Grid */}
      {hasRun && (
        <div>
          <h3 style={{ fontSize: '1.2rem', color: '#FFF', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sliders size={18} color="#A78BFA" /> Recommended Results Output
          </h3>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Computing vector dot products and similarity matrix...
            </div>
          ) : recommendations.length === 0 ? (
            <div className="glass-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No recommendations generated. Try another query.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {recommendations.map((rec, idx) => (
                <div key={idx} className="glass-card-interactive" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ position: 'relative', width: '100%', height: '180px', backgroundColor: '#000' }}>
                    <img 
                      src={rec.image_url} 
                      alt="Recommended media" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      padding: '4px 10px',
                      background: 'rgba(16, 185, 129, 0.9)',
                      color: '#FFF',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                    }}>
                      Score: {rec.similarity !== undefined ? `${Math.round(rec.similarity * 100)}%` : `${Math.round((rec.engagement_score || 0.88) * 100)}%`}
                    </div>
                  </div>

                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
                    <p style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: 500, lineHeight: 1.4 }}>
                      {rec.Caption || rec.predicted_caption}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#06B6D4', fontWeight: 600 }}>
                      {rec.Hashtags || rec.predicted_hashtags}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

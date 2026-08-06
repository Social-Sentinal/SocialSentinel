import React, { useState } from 'react';
import { Cpu, Sparkles, Sliders, Compass, Layers } from 'lucide-react';
import { fetchContentRecommendations, fetchCollaborativeRecommendations } from '../services/api';

export default function EnginePage() {
  const [activeModel, setActiveModel] = useState('content');
  const [userInput, setUserInput] = useState('exploring mountains and nature adventure');
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const sampleQueries = [
    'exploring mountains nature',
    'delicious coffee morning',
    'fitness gym workout',
    'sunset beach ocean',
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
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Compact Controls Card */}
      <div className="insta-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Model Switch Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveModel('content')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeModel === 'content' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: activeModel === 'content' ? '#FFFFFF' : 'var(--text-muted)',
              border: activeModel === 'content' ? '1px solid #8B5CF6' : '1px solid var(--border-color)',
            }}
          >
            <Compass size={16} color={activeModel === 'content' ? '#A78BFA' : 'currentColor'} />
            Content Similarity (Word2Vec)
          </button>

          <button
            onClick={() => setActiveModel('collaborative')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: activeModel === 'collaborative' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: activeModel === 'collaborative' ? '#FFFFFF' : 'var(--text-muted)',
              border: activeModel === 'collaborative' ? '1px solid #06B6D4' : '1px solid var(--border-color)',
            }}
          >
            <Layers size={16} color={activeModel === 'collaborative' ? '#06B6D4' : 'currentColor'} />
            Collaborative Matrix
          </button>
        </div>

        {/* Input Bar */}
        {activeModel === 'content' ? (
          <div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter topics..."
                className="input-field"
              />
              <button 
                onClick={() => handleRunRecommendation()} 
                className="btn-primary"
                disabled={isLoading}
                style={{ flexShrink: 0 }}
              >
                <Sparkles size={16} />
                {isLoading ? 'Computing...' : 'Recommend'}
              </button>
            </div>

            {/* Presets */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
              {sampleQueries.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setUserInput(q);
                    handleRunRecommendation(q);
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
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(6, 182, 212, 0.08)', borderRadius: 'var(--radius-sm)' }}>
            <span style={{ fontSize: '0.84rem', color: '#06B6D4' }}>
              Recommends content based on user dwell times & saves.
            </span>
            <button 
              onClick={() => handleRunRecommendation()} 
              className="btn-primary"
              disabled={isLoading}
            >
              <Sparkles size={16} />
              {isLoading ? 'Predicting...' : 'Predict'}
            </button>
          </div>
        )}
      </div>

      {/* Grid Results */}
      {hasRun && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {recommendations.map((rec, idx) => (
            <div key={idx} className="insta-card" style={{ overflow: 'hidden' }}>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', backgroundColor: '#000' }}>
                <img 
                  src={rec.image_url} 
                  alt="Rec media" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  padding: '3px 8px',
                  background: 'rgba(16, 185, 129, 0.9)',
                  color: '#FFF',
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  borderRadius: 'var(--radius-full)'
                }}>
                  {rec.similarity !== undefined ? `${Math.round(rec.similarity * 100)}% Match` : `${Math.round((rec.engagement_score || 0.88) * 100)}% Match`}
                </div>
              </div>

              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '0.84rem', color: '#FFF', fontWeight: 500, lineHeight: 1.35 }}>
                  {rec.Caption || rec.predicted_caption}
                </p>
                <p style={{ fontSize: '0.78rem', color: '#06B6D4', fontWeight: 600 }}>
                  {rec.Hashtags || rec.predicted_hashtags}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

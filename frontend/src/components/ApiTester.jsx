import React, { useState } from 'react';
import { Play, Copy, Check, Terminal, Code2 } from 'lucide-react';

export default function ApiTester() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/v1/sentiment/predict');
  const [method, setMethod] = useState('POST');
  const [payloadText, setPayloadText] = useState('SocialSentinel AI provides remarkable accuracy!');
  const [responseJson, setResponseJson] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const endpoints = [
    { path: '/api/v1/posts', method: 'GET', description: 'Fetch dataset posts' },
    { path: '/api/v1/sentiment/predict', method: 'POST', description: 'Analyze sentiment & NLP confidence' },
    { path: '/api/v1/recommendations/content', method: 'POST', description: 'Word2Vec content recommendation' },
    { path: '/api/v1/recommendations/collaborative', method: 'GET', description: 'Collaborative user interaction matrix' },
    { path: '/api/v1/analytics/overview', method: 'GET', description: 'Platform analytics & metrics' },
  ];

  const handleSelect = (ep) => {
    setSelectedEndpoint(ep.path);
    setMethod(ep.method);
    setResponseJson(null);
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setResponseJson(null);
    try {
      let res;
      if (method === 'GET') {
        res = await fetch(selectedEndpoint);
      } else {
        const formData = new FormData();
        formData.append('text', payloadText);
        formData.append('user_input', payloadText);
        res = await fetch(selectedEndpoint, {
          method: 'POST',
          body: formData,
        });
      }
      const data = await res.json();
      setResponseJson(data);
    } catch (err) {
      setResponseJson({ error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getCurlSnippet = () => {
    if (method === 'GET') {
      return `curl -X GET "https://socialsentinel.onrender.com${selectedEndpoint}"`;
    }
    return `curl -X POST "https://socialsentinel.onrender.com${selectedEndpoint}" \\
  -F "text=${payloadText}"`;
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(getCurlSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Terminal size={22} color="#A78BFA" />
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#FFF' }}>Interactive API Playground</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Execute REST API endpoints live</p>
          </div>
        </div>
      </div>

      {/* Endpoint Selector Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
        {endpoints.map((ep) => (
          <button
            key={ep.path}
            onClick={() => handleSelect(ep)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              background: selectedEndpoint === ep.path ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              color: selectedEndpoint === ep.path ? '#A78BFA' : 'var(--text-muted)',
              border: selectedEndpoint === ep.path ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--border-glass)',
            }}
          >
            <span style={{ padding: '2px 6px', borderRadius: '4px', background: ep.method === 'GET' ? 'rgba(6, 182, 212, 0.2)' : 'rgba(16, 185, 129, 0.2)', color: ep.method === 'GET' ? '#06B6D4' : '#34D399', fontSize: '0.7rem' }}>
              {ep.method}
            </span>
            {ep.path}
          </button>
        ))}
      </div>

      {/* Payload Editor (if POST) */}
      {method === 'POST' && (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '6px', display: 'block' }}>
            Payload Parameter (`text` / `user_input`):
          </label>
          <input 
            type="text" 
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            className="input-field"
          />
        </div>
      )}

      {/* Execute & cURL Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        <button 
          onClick={handleExecute} 
          className="btn-primary" 
          disabled={isLoading}
          style={{ flexShrink: 0 }}
        >
          <Play size={16} />
          {isLoading ? 'Executing...' : 'Run Request'}
        </button>

        <button 
          onClick={handleCopyCurl}
          className="btn-secondary"
          style={{ flexShrink: 0 }}
        >
          {copied ? <Check size={16} color="#34D399" /> : <Copy size={16} />}
          {copied ? 'Copied!' : 'Copy cURL'}
        </button>
      </div>

      {/* cURL Snippet Display */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Code2 size={14} /> cURL Command:
        </div>
        <div className="code-block" style={{ color: '#38BDF8' }}>
          {getCurlSnippet()}
        </div>
      </div>

      {/* JSON Response Preview */}
      {responseJson && (
        <div>
          <div style={{ fontSize: '0.78rem', color: '#34D399', marginBottom: '4px', fontWeight: 600 }}>
            HTTP 200 OK — JSON Response:
          </div>
          <div className="code-block" style={{ maxHeight: '280px', overflowY: 'auto' }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(responseJson, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { Terminal, Code2, Server, CheckCircle2, Copy, Check } from 'lucide-react';
import ApiTester from '../components/ApiTester';

export default function ApiPortalPage() {
  const [activeLang, setActiveLang] = useState('js');
  const [copied, setCopied] = useState(false);

  const jsSnippet = `// Fetch social post intelligence using JavaScript fetch
async function getSentimentPosts() {
  const res = await fetch('https://socialsentinel.onrender.com/api/v1/posts');
  const data = await res.json();
  console.log('Posts:', data.data);
}`;

  const pythonSnippet = `# Fetch sentiment recommendations using Python
import requests

url = "https://socialsentinel.onrender.com/api/v1/sentiment/predict"
payload = {"text": "SocialSentinel AI delivers unbelievable accuracy!"}
response = requests.post(url, data=payload)

print("Classification Result:", response.json())`;

  const getCodeSnippet = () => {
    if (activeLang === 'js') return jsSnippet;
    return pythonSnippet;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '32px 28px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 100%)' }}>
        <div style={{ maxWidth: '750px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid rgba(139, 92, 246, 0.4)', fontSize: '0.78rem', color: '#A78BFA', fontWeight: 600, marginBottom: '12px' }}>
            <Terminal size={14} /> Developer API Portal v1.0
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '12px' }} className="gradient-text">
            RESTful API & Integration Console
          </h1>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Integrate SocialSentinel sentiment scoring, recommendation models, and social feeds directly into your mobile apps and services.
          </p>
        </div>
      </div>

      {/* Interactive Playground Section */}
      <ApiTester />

      {/* Code SDK Integration Samples */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Code2 size={20} color="#06B6D4" />
            <h3 style={{ fontSize: '1.1rem', color: '#FFF' }}>Client SDK Integration Code</h3>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveLang('js')}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: activeLang === 'js' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                color: activeLang === 'js' ? '#A78BFA' : 'var(--text-muted)',
                border: activeLang === 'js' ? '1px solid #8B5CF6' : '1px solid var(--border-glass)'
              }}
            >
              JavaScript
            </button>
            <button
              onClick={() => setActiveLang('python')}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                fontWeight: 600,
                background: activeLang === 'python' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                color: activeLang === 'python' ? '#06B6D4' : 'var(--text-muted)',
                border: activeLang === 'python' ? '1px solid #06B6D4' : '1px solid var(--border-glass)'
              }}
            >
              Python
            </button>

            <button onClick={handleCopy} className="btn-icon" style={{ width: 32, height: 32 }}>
              {copied ? <Check size={16} color="#34D399" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="code-block" style={{ color: '#E2E8F0' }}>
          <pre style={{ margin: 0 }}>{getCodeSnippet()}</pre>
        </div>
      </div>
    </div>
  );
}

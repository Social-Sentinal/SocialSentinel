import React, { useState } from 'react';
import { Terminal, Code2, Copy, Check } from 'lucide-react';
import ApiTester from '../components/ApiTester';

export default function ApiPortalPage() {
  const [activeLang, setActiveLang] = useState('js');
  const [copied, setCopied] = useState(false);

  const jsSnippet = `// Fetch social post intelligence
async function getSentimentPosts() {
  const res = await fetch('/api/v1/posts');
  const data = await res.json();
  console.log('Posts:', data.data);
}`;

  const pythonSnippet = `# Fetch sentiment prediction using Python
import requests

url = "https://socialsentinel.onrender.com/api/v1/sentiment/predict"
payload = {"text": "SocialSentinel AI delivers great results!"}
response = requests.post(url, data=payload)
print(response.json())`;

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
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Interactive Playground */}
      <ApiTester />

      {/* Code Snippet Card */}
      <div className="insta-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code2 size={18} color="#06B6D4" />
            <h3 style={{ fontSize: '0.98rem', color: '#FFF' }}>Client Integration SDK Snippets</h3>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveLang('js')}
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: activeLang === 'js' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                color: activeLang === 'js' ? '#A78BFA' : 'var(--text-muted)',
                border: activeLang === 'js' ? '1px solid #8B5CF6' : '1px solid var(--border-color)'
              }}
            >
              JavaScript
            </button>
            <button
              onClick={() => setActiveLang('python')}
              style={{
                padding: '3px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.75rem',
                fontWeight: 600,
                background: activeLang === 'python' ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                color: activeLang === 'python' ? '#06B6D4' : 'var(--text-muted)',
                border: activeLang === 'python' ? '1px solid #06B6D4' : '1px solid var(--border-color)'
              }}
            >
              Python
            </button>

            <button onClick={handleCopy} className="btn-icon" style={{ width: 28, height: 28 }}>
              {copied ? <Check size={14} color="#34D399" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        <div className="code-block">
          <pre style={{ margin: 0 }}>{getCodeSnippet()}</pre>
        </div>
      </div>
    </div>
  );
}

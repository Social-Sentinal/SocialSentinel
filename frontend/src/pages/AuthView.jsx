import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles } from 'lucide-react';

export function AuthView({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.auth(mode, form);
      onLogin(res.user);
    } catch (err) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.demoLogin();
      onLogin(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <img src="/logo.png" alt="SocialSentinel" style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)' }} />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>SocialSentinel</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Intelligent, sentiment-aware social intelligence network.
          </p>
        </div>

        {error && (
          <div style={{
            color: 'var(--status-negative)',
            background: 'var(--status-negative-bg)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12.5,
            fontWeight: 500
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Username</label>
              <input
                required
                className="input-field"
                placeholder="e.g. alex_dev"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                style={{ marginTop: 3 }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
              {mode === 'login' ? 'Email or Username' : 'Email Address'}
            </label>
            <input
              required
              className="input-field"
              placeholder={mode === 'login' ? 'alex@example.com' : 'alex@example.com'}
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ marginTop: 3 }}
            />
          </div>

          {mode === 'register' && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Display Name</label>
              <input
                className="input-field"
                placeholder="Alex Mercer"
                value={form.display_name}
                onChange={e => setForm({ ...form, display_name: e.target.value })}
                style={{ marginTop: 3 }}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={{ marginTop: 3 }}
            />
          </div>

          <button
            className="btn-primary"
            style={{ width: '100%', padding: '10px 16px', marginTop: 6 }}
            disabled={loading}
          >
            {loading ? 'Authenticating…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          <button
            onClick={handleDemo}
            className="btn-secondary"
            style={{ width: '100%', padding: '9px 14px', fontSize: 13 }}
            disabled={loading}
          >
            <Sparkles size={14} color="var(--primary)" />
            <span>Try Demo Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}

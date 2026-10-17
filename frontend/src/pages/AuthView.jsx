import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Sparkles } from 'lucide-react';

export function AuthView({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '', display_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
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
    <div className="auth-stage">
      <div className="auth-panel-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <img src="/logo.png" alt="SocialSentinel Logo" className="brand-logo-img" style={{ width: 46, height: 46 }} />
          <div className="brand-name" style={{ fontSize: 26 }}>SocialSentinel</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700 }}>
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Connect, discover, and share across intelligent topic communities.
          </p>
        </div>

        {error && (
          <div style={{ color: 'var(--status-negative)', background: 'var(--status-negative-bg)', border: '1px solid var(--status-negative-border)', padding: 10, borderRadius: 10, fontSize: 13, fontWeight: 600 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {mode === 'register' && (
            <input
              required
              placeholder="Username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
          )}

          <input
            required
            placeholder={mode === 'login' ? 'Email or Username' : 'Email Address'}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          {mode === 'register' && (
            <input
              placeholder="Display Name"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
          )}

          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          <button className="btn-primary" style={{ justifyContent: 'center', padding: 12, marginTop: 4, width: '100%' }} disabled={loading}>
            {loading ? 'Authenticating…' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 13 }}
          >
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={handleDemo}
            className="btn-secondary"
            style={{ justifyContent: 'center', padding: 11, fontWeight: 700, width: '100%', borderColor: 'var(--border)' }}
            disabled={loading}
          >
            <Sparkles size={16} color="var(--primary)" /> Try Demo Account (Sentinel Explorer)
          </button>
        </div>
      </div>
    </div>
  );
}

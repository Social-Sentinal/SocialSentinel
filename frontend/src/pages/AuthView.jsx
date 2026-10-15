import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import MediaImage from '../components/MediaImage';
import { Heart, MessageCircle, Share2, Sparkles, X, Send, Compass, Search, Users, Brain, Shield, BarChart3, TrendingUp } from 'lucide-react';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <div className="brand-shield-icon">
            <Shield size={22} />
          </div>
          <div className="brand-name" style={{ fontSize: 24 }}>SocialSentinel</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 20 }}>
            {mode === 'login' ? 'Welcome Back' : 'Join SocialSentinel'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
            AI-driven social network with hybrid recommendations and sentiment awareness.
          </p>
        </div>

        {error && (
          <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: 8, borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
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
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
          )}

          <input
            required
            placeholder={mode === 'login' ? 'Email or Username' : 'Email Address'}
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          {mode === 'register' && (
            <input
              placeholder="Display Name"
              value={form.display_name}
              onChange={e => setForm({ ...form, display_name: e.target.value })}
              style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
            />
          )}

          <input
            type="password"
            required
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            style={{ padding: 10, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', outline: 'none' }}
          />

          <button className="btn-primary" style={{ justifyContent: 'center', padding: 12, marginTop: 4 }} disabled={loading}>
            {loading ? 'Authenticating…' : mode === 'login' ? 'Log In' : 'Create Account'}
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
            {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Log in'}
          </button>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Quick Assessment & Interview Review</span>
          <button
            onClick={handleDemo}
            className="btn-secondary"
            style={{ justifyContent: 'center', padding: 10, fontWeight: 700 }}
            disabled={loading}
          >
            🚀 Try Demo Account (Sentinel Explorer)
          </button>
        </div>
      </div>
    </div>
  );
}

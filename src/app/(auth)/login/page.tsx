'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Shield, Sparkles, LogIn, ArrowRight } from 'lucide-react';
import { signInAction, demoSignInAction } from '@/modules/auth/actions';

export default function LoginPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleDemoLogin = () => {
    setErrorMsg('');
    startTransition(async () => {
      const res = await demoSignInAction();
      if (res?.error) setErrorMsg(res.error);
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await signInAction(null, formData);
      if (res?.error) setErrorMsg(res.error);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)] relative overflow-hidden">
      {/* Background Glow Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl relative z-10 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-600/25 mb-1">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[var(--text-primary)]">
            Welcome to Social<span className="text-gradient">Sentinel</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
            AI-powered social intelligence network with explainable recommendations and healthy-feed controls.
          </p>
        </div>

        {/* 1-Click Demo Login Highlight */}
        <button
          onClick={handleDemoLogin}
          disabled={isPending}
          className="w-full py-3.5 px-4 rounded-xl font-heading font-semibold text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span>{isPending ? 'Authenticating Explorer...' : '🚀 Instant Demo Access (Sentinel Explorer)'}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" />
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            or sign in with email
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {errorMsg}
          </div>
        )}

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Email or Username</label>
            <input
              type="text"
              name="email"
              required
              placeholder="demo@socialsentinel.io"
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Password</label>
            </div>
            <input
              type="password"
              name="password"
              required
              placeholder="••••••••"
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 px-4 rounded-xl font-heading font-semibold text-sm bg-[var(--bg-elevated)] hover:bg-indigo-600 hover:text-white border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            <span>{isPending ? 'Verifying...' : 'Sign In'}</span>
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--text-muted)]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-indigo-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Shield, UserPlus } from 'lucide-react';
import { signUpAction } from '@/modules/auth/actions';

export default function RegisterPage() {
  const [errorMsg, setErrorMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await signUpAction(null, formData);
      if (res?.error) setErrorMsg(res.error);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-app)] relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl relative z-10 flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-600/25 mb-1">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-heading font-bold text-2xl text-[var(--text-primary)]">
            Create an Account
          </h1>
          <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
            Join SocialSentinel to experience explainable recommendations and healthy social discussions.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Display Name</label>
            <input
              type="text"
              name="displayName"
              required
              placeholder="Dr. Elena Vasquez"
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Username</label>
            <input
              type="text"
              name="username"
              required
              placeholder="elena_ai"
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="elena@example.com"
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Password</label>
            <input
              type="password"
              name="password"
              required
              placeholder="At least 8 characters"
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 px-4 rounded-xl font-heading font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-indigo-600/25 disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            <span>{isPending ? 'Creating Account...' : 'Sign Up'}</span>
          </button>
        </form>

        <p className="text-center text-xs text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-indigo-400 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

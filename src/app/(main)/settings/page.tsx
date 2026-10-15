'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Sliders, Sparkles, User, Shield, Check, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Profile, UserPreference } from '@/types/database.types';

const AVAILABLE_TOPICS = [
  'AI & Tech',
  'Cybersecurity & Privacy',
  'Web Engineering',
  'Creative Tech & Design',
  'Digital Wellbeing',
];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<UserPreference | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [explorationRate, setExplorationRate] = useState(0.15);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('dark');
  const [mutedUsers, setMutedUsers] = useState<Profile[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (p) {
        setProfile(p);
        setDisplayName(p.display_name);
        setBio(p.bio);
        setAvatarUrl(p.avatar_url);
      }

      // Fetch preferences
      const { data: pref } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).single();
      if (pref) {
        setPreferences(pref);
        setExplorationRate(pref.exploration_rate);
        setSelectedTopics(pref.preferred_topics || []);
        setTheme(pref.theme);
      }

      // Fetch muted users
      const { data: mutes } = await supabase
        .from('muted_users')
        .select('muted_id, profiles!muted_users_muted_id_fkey(*)')
        .eq('muter_id', user.id);

      if (mutes) {
        setMutedUsers(mutes.map((m: any) => m.profiles).filter(Boolean));
      }
    }
    loadData();
  }, []);

  const handleToggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleUnmute = async (userId: string) => {
    if (!profile) return;
    await supabase.from('muted_users').delete().eq('muter_id', profile.id).eq('muted_id', userId);
    setMutedUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    startTransition(async () => {
      // 1. Update Profile
      await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          bio: bio.trim(),
          avatar_url: avatarUrl.trim(),
        })
        .eq('id', profile.id);

      // 2. Update Preferences
      await supabase
        .from('user_preferences')
        .update({
          preferred_topics: selectedTopics,
          exploration_rate: explorationRate,
          theme: theme,
        })
        .eq('user_id', profile.id);

      // Update document theme if changed
      if (theme !== 'system') {
        document.documentElement.setAttribute('data-theme', theme);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border)] p-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <span>Healthy Feed & Account Settings</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Take granular control over algorithmic recommendations, topic diversity, and personal profile data.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <form onSubmit={handleSave} className="p-4 sm:p-6 flex flex-col gap-8 max-w-3xl mx-auto w-full">
        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Preferences and profile updated successfully!</span>
          </div>
        )}

        {/* Section 1: Algorithmic Serendipity & Diversity Controls */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Healthy Feed & Diversity Controls</span>
          </div>

          {/* Exploration Slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-bold text-[var(--text-primary)]">
                  Serendipity & Novelty Rate ({Math.round(explorationRate * 100)}%)
                </label>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Controls how frequently the recommendation engine surfaces unexpected topics outside your engagement bubble.
                </p>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-600/10 text-indigo-400 border border-indigo-500/20">
                {explorationRate < 0.2 ? 'Focused' : explorationRate < 0.5 ? 'Balanced' : 'High Discovery'}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={explorationRate}
              onChange={(e) => setExplorationRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-[var(--text-muted)]">
              <span>0% (Familiar Only)</span>
              <span>50% (Standard Balance)</span>
              <span>100% (Maximum Serendipity)</span>
            </div>
          </div>

          {/* Preferred Topics */}
          <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border)]">
            <label className="text-sm font-bold text-[var(--text-primary)]">
              Core Topic Affinities:
            </label>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              Select topics you wish to prioritize across your personalized feeds:
            </p>

            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handleToggleTopic(topic)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {isSelected ? <Check className="w-3 h-3 inline mr-1" /> : null}
                    #{topic}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 2: Profile Settings */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] font-bold text-xs uppercase tracking-wider">
            <User className="w-4 h-4 text-indigo-400" />
            <span>Public Profile Information</span>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Biography</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell the network about your interests and focus areas..."
                className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Avatar Image URL</label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="px-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-sm text-[var(--text-primary)] outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Safety & Muted Creators */}
        {mutedUsers.length > 0 && (
          <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-4">
            <h2 className="font-heading font-bold text-sm text-[var(--text-primary)]">
              Muted Creators ({mutedUsers.length})
            </h2>
            <div className="flex flex-col gap-2">
              {mutedUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)]">
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">{u.display_name}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">@{u.username}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnmute(u.id)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-indigo-400 hover:bg-indigo-600/10"
                  >
                    Unmute
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          type="submit"
          disabled={isPending}
          className="py-3.5 px-6 rounded-2xl font-heading font-semibold text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>{isPending ? 'Saving Preferences...' : 'Save All Preferences'}</span>
        </button>
      </form>
    </div>
  );
}

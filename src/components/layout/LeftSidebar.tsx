'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Compass,
  MessageSquare,
  Users,
  Brain,
  BarChart3,
  User,
  Plus,
  LogOut,
  Sun,
  Moon,
  Shield,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { signOutAction } from '@/modules/auth/actions';
import { Profile } from '@/types/database.types';
import { getAvatarFallbackUrl } from '@/lib/utils';

interface LeftSidebarProps {
  currentUser: Profile | null;
  unreadCount?: number;
  onOpenCreateModal?: () => void;
}

const NAV_ITEMS = [
  { href: '/feed', label: 'Home Feed', icon: Home },
  { href: '/explore', label: 'Explore', icon: Compass },
  { href: '/messages', label: 'Messages', icon: MessageSquare, badgeKey: 'messages' },
  { href: '/communities', label: 'Communities', icon: Users },
  { href: '/ai-studio', label: 'AI Studio', icon: Brain },
  { href: '/community-pulse', label: 'Community Pulse', icon: BarChart3 },
  { href: '/settings', label: 'Healthy Feed', icon: Sliders },
];

export function LeftSidebar({ currentUser, unreadCount = 0, onOpenCreateModal }: LeftSidebarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <aside className="w-64 flex-shrink-0 h-screen sticky top-0 flex flex-col justify-between p-4 border-r border-[var(--border)] bg-[var(--bg-card)] select-none">
      {/* Top Branding & Nav */}
      <div className="flex flex-col gap-6">
        {/* Brand Header */}
        <Link href="/feed" className="flex items-center gap-3 px-2 py-1 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-heading font-bold text-lg leading-tight tracking-tight text-[var(--text-primary)]">
              Social<span className="text-gradient">Sentinel</span>
            </h1>
            <p className="text-[11px] font-medium text-[var(--text-muted)] tracking-wider uppercase">
              AI Social Network
            </p>
          </div>
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/feed' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-500 font-semibold shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badgeKey === 'messages' && unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Profile Link */}
          {currentUser && (
            <Link
              href={`/${currentUser.username}`}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                pathname === `/${currentUser.username}`
                  ? 'bg-indigo-600/10 text-indigo-500 font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <User className="w-5 h-5 text-[var(--text-muted)]" />
              <span>Profile</span>
            </Link>
          )}
        </nav>

        {/* Compose Button */}
        {onOpenCreateModal && (
          <button
            onClick={onOpenCreateModal}
            className="w-full mt-2 py-3 px-4 rounded-xl font-heading font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>
        )}
      </div>

      {/* Bottom User Badge & Controls */}
      <div className="flex flex-col gap-3 pt-4 border-t border-[var(--border)]">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
            <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)]">Toggle</span>
        </button>

        {/* User Card */}
        {currentUser && (
          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-elevated)]">
            <Link href={`/${currentUser.username}`} className="flex items-center gap-2.5 min-w-0">
              <img
                src={currentUser.avatar_url || getAvatarFallbackUrl(currentUser.username)}
                alt={currentUser.display_name}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {currentUser.display_name}
                </p>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  @{currentUser.username}
                </p>
              </div>
            </Link>

            <form action={signOutAction}>
              <button
                type="submit"
                title="Sign Out"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}

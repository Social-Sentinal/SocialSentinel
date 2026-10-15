'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserCheck, UserPlus, MoreHorizontal, ShieldAlert, VolumeX, Edit3 } from 'lucide-react';
import { toggleFollowAction, toggleBlockAction, toggleMuteAction } from '@/modules/social-graph/actions';

interface ProfileHeaderActionsProps {
  profileId: string;
  isMe: boolean;
  initialFollowing: boolean;
}

export function ProfileHeaderActions({
  profileId,
  isMe,
  initialFollowing,
}: ProfileHeaderActionsProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [menuOpen, setMenuOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const handleFollow = async () => {
    const nextState = !following;
    setFollowing(nextState);
    const res = await toggleFollowAction(profileId);
    if (res?.error) setFollowing(!nextState);
  };

  const handleMute = async () => {
    setMenuOpen(false);
    const res = await toggleMuteAction(profileId);
    if (res?.muted) setMuted(true);
  };

  const handleBlock = async () => {
    if (!confirm('Are you sure you want to block this user? They will not be able to interact with your content.')) return;
    setMenuOpen(false);
    const res = await toggleBlockAction(profileId);
    if (res?.blocked) setBlocked(true);
  };

  if (isMe) {
    return (
      <Link
        href="/settings"
        className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:bg-indigo-600 hover:text-white flex items-center gap-1.5 transition-colors"
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Edit Profile</span>
      </Link>
    );
  }

  if (blocked) {
    return (
      <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
        Blocked
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 relative">
      <button
        onClick={handleFollow}
        className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
          following
            ? 'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:text-rose-400'
            : 'bg-indigo-600 hover:bg-indigo-500 text-white'
        }`}
      >
        {following ? (
          <>
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Following</span>
          </>
        ) : (
          <>
            <UserPlus className="w-3.5 h-3.5" />
            <span>Follow</span>
          </>
        )}
      </button>

      {/* Overflow Menu */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-11 w-40 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-lg py-1 z-20 flex flex-col text-xs">
          <button
            onClick={handleMute}
            className="flex items-center gap-2 px-3.5 py-2 text-left text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>{muted ? 'Muted' : 'Mute Creator'}</span>
          </button>
          <button
            onClick={handleBlock}
            className="flex items-center gap-2 px-3.5 py-2 text-left text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Block User</span>
          </button>
        </div>
      )}
    </div>
  );
}

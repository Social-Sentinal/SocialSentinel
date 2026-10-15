import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { LeftSidebar } from '@/components/layout/LeftSidebar';
import { RightSidebarRail } from '@/components/layout/RightSidebarRail';
import { Community, Profile } from '@/types/database.types';

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let unreadCount = 0;
  let communities: Community[] = [];
  let creators: Profile[] = [];
  let explorationRate = 0.15;

  if (user) {
    // 1. Fetch user profile
    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = p as Profile | null;

    // 2. Fetch unread notification count
    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    unreadCount = count || 0;

    // 3. Fetch user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('exploration_rate')
      .eq('user_id', user.id)
      .single();
    if (prefs) explorationRate = (prefs as any).exploration_rate;
  }

  // 4. Fetch suggested communities
  const { data: comms } = await supabase
    .from('communities')
    .select('*')
    .order('members_count', { ascending: false })
    .limit(5);
  communities = (comms as Community[]) || [];

  // 5. Fetch suggested creators (excluding current user)
  const creatorQuery = supabase
    .from('profiles')
    .select('*')
    .order('followers_count', { ascending: false })
    .limit(6);
  if (user) {
    creatorQuery.neq('id', user.id);
  }
  const { data: cr } = await creatorQuery;
  creators = (cr as Profile[]) || [];

  return (
    <div className="min-h-screen flex justify-center bg-[var(--bg-app)]">
      <div className="w-full max-w-7xl flex">
        {/* Left Navigation Sidebar */}
        <LeftSidebar currentUser={profile} unreadCount={unreadCount} />

        {/* Central Feed / Page Content Column */}
        <main className="flex-1 min-w-0 border-r border-[var(--border)] min-h-screen">
          {children}
        </main>

        {/* Right Sidebar Rail */}
        <RightSidebarRail
          communities={communities}
          creators={creators}
          userExplorationRate={explorationRate}
        />
      </div>
    </div>
  );
}

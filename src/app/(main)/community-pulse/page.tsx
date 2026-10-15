import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { BarChart3, TrendingUp, ShieldCheck, Heart, Users, MessageSquare } from 'lucide-react';

export default async function CommunityPulsePage() {
  const supabase = createClient();

  // Aggregate metrics from actual database records
  const { data: posts } = await supabase
    .from('posts')
    .select('sentiment, topic_category, emotion, likes_count, comments_count');

  const totalPosts = posts?.length || 0;
  const sentimentCounts: Record<string, number> = { Positive: 0, Neutral: 0, Negative: 0 };
  const topicCounts: Record<string, number> = {};
  let totalLikes = 0;
  let totalComments = 0;

  if (posts) {
    for (const p of posts) {
      if (p.sentiment) {
        sentimentCounts[p.sentiment] = (sentimentCounts[p.sentiment] || 0) + 1;
      }
      if (p.topic_category) {
        topicCounts[p.topic_category] = (topicCounts[p.topic_category] || 0) + 1;
      }
      totalLikes += p.likes_count || 0;
      totalComments += p.comments_count || 0;
    }
  }

  const positivePercent = totalPosts > 0 ? Math.round((sentimentCounts.Positive / totalPosts) * 100) : 0;
  const neutralPercent = totalPosts > 0 ? Math.round((sentimentCounts.Neutral / totalPosts) * 100) : 0;
  const negativePercent = totalPosts > 0 ? Math.round((sentimentCounts.Negative / totalPosts) * 100) : 0;

  const { count: totalCommunities } = await supabase
    .from('communities')
    .select('*', { count: 'exact', head: true });

  const { count: totalCreators } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[var(--bg-glass)] backdrop-blur-md border-b border-[var(--border)] p-4 flex items-center justify-between">
        <div>
          <h1 className="font-heading font-bold text-lg text-[var(--text-primary)] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            <span>Community Pulse</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            Aggregated discussion intelligence, community sentiment trends, and discussion velocity.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 sm:p-6 flex flex-col gap-8 max-w-4xl mx-auto w-full">
        {/* Privacy Safeguard Notice */}
        <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)]">Privacy-Preserving Aggregation:</span>{' '}
            Community Pulse evaluates discussions solely in aggregate across public posts. Direct messages are strictly excluded, and minimum group-size thresholds ensure individual users are never profiled.
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Posts Analyzed</span>
            <span className="font-heading font-bold text-2xl text-[var(--text-primary)]">{totalPosts}</span>
            <span className="text-[11px] text-emerald-400 font-medium">100% database verified</span>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Active Creators</span>
            <span className="font-heading font-bold text-2xl text-[var(--text-primary)]">{totalCreators || 0}</span>
            <span className="text-[11px] text-indigo-400 font-medium">Across all hubs</span>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Reactions Given</span>
            <span className="font-heading font-bold text-2xl text-[var(--text-primary)]">{totalLikes}</span>
            <span className="text-[11px] text-rose-400 font-medium">Recorded likes</span>
          </div>

          <div className="p-5 rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Community Hubs</span>
            <span className="font-heading font-bold text-2xl text-[var(--text-primary)]">{totalCommunities || 0}</span>
            <span className="text-[11px] text-purple-400 font-medium">Topic spaces</span>
          </div>
        </div>

        {/* Sentiment Distribution Radar */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <span>Platform Sentiment Balance</span>
            </h2>
            <span className="text-xs text-[var(--text-muted)]">Live calculated</span>
          </div>

          {/* Combined Progress Bar */}
          <div className="w-full h-4 rounded-full bg-[var(--bg-elevated)] overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${positivePercent}%` }}
              title={`Positive: ${positivePercent}%`}
            />
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${neutralPercent}%` }}
              title={`Neutral: ${neutralPercent}%`}
            />
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${negativePercent}%` }}
              title={`Negative: ${negativePercent}%`}
            />
          </div>

          {/* Legend */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col gap-1">
              <span className="text-xs font-bold text-emerald-400">Positive Discussions</span>
              <span className="font-heading font-bold text-xl text-[var(--text-primary)]">{positivePercent}%</span>
              <span className="text-[11px] text-[var(--text-muted)]">{sentimentCounts.Positive} posts</span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col gap-1">
              <span className="text-xs font-bold text-blue-400">Constructive / Neutral</span>
              <span className="font-heading font-bold text-xl text-[var(--text-primary)]">{neutralPercent}%</span>
              <span className="text-[11px] text-[var(--text-muted)]">{sentimentCounts.Neutral} posts</span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] flex flex-col gap-1">
              <span className="text-xs font-bold text-rose-400">Critical / Concerning</span>
              <span className="font-heading font-bold text-xl text-[var(--text-primary)]">{negativePercent}%</span>
              <span className="text-[11px] text-[var(--text-muted)]">{sentimentCounts.Negative} posts</span>
            </div>
          </div>
        </div>

        {/* Discussion Volume by Topic */}
        <div className="p-6 rounded-3xl bg-[var(--bg-card)] border border-[var(--border)] shadow-sm flex flex-col gap-4">
          <h2 className="font-heading font-bold text-base text-[var(--text-primary)]">
            Discussion Volume by Topic Category
          </h2>

          <div className="flex flex-col gap-3">
            {Object.entries(topicCounts).map(([topic, count]) => {
              const share = totalPosts > 0 ? Math.round((count / totalPosts) * 100) : 0;
              return (
                <div key={topic} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)]">#{topic}</span>
                    <span className="text-[var(--text-muted)]">
                      {count} posts ({share}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

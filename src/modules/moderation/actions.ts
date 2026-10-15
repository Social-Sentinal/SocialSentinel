'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { ReportCreateSchema } from '@/lib/validations/post';
import { ModerationActionType } from '@/types/database.types';
import { revalidatePath } from 'next/cache';

export async function submitReportAction(
  targetType: 'post' | 'comment' | 'profile',
  targetId: string,
  reason: string,
  details?: string
) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required to submit a report' };

  const parsed = ReportCreateSchema.safeParse({
    targetType,
    targetId,
    reason,
    details,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid report submission' };
  }

  const payload: any = {
    reporter_id: user.id,
    target_type: targetType,
    reason: parsed.data.reason,
    details: parsed.data.details || '',
    status: 'pending',
  };

  if (targetType === 'post') payload.post_id = targetId;
  if (targetType === 'comment') payload.comment_id = targetId;
  if (targetType === 'profile') payload.profile_id = targetId;

  const { error } = await supabase.from('reports').insert(payload);
  if (error) return { error: error.message };

  return { success: true };
}

export async function resolveReportAction(
  reportId: string,
  actionType: ModerationActionType,
  notes: string = ''
) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  // Verify moderator role
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_moderator')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_moderator) {
    return { error: 'Unauthorized: Moderator privileges required' };
  }

  // Fetch report details
  const { data: report } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (!report) return { error: 'Report not found' };

  const targetId = report.post_id || report.comment_id || report.profile_id || reportId;

  // Execute moderation effect
  if (actionType === 'remove_content') {
    if (report.post_id) {
      await supabase.from('posts').delete().eq('id', report.post_id);
    } else if (report.comment_id) {
      await supabase.from('comments').delete().eq('id', report.comment_id);
    }
  }

  // Record audit trail
  await supabase.from('moderation_actions').insert({
    moderator_id: user.id,
    report_id: reportId,
    action_type: actionType,
    target_id: targetId,
    notes,
  });

  // Update report status
  await supabase
    .from('reports')
    .update({
      status: actionType === 'dismiss' ? 'dismissed' : 'action_taken',
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
    })
    .eq('id', reportId);

  revalidatePath('/feed');
  return { success: true };
}

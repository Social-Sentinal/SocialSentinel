'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { revalidatePath } from 'next/cache';

export async function toggleFollowAction(targetUserId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };
  if (user.id === targetUserId) return { error: 'You cannot follow yourself' };

  const { data: existingFollow } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  if (existingFollow) {
    await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    revalidatePath('/feed');
    return { following: false };
  } else {
    await supabase.from('follows').insert({
      follower_id: user.id,
      following_id: targetUserId,
    });

    await supabase.from('notifications').insert({
      user_id: targetUserId,
      actor_id: user.id,
      type: 'follow',
    });

    revalidatePath('/feed');
    return { following: true };
  }
}

export async function toggleBlockAction(targetUserId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };
  if (user.id === targetUserId) return { error: 'You cannot block yourself' };

  const { data: existingBlock } = await supabase
    .from('blocked_users')
    .select('blocker_id')
    .eq('blocker_id', user.id)
    .eq('blocked_id', targetUserId)
    .maybeSingle();

  if (existingBlock) {
    await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', targetUserId);

    revalidatePath('/feed');
    return { blocked: false };
  } else {
    // When blocking, remove any mutual follow connections
    await supabase
      .from('follows')
      .delete()
      .or(`and(follower_id.eq.${user.id},following_id.eq.${targetUserId}),and(follower_id.eq.${targetUserId},following_id.eq.${user.id})`);

    await supabase.from('blocked_users').insert({
      blocker_id: user.id,
      blocked_id: targetUserId,
    });

    revalidatePath('/feed');
    return { blocked: true };
  }
}

export async function toggleMuteAction(targetUserId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };
  if (user.id === targetUserId) return { error: 'You cannot mute yourself' };

  const { data: existingMute } = await supabase
    .from('muted_users')
    .select('muter_id')
    .eq('muter_id', user.id)
    .eq('muted_id', targetUserId)
    .maybeSingle();

  if (existingMute) {
    await supabase
      .from('muted_users')
      .delete()
      .eq('muter_id', user.id)
      .eq('muted_id', targetUserId);

    revalidatePath('/feed');
    return { muted: false };
  } else {
    await supabase.from('muted_users').insert({
      muter_id: user.id,
      muted_id: targetUserId,
    });

    revalidatePath('/feed');
    return { muted: true };
  }
}

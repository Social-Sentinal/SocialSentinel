'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { revalidatePath } from 'next/cache';

export async function toggleJoinCommunityAction(communityId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data: existingMember } = await supabase
    .from('community_members')
    .select('user_id')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMember) {
    await supabase
      .from('community_members')
      .delete()
      .eq('community_id', communityId)
      .eq('user_id', user.id);

    revalidatePath('/communities');
    return { joined: false };
  } else {
    await supabase.from('community_members').insert({
      community_id: communityId,
      user_id: user.id,
      role: 'member',
    });

    revalidatePath('/communities');
    return { joined: true };
  }
}

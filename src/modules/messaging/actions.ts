'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { revalidatePath } from 'next/cache';

export async function getOrCreateConversationAction(recipientId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };
  if (user.id === recipientId) return { error: 'Cannot start a conversation with yourself' };

  // Check if mutual 1-to-1 conversation exists
  const { data: myConvs } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('user_id', user.id);

  if (myConvs && myConvs.length > 0) {
    const myConvIds = myConvs.map((c) => c.conversation_id);
    const { data: commonConv } = await supabase
      .from('conversation_members')
      .select('conversation_id')
      .eq('user_id', recipientId)
      .in('conversation_id', myConvIds)
      .limit(1)
      .maybeSingle();

    if (commonConv) {
      return { conversationId: commonConv.conversation_id };
    }
  }

  // Create new conversation
  const { data: newConv, error: convError } = await supabase
    .from('conversations')
    .insert({ is_group: false })
    .select('id')
    .single();

  if (convError || !newConv) {
    return { error: convError?.message || 'Failed to create conversation' };
  }

  // Add both members
  await supabase.from('conversation_members').insert([
    { conversation_id: newConv.id, user_id: user.id },
    { conversation_id: newConv.id, user_id: recipientId },
  ]);

  return { conversationId: newConv.id };
}

export async function sendMessageAction(
  conversationId: string,
  body: string,
  sharedPostId?: string | null
) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };
  if (!body.trim() && !sharedPostId) return { error: 'Message cannot be empty' };

  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      body: body.trim() || 'Shared a post to conversation',
      shared_post_id: sharedPostId || null,
    })
    .select('*, profiles(*)')
    .single();

  if (error) return { error: error.message };

  // Notify other members
  const { data: members } = await supabase
    .from('conversation_members')
    .select('user_id')
    .eq('conversation_id', conversationId);

  if (members) {
    for (const m of members) {
      if (m.user_id !== user.id) {
        await supabase.from('notifications').insert({
          user_id: m.user_id,
          actor_id: user.id,
          type: 'message',
        });
      }
    }
  }

  revalidatePath('/messages');
  return { success: true, message };
}

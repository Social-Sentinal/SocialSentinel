'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { CommentCreateSchema } from '@/lib/validations/post';
import { predictSentiment } from '@/modules/ai/sentiment';
import { revalidatePath } from 'next/cache';

export async function createCommentAction(formData: FormData) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required to post a comment' };

  const raw = {
    postId: formData.get('postId') as string,
    parentCommentId: (formData.get('parentCommentId') as string) || null,
    body: formData.get('body') as string,
  };

  const parsed = CommentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid comment' };
  }

  const sentimentRes = predictSentiment(parsed.data.body);

  const { data: newComment, error } = await supabase
    .from('comments')
    .insert({
      post_id: parsed.data.postId,
      author_id: user.id,
      parent_comment_id: parsed.data.parentCommentId || null,
      body: parsed.data.body,
      sentiment: sentimentRes.sentiment,
      sentiment_confidence: sentimentRes.confidence,
    })
    .select('*, profiles(*)')
    .single();

  if (error) return { error: error.message };

  // Notify parent comment author or post author
  if (parsed.data.parentCommentId) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', parsed.data.parentCommentId)
      .single();

    if (parentComment && parentComment.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: parentComment.author_id,
        actor_id: user.id,
        type: 'reply',
        post_id: parsed.data.postId,
        comment_id: newComment.id,
      });
    }
  } else {
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', parsed.data.postId)
      .single();

    if (post && post.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        actor_id: user.id,
        type: 'comment',
        post_id: parsed.data.postId,
        comment_id: newComment.id,
      });
    }
  }

  revalidatePath('/feed');
  return { success: true, comment: newComment };
}

export async function deleteCommentAction(commentId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) return { error: error.message };

  revalidatePath('/feed');
  return { success: true };
}

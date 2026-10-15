'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { PostCreateSchema } from '@/lib/validations/post';
import { predictSentiment } from '@/modules/ai/sentiment';
import { detectEmotion } from '@/modules/ai/emotion';
import { revalidatePath } from 'next/cache';

export async function createPostAction(formData: FormData) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required to publish a post.' };
  }

  const raw = {
    caption: formData.get('caption') as string,
    topicCategory: (formData.get('topicCategory') as string) || 'General',
    communityId: (formData.get('communityId') as string) || null,
    mediaUrl: (formData.get('mediaUrl') as string) || null,
  };

  const parsed = PostCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message || 'Invalid post content' };
  }

  // Native AI Inference (100% offline, zero API latency)
  const sentimentRes = predictSentiment(parsed.data.caption);
  const emotionRes = detectEmotion(parsed.data.caption);

  const { data: newPost, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      caption: parsed.data.caption,
      topic_category: parsed.data.topicCategory,
      community_id: parsed.data.communityId || null,
      sentiment: sentimentRes.sentiment,
      sentiment_confidence: sentimentRes.confidence,
      emotion: emotionRes.emotion,
      emotion_confidence: emotionRes.confidence,
    })
    .select('*, profiles(*)')
    .single();

  if (error) {
    return { error: error.message };
  }

  // Insert media attachment if provided
  if (parsed.data.mediaUrl && newPost) {
    await supabase.from('post_media').insert({
      post_id: newPost.id,
      media_url: parsed.data.mediaUrl,
    });
  }

  revalidatePath('/feed');
  return { success: true, post: newPost };
}

export async function deletePostAction(postId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) return { error: error.message };

  revalidatePath('/feed');
  return { success: true };
}

export async function editPostAction(postId: string, newCaption: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const sentimentRes = predictSentiment(newCaption);
  const emotionRes = detectEmotion(newCaption);

  const { error } = await supabase
    .from('posts')
    .update({
      caption: newCaption,
      sentiment: sentimentRes.sentiment,
      sentiment_confidence: sentimentRes.confidence,
      emotion: emotionRes.emotion,
      emotion_confidence: emotionRes.confidence,
    })
    .eq('id', postId)
    .eq('author_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/feed');
  return { success: true };
}

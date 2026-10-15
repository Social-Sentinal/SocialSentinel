'use server';

import { createActionClient } from '@/lib/supabase/actions';
import { revalidatePath } from 'next/cache';

export async function toggleLikeAction(postId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  // Check if like exists
  const { data: existingLike } = await supabase
    .from('likes')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existingLike) {
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    revalidatePath('/feed');
    return { liked: false };
  } else {
    await supabase.from('likes').insert({
      user_id: user.id,
      post_id: postId,
    });

    // Record recommendation telemetry event
    await supabase.from('recommendation_events').insert({
      user_id: user.id,
      post_id: postId,
      event_type: 'click',
      duration_seconds: 5.0,
    });

    // Send notification to post author
    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (post && post.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        actor_id: user.id,
        type: 'like',
        post_id: postId,
      });
    }

    revalidatePath('/feed');
    return { liked: true };
  }
}

export async function toggleBookmarkAction(postId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data: existingBookmark } = await supabase
    .from('bookmarks')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existingBookmark) {
    await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    revalidatePath('/feed');
    return { bookmarked: false };
  } else {
    await supabase.from('bookmarks').insert({
      user_id: user.id,
      post_id: postId,
    });

    revalidatePath('/feed');
    return { bookmarked: true };
  }
}

export async function toggleRepostAction(postId: string) {
  const supabase = createActionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'Authentication required' };

  const { data: existingRepost } = await supabase
    .from('reposts')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existingRepost) {
    await supabase
      .from('reposts')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    revalidatePath('/feed');
    return { reposted: false };
  } else {
    await supabase.from('reposts').insert({
      user_id: user.id,
      post_id: postId,
    });

    const { data: post } = await supabase
      .from('posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (post && post.author_id !== user.id) {
      await supabase.from('notifications').insert({
        user_id: post.author_id,
        actor_id: user.id,
        type: 'repost',
        post_id: postId,
      });
    }

    revalidatePath('/feed');
    return { reposted: true };
  }
}

-- ============================================================================
-- SocialSentinel PostgreSQL Schema & Row Level Security Migration
-- Version: 20261015000000_init_socialsentinel.sql
-- Description: Complete production schema with UUID keys, RLS, triggers & indexes
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. Helper Functions & Triggers
-- ============================================================================

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Core Tables
-- ============================================================================

-- PROFILES: Public user identity referencing auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  bio TEXT DEFAULT '' NOT NULL,
  avatar_url TEXT DEFAULT '',
  website TEXT DEFAULT '',
  is_demo BOOLEAN DEFAULT false NOT NULL,
  is_moderator BOOLEAN DEFAULT false NOT NULL,
  followers_count INTEGER DEFAULT 0 NOT NULL CHECK (followers_count >= 0),
  following_count INTEGER DEFAULT 0 NOT NULL CHECK (following_count >= 0),
  posts_count INTEGER DEFAULT 0 NOT NULL CHECK (posts_count >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT username_format CHECK (username ~* '^[a-z0-9_]{3,40}$')
);

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- USER PREFERENCES: User-controlled algorithmic & privacy settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  preferred_topics TEXT[] DEFAULT ARRAY['AI & Tech', 'Web Engineering', 'Cybersecurity & Privacy'] NOT NULL,
  exploration_rate REAL DEFAULT 0.15 NOT NULL CHECK (exploration_rate >= 0.0 AND exploration_rate <= 1.0),
  theme TEXT DEFAULT 'dark' NOT NULL CHECK (theme IN ('light', 'dark', 'system')),
  is_private BOOLEAN DEFAULT false NOT NULL,
  filter_sensitive BOOLEAN DEFAULT false NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Automatically provision profile and preferences when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
  v_display_name TEXT;
BEGIN
  -- Derive username from metadata or email prefix
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    LOWER(SPLIT_PART(NEW.email, '@', 1))
  );
  -- Clean up username
  v_username := REGEXP_REPLACE(v_username, '[^a-z0-9_]', '', 'g');
  IF LENGTH(v_username) < 3 THEN
    v_username := v_username || '_' || SUBSTRING(NEW.id::text, 1, 4);
  END IF;

  v_display_name := COALESCE(
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    INITCAP(v_username)
  );

  INSERT INTO public.profiles (id, username, display_name, avatar_url, is_demo)
  VALUES (
    NEW.id,
    v_username,
    v_display_name,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_demo')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- COMMUNITIES: Topic interest spaces
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '' NOT NULL,
  icon TEXT DEFAULT '🌐' NOT NULL,
  banner_gradient TEXT DEFAULT 'linear-gradient(135deg, #6366f1, #8b5cf6)' NOT NULL,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  members_count INTEGER DEFAULT 0 NOT NULL CHECK (members_count >= 0),
  posts_count INTEGER DEFAULT 0 NOT NULL CHECK (posts_count >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- COMMUNITY MEMBERS: Membership junction
CREATE TABLE IF NOT EXISTS public.community_members (
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (community_id, user_id)
);

-- POSTS: Social network posts
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  community_id UUID REFERENCES public.communities(id) ON DELETE SET NULL,
  caption TEXT NOT NULL CHECK (char_length(caption) > 0 AND char_length(caption) <= 5000),
  topic_category TEXT DEFAULT 'General' NOT NULL,
  sentiment TEXT DEFAULT 'Neutral' NOT NULL CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
  sentiment_confidence REAL DEFAULT 0.0 NOT NULL,
  emotion TEXT DEFAULT 'curiosity' NOT NULL,
  emotion_confidence REAL DEFAULT 0.0 NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL CHECK (likes_count >= 0),
  comments_count INTEGER DEFAULT 0 NOT NULL CHECK (comments_count >= 0),
  bookmarks_count INTEGER DEFAULT 0 NOT NULL CHECK (bookmarks_count >= 0),
  reposts_count INTEGER DEFAULT 0 NOT NULL CHECK (reposts_count >= 0),
  views_count INTEGER DEFAULT 0 NOT NULL CHECK (views_count >= 0),
  is_pinned BOOLEAN DEFAULT false NOT NULL,
  is_synthetic BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- POST MEDIA: Image attachments
CREATE TABLE IF NOT EXISTS public.post_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image' NOT NULL,
  alt_text TEXT DEFAULT '',
  order_index INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- HASHTAGS & POST_HASHTAGS
CREATE TABLE IF NOT EXISTS public.hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL CHECK (usage_count >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (post_id, hashtag_id)
);

-- COMMENTS: Threaded comment tree
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  sentiment TEXT DEFAULT 'Neutral' NOT NULL,
  sentiment_confidence REAL DEFAULT 0.0 NOT NULL,
  likes_count INTEGER DEFAULT 0 NOT NULL CHECK (likes_count >= 0),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER set_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- LIKES, BOOKMARKS, REPOSTS
CREATE TABLE IF NOT EXISTS public.likes (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.reposts (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

-- SOCIAL GRAPH: Follows, Blocks, Mutes
CREATE TABLE IF NOT EXISTS public.follows (
  follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id <> following_id)
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE TABLE IF NOT EXISTS public.muted_users (
  muter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  muted_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (muter_id, muted_id),
  CONSTRAINT no_self_mute CHECK (muter_id <> muted_id)
);

-- DIRECT MESSAGING: Conversations & Messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN DEFAULT false NOT NULL,
  title TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 5000),
  shared_post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('follow', 'like', 'comment', 'reply', 'repost', 'message', 'mention', 'system')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- REPORTS & MODERATION
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'profile')),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'reviewed', 'action_taken', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('warn', 'remove_content', 'ban_user', 'dismiss')),
  target_id UUID NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RECOMMENDATION EVENTS: Real-time telemetry for hybrid ranking
CREATE TABLE IF NOT EXISTS public.recommendation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'long_view', 'click', 'skip', 'not_interested')),
  duration_seconds REAL DEFAULT 0.0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================================================
-- 4. Atomic Counter Triggers (Eliminates N+1 Queries)
-- ============================================================================

-- Likes count trigger
CREATE OR REPLACE FUNCTION public.sync_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_like_change
  AFTER INSERT OR DELETE ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_likes_count();

-- Bookmarks count trigger
CREATE OR REPLACE FUNCTION public.sync_post_bookmarks_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET bookmarks_count = GREATEST(0, bookmarks_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_bookmark_change
  AFTER INSERT OR DELETE ON public.bookmarks
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_bookmarks_count();

-- Reposts count trigger
CREATE OR REPLACE FUNCTION public.sync_post_reposts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET reposts_count = reposts_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET reposts_count = GREATEST(0, reposts_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_repost_change
  AFTER INSERT OR DELETE ON public.reposts
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_reposts_count();

-- Comments count trigger
CREATE OR REPLACE FUNCTION public.sync_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.sync_post_comments_count();

-- Community member count trigger
CREATE OR REPLACE FUNCTION public.sync_community_members_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET members_count = members_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET members_count = GREATEST(0, members_count - 1) WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_community_member_change
  AFTER INSERT OR DELETE ON public.community_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_community_members_count();

-- Follower and following count triggers
CREATE OR REPLACE FUNCTION public.sync_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
    UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.sync_follow_counts();

-- User post count trigger
CREATE OR REPLACE FUNCTION public.sync_user_posts_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.profiles SET posts_count = posts_count + 1 WHERE id = NEW.author_id;
    IF NEW.community_id IS NOT NULL THEN
      UPDATE public.communities SET posts_count = posts_count + 1 WHERE id = NEW.community_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.author_id;
    IF OLD.community_id IS NOT NULL THEN
      UPDATE public.communities SET posts_count = GREATEST(0, posts_count - 1) WHERE id = OLD.community_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_change
  AFTER INSERT OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_posts_count();

-- ============================================================================
-- 5. Performance Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_posts_author_created ON public.posts(author_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_community_created ON public.posts(community_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_topic_created ON public.posts(topic_category, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_sentiment ON public.posts(sentiment);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_blocked_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_muted_muter ON public.muted_users(muter_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_conv_members_user ON public.conversation_members(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_events_user ON public.recommendation_events(user_id, created_at DESC);

-- ============================================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on every table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muted_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;

-- PROFILES Policies
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- USER PREFERENCES Policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- COMMUNITIES Policies
CREATE POLICY "Communities are readable by everyone"
  ON public.communities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON public.communities FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Community creators can update their community"
  ON public.communities FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

-- COMMUNITY MEMBERS Policies
CREATE POLICY "Community memberships are readable by everyone"
  ON public.community_members FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can join communities"
  ON public.community_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- POSTS Policies (With Blocking Enforcement)
CREATE POLICY "Posts readable if not blocked"
  ON public.posts FOR SELECT
  USING (
    auth.uid() IS NULL 
    OR NOT EXISTS (
      SELECT 1 FROM public.blocked_users 
      WHERE (blocker_id = posts.author_id AND blocked_id = auth.uid())
         OR (blocker_id = auth.uid() AND blocked_id = posts.author_id)
    )
  );

CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors or moderators can delete posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_moderator = true)
  );

-- POST MEDIA Policies
CREATE POLICY "Post media is readable by everyone"
  ON public.post_media FOR SELECT
  USING (true);

CREATE POLICY "Post authors can insert post media"
  ON public.post_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
  );

-- HASHTAGS & POST_HASHTAGS Policies
CREATE POLICY "Hashtags are readable by everyone"
  ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "Hashtags insertable by authenticated users"
  ON public.hashtags FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Post hashtags are readable by everyone"
  ON public.post_hashtags FOR SELECT USING (true);
CREATE POLICY "Post authors can link hashtags"
  ON public.post_hashtags FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND author_id = auth.uid())
  );

-- COMMENTS Policies
CREATE POLICY "Comments readable by everyone"
  ON public.comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Comment authors or moderators can delete comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = author_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_moderator = true)
  );

-- LIKES Policies
CREATE POLICY "Likes readable by everyone"
  ON public.likes FOR SELECT USING (true);

CREATE POLICY "Users can like posts"
  ON public.likes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.likes FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- BOOKMARKS Policies (Private to user)
CREATE POLICY "Users can only view their own bookmarks"
  ON public.bookmarks FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can bookmark posts"
  ON public.bookmarks FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove bookmarks"
  ON public.bookmarks FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- REPOSTS Policies
CREATE POLICY "Reposts readable by everyone"
  ON public.reposts FOR SELECT USING (true);

CREATE POLICY "Users can repost"
  ON public.reposts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can undo repost"
  ON public.reposts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- FOLLOWS Policies
CREATE POLICY "Follows are viewable by everyone"
  ON public.follows FOR SELECT USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.follows FOR DELETE TO authenticated
  USING (auth.uid() = follower_id);

-- BLOCKS & MUTES Policies (Private to acting user)
CREATE POLICY "Users can manage their block list"
  ON public.blocked_users FOR ALL TO authenticated
  USING (auth.uid() = blocker_id)
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can manage their mute list"
  ON public.muted_users FOR ALL TO authenticated
  USING (auth.uid() = muter_id)
  WITH CHECK (auth.uid() = muter_id);

-- CONVERSATIONS & MEMBERS Policies
CREATE POLICY "Conversation members can view conversations"
  ON public.conversations FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = conversations.id AND user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create conversations"
  ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Conversation members are viewable by conversation participants"
  ON public.conversation_members FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.conversation_members cm WHERE cm.conversation_id = conversation_members.conversation_id AND cm.user_id = auth.uid())
  );

CREATE POLICY "Users can add members to conversations"
  ON public.conversation_members FOR INSERT TO authenticated
  WITH CHECK (true);

-- MESSAGES Policies
CREATE POLICY "Messages readable by conversation participants only"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
  );

CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id 
    AND EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())
  );

-- NOTIFICATIONS Policies
CREATE POLICY "Users can only view their own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read"
  ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System or authenticated users can create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = actor_id);

-- REPORTS & MODERATION Policies
CREATE POLICY "Users can view reports they created"
  ON public.reports FOR SELECT TO authenticated
  USING (
    auth.uid() = reporter_id 
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_moderator = true)
  );

CREATE POLICY "Authenticated users can submit reports"
  ON public.reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Moderators can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_moderator = true));

CREATE POLICY "Moderation actions viewable by moderators only"
  ON public.moderation_actions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_moderator = true));

CREATE POLICY "Moderators can record actions"
  ON public.moderation_actions FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = moderator_id 
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_moderator = true)
  );

-- RECOMMENDATION EVENTS Policies
CREATE POLICY "Users can log their own recommendation events"
  ON public.recommendation_events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own telemetry events"
  ON public.recommendation_events FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

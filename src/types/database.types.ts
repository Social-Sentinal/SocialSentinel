export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SentimentType = 'Positive' | 'Neutral' | 'Negative';
export type EmotionType = 'joy' | 'curiosity' | 'wonder' | 'inspiration' | 'empathy' | 'concern' | 'sadness';
export type NotificationType = 'follow' | 'like' | 'comment' | 'reply' | 'repost' | 'message' | 'mention' | 'system';
export type ReportStatus = 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
export type ModerationActionType = 'warn' | 'remove_content' | 'ban_user' | 'dismiss';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          bio: string;
          avatar_url: string;
          website: string;
          is_demo: boolean;
          is_moderator: boolean;
          followers_count: number;
          following_count: number;
          posts_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          bio?: string;
          avatar_url?: string;
          website?: string;
          is_demo?: boolean;
          is_moderator?: boolean;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string;
          bio?: string;
          avatar_url?: string;
          website?: string;
          is_demo?: boolean;
          is_moderator?: boolean;
          followers_count?: number;
          following_count?: number;
          posts_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          user_id: string;
          preferred_topics: string[];
          exploration_rate: number;
          theme: 'light' | 'dark' | 'system';
          is_private: boolean;
          filter_sensitive: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          preferred_topics?: string[];
          exploration_rate?: number;
          theme?: 'light' | 'dark' | 'system';
          is_private?: boolean;
          filter_sensitive?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          preferred_topics?: string[];
          exploration_rate?: number;
          theme?: 'light' | 'dark' | 'system';
          is_private?: boolean;
          filter_sensitive?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      communities: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          icon: string;
          banner_gradient: string;
          creator_id: string | null;
          members_count: number;
          posts_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string;
          icon?: string;
          banner_gradient?: string;
          creator_id?: string | null;
          members_count?: number;
          posts_count?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          icon?: string;
          banner_gradient?: string;
          creator_id?: string | null;
          members_count?: number;
          posts_count?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      community_members: {
        Row: {
          community_id: string;
          user_id: string;
          role: 'member' | 'moderator' | 'admin';
          joined_at: string;
        };
        Insert: {
          community_id: string;
          user_id: string;
          role?: 'member' | 'moderator' | 'admin';
          joined_at?: string;
        };
        Update: {
          community_id?: string;
          user_id?: string;
          role?: 'member' | 'moderator' | 'admin';
          joined_at?: string;
        };
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          community_id: string | null;
          caption: string;
          topic_category: string;
          sentiment: SentimentType;
          sentiment_confidence: number;
          emotion: EmotionType;
          emotion_confidence: number;
          likes_count: number;
          comments_count: number;
          bookmarks_count: number;
          reposts_count: number;
          views_count: number;
          is_pinned: boolean;
          is_synthetic: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          community_id?: string | null;
          caption: string;
          topic_category?: string;
          sentiment?: SentimentType;
          sentiment_confidence?: number;
          emotion?: EmotionType;
          emotion_confidence?: number;
          likes_count?: number;
          comments_count?: number;
          bookmarks_count?: number;
          reposts_count?: number;
          views_count?: number;
          is_pinned?: boolean;
          is_synthetic?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          community_id?: string | null;
          caption?: string;
          topic_category?: string;
          sentiment?: SentimentType;
          sentiment_confidence?: number;
          emotion?: EmotionType;
          emotion_confidence?: number;
          likes_count?: number;
          comments_count?: number;
          bookmarks_count?: number;
          reposts_count?: number;
          views_count?: number;
          is_pinned?: boolean;
          is_synthetic?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "posts_community_id_fkey";
            columns: ["community_id"];
            isOneToOne: false;
            referencedRelation: "communities";
            referencedColumns: ["id"];
          }
        ];
      };
      post_media: {
        Row: {
          id: string;
          post_id: string;
          media_url: string;
          media_type: string;
          alt_text: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          media_url: string;
          media_type?: string;
          alt_text?: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          media_url?: string;
          media_type?: string;
          alt_text?: string;
          order_index?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_id: string;
          parent_comment_id: string | null;
          body: string;
          sentiment: string;
          sentiment_confidence: number;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          author_id: string;
          parent_comment_id?: string | null;
          body: string;
          sentiment?: string;
          sentiment_confidence?: number;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          author_id?: string;
          parent_comment_id?: string | null;
          body?: string;
          sentiment?: string;
          sentiment_confidence?: number;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_parent_comment_id_fkey";
            columns: ["parent_comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          }
        ];
      };
      likes: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      reposts: {
        Row: {
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          follower_id: string;
          following_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          following_id: string;
          created_at?: string;
        };
        Update: {
          follower_id?: string;
          following_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      blocked_users: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
          created_at?: string;
        };
        Update: {
          blocker_id?: string;
          blocked_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      muted_users: {
        Row: {
          muter_id: string;
          muted_id: string;
          created_at: string;
        };
        Insert: {
          muter_id: string;
          muted_id: string;
          created_at?: string;
        };
        Update: {
          muter_id?: string;
          muted_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          is_group: boolean;
          title: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          is_group?: boolean;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          is_group?: boolean;
          title?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          joined_at: string;
          last_read_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          joined_at?: string;
          last_read_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          joined_at?: string;
          last_read_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversation_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          shared_post_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          shared_post_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          body?: string;
          shared_post_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_shared_post_id_fkey";
            columns: ["shared_post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: NotificationType;
          post_id: string | null;
          comment_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: NotificationType;
          post_id?: string | null;
          comment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          actor_id?: string;
          type?: NotificationType;
          post_id?: string | null;
          comment_id?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          }
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: 'post' | 'comment' | 'profile';
          post_id: string | null;
          comment_id: string | null;
          profile_id: string | null;
          reason: string;
          details: string;
          status: ReportStatus;
          created_at: string;
          resolved_at: string | null;
          resolved_by: string | null;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: 'post' | 'comment' | 'profile';
          post_id?: string | null;
          comment_id?: string | null;
          profile_id?: string | null;
          reason: string;
          details?: string;
          status?: ReportStatus;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          target_type?: 'post' | 'comment' | 'profile';
          post_id?: string | null;
          comment_id?: string | null;
          profile_id?: string | null;
          reason?: string;
          details?: string;
          status?: ReportStatus;
          created_at?: string;
          resolved_at?: string | null;
          resolved_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_profile_id_fkey";
            columns: ["profile_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      moderation_actions: {
        Row: {
          id: string;
          moderator_id: string;
          report_id: string | null;
          action_type: ModerationActionType;
          target_id: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          moderator_id: string;
          report_id?: string | null;
          action_type: ModerationActionType;
          target_id: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          moderator_id?: string;
          report_id?: string | null;
          action_type?: ModerationActionType;
          target_id?: string;
          notes?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      recommendation_events: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          event_type: 'view' | 'long_view' | 'click' | 'skip' | 'not_interested';
          duration_seconds: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          event_type: 'view' | 'long_view' | 'click' | 'skip' | 'not_interested';
          duration_seconds?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          event_type?: 'view' | 'long_view' | 'click' | 'skip' | 'not_interested';
          duration_seconds?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Post = Database['public']['Tables']['posts']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type Community = Database['public']['Tables']['communities']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];
export type UserPreference = Database['public']['Tables']['user_preferences']['Row'];

export interface PostWithAuthor extends Post {
  profiles: Profile;
  liked_by_viewer?: boolean;
  bookmarked_by_viewer?: boolean;
  reposted_by_viewer?: boolean;
  recommendation_score?: number;
  recommendation_reason?: string;
}

export interface CommentWithAuthor extends Comment {
  profiles: Profile;
  replies?: CommentWithAuthor[];
}

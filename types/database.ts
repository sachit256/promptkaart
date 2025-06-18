export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          followers_count: number | null;
          following_count: number | null;
          posts_count: number | null;
          likes_received_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          posts_count?: number | null;
          likes_received_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          followers_count?: number | null;
          following_count?: number | null;
          posts_count?: number | null;
          likes_received_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          content: string | null;
          prompt: string;
          ai_source: 'chatgpt' | 'grok' | 'gemini';
          images: string[];
          category: string;
          tags: string[];
          likes_count: number | null;
          comments_count: number | null;
          shares_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          content?: string | null;
          prompt: string;
          ai_source: 'chatgpt' | 'grok' | 'gemini';
          images?: string[];
          category?: string;
          tags?: string[];
          likes_count?: number | null;
          comments_count?: number | null;
          shares_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          content?: string | null;
          prompt?: string;
          ai_source?: 'chatgpt' | 'grok' | 'gemini';
          images?: string[];
          category?: string;
          tags?: string[];
          likes_count?: number | null;
          comments_count?: number | null;
          shares_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          content: string;
          likes_count: number | null;
          replies_count: number | null;
          parent_id: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          content: string;
          likes_count?: number | null;
          replies_count?: number | null;
          parent_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          content?: string;
          likes_count?: number | null;
          replies_count?: number | null;
          parent_id?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      likes: {
        Row: {
          id: string;
          user_id: string;
          post_id: string | null;
          comment_id: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string | null;
          comment_id?: string | null;
          created_at?: string | null;
        };
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          post_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          post_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          post_id?: string;
          created_at?: string | null;
        };
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          following_id: string;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          follower_id: string;
          following_id: string;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          follower_id?: string;
          following_id?: string;
          created_at?: string | null;
        };
      };
    };
    Enums: {
      ai_source_type: 'chatgpt' | 'grok' | 'gemini';
    };
  };
}
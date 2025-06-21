export interface Prompt {
  id: string;
  prompt: string;
  ai_source: 'chatgpt' | 'grok' | 'gemini' | 'midjourney';
  images: string[];
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  isBookmarked?: boolean;
  bookmarkCount?: number;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies_count?: number;
  parent_id?: string;
}

export interface DatabasePost {
  id: string;
  user_id: string;
  prompt: string;
  ai_source: 'chatgpt' | 'grok' | 'gemini' | 'midjourney';
  images: string[];
  category: string;
  tags: string[];
  likes_count: number | null;
  comments_count: number | null;
  shares_count: number | null;
  created_at: string | null;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface DatabaseComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  likes_count: number | null;
  replies_count: number | null;
  parent_id: string | null;
  created_at: string | null;
  profiles: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}
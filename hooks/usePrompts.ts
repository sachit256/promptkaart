import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Prompt, DatabasePost } from '@/types/prompt';
import { useAuth } from '@/contexts/AuthContext';

export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [bookmarkCounts, setBookmarkCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const transformDatabasePost = (dbPost: DatabasePost, userLikes: string[] = [], userBookmarks: string[] = [], bookmarkCount: number = 0): Prompt => {
    // Debug logging to understand the data structure
    
    return {
      id: dbPost.id,
      prompt: dbPost.prompt,
      ai_source: dbPost.ai_source,
      images: dbPost.images,
      category: dbPost.category,
      tags: dbPost.tags,
      likes: dbPost.likes_count || 0,
      comments: dbPost.comments_count || 0,
      shares: dbPost.shares_count || 0,
      isLiked: userLikes.includes(dbPost.id),
      isBookmarked: userBookmarks.includes(dbPost.id),
      bookmarkCount: bookmarkCount,
      author: {
        id: dbPost.profiles?.id || dbPost.user_id,
        name: dbPost.profiles?.username || 'Unknown User',
        avatar: dbPost.profiles?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
      },
      createdAt: dbPost.created_at || new Date().toISOString()
    };
  };

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch posts with author profiles
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (postsError) {
        console.error('Error fetching posts:', postsError);
        throw postsError;
      }
      
      if (posts && posts.length > 0) {
        // console.log('Sample post data:', {
        //   id: posts[0].id,
        //   user_id: posts[0].user_id,
        //   profiles: posts[0].profiles,
        //   comments_count: posts[0].comments_count
        // });
      }

      // Fetch bookmark counts for all posts
      const postIds = posts?.map(post => post.id) || [];
      let bookmarkCountsData: { [key: string]: number } = {};
      
      if (postIds.length > 0) {
        const { data: bookmarkData, error: bookmarkError } = await supabase
          .from('bookmarks')
          .select('post_id')
          .in('post_id', postIds);

        if (!bookmarkError && bookmarkData) {
          // Count bookmarks for each post
          bookmarkCountsData = bookmarkData.reduce((acc, bookmark) => {
            acc[bookmark.post_id] = (acc[bookmark.post_id] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number });
        }
      }

      setBookmarkCounts(bookmarkCountsData);
      let userLikes: string[] = [];
      let userBookmarks: string[] = [];

      // If user is logged in, fetch their likes and bookmarks
      if (user) {
        const [likesResponse, bookmarksResponse] = await Promise.all([
          supabase
            .from('likes')
            .select('post_id')
            .eq('user_id', user.id)
            .not('post_id', 'is', null),
          supabase
            .from('bookmarks')
            .select('post_id')
            .eq('user_id', user.id)
        ]);

        if (likesResponse.data) {
          userLikes = likesResponse.data.map(like => like.post_id!);
        }

        if (bookmarksResponse.data) {
          userBookmarks = bookmarksResponse.data.map(bookmark => bookmark.post_id);
        }
      }

      const transformedPrompts = posts?.map(post => 
        transformDatabasePost(
          post as DatabasePost, 
          userLikes, 
          userBookmarks, 
          bookmarkCountsData[post.id] || 0
        )
      ) || [];

      setPrompts(transformedPrompts);
    } catch (err) {
      console.error('Error fetching prompts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (promptId: string) => {
    if (!user) {
      throw new Error('Must be logged in to like posts');
    }

    try {
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      if (prompt.isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', promptId);

        if (error) throw error;
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: promptId
          });

        if (error) throw error;
      }

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === promptId 
          ? { 
              ...p, 
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1
            }
          : p
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
      throw err;
    }
  };

  const toggleBookmark = async (promptId: string) => {
    if (!user) {
      throw new Error('Must be logged in to bookmark posts');
    }

    try {
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      // Store original state for rollback
      const originalIsBookmarked = prompt.isBookmarked;
      const originalBookmarkCount = bookmarkCounts[promptId] || 0;

      if (prompt.isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', promptId);

        if (error) {
          console.error('Error removing bookmark:', error);
          throw error;
        }
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            post_id: promptId
          });

        if (error) {
          console.error('Error adding bookmark:', error);
          throw error;
        }
      }

      // Update local state
      setPrompts(prev => prev.map(p => 
        p.id === promptId 
          ? { ...p, isBookmarked: !p.isBookmarked }
          : p
      ));

      // Update bookmark counts
      setBookmarkCounts(prev => ({
        ...prev,
        [promptId]: prompt.isBookmarked 
          ? Math.max((prev[promptId] || 1) - 1, 0)
          : (prev[promptId] || 0) + 1
      }));
    } catch (err) {
      // Rollback local state on error
      setPrompts(prev => prev.map(p => 
        p.id === promptId 
          ? { ...p, isBookmarked: originalIsBookmarked }
          : p
      ));

      setBookmarkCounts(prev => ({
        ...prev,
        [promptId]: originalBookmarkCount
      }));

      console.error('Error toggling bookmark:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, [user]);

  return {
    prompts,
    bookmarkCounts,
    loading,
    error,
    refetch: fetchPrompts,
    toggleLike,
    toggleBookmark
  };
}
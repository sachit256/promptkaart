import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type Comment = {
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
  parent_id: string | null;
};

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_comments_for_post', {
        p_post_id: postId,
        p_user_id: user?.id || null,
      });

      if (rpcError) throw rpcError;

      const transformedComments: Comment[] = data.map((c: any) => ({
        id: c.id,
        content: c.content,
        createdAt: c.created_at,
        parent_id: c.parent_id,
        likes: c.likes_count,
        isLiked: c.is_liked,
        author: {
          id: c.author.id,
          name: c.author.name || 'Deleted User',
          avatar: c.author.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        },
      }));
      
      setComments(transformedComments);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [postId, user?.id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string, parentId: string | null = null) => {
    if (!user) throw new Error('User must be logged in to comment');

    // Create optimistic comment
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`, // Temporary ID
      content,
      parent_id: parentId,
      likes: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
      author: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
      },
    };

    // Optimistically add comment to UI
    setComments(prev => [optimisticComment, ...prev]);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content,
          post_id: postId,
          user_id: user.id,
          parent_id: parentId,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('Failed to create comment');
      
      // Replace optimistic comment with real comment
      setComments(prev => 
        prev.map(comment => 
          comment.id === optimisticComment.id 
            ? {
                ...optimisticComment,
                id: data.id,
                createdAt: data.created_at,
              }
            : comment
        )
      );
    } catch (err) {
      // Remove optimistic comment on error
      setComments(prev => prev.filter(comment => comment.id !== optimisticComment.id));
      throw err;
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!user) throw new Error('User must be logged in to like comments');

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    // Optimistic UI update
    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );

    try {
      if (comment.isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('comment_id', commentId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ comment_id: commentId, user_id: user.id });
        if (error) throw error;
      }
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
      // Revert optimistic update on failure
      setComments(prev =>
        prev.map(c =>
          c.id === commentId
            ? { ...c, isLiked: comment.isLiked, likes: comment.likes }
            : c
        )
      );
    }
  };

  return {
    comments,
    loading,
    error,
    addComment,
    toggleCommentLike,
    refetch: fetchComments,
  };
}
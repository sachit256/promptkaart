import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react-native';
import { PromptCard } from '@/components/PromptCard';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Prompt } from '@/types/prompt';

export default function HomeScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_all_posts', {
        p_user_id: user?.id || null,
      });

      if (rpcError) throw rpcError;

      if (!data) {
        setPrompts([]);
        return;
      }

      const transformedPrompts: Prompt[] = data.map((p: any) => ({
        ...p,
        ai_source: ['chatgpt', 'grok', 'gemini'].includes(p.ai_source)
          ? (p.ai_source as Prompt['ai_source'])
          : 'chatgpt',
        author: {
          id: p.author?.id || 'unknown-author',
          name: p.author?.name || 'Deleted User',
          avatar: p.author?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        },
      }));

      setPrompts(transformedPrompts);
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    // Initial fetch
    fetchPosts();

    // Set up real-time subscriptions
    const postsChannel = supabase
      .channel(`posts_${user?.id || 'anonymous'}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          console.log('Posts change detected:', payload);
          // Add delay to ensure database consistency
          setTimeout(() => {
            fetchPosts();
          }, 100);
        }
      )
      .subscribe();

    const likesChannel = supabase
      .channel(`likes_${user?.id || 'anonymous'}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        (payload) => {
          console.log('Likes change detected:', payload);
          
          setTimeout(() => {
            if (payload.eventType === 'INSERT' && payload.new.post_id) {
            setPrompts(prev => prev.map(prompt => {
              if (prompt.id === payload.new.post_id) {
                return {
                  ...prompt,
                  likes: prompt.likes + 1,
                  isLiked: payload.new.user_id === user?.id ? true : prompt.isLiked
                };
              }
              return prompt;
            }));
            } else if (payload.eventType === 'DELETE' && payload.old.post_id) {
            setPrompts(prev => prev.map(prompt => {
              if (prompt.id === payload.old.post_id) {
                return {
                  ...prompt,
                  likes: Math.max(prompt.likes - 1, 0),
                  isLiked: payload.old.user_id === user?.id ? false : prompt.isLiked
                };
              }
              return prompt;
            }));
            }
          }, 100);
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel(`comments_${user?.id || 'anonymous'}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        (payload) => {
          console.log('Comments change detected:', payload);
          
          setTimeout(() => {
            if (payload.eventType === 'INSERT' && payload.new.post_id) {
            setPrompts(prev => prev.map(prompt => {
              if (prompt.id === payload.new.post_id) {
                return {
                  ...prompt,
                  comments: prompt.comments + 1
                };
              }
              return prompt;
            }));
            } else if (payload.eventType === 'DELETE' && payload.old.post_id) {
            setPrompts(prev => prev.map(prompt => {
              if (prompt.id === payload.old.post_id) {
                return {
                  ...prompt,
                  comments: Math.max(prompt.comments - 1, 0)
                };
              }
              return prompt;
            }));
            }
          }, 100);
        }
      )
      .subscribe();

    const bookmarksChannel = supabase
      .channel(`bookmarks_${user?.id || 'anonymous'}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks'
        },
        (payload) => {
          console.log('Bookmarks change detected:', payload);
          
          setTimeout(() => {
            if (payload.eventType === 'INSERT' && payload.new.post_id) {
            setPrompts(prev => prev.map(prompt => {
              if (prompt.id === payload.new.post_id && payload.new.user_id === user?.id) {
                return {
                  ...prompt,
                  isBookmarked: true
                };
              }
              return prompt;
            }));
            } else if (payload.eventType === 'DELETE' && payload.old.post_id) {
            setPrompts(prev => prev.map(prompt => {
              if (prompt.id === payload.old.post_id && payload.old.user_id === user?.id) {
                return {
                  ...prompt,
                  isBookmarked: false
                };
              }
              return prompt;
            }));
            }
          }, 100);
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(bookmarksChannel);
    };
  }, [user?.id, fetchPosts]);

  const handleLike = async (promptId: string) => {
    if (!user?.id) {
      router.push('/auth');
      return;
    }

    try {
      // Optimistic update
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      const newLikedState = !prompt.isLiked;
      const newLikesCount = newLikedState ? prompt.likes + 1 : prompt.likes - 1;

      // Update UI immediately
      setPrompts(prev => prev.map(p => 
        p.id === promptId 
          ? { ...p, isLiked: newLikedState, likes: newLikesCount }
          : p
      ));

      if (prompt.isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', promptId);
        
        if (error) {
          // Revert optimistic update on error
          setPrompts(prev => prev.map(p => 
            p.id === promptId 
              ? { ...p, isLiked: prompt.isLiked, likes: prompt.likes }
              : p
          ));
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: promptId });
        
        if (error) {
          // Revert optimistic update on error
          setPrompts(prev => prev.map(p => 
            p.id === promptId 
              ? { ...p, isLiked: prompt.isLiked, likes: prompt.likes }
              : p
          ));
          throw error;
        }
      }
      
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmark = async (promptId: string) => {
    if (!user?.id) {
      router.push('/auth');
      return;
    }

    try {
      // Optimistic update
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      const newBookmarkedState = !prompt.isBookmarked;

      // Update UI immediately
      setPrompts(prev => prev.map(p => 
        p.id === promptId 
          ? { ...p, isBookmarked: newBookmarkedState }
          : p
      ));

      if (prompt.isBookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', promptId);
        
        if (error) {
          // Revert optimistic update on error
          setPrompts(prev => prev.map(p => 
            p.id === promptId 
              ? { ...p, isBookmarked: prompt.isBookmarked }
              : p
          ));
          throw error;
        }
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, post_id: promptId });
        
        if (error && error.code === '23505') {
          // Bookmark already exists - this is fine, the optimistic update was correct
          // No need to revert the UI state
          console.log('Bookmark already exists, ignoring duplicate error');
        } else if (error) {
          // For any other error, revert the optimistic update
          console.error('Error creating bookmark:', error);
          // Revert optimistic update on error
          setPrompts(prev => prev.map(p => 
            p.id === promptId 
              ? { ...p, isBookmarked: prompt.isBookmarked }
              : p
          ));
          throw error;
        }
      }
      
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleShare = (promptId: string) => {
    console.log('Share prompt:', promptId);
  };

  const onRefresh = () => {
    fetchPosts(true);
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      paddingTop: Platform.OS === 'android' ? insets.top + 16 : insets.top + 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
    },
    notificationButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
      position: 'relative',
    },
    notificationBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 16,
      paddingBottom: 120,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: 100,
    },
    loadingText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 16,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 100,
    },
    errorText: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    errorDescription: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    retryButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    realtimeIndicator: {
      position: 'absolute',
      top: Platform.OS === 'android' ? insets.top + 60 : insets.top + 64,
      right: 20,
      backgroundColor: colors.success,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      opacity: 0.8,
    },
    realtimeText: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      color: colors.white,
    },
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading prompts...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load posts</Text>
          <Text style={styles.errorDescription}>
            Please check your connection and try again.
          </Text>
          <TouchableOpacity onPress={() => fetchPosts()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
        <TouchableOpacity style={styles.notificationButton}>
          <Bell size={20} color={colors.textSecondary} />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {prompts.length > 0 ? (
          prompts.map((prompt) => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              onLike={handleLike}
              onBookmark={handleBookmark}
              onShare={handleShare}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              No prompts found. Be the first to share your creativity!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
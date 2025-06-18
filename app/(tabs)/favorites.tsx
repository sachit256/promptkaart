import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, Filter, CircleAlert as AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { PromptCard } from '@/components/PromptCard';
import { supabase } from '@/lib/supabase';
import { Prompt } from '@/types/prompt';

type BookmarkedPrompt = Omit<Prompt, 'author'> & {
  author: {
    id: string;
    name: string;
    avatar: string;
  };
};

export default function FavoritesScreen() {
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [favoritePrompts, setFavoritePrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect to auth if not logged in
  React.useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth');
    }
  }, [isLoggedIn]);

  const fetchFavorites = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase.rpc('get_bookmarked_posts', {
        p_user_id: user.id,
      });

      if (rpcError) throw rpcError;

      if (!data) {
        setFavoritePrompts([]);
        return;
      }

      const transformedPrompts: Prompt[] = (data as BookmarkedPrompt[]).map((p) => ({
        ...p,
        ai_source: ['chatgpt', 'grok', 'gemini'].includes(p.ai_source)
          ? (p.ai_source as Prompt['ai_source'])
          : 'chatgpt',
        author: {
          id: p.author.id || 'unknown-author',
          name: p.author.name || 'Deleted User',
          avatar: p.author.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        },
      }));

      setFavoritePrompts(transformedPrompts);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (promptId: string) => {
    if (!user?.id) {
      console.error('No user ID for like action');
      return;
    }

    try {
      const prompt = favoritePrompts.find(p => p.id === promptId);
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
      setFavoritePrompts(prev => prev.map(p => 
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
    }
  };

  const handleBookmark = async (promptId: string) => {
    if (!user?.id) {
      console.error('No user ID for bookmark action');
      return;
    }

    try {
      // Remove bookmark (since this is favorites screen, we're removing from favorites)
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', user.id)
        .eq('post_id', promptId);

      if (error) throw error;

      // Remove from local state
      setFavoritePrompts(prev => prev.filter(p => p.id !== promptId));
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  const handleShare = (promptId: string) => {
    // TODO: Implement share functionality
    console.log('Share prompt:', promptId);
  };

  useEffect(() => {
    if (user?.id && isLoggedIn) {
      fetchFavorites();
    }
  }, [user?.id, isLoggedIn]);

  if (!isLoggedIn) {
    return null; // or loading spinner
  }

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
    filterButton: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      padding: 8,
    },
    content: {
      flex: 1,
    },
    statsContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statsText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: 16,
      paddingBottom: 140, // Fixed padding for floating tab bar
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
    errorIcon: {
      marginBottom: 16,
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
    emptyIcon: {
      marginBottom: 16,
    },
    emptyText: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading favorites...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Favorites</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>Failed to load favorites</Text>
          <Text style={styles.errorDescription}>
            Please check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchFavorites}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Favorites</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {favoritePrompts.length > 0 ? (
          <>
            {/* Stats */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {favoritePrompts.length} favorite prompt{favoritePrompts.length !== 1 ? 's' : ''}
              </Text>
            </View>

            {/* Favorites List */}
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {favoritePrompts.map((prompt) => (
                <PromptCard 
                  key={prompt.id} 
                  prompt={prompt}
                  onLike={handleLike}
                  onShare={handleShare}
                  onBookmark={handleBookmark}
                />
              ))}
            </ScrollView>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Heart 
              size={64} 
              color={colors.textSecondary} 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyText}>No favorites yet</Text>
            <Text style={styles.emptyDescription}>
              Start exploring prompts and tap the bookmark icon to save your favorites here.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
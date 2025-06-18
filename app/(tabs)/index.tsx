import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
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
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async () => {
    try {
      setLoading(true);
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
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user?.id, isLoggedIn]);

  const handleLike = async (promptId: string) => {
    if (!user?.id) {
      router.push('/auth');
      return;
    }

    try {
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      if (prompt.isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', promptId);
      } else {
        await supabase
          .from('likes')
          .insert({ user_id: user.id, post_id: promptId });
      }

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
    }
  };

  const handleBookmark = async (promptId: string) => {
    if (!user?.id) {
      router.push('/auth');
      return;
    }

    try {
      const prompt = prompts.find(p => p.id === promptId);
      if (!prompt) return;

      if (prompt.isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', promptId);
      } else {
        await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, post_id: promptId });
      }

      setPrompts(prev => prev.map(p => 
        p.id === promptId 
          ? { ...p, isBookmarked: !p.isBookmarked }
          : p
      ));
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleShare = (promptId: string) => {
    console.log('Share prompt:', promptId);
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
    themeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceVariant,
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
      paddingTop: 0,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Home</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
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
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: colors.text, fontFamily: 'Inter-SemiBold', fontSize: 18, marginBottom: 10 }}>
            Failed to load posts
          </Text>
          <TouchableOpacity onPress={fetchPosts} style={{ backgroundColor: colors.primary, padding: 12, borderRadius: 10 }}>
            <Text style={{ color: colors.white, fontFamily: 'Inter-SemiBold' }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Home</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {prompts.map((prompt) => (
          <PromptCard 
            key={prompt.id} 
            prompt={prompt} 
            onLike={handleLike}
            onBookmark={handleBookmark}
            onShare={handleShare}
          />
        ))}
      </ScrollView>
    </View>
  );
}
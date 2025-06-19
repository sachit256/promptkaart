import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions, TextInput, Alert, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Heart, MessageCircle, Share, ChevronLeft, ChevronRight, Send, Bookmark, CircleAlert as AlertCircle } from 'lucide-react-native';
import { CommentCard } from '@/components/CommentCard';
import { useComments } from '@/hooks/useComments';
import { supabase } from '@/lib/supabase';
import { Prompt } from '@/types/prompt';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

type PostDetails = Omit<Prompt, 'author' | 'createdAt' | 'isLiked' | 'isBookmarked'> & {
  created_at: string;
  is_liked: boolean;
  is_bookmarked: boolean;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
};

export default function PromptDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  
  const { comments, loading: commentsLoading, addComment, toggleCommentLike } = useComments(id as string);

  const fetchPrompt = async () => {
    try {
      setLoading(true);
      setError(null);
  
      const { data, error: rpcError } = await supabase.rpc('get_post_details', {
        p_post_id: id,
        p_user_id: user?.id || null,
      }).single();
  
      if (rpcError) throw rpcError;
  
      if (!data) {
        throw new Error('Post not found');
      }
      
      const typedData = data as PostDetails;
  
      const transformedPrompt: Prompt = {
        id: typedData.id,
        prompt: typedData.prompt,
        ai_source: ['chatgpt', 'grok', 'gemini'].includes(typedData.ai_source) ? typedData.ai_source as Prompt['ai_source'] : 'chatgpt',
        images: typedData.images,
        category: typedData.category,
        tags: typedData.tags,
        likes: typedData.likes,
        comments: typedData.comments,
        shares: typedData.shares,
        createdAt: typedData.created_at,
        isLiked: typedData.is_liked,
        isBookmarked: typedData.is_bookmarked,
        author: {
          id: typedData.author?.id || 'unknown-author',
          name: typedData.author?.name || 'Deleted User',
          avatar: typedData.author?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
        },
      };
  
      setPrompt(transformedPrompt);
    } catch (err) {
      console.error('Error fetching prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch prompt');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPrompt();
    }
  }, [id, user?.id]);

  const handleNextImage = () => {
    if (!prompt) return;
    setCurrentImageIndex((prev) => 
      prev === prompt.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    if (!prompt) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? prompt.images.length - 1 : prev - 1
    );
  };

  const handleLike = async () => {
    if (!user || !prompt) return;
    try {
      // Store original state for potential rollback
      const originalLikedState = prompt.isLiked;
      const originalLikesCount = prompt.likes;
      const newLikedState = !prompt.isLiked;
      const newLikesCount = newLikedState ? prompt.likes + 1 : prompt.likes - 1;

      // Optimistic update
      setPrompt(p => p ? { ...p, isLiked: newLikedState, likes: newLikesCount } : null);

      if (newLikedState) {
        const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: prompt.id });
        if (error) {
          // Revert optimistic update on error
          setPrompt(p => p ? { ...p, isLiked: originalLikedState, likes: originalLikesCount } : null);
          throw error;
        }
      } else {
        const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', prompt.id);
        if (error) {
          // Revert optimistic update on error
          setPrompt(p => p ? { ...p, isLiked: originalLikedState, likes: originalLikesCount } : null);
          throw error;
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmark = async () => {
    if (!user || !prompt) return;
    try {
      // Store original state for potential rollback
      const originalBookmarkedState = prompt.isBookmarked;
      const newBookmarkedState = !prompt.isBookmarked;
      
      // Optimistic update
      setPrompt(p => p ? { ...p, isBookmarked: newBookmarkedState } : null);

      if (newBookmarkedState) {
        const { error } = await supabase.from('bookmarks').insert({ user_id: user.id, post_id: prompt.id });
        if (error && error.code === '23505') {
          // Bookmark already exists - this is fine, the optimistic update was correct
          // No need to revert the UI state
          console.log('Bookmark already exists, ignoring duplicate error');
        } else if (error) {
          // For any other error, revert the optimistic update
          console.error('Error creating bookmark:', error);
          // Revert optimistic update on error
          setPrompt(p => p ? { ...p, isBookmarked: originalBookmarkedState } : null);
          throw error;
        }
      } else {
        const { error } = await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('post_id', prompt.id);
        if (error) {
          console.error('Error deleting bookmark:', error);
          // Revert optimistic update on error
          setPrompt(p => p ? { ...p, isBookmarked: originalBookmarkedState } : null);
          throw error;
        }
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handlePostComment = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to post a comment.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    if (newComment.trim() === '' || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      await addComment(newComment);
      setNewComment('');
      
      // Update comment count optimistically
      setPrompt(prev => prev ? {
        ...prev,
        comments: prev.comments + 1
      } : null);
    } catch (err) {
      console.error('Error posting comment:', err);
      Alert.alert('Error', 'Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplyToComment = async (commentId: string, content: string) => {
    if (!isLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to reply to comments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    try {
      await addComment(content, commentId);
      
      // Update comment count optimistically
      setPrompt(prev => prev ? {
        ...prev,
        comments: prev.comments + 1
      } : null);
    } catch (err) {
      console.error('Error posting reply:', err);
      Alert.alert('Error', 'Failed to post reply. Please try again.');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!isLoggedIn) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to like comments.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth') }
        ]
      );
      return;
    }

    try {
      await toggleCommentLike(commentId);
    } catch (err) {
      console.error('Error liking comment:', err);
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    
    return 'Just now';
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: Platform.OS === 'android' ? insets.top + 12 : insets.top + 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    backButton: {
      padding: 8,
      borderRadius: 20,
      marginRight: 12,
      backgroundColor: colors.surfaceVariant,
    },
    headerTitle: {
      flex: 1,
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'left',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    scrollView: {
      flex: 1,
      paddingBottom: insets.bottom,
    },
    imageContainer: {
      position: 'relative',
      height: IMAGE_HEIGHT,
      backgroundColor: colors.surfaceVariant,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageNavigation: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    navLeft: {
      left: 0,
    },
    navRight: {
      right: 0,
    },
    navButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 20,
      padding: 8,
    },
    imageIndicators: {
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeIndicator: {
      backgroundColor: colors.primary,
    },
    content: {
      padding: 20,
    },
    authorSection: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatarContainer: {
      width: 50,
      height: 50,
      marginRight: 16,
    },
    avatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.surface,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surfaceVariant,
    },
    authorInfo: {
      flex: 1,
    },
    authorName: {
      fontSize: 15,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    category: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    timeAgo: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 2,
    },
    promptText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 24,
      marginBottom: 24,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 24,
    },
    tag: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    tagText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    actionsSection: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: 20,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 24,
      backgroundColor: colors.surfaceVariant,
    },
    likedButton: {
      backgroundColor: colors.error + '20',
    },
    bookmarkedButton: {
      backgroundColor: colors.primary + '20',
    },
    actionText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.textSecondary,
      marginLeft: 6,
    },
    likedText: {
      color: colors.error,
    },
    bookmarkedText: {
      color: colors.primary,
    },
    commentsSection: {
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingTop: 24,
      marginTop: 24,
    },
    commentsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    commentsTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginRight: 8,
    },
    commentsCount: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    commentInputContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    commentInputWrapper: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 10,
    },
    commentInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      maxHeight: 100,
      paddingVertical: 6,
      paddingHorizontal: 10,
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 6,
      marginLeft: 6,
      opacity: isSubmittingComment ? 0.6 : 1,
    },
    sendButtonDisabled: {
      backgroundColor: colors.surfaceVariant,
    },
    loginPrompt: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      alignItems: 'center',
    },
    loginPromptText: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 12,
    },
    loginButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    loginButtonText: {
      fontSize: 12,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },
    commentsContainer: {
      gap: 0,
    },
    noComments: {
      textAlign: 'center',
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      paddingVertical: 32,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prompt Details</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading prompt...</Text>
        </View>
      </View>
    );
  }

  if (error || !prompt) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prompt Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>
            {error || 'Prompt not found'}
          </Text>
          <Text style={styles.errorDescription}>
            Please check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPrompt}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Group comments by parent_id for nested display
  const topLevelComments = comments.filter(comment => !comment.parent_id);
  const getReplies = (parentId: string) => comments.filter(comment => comment.parent_id === parentId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
        Prompt Details
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Images Carousel */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: prompt.images[currentImageIndex] }} 
            style={styles.image}
            resizeMode="cover"
          />
          
          {prompt.images.length > 1 && (
            <>
              <TouchableOpacity 
                style={[styles.imageNavigation, styles.navLeft]}
                onPress={handlePrevImage}
              >
                <View style={styles.navButton}>
                  <ChevronLeft size={24} color="white" />
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.imageNavigation, styles.navRight]}
                onPress={handleNextImage}
              >
                <View style={styles.navButton}>
                  <ChevronRight size={24} color="white" />
                </View>
              </TouchableOpacity>

              <View style={styles.imageIndicators}>
                {prompt.images.map((_, index) => (
                  <View 
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.activeIndicator
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Author Section */}
          <View style={styles.authorSection}>
            <View style={styles.avatarContainer}>
              {isAvatarLoading && <View style={[styles.avatar, styles.avatarPlaceholder]} />}
              <Image
                source={{ uri: prompt.author.avatar }}
                style={[styles.avatar, isAvatarLoading && { position: 'absolute' }]}
                onLoad={() => setIsAvatarLoading(false)}
              />
            </View>
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{prompt.author.name}</Text>
              <Text style={styles.category}>{prompt.category}</Text>
              <Text style={styles.timeAgo}>{formatTimeAgo(prompt.createdAt)}</Text>
            </View>
          </View>

          {/* Prompt Text */}
          <Text style={styles.promptText}>{prompt.prompt}</Text>

          {/* Tags */}
          {prompt.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {prompt.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsSection}>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.actionButton, prompt.isLiked && styles.likedButton]}
                onPress={handleLike}
              >
                <Heart 
                  size={18} 
                  color={prompt.isLiked ? colors.error : colors.textSecondary}
                  fill={prompt.isLiked ? colors.error : 'none'}
                />
                <Text style={[styles.actionText, prompt.isLiked && styles.likedText]}>
                  {prompt.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={18} color={colors.textSecondary} />
                <Text style={styles.actionText}>{prompt.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, prompt.isBookmarked && styles.bookmarkedButton]}
                onPress={handleBookmark}
              >
                <Bookmark 
                  size={18} 
                  color={prompt.isBookmarked ? colors.primary : colors.textSecondary}
                  fill={prompt.isBookmarked ? colors.primary : 'none'}
                />
                <Text style={[styles.actionText, prompt.isBookmarked && styles.bookmarkedText]}>
                  {prompt.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <Share size={18} color={colors.textSecondary} />
                <Text style={styles.actionText}>{prompt.shares}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.content}>
          <View style={styles.commentsSection}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <Text style={styles.commentsCount}>({prompt.comments})</Text>
            </View>

            {/* Comment Input */}
            {isLoggedIn ? (
              <View style={styles.commentInputContainer}>
                <View style={styles.commentInputWrapper}>
                  <TextInput
                    style={styles.commentInput}
                    placeholder="Write a comment..."
                    placeholderTextColor={colors.textSecondary}
                    value={newComment}
                    onChangeText={setNewComment}
                    multiline
                    textAlignVertical="top"
                    editable={!isSubmittingComment}
                  />
                  <TouchableOpacity 
                    style={[
                      styles.sendButton,
                      (newComment.trim() === '' || isSubmittingComment) && styles.sendButtonDisabled
                    ]}
                    onPress={handlePostComment}
                    disabled={newComment.trim() === '' || isSubmittingComment}
                  >
                    <Send 
                      size={14} 
                      color={(newComment.trim() === '' || isSubmittingComment) ? colors.textSecondary : colors.white} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.loginPrompt}>
                <Text style={styles.loginPromptText}>
                  Sign in to join the conversation and share your thoughts!
                </Text>
                <TouchableOpacity 
                  style={styles.loginButton}
                  onPress={() => router.push('/auth')}
                >
                  <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Comments List */}
            <View style={styles.commentsContainer}>
              {commentsLoading ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : topLevelComments.length > 0 ? (
                topLevelComments.map((comment) => {
                  const replies = getReplies(comment.id);
                  return (
                    <CommentCard 
                      key={comment.id}
                      comment={comment}
                      onLike={handleCommentLike}
                      onReply={handleReplyToComment}
                      depth={0}
                      maxDepth={2}
                      replies={replies}
                      showReplies={showReplies[comment.id]}
                      onToggleReplies={() => toggleReplies(comment.id)}
                    />
                  );
                })
              ) : (
                <Text style={styles.noComments}>
                  No comments yet. Be the first to share your thoughts!
                </Text>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
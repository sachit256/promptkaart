import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Heart,
  MessageCircle,
  Share,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  ChevronDown,
  ChevronUp,
  CreditCard as Edit,
  ChartBar as BarChart3,
  Brain,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Prompt } from '@/types/prompt';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const IMAGE_HEIGHT = 200;

interface PromptCardProps {
  prompt: Prompt;
  onLike?: (id: string) => void;
  onShare?: (id: string) => void;
  onBookmark?: (id: string) => void;
  bookmarkCount?: number;
}

export function PromptCard({
  prompt,
  onLike,
  onShare,
  onBookmark,
  bookmarkCount,
}: PromptCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);

  const CHAR_LIMIT = 150;
  const shouldShowReadMore = prompt.prompt.length > CHAR_LIMIT;
  const displayText = isExpanded
    ? prompt.prompt
    : prompt.prompt.substring(0, CHAR_LIMIT);

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === prompt.images.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? prompt.images.length - 1 : prev - 1
    );
  };

  const handleCardPress = () => {
    router.push(`/prompt/${prompt.id}`);
  };

  const handleEdit = (e: any) => {
    e.stopPropagation(); // Prevent card press when tapping edit
    router.push(`/edit-post/${prompt.id}`);
  };

  const handleViewActivity = (e: any) => {
    e.stopPropagation(); // Prevent card press when tapping activity
    router.push(`/post-activity/${prompt.id}`);
  };

  const toggleReadMore = (e: any) => {
    e.stopPropagation(); // Prevent card press when tapping read more
    setIsExpanded(!isExpanded);
  };

  const handleAuthAction = (action: () => void) => {
    if (!user) {
      router.push('/auth');
    } else {
      action();
    }
  };

  const handleLikePress = (e: any) => {
    e.stopPropagation(); // Prevent card press when tapping like
    handleAuthAction(() => {
      onLike?.(prompt.id);
    });
  };

  const handleBookmarkPress = (e: any) => {
    e.stopPropagation(); // Prevent card press when tapping bookmark
    handleAuthAction(() => {
      onBookmark?.(prompt.id);
    });
  };

  const handleSharePress = (e: any) => {
    e.stopPropagation(); // Prevent card press when tapping share
    onShare?.(prompt.id);
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 20,
      marginHorizontal: 16,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingBottom: 12,
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
    },
    authorInfo: {
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editButton: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
    },
    authorName: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 2,
    },
    category: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    imageContainer: {
      position: 'relative',
      height: IMAGE_HEIGHT,
      marginHorizontal: 16,
      borderRadius: 12,
      overflow: 'hidden',
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
      paddingHorizontal: 8,
    },
    navLeft: {
      left: 0,
    },
    navRight: {
      right: 0,
    },
    navButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 16,
      padding: 4,
    },
    imageIndicators: {
      position: 'absolute',
      bottom: 12,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    indicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    activeIndicator: {
      backgroundColor: colors.primary,
    },
    content: {
      padding: 16,
    },
    promptContainer: {
      marginBottom: 16,
    },
    promptText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 22,
    },
    readMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      marginTop: 8,
      paddingVertical: 2,
    },
    readMoreText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginRight: 4,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
    },
    tag: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    tagText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: 8,
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 15,
      backgroundColor: 'transparent',
      minWidth: 44,
      justifyContent: 'flex-start',
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    actionButtonBookmark: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: 'transparent',
      minWidth: 44,
      justifyContent: 'center',
    },
    actionButtonActive: {
      backgroundColor: colors.surfaceVariant,
    },
    actionText: {
      fontSize: 11,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginLeft: 3,
    },
    likedText: {
      color: colors.error,
    },
    likedButton: {
      // backgroundColor: colors.surfaceVariant,
    },
    bookmarkedText: {
      color: colors.primary,
    },
    bookmarkedButton: {
      backgroundColor: colors.surfaceVariant,
    },
    authorSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    avatarContainer: {
      width: 40,
      height: 40,
      marginRight: 12,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surfaceVariant,
    },
    aiSourceBadge: {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 8,
    },
    aiSourceText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
    },
  });

  // Use provided bookmark count or default to 0
  const displayBookmarkCount = bookmarkCount || 0;

  // Check if current user owns this prompt
  const isOwner = user?.id === prompt.author.id;

  const getAISourceColor = (aiSource: string) => {
    switch (aiSource) {
      case 'chatgpt': return '#10A37F';
      case 'gemini': return '#4285F4';
      case 'grok': return '#1DA1F2';
      default: return colors.primary;
    }
  };

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.98}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {isAvatarLoading && (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <Image
              source={{ uri: prompt.author.avatar }}
              style={[
                styles.avatar,
                isAvatarLoading && { position: 'absolute' },
              ]}
              onLoad={() => setIsAvatarLoading(false)}
            />
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{prompt.author.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.category}>{prompt.category}</Text>
              <View
                style={[
                  styles.aiSourceBadge,
                  { backgroundColor: getAISourceColor(prompt.ai_source) + '20' },
                ]}
              >
                <Brain size={10} color={getAISourceColor(prompt.ai_source)} />
                <Text
                  style={[
                    styles.aiSourceText,
                    { color: getAISourceColor(prompt.ai_source) },
                  ]}
                >
                  {prompt.ai_source.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          {isOwner && (
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <Edit size={16} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleViewActivity}
              >
                <BarChart3 size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

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
                  <ChevronLeft size={20} color="white" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.imageNavigation, styles.navRight]}
                onPress={handleNextImage}
              >
                <View style={styles.navButton}>
                  <ChevronRight size={20} color="white" />
                </View>
              </TouchableOpacity>

              <View style={styles.imageIndicators}>
                {prompt.images.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentImageIndex && styles.activeIndicator,
                    ]}
                  />
                ))}
              </View>
            </>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Prompt Text with Inline Read More/Less */}
          <View style={styles.promptContainer}>
            <Text style={styles.promptText}>
              {displayText}
              {!isExpanded && shouldShowReadMore && '...'}
            </Text>
            {shouldShowReadMore && (
              <TouchableOpacity
                style={styles.readMoreButton}
                onPress={toggleReadMore}
              >
                <Text style={styles.readMoreText}>
                  {isExpanded ? 'Show less' : 'Read more'}
                </Text>
                {isExpanded ? (
                  <ChevronUp size={16} color={colors.textSecondary} />
                ) : (
                  <ChevronDown size={16} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tagsContainer}>
            {prompt.tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                style={[styles.actionButton, prompt.isLiked && styles.likedButton]}
                onPress={handleLikePress}
              >
                <Heart
                  size={16}
                  color={prompt.isLiked ? colors.error : colors.textSecondary}
                  fill={prompt.isLiked ? colors.error : 'none'}
                />
                <Text style={[styles.actionText, prompt.isLiked && styles.likedText]}>
                  {prompt.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={16} color={colors.textSecondary} />
                <Text style={styles.actionText}>{prompt.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSharePress}
              >
                <Share size={16} color={colors.textSecondary} />
                <Text style={styles.actionText}>{prompt.shares}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.actionButtonBookmark,
                prompt.isBookmarked && styles.bookmarkedButton,
              ]}
              onPress={handleBookmarkPress}
            >
              <Bookmark
                size={16}
                color={prompt.isBookmarked ? colors.primary : colors.textSecondary}
                fill={prompt.isBookmarked ? colors.primary : 'none'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
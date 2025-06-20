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
  Modal,
  StatusBar,
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
  X,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Prompt } from '@/types/prompt';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;

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
  const [imageModalVisible, setImageModalVisible] = useState(false);

  const CHAR_LIMIT = 150;
  const shouldShowReadMore = prompt.prompt.length > CHAR_LIMIT;
  const displayText = isExpanded
    ? prompt.prompt
    : prompt.prompt.substring(0, CHAR_LIMIT);

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

  const handleImagePress = (e: any, index: number) => {
    e.stopPropagation(); // Prevent card press when tapping image
    setCurrentImageIndex(index);
    setImageModalVisible(true);
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
    imageScrollView: {
      marginTop: 4,
      marginBottom: 12,
    },
    imageScrollViewContent: {
      gap: 12,
      paddingHorizontal: 16,
    },
    image: {
      width: CARD_WIDTH - 80,
      height: CARD_WIDTH - 80,
      borderRadius: 12,
      backgroundColor: colors.surfaceVariant,
    },
    content: {
      padding: 16,
      paddingTop: 4,
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
    // Modal styles
    modalContainer: {
      flex: 1,
      backgroundColor: 'black',
    },
    modalHeader: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: StatusBar.currentHeight || 44,
      paddingBottom: 16,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalImageContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalImage: {
      width: width,
      height: width, // Square aspect ratio for modal
      resizeMode: 'contain',
    },
    modalNavigation: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    modalNavButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 25,
      padding: 12,
    },
    modalIndicators: {
      position: 'absolute',
      bottom: 100,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    modalIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },
    modalActiveIndicator: {
      backgroundColor: 'white',
    },
    closeButton: {
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: 20,
      padding: 8,
    },
    navLeft: {
      left: 0,
    },
    navRight: {
      right: 0,
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
    <>
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
          {prompt.images && prompt.images.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScrollView}
              contentContainerStyle={styles.imageScrollViewContent}
            >
              {prompt.images.map((imageUrl, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={(e) => handleImagePress(e, index)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

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

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImageModalVisible(false)}
            >
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalImageContainer}>
            <Image
              source={{ uri: prompt.images[currentImageIndex] }}
              style={styles.modalImage}
              resizeMode="contain"
            />

            {prompt.images.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.modalNavigation, styles.navLeft]}
                  onPress={() => setCurrentImageIndex(prev => prev === 0 ? prompt.images.length - 1 : prev - 1)}
                >
                  <View style={styles.modalNavButton}>
                    <ChevronLeft size={24} color="white" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalNavigation, styles.navRight]}
                  onPress={() => setCurrentImageIndex(prev => prev === prompt.images.length - 1 ? 0 : prev + 1)}
                >
                  <View style={styles.modalNavButton}>
                    <ChevronRight size={24} color="white" />
                  </View>
                </TouchableOpacity>

                <View style={styles.modalIndicators}>
                  {prompt.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.modalIndicator,
                        index === currentImageIndex && styles.modalActiveIndicator,
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
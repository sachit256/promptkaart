import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Heart, MessageSquare, Share, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Comment } from '@/hooks/useComments';
import { router } from 'expo-router';

interface CommentCardProps {
  comment: Comment;
  onLike: (id: string) => void;
  onReply: (id: string, content: string) => void;
  depth: number;
  maxDepth?: number;
  replies?: Comment[];
  showReplies?: boolean;
  onToggleReplies?: () => void;
}

export function CommentCard({ 
  comment, 
  onLike, 
  onReply, 
  depth, 
  maxDepth = 2,
  replies = [],
  showReplies = false,
  onToggleReplies
}: CommentCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const DEFAULT_AVATAR = 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg';

  const handleAuthAction = (action: () => void) => {
    if (!user) {
      router.push('/auth');
    } else {
      action();
    }
  };

  const handleLikePress = () => {
    handleAuthAction(() => onLike(comment.id));
  };

  const handleReplyPress = () => {
    handleAuthAction(() => setIsReplying(!isReplying));
  };

  const handleReplySubmit = async () => {
    if (replyContent.trim() !== '' && !isSubmitting) {
      setIsSubmitting(true);
      try {
        await onReply(comment.id, replyContent);
        setIsReplying(false);
        setReplyContent('');
      } catch (error) {
        console.error('Error submitting reply:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'now';
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m`;
    return `${Math.floor(seconds)}s`;
  };
  
  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginLeft: depth > 0 ? 32 : 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    avatarContainer: {
      width: 32,
      height: 32,
      marginRight: 12,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surfaceVariant,
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    authorName: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 14,
      color: colors.text,
      marginRight: 8,
    },
    timeAgo: {
      fontFamily: 'Inter-Regular',
      fontSize: 13,
      color: colors.textSecondary,
    },
    commentText: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
      marginLeft: 44, // Align with avatar + margin
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 44, // Align with avatar + margin
      gap: 20,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionText: {
      marginLeft: 6,
      fontFamily: 'Inter-Medium',
      fontSize: 13,
      color: colors.textSecondary,
    },
    likedText: {
      color: colors.error,
    },
    replyContainer: {
      marginTop: 12,
      marginLeft: 44, // Align with avatar + margin
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    replyInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      maxHeight: 80,
    },
    replyButton: {
      marginLeft: 12,
      paddingHorizontal: 16,
      paddingVertical: 6,
      backgroundColor: colors.primary,
      borderRadius: 16,
      opacity: isSubmitting ? 0.6 : 1,
    },
    replyButtonText: {
      fontSize: 13,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },
    showRepliesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      marginLeft: 44, // Align with avatar + margin
      paddingVertical: 8,
    },
    showRepliesText: {
      fontSize: 13,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginRight: 4,
    },
    repliesContainer: {
      marginTop: 8,
      borderLeftWidth: 1,
      borderLeftColor: colors.borderLight,
      marginLeft: 22, // Half of avatar width to center the line
    },
    optimisticComment: {
      opacity: 0.7,
    },
  });

  // Check if this is an optimistic comment (temporary ID)
  const isOptimistic = comment.id.startsWith('temp-');

  return (
    <View>
      <View style={[styles.container, isOptimistic && styles.optimisticComment]}>
        {/* Header with Avatar, Name, and Time */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {isAvatarLoading && <View style={[styles.avatar, styles.avatarPlaceholder]} />}
            <Image 
              source={{ uri: comment.author.avatar && comment.author.avatar.trim() !== '' ? comment.author.avatar : DEFAULT_AVATAR }}
              style={[styles.avatar, isAvatarLoading && { position: 'absolute' }]}
              onLoad={() => setIsAvatarLoading(false)}
            />
          </View>
          <View style={styles.headerContent}>
            <Text style={styles.authorName}>{comment.author.name}</Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
          </View>
        </View>

        {/* Comment Text */}
        <Text style={styles.commentText}>{comment.content}</Text>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleLikePress} style={styles.actionButton} disabled={isOptimistic}>
            <Heart 
              size={16} 
              color={comment.isLiked ? colors.error : colors.textSecondary} 
              fill={comment.isLiked ? colors.error : 'none'}
            />
            {comment.likes > 0 && (
              <Text style={[styles.actionText, comment.isLiked && styles.likedText]}>
                {comment.likes}
              </Text>
            )}
          </TouchableOpacity>

          {depth < maxDepth && !isOptimistic && (
            <TouchableOpacity onPress={handleReplyPress} style={styles.actionButton}>
              <MessageSquare size={16} color={colors.textSecondary} />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          )}

          {!isOptimistic && (
            <TouchableOpacity style={styles.actionButton}>
              <Share size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Reply Input */}
        {isReplying && (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder={`Reply to ${comment.author.name}...`}
              placeholderTextColor={colors.textSecondary}
              value={replyContent}
              onChangeText={setReplyContent}
              autoFocus
              multiline
              editable={!isSubmitting}
            />
            <TouchableOpacity 
              onPress={handleReplySubmit} 
              style={styles.replyButton}
              disabled={isSubmitting || replyContent.trim() === ''}
            >
              <Text style={styles.replyButtonText}>
                {isSubmitting ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Show Replies Button */}
        {replies.length > 0 && (
          <TouchableOpacity style={styles.showRepliesButton} onPress={onToggleReplies}>
            <Text style={styles.showRepliesText}>
              {showReplies ? 'Hide replies' : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
            </Text>
            {showReplies ? (
              <ChevronUp size={16} color={colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              depth={depth + 1}
              maxDepth={maxDepth}
            />
          ))}
        </View>
      )}
    </View>
  );
}
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { Heart, MessageSquare, CornerUpLeft } from 'lucide-react-native';
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
}

export function CommentCard({ comment, onLike, onReply, depth, maxDepth = 2 }: CommentCardProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isAvatarLoading, setIsAvatarLoading] = useState(true);
  
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

  const handleReplySubmit = () => {
    if (replyContent.trim() !== '') {
      onReply(comment.id, replyContent);
      setIsReplying(false);
      setReplyContent('');
    }
  };
  
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';

    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 5) return 'Just now';
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
      flexDirection: 'row',
      padding: 12,
      marginLeft: depth > 0 ? 20 * Math.min(depth, 3) : 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.surface,
    },
    avatarContainer: {
      width: 36,
      height: 36,
      marginRight: 12,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
    },
    avatarPlaceholder: {
      backgroundColor: colors.surfaceVariant,
    },
    contentContainer: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    authorName: {
      fontFamily: 'Inter-SemiBold',
      fontSize: 14,
      color: colors.text,
      marginRight: 8,
    },
    timeAgo: {
      fontFamily: 'Inter-Regular',
      fontSize: 12,
      color: colors.textSecondary,
    },
    commentText: {
      fontFamily: 'Inter-Regular',
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
      gap: 24,
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
      flexDirection: 'row',
      alignItems: 'center',
    },
    replyInput: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 18,
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      marginRight: 8,
    },
    replyButton: {
      backgroundColor: colors.primary,
      padding: 8,
      borderRadius: 18,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {isAvatarLoading && <View style={[styles.avatar, styles.avatarPlaceholder]} />}
        <Image 
          source={{ uri: comment.author.avatar && comment.author.avatar.trim() !== '' ? comment.author.avatar : DEFAULT_AVATAR }}
          style={[styles.avatar, isAvatarLoading && { position: 'absolute' }]}
          onLoad={() => setIsAvatarLoading(false)}
        />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.authorName}>{comment.author.name}</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleLikePress} style={styles.actionButton}>
            <Heart 
              size={16} 
              color={comment.isLiked ? colors.error : colors.textSecondary} 
              fill={comment.isLiked ? colors.error : 'none'}
            />
            <Text style={[styles.actionText, comment.isLiked && styles.likedText]}>
              {comment.likes > 0 ? comment.likes : ''}
            </Text>
          </TouchableOpacity>
          {depth < maxDepth && (
            <TouchableOpacity onPress={handleReplyPress} style={styles.actionButton}>
              <MessageSquare size={16} color={colors.textSecondary} />
              <Text style={styles.actionText}>Reply</Text>
            </TouchableOpacity>
          )}
        </View>
        {isReplying && (
          <View style={styles.replyContainer}>
            <TextInput
              style={styles.replyInput}
              placeholder={`Replying to ${comment.author.name}...`}
              placeholderTextColor={colors.textSecondary}
              value={replyContent}
              onChangeText={setReplyContent}
              autoFocus
            />
            <TouchableOpacity onPress={handleReplySubmit} style={styles.replyButton}>
              <CornerUpLeft size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Heart, MessageCircle, Bookmark, Share, Users, TrendingUp, CircleAlert as AlertCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

type PostDetails = {
  id: string;
  prompt: string;
  category: string;
  created_at: string;
  likes: number;
  comments: number;
  shares: number;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
};

interface PostActivity {
  id: string;
  prompt: string;
  category: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  bookmarks_count: number;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface ActivityUser {
  id: string;
  name: string;
  avatar: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user: ActivityUser;
  created_at: string;
  parent_id: string | null;
  replies_count: number;
  likes_count: number;
  replies: Comment[];
}

interface DetailedActivity {
  likes: ActivityUser[];
  comments: Comment[];
  bookmarks: ActivityUser[];
  shares: ActivityUser[];
}

export default function PostActivityScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [post, setPost] = useState<PostActivity | null>(null);
  const [activity, setActivity] = useState<DetailedActivity>({
    likes: [],
    comments: [],
    bookmarks: [],
    shares: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'likes' | 'comments' | 'bookmarks' | 'shares'>('comments');

  const fetchPostActivity = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch post details using the RPC function
      const { data: postData, error: postError } = await supabase.rpc('get_post_details', {
        p_post_id: id,
        p_user_id: user?.id || null,
      }).single<PostDetails>();

      if (postError) throw postError;

      if (!postData) {
        throw new Error('Post not found');
      }

      // Check if current user is the post owner
      if (user?.id !== postData.author.id) {
        throw new Error('You can only view activity for your own posts');
      }

      // Get bookmark count (if needed separately, otherwise it's in postData)
      const { count: bookmarkCount, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id);

      const transformedPost: PostActivity = {
        id: postData.id,
        prompt: postData.prompt,
        category: postData.category,
        created_at: postData.created_at,
        likes_count: postData.likes || 0,
        comments_count: postData.comments || 0,
        shares_count: postData.shares || 0,
        bookmarks_count: bookmarkCount || 0,
        author: {
          id: postData.author.id,
          name: postData.author.name || 'Deleted User',
          avatar: postData.author.avatar && postData.author.avatar.trim() !== '' ? postData.author.avatar : 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg'
        }
      };

      setPost(transformedPost);

      // Fetch detailed activity
      const [likesResponse, commentsResponse, bookmarksResponse] = await Promise.all([
        // Get users who liked this post
        supabase.from('likes').select(`
          user_id,
          created_at,
          profiles!likes_user_id_fkey (username, avatar_url)
        `).eq('post_id', id),

        // Get comments on this post
        supabase.from('comments').select(`
          id,
          content,
          created_at,
          parent_id,
          replies_count,
          likes_count,
          profiles!comments_user_id_fkey (id, username, avatar_url)
        `).eq('post_id', id).order('created_at', { ascending: true }),

        // Get users who bookmarked this post
        supabase.from('bookmarks').select(`
          user_id,
          created_at,
          profiles!bookmarks_user_id_fkey (username, avatar_url)
        `).eq('post_id', id)
      ]);

      const detailedActivity: DetailedActivity = {
        likes: likesResponse.data?.map((like: any) => ({
          id: like.user_id,
          name: like.name || 'Deleted User',
          avatar: like.avatar && like.avatar.trim() !== '' ? like.avatar : 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          created_at: like.created_at,
        })) || [],
        
        comments: commentsResponse.data?.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          user: {
            id: comment.user_id,
            name: comment.full_name || 'Deleted User',
            avatar: comment.avatar_url && comment.avatar_url.trim() !== '' ? comment.avatar_url : 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
            created_at: comment.created_at
          },
          created_at: comment.created_at,
          parent_id: comment.parent_id,
          replies_count: comment.replies_count,
          likes_count: comment.likes_count,
          replies: []
        })) || [],
        
        bookmarks: bookmarksResponse.data?.map((bookmark: any) => ({
          id: bookmark.user_id,
          name: bookmark.name || 'Deleted User',
          avatar: bookmark.avatar && bookmark.avatar.trim() !== '' ? bookmark.avatar : 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
          created_at: bookmark.created_at,
        })) || [],
        
        shares: [] // Shares functionality to be implemented
      };

      setActivity(detailedActivity);
    } catch (err) {
      console.error('Error fetching post activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch post activity');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) {
      fetchPostActivity();
    }
  }, [id, user]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const buildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    comments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment.id, comment);
    });

    comments.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    return rootComments;
  };

  const CommentItem = ({ comment, level = 0, colors }: { comment: Comment, level?: number, colors: ReturnType<typeof useTheme>['colors'] }) => {
    const [showReplies, setShowReplies] = useState(false);

    return (
      <View style={{ marginLeft: level > 0 ? 44 : 0 }}>
        <View style={styles.commentContainer}>
          <Image source={{ uri: comment.user.avatar }} style={styles.userAvatar} />
          <View style={styles.commentBody}>
            <View style={styles.commentHeader}>
              <Text>
                <Text style={[styles.userName, { color: colors.text }]}>{comment.user.name}</Text>
                <Text style={[styles.commentContentText, { color: colors.text }]}> {comment.content}</Text>
              </Text>
            </View>
            <View style={styles.commentFooter}>
              <Text style={[styles.activityTime, { color: colors.secondary }]}>{formatTimeAgo(comment.created_at)}</Text>
              <TouchableOpacity>
                <Text style={[styles.replyAction, { color: colors.secondary }]}>Reply</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity style={styles.likeButton}>
            <Heart size={16} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {comment.replies.length > 0 && (
          <View style={styles.repliesSection}>
            <TouchableOpacity
              style={styles.viewRepliesButton}
              onPress={() => setShowReplies(!showReplies)}
            >
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={[styles.viewRepliesText, { color: colors.secondary }]}>
                {showReplies ? 'Hide replies' : `View ${comment.replies.length} replies`}
              </Text>
            </TouchableOpacity>
            {showReplies && (
              <View>
                {comment.replies.map(reply => (
                  <CommentItem key={reply.id} comment={reply} level={level + 1} colors={colors} />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'likes':
        return (
          <View style={styles.tabContent}>
            {activity.likes.length > 0 ? (
              activity.likes.map((user, index) => (
                <View key={`${user.id}-${index}`} style={styles.activityItem}>
                  <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                  <View style={styles.activityInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.activityTime}>Liked • {formatTimeAgo(user.created_at)}</Text>
                  </View>
                  <Heart size={16} color={colors.error} fill={colors.error} />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No likes yet</Text>
            )}
          </View>
        );

      case 'comments':
        const commentTree = buildCommentTree(activity.comments);
        return (
          <View style={styles.tabContent}>
            {commentTree.length > 0 ? (
              commentTree.map((comment) => (
                <CommentItem key={comment.id} comment={comment} colors={colors} />
              ))
            ) : (
              <Text style={[styles.emptyText, { color: colors.secondary }]}>No comments yet</Text>
            )}
          </View>
        );

      case 'bookmarks':
        return (
          <View style={styles.tabContent}>
            {activity.bookmarks.length > 0 ? (
              activity.bookmarks.map((user, index) => (
                <View key={`${user.id}-${index}`} style={styles.activityItem}>
                  <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                  <View style={styles.activityInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.activityTime}>Bookmarked • {formatTimeAgo(user.created_at)}</Text>
                  </View>
                  <Bookmark size={16} color={colors.primary} fill={colors.primary} />
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No bookmarks yet</Text>
            )}
          </View>
        );

      case 'shares':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.emptyText}>Share tracking coming soon</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
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
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
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
    content: {
      flex: 1,
    },
    postSummary: {
      backgroundColor: colors.surface,
      margin: 16,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    postPrompt: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    postMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    postCategory: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    postDate: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    statsContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statsTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 12,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
    tabsContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tabsHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    activeTabText: {
      color: colors.primary,
    },
    tabContent: {
      maxHeight: 400,
      marginHorizontal: 7,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    commentItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    replyItem: {
      marginLeft: 30,
      marginTop: 15,
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
    },
    activityInfo: {
      flex: 1,
    },
    commentContent: {
      flex: 1,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      marginBottom: 4,
    },
    userName: {
      fontSize: 15,
      fontWeight: 'bold',
    },
    activityTime: {
      fontSize: 12,
    },
    commentText: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 18,
    },
    commentActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 20,
    },
    actionText: {
      marginLeft: 6,
      fontSize: 12,
    },
    viewReplies: {
      marginTop: 10,
      fontWeight: 'bold',
    },
    repliesContainer: {
      marginTop: 10,
      borderLeftWidth: 1,
      paddingLeft: 10,
    },
    emptyText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      paddingVertical: 32,
    },
    commentContainer: {
      flexDirection: 'row',
      paddingVertical: 10,
      alignItems: 'flex-start',
      position: 'relative',
    },
    commentBody: {
      flex: 1,
    },
    commentFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    likesCount: {
      fontSize: 12,
      marginLeft: 16,
    },
    replyAction: {
      fontSize: 12,
      fontWeight: 'bold',
      marginLeft: 16,
    },
    likeButton: {
      paddingLeft: 10,
      paddingTop: 2,
    },
    repliesSection: {
      marginLeft: 44, // Avatar width (32) + margin (12)
    },
    viewRepliesButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    line: {
      width: 24,
      height: 1,
      marginRight: 8,
    },
    viewRepliesText: {
      fontSize: 12,
      fontWeight: 'bold',
    },
    commentInfo: {
      flex: 1,
    },
    commentContentText: {
      fontSize: 14,
    },
    replyLine: {
      position: 'absolute',
      left: -22,
      top: 0,
      bottom: 0,
      width: 1,
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
        Post Activity
        </Text>
      </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading activity...</Text>
        </View>
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Activity</Text>
        </View>
        <View style={styles.errorContainer}>
          <AlertCircle size={64} color={colors.error} style={styles.errorIcon} />
          <Text style={styles.errorText}>
            {error || 'Post not found'}
          </Text>
          <Text style={styles.errorDescription}>
            You can only view activity for your own posts.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post Activity</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Summary */}
        <View style={styles.postSummary}>
          <Text style={styles.postPrompt}>
            {post.prompt}
          </Text>
          <View style={styles.postMeta}>
            <Text style={styles.postCategory}>{post.category}</Text>
            <Text style={styles.postDate}>{formatTimeAgo(post.created_at)}</Text>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Total Engagement</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{post.likes_count}</Text>
              <Text style={styles.statLabel}>Likes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{post.comments_count}</Text>
              <Text style={styles.statLabel}>Comments</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{post.bookmarks_count}</Text>
              <Text style={styles.statLabel}>Bookmarks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{post.shares_count}</Text>
              <Text style={styles.statLabel}>Shares</Text>
            </View>
          </View>
        </View>

        {/* Activity Tabs */}
        <View style={styles.tabsContainer}>
          <View style={styles.tabsHeader}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'likes' && styles.activeTab]}
              onPress={() => setActiveTab('likes')}
            >
              <Text style={[styles.tabText, activeTab === 'likes' && styles.activeTabText]}>
                Likes ({activity.likes.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
              onPress={() => setActiveTab('comments')}
            >
              <Text style={[styles.tabText, activeTab === 'comments' && styles.activeTabText]}>
                Comments ({activity.comments.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'bookmarks' && styles.activeTab]}
              onPress={() => setActiveTab('bookmarks')}
            >
              <Text style={[styles.tabText, activeTab === 'bookmarks' && styles.activeTabText]}>
                Bookmarks ({activity.bookmarks.length})
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.tabContent} nestedScrollEnabled>
            {renderTabContent()}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}
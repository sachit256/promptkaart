import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Image, Platform, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, CreditCard as Edit, Heart, MessageCircle, Share, Sun, Moon, TrendingUp, ChartBar as BarChart3, User, Bookmark, ThumbsUp, Sparkles } from 'lucide-react-native';
import { LogOut } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { resetHasSeenWelcome } from '@/utils/onboarding';

interface UserStats {
  posts: number;
  likes: number;
  shares: number;
  bookmarks: number;
  comments: number;
  likesGiven: number;
  commentsGiven: number;
  bookmarksGiven: number;
}

interface UserPost {
  id: string;
  prompt: string;
  category: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
}

export default function ProfileScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const { user, isLoggedIn, signOut, profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [userStats, setUserStats] = useState<UserStats>({
    posts: 0,
    likes: 0,
    shares: 0,
    bookmarks: 0,
    comments: 0,
    likesGiven: 0,
    commentsGiven: 0,
    bookmarksGiven: 0,
  });
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSignIn = () => {
    router.push('/auth');
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: () => signOut()
        }
      ]
    );
  };

  const handleShowWelcomeAgain = async () => {
    try {
      await resetHasSeenWelcome();
      router.push('/welcome');
    } catch (error) {
      console.error('Error resetting onboarding state:', error);
      Alert.alert('Error', 'Failed to show welcome screen again. Please try again.');
    }
  };

  const fetchUserStats = async () => {
    if (!user || !isLoggedIn) return;

    try {
      setLoading(true);

      // Get user's posts
      const { data: userPostsData } = await supabase
        .from('posts')
        .select('id, prompt, category, created_at, likes_count, comments_count, shares_count')
        .eq('user_id', user.id);

      const postIds = userPostsData?.map(post => post.id) || [];
      setUserPosts(userPostsData || []);

      // Fetch user statistics in parallel
      const [
        postsResponse,
        likesGivenResponse,
        bookmarksResponse,
        commentsGivenResponse,
        likesReceivedResponse,
        bookmarksGivenResponse
      ] = await Promise.all([
        supabase
          .from('posts')
          .select('id')
          .eq('user_id', user.id),
        
        // Likes given by user
        supabase
          .from('likes')
          .select('id')
          .eq('user_id', user.id),
        
        // Bookmarks created by user
        supabase
          .from('bookmarks')
          .select('id')
          .eq('user_id', user.id),
        
        // Comments made by user
        supabase
          .from('comments')
          .select('id')
          .eq('user_id', user.id),
        
        // Likes received on user's posts (only if user has posts)
        postIds.length > 0 ? supabase
          .from('likes')
          .select('id')
          .in('post_id', postIds) : Promise.resolve({ data: [] }),
        
        // Bookmarks received on user's posts
        postIds.length > 0 ? supabase
          .from('bookmarks')
          .select('id')
          .in('post_id', postIds) : Promise.resolve({ data: [] })
      ]);

      const totalShares = userPostsData?.reduce((sum, post) => sum + (post.shares_count || 0), 0) || 0;

      setUserStats({
        posts: postsResponse.data?.length || 0,
        likes: likesReceivedResponse.data?.length || 0, // Likes received on user's content
        shares: totalShares,
        bookmarks: bookmarksGivenResponse.data?.length || 0, // Bookmarks received on user's posts
        comments: commentsGivenResponse.data?.length || 0, // Comments made by user
        likesGiven: likesGivenResponse.data?.length || 0,
        commentsGiven: commentsGivenResponse.data?.length || 0,
        bookmarksGiven: bookmarksResponse.data?.length || 0,
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewPostActivity = (postId: string) => {
    router.push(`/post-activity/${postId}`);
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchUserStats();
    }
  }, [isLoggedIn, user]);

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
    settingsButton: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      padding: 8,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      paddingBottom: insets.bottom + 140, // Generous padding for floating tab bar
    },
    profileSection: {
      backgroundColor: colors.surface,
      margin: 16,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    guestAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    guestAvatarText: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: colors.textSecondary,
    },
    guestName: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 8,
    },
    guestDescription: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    signInButton: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      paddingHorizontal: 32,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    signInButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
      marginLeft: 8,
    },
    userAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      marginBottom: 16,
    },
    userName: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginBottom: 20,
    },
    signOutButton: {
      backgroundColor: colors.error + '20',
      borderRadius: 24,
      paddingHorizontal: 32,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.error + '40',
    },
    signOutButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.error,
      marginLeft: 8,
    },
    statsSection: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    statsTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 20,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    additionalStatsSection: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    additionalStatsTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    additionalStatsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    additionalStatItem: {
      width: '48%',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
    },
    additionalStatIcon: {
      marginBottom: 8,
    },
    additionalStatValue: {
      fontSize: 18,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginBottom: 4,
    },
    additionalStatLabel: {
      fontSize: 11,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    settingsSection: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    lastSettingItem: {
      borderBottomWidth: 0,
    },
    settingIcon: {
      marginRight: 16,
    },
    settingText: {
      flex: 1,
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.text,
    },
    settingValue: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    postsSection: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginBottom: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    postsSectionTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      padding: 20,
      paddingBottom: 8,
    },
    postItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    postContent: {
      flex: 1,
      marginRight: 12,
    },
    postPrompt: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 18,
      marginBottom: 4,
    },
    postCategory: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.primary,
    },
    postStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    postStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    postStatText: {
      fontSize: 12,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    viewAllButton: {
      padding: 16,
      alignItems: 'center',
    },
    viewAllText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginLeft: 8,
    },
  });

  const mainStats = [
    { 
      label: 'Posts', 
      value: userStats.posts.toString(), 
      icon: MessageCircle,
      color: colors.primary 
    },
    { 
      label: 'Likes', 
      value: userStats.likes.toString(), 
      icon: Heart,
      color: colors.error 
    },
    { 
      label: 'Shares', 
      value: userStats.shares.toString(), 
      icon: Share,
      color: colors.success 
    },
  ];

  const additionalStats = [
    { 
      label: 'Bookmarks Given', 
      value: userStats.bookmarksGiven, 
      icon: Bookmark,
      color: colors.primary 
    },
    { 
      label: 'Comments Made', 
      value: userStats.commentsGiven, 
      icon: MessageCircle,
      color: colors.secondary 
    },
    { 
      label: 'Likes Given', 
      value: userStats.likesGiven, 
      icon: ThumbsUp,
      color: colors.error 
    },
    { 
      label: 'Total Engagement', 
      value: userStats.likes + userStats.bookmarks + userStats.shares, 
      icon: TrendingUp,
      color: colors.success 
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        {isLoggedIn ? (
          <View style={styles.profileSection}>
            <Image 
              source={{ 
                uri: user?.avatar || profile?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg' 
              }} 
              style={styles.userAvatar} 
            />
            <Text style={styles.userName}>
              {user?.name || profile?.username || 'User'}
            </Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <LogOut size={18} color={colors.error} />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileSection}>
            <View style={styles.guestAvatar}>
              <User size={32} color={colors.textSecondary} />
            </View>
            <Text style={styles.guestName}>Welcome!</Text>
            <Text style={styles.guestDescription}>
              Sign in to create prompts, like content, and connect with the community.
            </Text>
            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <Edit size={18} color={colors.white} />
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats Section */}
        {isLoggedIn && (
          <>
            <View style={styles.statsSection}>
              <Text style={styles.statsTitle}>Your Activity</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading stats...</Text>
                </View>
              ) : (
                <View style={styles.statsGrid}>
                  {mainStats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <View key={index} style={styles.statItem}>
                        <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
                          <IconComponent size={20} color={stat.color} />
                        </View>
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Additional Stats Section */}
            <View style={styles.additionalStatsSection}>
              <Text style={styles.additionalStatsTitle}>Detailed Activity</Text>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading details...</Text>
                </View>
              ) : (
                <View style={styles.additionalStatsGrid}>
                  {additionalStats.map((stat, index) => {
                    const IconComponent = stat.icon;
                    return (
                      <View key={index} style={styles.additionalStatItem}>
                        <View style={styles.additionalStatIcon}>
                          <IconComponent size={18} color={stat.color} />
                        </View>
                        <Text style={styles.additionalStatValue}>{stat.value}</Text>
                        <Text style={styles.additionalStatLabel}>{stat.label}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* User Posts Section */}
            {userPosts.length > 0 && (
              <View style={styles.postsSection}>
                <Text style={styles.postsSectionTitle}>Recent Posts</Text>
                {userPosts.slice(0, 3).map((post) => (
                  <TouchableOpacity 
                    key={post.id} 
                    style={styles.postItem}
                    onPress={() => handleViewPostActivity(post.id)}
                  >
                    <View style={styles.postContent}>
                      <Text style={styles.postPrompt} numberOfLines={2}>
                        {post.prompt}
                      </Text>
                      <Text style={styles.postCategory}>{post.category}</Text>
                    </View>
                    <View style={styles.postStats}>
                      <View style={styles.postStatItem}>
                        <Heart size={12} color={colors.error} />
                        <Text style={styles.postStatText}>{post.likes_count}</Text>
                      </View>
                      <View style={styles.postStatItem}>
                        <MessageCircle size={12} color={colors.primary} />
                        <Text style={styles.postStatText}>{post.comments_count}</Text>
                      </View>
                      <BarChart3 size={16} color={colors.textSecondary} />
                    </View>
                  </TouchableOpacity>
                ))}
                {userPosts.length > 3 && (
                  <TouchableOpacity style={styles.viewAllButton}>
                    <Text style={styles.viewAllText}>View All Posts</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleShowWelcomeAgain}
          >
            <View style={styles.settingIcon}>
              <Sparkles size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.settingText}>Show Welcome Again</Text>
            <Text style={styles.settingValue}>Onboarding</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.settingItem, styles.lastSettingItem]}
            onPress={toggleTheme}
          >
            <View style={styles.settingIcon}>
              {theme === 'dark' ? (
                <Sun size={20} color={colors.textSecondary} />
              ) : (
                <Moon size={20} color={colors.textSecondary} />
              )}
            </View>
            <Text style={styles.settingText}>Appearance</Text>
            <Text style={styles.settingValue}>
              {theme === 'dark' ? 'Dark' : 'Light'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
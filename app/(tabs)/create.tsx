import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Image, Type, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';

export default function CreateScreen() {
  const { colors } = useTheme();
  const { isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const handleCreatePrompt = () => {
    if (!isLoggedIn) {
      // Navigate to auth if user is not logged in
      router.push('/auth');
    } else {
      // Navigate to create post screen
      router.push('/create-post');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
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
    content: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 20,
      paddingBottom: 140, // Fixed padding for floating tab bar
    },
    createOptions: {
      gap: 16,
    },
    optionCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    optionIcon: {
      marginRight: 12,
    },
    optionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    optionDescription: {
      fontSize: 15,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 16,
    },
    optionButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    optionButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },
    featuredSection: {
      marginTop: 32,
    },
    sectionTitle: {
      fontSize: 20,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 16,
    },
    featureCard: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    featureText: {
      flex: 1,
      marginRight: 12,
    },
    featureTitle: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.createOptions}>
            <TouchableOpacity style={styles.optionCard} onPress={handleCreatePrompt}>
              <View style={styles.optionHeader}>
                <Type size={24} color={colors.primary} style={styles.optionIcon} />
                <Text style={styles.optionTitle}>Your Prompt</Text>
              </View>
              <Text style={styles.optionDescription}>
                Create a detailed prompt with descriptions, instructions, and creative ideas.
              </Text>
              <TouchableOpacity style={styles.optionButton} onPress={handleCreatePrompt}>
                <Text style={styles.optionButtonText}>Create Your Prompt</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Pro Tip</Text>
            <View style={styles.featureCard}>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  {isLoggedIn ? 'Start creating amazing prompts' : 'Sign in to create prompts'}
                </Text>
                <Text style={styles.featureDescription}>
                  {isLoggedIn 
                    ? 'Share your creative ideas and inspire others in the community.'
                    : 'Login or create an account to start sharing your creative prompts with the community.'
                  }
                </Text>
              </View>
              <Plus size={24} color={colors.primary} />
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
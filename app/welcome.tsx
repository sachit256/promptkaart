import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { 
  ArrowRight, 
  Sparkles, 
  Brain, 
  Users, 
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import { setHasSeenWelcome } from '@/utils/onboarding';

const { width, height } = Dimensions.get('window');

interface OnboardingPage {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  backgroundColor: string;
}

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const pages: OnboardingPage[] = [
    {
      id: '1',
      title: 'Welcome to PromptKaart',
      description: 'Your creative companion for generating amazing AI prompts. Discover, create, and share prompts that bring your ideas to life.',
      icon: <Sparkles size={80} color="#10A37F" />,
      backgroundColor: '#10A37F20',
    },
    {
      id: '2',
      title: 'AI-Powered Creativity',
      description: 'Access multiple AI models including ChatGPT, Gemini, and Grok. Get the best results for your creative projects.',
      icon: <Brain size={80} color="#4285F4" />,
      backgroundColor: '#4285F420',
    },
    {
      id: '3',
      title: 'Share & Discover',
      description: 'Join a community of creators. Share your prompts, discover trending ideas, and get inspired by others.',
      icon: <Users size={80} color="#1DA1F2" />,
      backgroundColor: '#1DA1F220',
    },
    {
      id: '4',
      title: 'Ready to Create?',
      description: 'Start your creative journey today. Generate stunning prompts and bring your imagination to reality.',
      icon: <Zap size={80} color="#FF6B35" />,
      backgroundColor: '#FF6B3520',
    },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollViewRef.current?.scrollTo({
      x: page * width,
      animated: true,
    });
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      handlePageChange(currentPage + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    try {
      await setHasSeenWelcome(true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error setting onboarding state:', error);
      router.replace('/(tabs)');
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    page: {
      width,
      height: height - insets.top - insets.bottom,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    iconContainer: {
      width: 160,
      height: 160,
      borderRadius: 80,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 48,
    },
    title: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: 36,
    },
    description: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: width * 0.8,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: 32,
      paddingBottom: insets.bottom + 32,
      backgroundColor: colors.background,
    },
    pageIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
    },
    indicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surfaceVariant,
      marginHorizontal: 4,
    },
    activeIndicator: {
      backgroundColor: colors.primary,
      width: 24,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    skipButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    skipText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    nextButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    nextButtonText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
      marginRight: 8,
    },
    getStartedButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    getStartedText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
      marginRight: 8,
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const page = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentPage(page);
        }}
        style={styles.scrollView}
      >
        {pages.map((page, index) => (
          <View key={page.id} style={styles.page}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: page.backgroundColor },
              ]}
            >
              {page.icon}
            </View>
            <Text style={styles.title}>{page.title}</Text>
            <Text style={styles.description}>{page.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.pageIndicator}>
          {pages.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentPage && styles.activeIndicator,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          {currentPage < pages.length - 1 ? (
            <>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>Next</Text>
                <ChevronRight size={20} color={colors.white} />
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <Text style={styles.getStartedText}>Get Started</Text>
              <ArrowRight size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
} 
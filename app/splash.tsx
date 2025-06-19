import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import { Sparkles, Zap } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
    ]).start();

    // Navigate to welcome screen after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    logo: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    logoText: {
      fontSize: 32,
      fontFamily: 'Inter-Bold',
      color: colors.white,
      letterSpacing: 1,
    },
    appName: {
      fontSize: 28,
      fontFamily: 'Inter-Bold',
      color: colors.text,
      marginTop: 24,
      letterSpacing: 0.5,
    },
    tagline: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
    },
    sparkleContainer: {
      position: 'absolute',
      top: height * 0.3,
      right: width * 0.2,
    },
    sparkleContainer2: {
      position: 'absolute',
      bottom: height * 0.3,
      left: width * 0.2,
    },
    sparkle: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingContainer: {
      position: 'absolute',
      bottom: height * 0.15,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      marginTop: 8,
    },
  });

  return (
    <View style={styles.container}>
      {/* Animated sparkles */}
      <Animated.View style={[styles.sparkleContainer, { opacity: sparkleOpacity }]}>
        <View style={styles.sparkle}>
          <Sparkles size={16} color={colors.primary} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.sparkleContainer2, { opacity: sparkleOpacity }]}>
        <View style={styles.sparkle}>
          <Zap size={16} color={colors.primary} />
        </View>
      </Animated.View>

      {/* Main logo and text */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.logo,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        >
          <Text style={styles.logoText}>PK</Text>
        </Animated.View>
        <Text style={styles.appName}>PromptKaart</Text>
        <Text style={styles.tagline}>Unleash Your Creative Potential</Text>
      </Animated.View>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <Animated.View
          style={{
            width: 40,
            height: 4,
            backgroundColor: colors.surfaceVariant,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Animated.View
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: colors.primary,
              transform: [
                {
                  translateX: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-40, 40],
                  }),
                },
              ],
            }}
          />
        </Animated.View>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </View>
  );
} 
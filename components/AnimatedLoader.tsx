import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Bot, Sparkles, Zap } from 'lucide-react-native';

const quotes = [
  "Brewing up some brilliant ideas...",
  "Teaching the pixels to dance...",
  "Asking the AI for its masterpiece...",
  "Warming up the creative circuits...",
  "Generating a spark of genius...",
];

export function AnimatedLoader({ fullScreen = true }: { fullScreen?: boolean }) {
  const { colors } = useTheme();
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const progress = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Animate the progress bar
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    ).start();

    // Rotate the main icon
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Animate sparkles
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle1, {
          toValue: 1,
          duration: 1500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle1, {
          toValue: 0,
          duration: 1500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle2, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(sparkle2, {
          toValue: 0,
          duration: 2000,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1000,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cycle through quotes
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % quotes.length);
    }, 3000);

    return () => {
      clearInterval(quoteInterval);
    };
  }, []);

  const rotationDegree = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkle1Opacity = sparkle1.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  const sparkle2Opacity = sparkle2.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.2, 0.8, 0.2],
  });

  const progressBarWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 32,
    },
    inlineContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 100,
      padding: 32,
    },
    animationContainer: {
      width: 150,
      height: 150,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 32,
      position: 'relative',
    },
    mainIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    sparkleContainer: {
      position: 'absolute',
    },
    sparkle1: {
      top: 10,
      right: 10,
    },
    sparkle2: {
      bottom: 10,
      left: 10,
    },
    sparkle3: {
      top: 40,
      left: -10,
    },
    quoteText: {
      fontSize: 16,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
      height: 40,
      minHeight: 40,
    },
    progressBarContainer: {
      width: '80%',
      height: 8,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
    },
  });

  return (
    <View style={fullScreen ? styles.container : styles.inlineContainer}>
      <View style={styles.animationContainer}>
        {/* Sparkle animations */}
        <Animated.View style={[styles.sparkleContainer, styles.sparkle1, { opacity: sparkle1Opacity }]}>
          <Sparkles size={20} color={colors.primary} />
        </Animated.View>
        
        <Animated.View style={[styles.sparkleContainer, styles.sparkle2, { opacity: sparkle2Opacity }]}>
          <Zap size={18} color={colors.primary} />
        </Animated.View>
        
        <Animated.View style={[styles.sparkleContainer, styles.sparkle3, { opacity: sparkle1Opacity }]}>
          <Sparkles size={16} color={colors.primary} />
        </Animated.View>

        {/* Main animated icon */}
        <Animated.View 
          style={[
            styles.mainIcon,
            {
              transform: [
                { rotate: rotationDegree },
                { scale: pulse }
              ]
            }
          ]}
        >
          <Bot size={40} color={colors.white} />
        </Animated.View>
      </View>
      
      <Text style={styles.quoteText}>{quotes[currentQuoteIndex]}</Text>
      
      <View style={styles.progressBarContainer}>
        <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
      </View>
    </View>
  );
} 
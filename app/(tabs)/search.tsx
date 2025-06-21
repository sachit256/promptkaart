import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, Filter, Sparkles, Zap, Brain } from 'lucide-react-native';
import { PromptCard } from '@/components/PromptCard';
import { mockPrompts } from '@/data/mockData';
import { Prompt } from '@/types/prompt';

// Animated Search Placeholder Component
function AnimatedSearchPlaceholder({ colors }: { colors: any }) {
  const searchIconAnim = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Search icon rotation
    Animated.loop(
      Animated.timing(searchIconAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Sparkle animations
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
          duration: 2000,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2500,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const searchIconRotation = searchIconAnim.interpolate({
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

  const floatTranslateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -10],
  });

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      marginBottom: 100,
      paddingTop: -50,
    }}>
      <View style={{
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        position: 'relative',
      }}>
        {/* Sparkle animations */}
        <Animated.View style={{
          position: 'absolute',
          top: 5,
          right: 5,
          opacity: sparkle1Opacity,
          transform: [{ translateY: floatTranslateY }],
        }}>
          <Sparkles size={20} color={colors.primary} />
        </Animated.View>
        
        <Animated.View style={{
          position: 'absolute',
          bottom: 5,
          left: 5,
          opacity: sparkle2Opacity,
          transform: [{ translateY: floatTranslateY }],
        }}>
          <Zap size={18} color={colors.primary} />
        </Animated.View>
        
        <Animated.View style={{
          position: 'absolute',
          top: 35,
          left: -5,
          opacity: sparkle1Opacity,
          transform: [{ translateY: floatTranslateY }],
        }}>
          <Brain size={16} color={colors.primary} />
        </Animated.View>

        {/* Main search icon */}
        <Animated.View style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.3,
          shadowRadius: 16,
          elevation: 8,
          transform: [
            { rotate: searchIconRotation },
            { scale: pulse },
            { translateY: floatTranslateY }
          ]
        }}>
          <Search size={32} color={colors.white} />
        </Animated.View>
      </View>
      
      <Text style={{
        fontSize: 24,
        fontFamily: 'Inter-Bold',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 12,
      }}>
        Discover Amazing Prompts
      </Text>
      
      <Text style={{
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 8,
      }}>
        Search through thousands of creative AI prompts
      </Text>
      
    </View>
  );
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPrompts, setFilteredPrompts] = useState<Prompt[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredPrompts([]);
      return;
    }

    const filtered = mockPrompts.filter(prompt =>
      (prompt.prompt && prompt.prompt.toLowerCase().includes(query.toLowerCase())) ||
      (prompt.category && prompt.category.toLowerCase().includes(query.toLowerCase())) ||
      (prompt.tags && prompt.tags.some(tag => tag && tag.toLowerCase().includes(query.toLowerCase())))
    );
    setFilteredPrompts(filtered);
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
      marginBottom: 16,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchInput: {
      flex: 1,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 24,
      paddingLeft: 20,
      paddingRight: 48,
      paddingVertical: 12,
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      textAlign: 'left',
    },
    filterButton: {
      backgroundColor: colors.primary,
      borderRadius: 24,
      padding: 12,
    },
    content: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 100,
    },
    emptyText: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    searchHint: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    resultsHeader: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    resultsText: {
      fontSize: 16,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 140, // Fixed padding for floating tab bar
    },
    noResultsState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
      paddingTop: 60,
    },
    noResultsText: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    noResultsHint: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.searchContainer}>
          <View style={{ position: 'relative', flex: 1, justifyContent: 'center' }}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search prompts, categories, tags..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <Search 
              size={18} 
              color={colors.textSecondary} 
              style={{ 
                position: 'absolute', 
                right: 16, 
                top: '50%',
                marginTop: -9
              }} 
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {searchQuery === '' ? (
          <AnimatedSearchPlaceholder colors={colors} />
        ) : (
          <>
            {filteredPrompts.length > 0 && (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsText}>
                  {filteredPrompts.length} result{filteredPrompts.length !== 1 ? 's' : ''} found
                </Text>
              </View>
            )}
            
            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredPrompts.length > 0 ? (
                filteredPrompts.map((prompt) => (
                  <PromptCard key={prompt.id} prompt={prompt} />
                ))
              ) : (
                <View style={styles.noResultsState}>
                  <Search size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
                  <Text style={styles.noResultsText}>No results found</Text>
                  <Text style={styles.noResultsHint}>
                    Try different keywords or browse our categories
                  </Text>
                </View>
              )}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}
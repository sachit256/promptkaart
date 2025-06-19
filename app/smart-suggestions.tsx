import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Sparkles, TrendingUp, Clock, Zap, Brain, Wand as Wand2 } from 'lucide-react-native';
import { router } from 'expo-router';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
  tags: string[];
  aiSource: 'chatgpt' | 'gemini' | 'grok';
  trending: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export default function SmartSuggestionsScreen() {
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All', icon: Sparkles },
    { id: 'trending', name: 'Trending', icon: TrendingUp },
    { id: 'recent', name: 'Recent', icon: Clock },
    { id: 'personalized', name: 'For You', icon: Brain },
  ];

  const mockSuggestions: Suggestion[] = [
    {
      id: '1',
      title: 'Cyberpunk Cityscape',
      description: 'Create a futuristic neon-lit city with flying cars',
      prompt: 'Design a sprawling cyberpunk metropolis at night, featuring towering skyscrapers with holographic advertisements, neon-lit streets bustling with flying vehicles, and rain-slicked surfaces reflecting the colorful lights. Include futuristic architecture with glass and steel, elevated highways, and a dark, moody atmosphere.',
      category: 'Sci-Fi',
      tags: ['cyberpunk', 'futuristic', 'neon', 'cityscape'],
      aiSource: 'chatgpt',
      trending: true,
      difficulty: 'intermediate',
    },
    {
      id: '2',
      title: 'Enchanted Forest',
      description: 'Magical woodland with glowing creatures',
      prompt: 'Create an enchanted forest where ancient trees have bioluminescent bark, magical creatures with translucent wings flutter between floating mushrooms, and ethereal light filters through the canopy. Include mystical fog, glowing flowers, and hidden fairy dwellings carved into tree trunks.',
      category: 'Fantasy',
      tags: ['fantasy', 'magical', 'forest', 'creatures'],
      aiSource: 'gemini',
      trending: false,
      difficulty: 'beginner',
    },
    {
      id: '3',
      title: 'Abstract Geometric Art',
      description: 'Modern minimalist geometric composition',
      prompt: 'Design a minimalist abstract composition using geometric shapes in a harmonious color palette. Focus on balance, negative space, and the interplay between circles, triangles, and rectangles. Use gradients and subtle shadows to create depth while maintaining a clean, modern aesthetic.',
      category: 'Abstract',
      tags: ['geometric', 'minimalist', 'modern', 'abstract'],
      aiSource: 'grok',
      trending: true,
      difficulty: 'advanced',
    },
    {
      id: '4',
      title: 'Underwater Civilization',
      description: 'Advanced aquatic society beneath the waves',
      prompt: 'Envision an advanced underwater civilization with coral-based architecture, bioluminescent technology, and aquatic beings living in harmony with sea life. Include underwater cities with flowing organic structures, transportation via trained sea creatures, and gardens of colorful coral and seaweed.',
      category: 'Sci-Fi',
      tags: ['underwater', 'civilization', 'aquatic', 'bioluminescent'],
      aiSource: 'chatgpt',
      trending: false,
      difficulty: 'intermediate',
    },
    {
      id: '5',
      title: 'Steampunk Workshop',
      description: 'Victorian-era inventor\'s mechanical laboratory',
      prompt: 'Create a detailed steampunk inventor\'s workshop filled with brass gears, copper pipes, steam-powered machinery, and intricate clockwork devices. Include workbenches covered with blueprints, mechanical tools, and half-finished inventions. Add warm lighting from gas lamps and the glow of furnaces.',
      category: 'Steampunk',
      tags: ['steampunk', 'victorian', 'mechanical', 'workshop'],
      aiSource: 'gemini',
      trending: true,
      difficulty: 'advanced',
    },
  ];

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth');
    } else {
      fetchSuggestions();
    }
  }, [isLoggedIn]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSuggestions(mockSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSuggestions();
    setRefreshing(false);
  };

  const filteredSuggestions = suggestions.filter(suggestion => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'trending') return suggestion.trending;
    if (selectedCategory === 'recent') return true; // Would filter by date in real app
    if (selectedCategory === 'personalized') return true; // Would use user preferences
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const getAISourceColor = (aiSource: string) => {
    switch (aiSource) {
      case 'chatgpt': return '#10A37F';
      case 'gemini': return '#4285F4';
      case 'grok': return '#1DA1F2';
      default: return colors.primary;
    }
  };

  const handleUsePrompt = (suggestion: Suggestion) => {
    router.push({
      pathname: '/create-post',
      params: {
        prefilledPrompt: suggestion.prompt,
        prefilledCategory: suggestion.category,
        prefilledTags: JSON.stringify(suggestion.tags),
        prefilledAiSource: suggestion.aiSource,
      }
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
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
    sparkleIcon: {
      backgroundColor: colors.primary + '20',
      borderRadius: 20,
      padding: 8,
    },
    categoriesContainer: {
      backgroundColor: colors.surface,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    categoriesScroll: {
      flexDirection: 'row',
      gap: 12,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceVariant,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    categoryButtonActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    categoryText: {
      fontSize: 14,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
      marginLeft: 6,
    },
    categoryTextActive: {
      color: colors.primary,
    },
    content: {
      flex: 1,
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
    suggestionCard: {
      backgroundColor: colors.surface,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    suggestionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    suggestionTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      flex: 1,
      marginRight: 12,
    },
    trendingBadge: {
      backgroundColor: colors.error + '20',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    trendingText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      color: colors.error,
      marginLeft: 4,
    },
    suggestionDescription: {
      fontSize: 14,
      fontFamily: 'Inter-Regular',
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    suggestionPrompt: {
      fontSize: 13,
      fontFamily: 'Inter-Regular',
      color: colors.text,
      lineHeight: 18,
      backgroundColor: colors.surfaceVariant,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    suggestionMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    metaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    categoryBadge: {
      backgroundColor: colors.primary + '20',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    categoryBadgeText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      color: colors.primary,
    },
    difficultyBadge: {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    difficultyText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
    },
    aiSourceBadge: {
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    aiSourceText: {
      fontSize: 10,
      fontFamily: 'Inter-SemiBold',
      marginLeft: 4,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 16,
    },
    tag: {
      backgroundColor: colors.surfaceVariant,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    tagText: {
      fontSize: 10,
      fontFamily: 'Inter-Medium',
      color: colors.textSecondary,
    },
    useButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    useButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
      marginLeft: 6,
    },
  });

  if (!isLoggedIn) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart Suggestions</Text>
        <View style={styles.sparkleIcon}>
          <Sparkles size={20} color={colors.primary} />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {categories.map((category) => {
            const IconComponent = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  isSelected && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <IconComponent
                  size={16}
                  color={isSelected ? colors.primary : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryText,
                    isSelected && styles.categoryTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading suggestions...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {filteredSuggestions.map((suggestion) => (
              <View key={suggestion.id} style={styles.suggestionCard}>
                <View style={styles.suggestionHeader}>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  {suggestion.trending && (
                    <View style={styles.trendingBadge}>
                      <TrendingUp size={10} color={colors.error} />
                      <Text style={styles.trendingText}>TRENDING</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.suggestionDescription}>
                  {suggestion.description}
                </Text>

                <Text style={styles.suggestionPrompt}>
                  {suggestion.prompt}
                </Text>

                <View style={styles.suggestionMeta}>
                  <View style={styles.metaLeft}>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryBadgeText}>
                        {suggestion.category}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.difficultyBadge,
                        { backgroundColor: getDifficultyColor(suggestion.difficulty) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.difficultyText,
                          { color: getDifficultyColor(suggestion.difficulty) },
                        ]}
                      >
                        {suggestion.difficulty.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.aiSourceBadge,
                      { backgroundColor: getAISourceColor(suggestion.aiSource) + '20' },
                    ]}
                  >
                    <Brain size={10} color={getAISourceColor(suggestion.aiSource)} />
                    <Text
                      style={[
                        styles.aiSourceText,
                        { color: getAISourceColor(suggestion.aiSource) },
                      ]}
                    >
                      {suggestion.aiSource.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.tagsContainer}>
                  {suggestion.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>#{tag}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.useButton}
                  onPress={() => handleUsePrompt(suggestion)}
                >
                  <Wand2 size={16} color={colors.white} />
                  <Text style={styles.useButtonText}>Use This Prompt</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
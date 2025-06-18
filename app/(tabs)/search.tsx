import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { Search, Filter } from 'lucide-react-native';
import { PromptCard } from '@/components/PromptCard';
import { mockPrompts } from '@/data/mockData';
import { Prompt } from '@/types/prompt';

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
      prompt.title.toLowerCase().includes(query.toLowerCase()) ||
      prompt.description.toLowerCase().includes(query.toLowerCase()) ||
      prompt.category.toLowerCase().includes(query.toLowerCase()) ||
      prompt.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Search for prompts</Text>
            <Text style={styles.searchHint}>
              Try searching for titles, categories, or tags
            </Text>
          </View>
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
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No results found</Text>
                  <Text style={styles.searchHint}>
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
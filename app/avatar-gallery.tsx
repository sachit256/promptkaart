import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Dimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { ArrowLeft, Check } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAvatar } from '@/contexts/AvatarContext';

const { width } = Dimensions.get('window');
const AVATAR_SIZE = (width - 80) / 3; // 3 avatars per row with padding
const NUM_COLUMNS = 3;

// AI-generated human avatars from various sources
const AI_HUMAN_AVATARS = [
  'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg',
  'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg',
  'https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg',
  'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg',
  'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg',
  'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg',
  'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg',
  'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg',
  'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg',
  'https://images.pexels.com/photos/1484794/pexels-photo-1484794.jpeg',
  'https://images.pexels.com/photos/1559486/pexels-photo-1559486.jpeg',
  'https://images.pexels.com/photos/1542085/pexels-photo-1542085.jpeg',
  'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg',
  'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg',
  'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg',
  'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
  'https://images.pexels.com/photos/1758144/pexels-photo-1758144.jpeg',
  'https://images.pexels.com/photos/1844012/pexels-photo-1844012.jpeg',
  'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg',
  'https://images.pexels.com/photos/1933873/pexels-photo-1933873.jpeg',
  'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
  'https://images.pexels.com/photos/2381069/pexels-photo-2381069.jpeg',
  'https://images.pexels.com/photos/2709388/pexels-photo-2709388.jpeg',
];

interface AvatarItemProps {
  avatar: string;
  index: number;
  selectedAvatar: string | null;
  onSelect: (avatar: string) => void;
  colors: any;
}

const AvatarItem = React.memo(({ avatar, index, selectedAvatar, onSelect, colors }: AvatarItemProps) => {
  const isSelected = selectedAvatar === avatar;
  
  const handlePress = useCallback(() => {
    onSelect(avatar);
  }, [avatar, onSelect]);

  const styles = useMemo(() => StyleSheet.create({
    avatarContainer: {
      flex: 1,
      alignItems: 'center',
      marginBottom: 16,
      position: 'relative',
    },
    avatar: {
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      borderWidth: 3,
      borderColor: 'transparent',
    },
    selectedAvatar: {
      borderColor: colors.primary,
      borderWidth: 4,
    },
    checkmark: {
      position: 'absolute',
      bottom: -2,
      right: 8,
      backgroundColor: colors.primary,
      borderRadius: 14,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.surface,
    },
  }), [colors]);

  return (
    <TouchableOpacity
      style={styles.avatarContainer}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: avatar }}
        style={[
          styles.avatar,
          isSelected && styles.selectedAvatar
        ]}
        resizeMode="cover"
        fadeDuration={200}
        progressiveRenderingEnabled={true}
      />
      {isSelected && (
        <View style={styles.checkmark}>
          <Check size={16} color={colors.white} strokeWidth={3} />
        </View>
      )}
    </TouchableOpacity>
  );
});

AvatarItem.displayName = 'AvatarItem';

export default function AvatarGalleryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { setSelectedAvatar } = useAvatar();
  const [selectedAvatar, setLocalSelectedAvatar] = useState<string | null>(
    params.currentAvatar as string || null
  );

  // Move styles definition to the top of the component
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
      padding: 6,
      borderRadius: 16,
      backgroundColor: colors.surfaceVariant,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: 'Inter-SemiBold',
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    confirmButton: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 8,
      opacity: selectedAvatar ? 1 : 0.5,
    },
    confirmButtonText: {
      fontSize: 14,
      fontFamily: 'Inter-SemiBold',
      color: colors.white,
    },
    content: {
      flex: 1,
    },
    headerContent: {
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    title: {
      fontSize: 24,
      fontFamily: 'Inter-Bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      fontFamily: 'Inter-Regular',
      textAlign: 'center',
      lineHeight: 24,
    },
    flatList: {
      flex: 1,
    },
    flatListContent: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
  });

  const handleSelectAvatar = useCallback((avatar: string) => {
    setLocalSelectedAvatar(avatar);
  }, []);

  const handleConfirmSelection = useCallback(() => {
    if (selectedAvatar) {
      setSelectedAvatar(selectedAvatar);
      router.back();
    } else {
      router.back();
    }
  }, [selectedAvatar, setSelectedAvatar]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const renderAvatarItem = useCallback(({ item, index }: { item: string; index: number }) => (
    <AvatarItem
      avatar={item}
      index={index}
      selectedAvatar={selectedAvatar}
      onSelect={handleSelectAvatar}
      colors={colors}
    />
  ), [selectedAvatar, handleSelectAvatar, colors]);

  const keyExtractor = useCallback((item: string, index: number) => `avatar-${index}`, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: AVATAR_SIZE + 16, // avatar height + margin
    offset: (AVATAR_SIZE + 16) * Math.floor(index / NUM_COLUMNS),
    index,
  }), []);

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.headerContent}>
      <Text style={[styles.title, { color: colors.text }]}>Select Your Profile Picture</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Choose from our collection of AI-generated human avatars to represent your profile
      </Text>
    </View>
  ), [colors, styles]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={18} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Avatar</Text>
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={handleConfirmSelection}
          disabled={!selectedAvatar}
        >
          <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <FlatList
          data={AI_HUMAN_AVATARS}
          renderItem={renderAvatarItem}
          keyExtractor={keyExtractor}
          numColumns={NUM_COLUMNS}
          style={styles.flatList}
          contentContainerStyle={styles.flatListContent}
          ListHeaderComponent={ListHeaderComponent}
          showsVerticalScrollIndicator={false}
          // Performance optimizations
          maxToRenderPerBatch={9} // 3 rows at a time
          windowSize={10}
          initialNumToRender={12} // 4 rows initially
          updateCellsBatchingPeriod={50}
          getItemLayout={getItemLayout}
          // Smooth scrolling
          decelerationRate="fast"
          scrollEventThrottle={16}
        />
      </View>
    </View>
  );
}
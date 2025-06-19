import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AvatarProvider } from '@/contexts/AvatarContext';

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthRoute = segments[0] === 'auth';

    // If the user is signed in and on the auth route, redirect them away.
    if (isLoggedIn && inAuthRoute) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isLoggedIn, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="prompt/[id]" />
      <Stack.Screen name="edit-post/[id]" />
      <Stack.Screen name="post-activity/[id]" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="avatar-gallery" />
      <Stack.Screen name="create-post" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="ai-assistant" />
      <Stack.Screen name="smart-suggestions" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AvatarProvider>
          <InitialLayout />
          <StatusBar 
            style="auto" 
            backgroundColor="transparent"
            translucent={Platform.OS === 'android'}
          />
        </AvatarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
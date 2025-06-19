import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, View, ActivityIndicator } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AvatarProvider } from '@/contexts/AvatarContext';
import { getHasSeenWelcome } from '@/utils/onboarding';

SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { isLoggedIn, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const seen = await getHasSeenWelcome();
        setHasSeenWelcome(seen);
      } catch (error) {
        console.error('Error checking onboarding state:', error);
        setHasSeenWelcome(false);
      } finally {
        setHasCheckedOnboarding(true);
      }
    };

    checkOnboarding();
  }, []);

  useEffect(() => {
    if (isLoading || !hasCheckedOnboarding) {
      return;
    }

    const inAuthRoute = segments[0] === 'auth';
    const inSplashRoute = segments[0] === 'splash';
    const inWelcomeRoute = segments[0] === 'welcome';

    // If the user is signed in and on the auth route, redirect them away.
    if (isLoggedIn && inAuthRoute) {
      if (hasSeenWelcome) {
        router.replace('/(tabs)');
      } else {
        router.replace('/welcome');
      }
    }

    // If user has seen welcome and is on welcome route, redirect to dashboard
    if (hasSeenWelcome && inWelcomeRoute) {
      router.replace('/(tabs)');
    }
  }, [isLoading, isLoggedIn, segments, router, hasCheckedOnboarding, hasSeenWelcome]);

  if (isLoading || !hasCheckedOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="welcome" />
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
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AvatarProvider } from '@/contexts/AvatarContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useFrameworkReady();

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
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="prompt/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="edit-post/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="post-activity/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="avatar-gallery" options={{ headerShown: false }} />
            <Stack.Screen name="create-post" options={{ headerShown: false }} />
            <Stack.Screen name="ai-assistant" options={{ headerShown: false }} />
            <Stack.Screen name="smart-suggestions" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
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
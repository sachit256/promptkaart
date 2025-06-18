import { Tabs } from 'expo-router';
import { Chrome as Home, Search, Plus, Heart, User } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { colors } = useTheme();
  const { isLoggedIn } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'android' ? 2 + insets.bottom : 30,
          backgroundColor: colors.tabBarBackground,
          borderRadius: 28,
          height: 75,
          paddingBottom: 12,
          paddingTop: 12,
          paddingHorizontal: 12,
          marginHorizontal: 16,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.tabBarBorder,
          shadowColor: colors.black,
          shadowOffset: {
            width: 0,
            height: 12,
          },
          shadowOpacity: 0.15,
          shadowRadius: 30,
          elevation: 20,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarShowLabel: false,
        tabBarItemStyle: {
          borderRadius: 22,
          marginHorizontal: 4,
          paddingVertical: 8,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color, focused }) => (
            <Home size={focused ? 26 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ size, color, focused }) => (
            <Search size={focused ? 26 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ size, color, focused }) => (
            <Plus size={focused ? 26 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ size, color, focused }) => (
            <Heart size={focused ? 26 : 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color, focused }) => (
            <User size={focused ? 26 : 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
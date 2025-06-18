import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  tabBarBackground: string;
  tabBarBorder: string;
  text: string;
  textSecondary: string;
  border: string;
  borderLight: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  white: string;
  black: string;
}

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const lightColors: ThemeColors = {
  primary: '#8B5CF6',
  secondary: '#6366F1',
  background: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceVariant: '#F1F5F9',
  tabBarBackground: '#FEFEFE',
  tabBarBorder: '#E5E7EB',
  text: '#1E293B',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  accent: '#F59E0B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',
};

const darkColors: ThemeColors = {
  primary: '#A78BFA',
  secondary: '#818CF8',
  background: '#0F172A',
  surface: '#1E293B',
  surfaceVariant: '#334155',
  tabBarBackground: '#1F2937',
  tabBarBorder: '#374151',
  text: '#F8FAFC',
  textSecondary: '#CBD5E1',
  border: '#475569',
  borderLight: '#334155',
  accent: '#FBBF24',
  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark mode

  const colors = theme === 'light' ? lightColors : darkColors;

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
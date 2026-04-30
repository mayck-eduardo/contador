import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palette } from '@/constants/theme';

export type ThemeMode = 'dark' | 'light' | 'auto';

const darkColors = {
  background: Palette.zinc950,
  surface: Palette.zinc900,
  surfaceAlt: Palette.zinc800,
  card: Palette.zinc900,
  cardBorder: Palette.zinc800,
  text: Palette.zinc50,
  textSecondary: Palette.zinc400,
  textMuted: Palette.zinc500,
  border: Palette.zinc800,
  inputBg: Palette.zinc800,
  inputBorder: Palette.zinc700,
  tabBarBg: '#050505',
  tabBarBorder: Palette.zinc800,
  primary: Palette.emerald500,
  primaryBg: Palette.emerald950,
  primaryLight: Palette.emerald900,
  danger: Palette.red500,
  dangerBg: Palette.red950,
  success: Palette.emerald500,
  successBg: Palette.emerald950,
  warning: Palette.f59e0b ?? '#F59E0B',
  warningBg: '#292009',
  accent: Palette.indigo400,
  accentBg: Palette.indigo950,
};

const lightColors = {
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F0F0',
  card: '#FFFFFF',
  cardBorder: '#E5E5E5',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E5E5',
  inputBg: '#F9FAFB',
  inputBorder: '#E5E7EB',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  primary: Palette.emerald500,
  primaryBg: '#D1FAE5',
  primaryLight: '#A7F3D0',
  danger: Palette.red500,
  dangerBg: '#FEE2E2',
  success: Palette.emerald500,
  successBg: '#D1FAE5',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  accent: Palette.indigo400,
  accentBg: '#EDE9FE',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  colors: typeof darkColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    AsyncStorage.getItem('@contador:themeMode').then((saved) => {
      if (saved === 'dark' || saved === 'light' || saved === 'auto') {
        setThemeModeState(saved);
      }
    });
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('@contador:themeMode', mode);
  };

  const isDark = themeMode === 'auto' ? systemColorScheme === 'dark' : themeMode === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

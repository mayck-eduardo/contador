import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { CounterProvider } from '../context/CounterContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

function StatusBarWrapper() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

function RootStack() {
  return (
    <CounterProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBarWrapper />
    </CounterProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootStack />
    </ThemeProvider>
  );
}

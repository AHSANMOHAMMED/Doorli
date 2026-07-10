import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Stack } from 'expo-router';

if (Platform.OS === 'web') {
  require('../global.css');
}
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { GradientBackground } from '../components/GradientBackground';

const queryClient = new QueryClient();

export default function RootLayout() {
  const loadSession = useAuthStore((state) => state.loadSession);

  useEffect(() => {
    loadSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={DarkTheme}>
        <GradientBackground>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(customer)" options={{ headerShown: false }} />
          </Stack>
        </GradientBackground>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

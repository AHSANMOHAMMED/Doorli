import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../store/auth';
import { ONBOARDING_KEY } from '../lib/onboarding';

export default function Index() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    (async () => {
      const done = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!done) {
        router.replace("/(onboarding)" as any);
        return;
      }
      if (!isAuthenticated || !user) {
        router.replace('/(auth)/login');
        return;
      }
      if (user.role === 'vendor') {
        router.replace("/(vendor)/hub" as any);
      } else if (user.role === 'driver') {
        router.replace('/(driver)/jobs');
      } else {
        router.replace('/(customer)');
      }
    })();
  }, [user, isAuthenticated, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#5DCAA5" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

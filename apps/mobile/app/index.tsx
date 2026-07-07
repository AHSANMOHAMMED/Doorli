import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/auth';

export default function Index() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) {
      router.replace('/(auth)/login');
      return;
    }
    if (user.role === 'vendor') {
      router.replace('/(vendor)/orders');
    } else if (user.role === 'driver') {
      router.replace('/(driver)/jobs');
    } else {
      router.replace('/(customer)');
    }
  }, [user, isAuthenticated, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator color="#2563eb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
});

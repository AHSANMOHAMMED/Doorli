import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth';

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useAuthStore((s) => s.user?.role);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'vendor') {
    return <Redirect href="/(vendor)/orders" />;
  }
  if (role === 'driver') {
    return <Redirect href="/(driver)/jobs" />;
  }

  return <Redirect href="/(customer)" />;
}

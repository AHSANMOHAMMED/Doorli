import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../lib/api';

export default function HomeScreen() {
  const { data: health, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    retry: 1,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚪</Text>
      <Text style={styles.title}>Doorli</Text>
      <Text style={styles.tagline}>Everything Local. Delivered.</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <Text style={styles.cardText}>
          Customer, vendor, and driver apps ship in Week 7–12.
        </Text>

        {isLoading && <ActivityIndicator style={styles.loader} color="#2563eb" />}
        {isError && (
          <Text style={styles.error}>API offline — start services with npm run dev</Text>
        )}
        {health && (
          <Text style={styles.status}>
            API: {health.status} · DB: {health.db ? 'ok' : 'down'} · Redis:{' '}
            {health.redis ? 'ok' : 'down'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  logo: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#2563eb' },
  tagline: { fontSize: 16, color: '#64748b', marginTop: 4, marginBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  cardText: { fontSize: 14, color: '#64748b', marginTop: 8, lineHeight: 20 },
  loader: { marginTop: 16 },
  error: { marginTop: 16, fontSize: 13, color: '#dc2626' },
  status: { marginTop: 16, fontSize: 12, color: '#16a34a' },
});

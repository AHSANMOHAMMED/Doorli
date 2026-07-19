import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import {
  fetchMySubscriptions,
  cancelSubscription,
  formatStatus,
} from '../../lib/api';
import { RefreshCw } from 'lucide-react-native';

export default function SubscriptionsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: fetchMySubscriptions,
  });

  async function handleCancel(id: string) {
    Alert.alert('Cancel subscription?', 'You can create a new one anytime.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSubscription(id);
            queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
          } catch (e: unknown) {
            Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Subscriptions</Text>
      <Text style={styles.subtitle}>Recurring grocery & essentials delivery</Text>

      {isLoading ? (
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(s) => s.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <RefreshCw color="rgba(255,255,255,0.5)" size={40} />
              <Text style={styles.emptyText}>
                No active subscriptions. Add items from a grocery shop to start one.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.freq}>{item.frequency}</Text>
              <Text style={styles.addr} numberOfLines={2}>
                {item.deliveryAddress}
              </Text>
              <Text style={styles.meta}>
                Next: {new Date(item.nextDeliveryAt).toLocaleDateString()} ·{' '}
                {item.isActive ? 'Active' : formatStatus('cancelled')}
              </Text>
              {item.isActive && (
                <TouchableOpacity style={styles.cancel} onPress={() => handleCancel(item.id)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </GlassCard>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  subtitle: { color: 'rgba(255,255,255,0.65)', marginTop: 6, marginBottom: 16 },
  list: { paddingBottom: 100 },
  card: { padding: 16, marginBottom: 10 },
  freq: { color: '#5DCAA5', fontWeight: '800', textTransform: 'capitalize', fontSize: 16 },
  addr: { color: '#fff', marginTop: 8 },
  meta: { color: 'rgba(255,255,255,0.5)', marginTop: 6, fontSize: 13 },
  cancel: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  cancelText: { color: '#f87171', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12, paddingHorizontal: 24 },
  emptyText: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
});

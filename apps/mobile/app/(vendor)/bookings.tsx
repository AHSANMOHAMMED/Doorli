import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';

type Booking = {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number | string;
  bookingType?: string;
  customer?: { fullName?: string };
};

export default function VendorBookings() {
  const qc = useQueryClient();
  const [vendorId, setVendorId] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/vendors/me')
      .then((res) => setVendorId(res.data?.data?.id ?? null))
      .catch(() => undefined);
  }, []);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-bookings', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const res = await apiClient.get(`/bookings/vendor/${vendorId}`);
      return (res.data?.data ?? []) as Booking[];
    },
  });

  async function setStatus(id: string, status: string) {
    try {
      await apiClient.patch(`/bookings/${id}/status`, { status });
      qc.invalidateQueries({ queryKey: ['vendor-bookings'] });
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bookings</Text>
      {isLoading ? (
        <ActivityIndicator color="#2563eb" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(i) => i.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.num}>#{item.bookingNumber}</Text>
              <Text style={styles.meta}>
                {item.customer?.fullName ?? 'Customer'} · {item.status} · LKR {Number(item.totalAmount)}
              </Text>
              {item.status === 'pending' && (
                <View style={styles.row}>
                  <TouchableOpacity style={styles.btn} onPress={() => setStatus(item.id, 'confirmed')}>
                    <Text style={styles.btnText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.btnGhost]}
                    onPress={() => setStatus(item.id, 'cancelled')}
                  >
                    <Text style={styles.btnGhostText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#0f172a' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  num: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4, fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12 },
  btn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
  btnGhost: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0' },
  btnGhostText: { color: '#64748b', fontWeight: '600' },
});

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { formatPrice } from '../../lib/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  vendor?: { businessName: string };
  driver?: { fullName: string } | null;
}

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-orders', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiClient.get(`/admin/orders?${params.toString()}`);
      return (res.data?.data?.items ?? []) as Order[];
    },
  });

  const refundMutation = useMutation({
    mutationFn: async (orderId: string) => {
      await apiClient.post(`/admin/orders/${orderId}/refund`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      Alert.alert('Done', 'Order refunded');
    },
    onError: () => Alert.alert('Error', 'Failed to process refund'),
  });

  const orders = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Order Management</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search order number..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {['all', 'pending', 'confirmed', 'ready', 'picked_up', 'delivered', 'cancelled'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === 'all' ? 'All' : s.replace(/_/g, ' ')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item: o }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>{o.orderNumber}</Text>
                <View style={[styles.statusBadge, o.status === 'delivered' && styles.statusDelivered]}>
                  <Text style={styles.statusText}>{o.status.replace(/_/g, ' ')}</Text>
                </View>
              </View>
              <Text style={styles.vendorName}>{o.vendor?.businessName ?? 'N/A'}</Text>
              <Text style={styles.orderDetail}>
                {formatPrice(Number(o.totalAmount))} · {o.paymentMethod.toUpperCase()} · {o.paymentStatus}
              </Text>
              {o.driver && (
                <Text style={styles.driverText}>Driver: {o.driver.fullName}</Text>
              )}
              <Text style={styles.dateText}>
                {new Date(o.createdAt).toLocaleString('en-LK', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
              <View style={styles.cardActions}>
                {(o.status === 'delivered' || o.status === 'cancelled') && o.paymentStatus !== 'refunded' && (
                  <TouchableOpacity
                    style={styles.refundBtn}
                    onPress={() =>
                      Alert.alert('Refund', `Refund order ${o.orderNumber}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Refund', style: 'destructive', onPress: () => refundMutation.mutate(o.id) },
                      ])
                    }
                  >
                    <Text style={styles.refundBtnText}>Refund</Text>
                  </TouchableOpacity>
                )}
                {o.paymentStatus === 'refunded' && (
                  <View style={styles.refundedBadge}>
                    <Text style={styles.refundedText}>Refunded</Text>
                  </View>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', paddingHorizontal: 16, paddingTop: 14 },
  searchRow: { paddingHorizontal: 16, marginTop: 12 },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 10, gap: 6, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#3b82f6' },
  filterText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  statusBadge: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusDelivered: { backgroundColor: '#064e3b' },
  statusText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'capitalize' },
  vendorName: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  orderDetail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  driverText: { fontSize: 12, color: '#3b82f6', marginTop: 2 },
  dateText: { fontSize: 11, color: '#64748b', marginTop: 4 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  refundBtn: { backgroundColor: '#991b1b', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  refundBtnText: { fontSize: 12, color: '#fca5a5', fontWeight: '600' },
  refundedBadge: { backgroundColor: '#334155', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  refundedText: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#64748b' },
});

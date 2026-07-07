import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyOrders, formatPrice, formatStatus } from '../../lib/api';

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#2563eb',
  preparing: '#2563eb',
  ready: '#2563eb',
  picked_up: '#2563eb',
  delivered: '#16a34a',
  cancelled: '#ef4444',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  });

  const orders = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>My Orders</Text>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#2563eb" />
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your order history will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(customer)/order/${item.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.orderNumber}>{item.order_number}</Text>
                <Text style={[styles.status, { color: STATUS_COLORS[item.status] ?? '#64748b' }]}>
                  {formatStatus(item.status)}
                </Text>
              </View>
              <Text style={styles.vendor}>{item.vendor?.business_name ?? 'Shop'}</Text>
              <View style={styles.footer}>
                <Text style={styles.total}>{formatPrice(Number(item.total_amount))}</Text>
                <Text style={styles.date}>
                  {new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  loader: { marginTop: 48 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#64748b', marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderNumber: { fontWeight: '600', color: '#0f172a', fontSize: 15 },
  status: { fontSize: 13, fontWeight: '500' },
  vendor: { color: '#64748b', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  total: { fontWeight: '700', color: '#0f172a' },
  date: { color: '#94a3b8', fontSize: 13 },
});

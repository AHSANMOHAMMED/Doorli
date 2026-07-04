import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyOrders, formatPrice } from '../../lib/api';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  picked_up: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  });

  const orders = data?.data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
                <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                <Text style={styles.status}>{STATUS_LABELS[item.status] ?? item.status}</Text>
              </View>
              <Text style={styles.vendor}>{item.vendor.businessName}</Text>
              <Text style={styles.total}>{formatPrice(item.totalAmount)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
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
  orderNumber: { fontWeight: '600', color: '#0f172a' },
  status: { fontSize: 13, color: '#2563eb', fontWeight: '500' },
  vendor: { color: '#64748b', fontSize: 14 },
  total: { marginTop: 8, fontWeight: '700', color: '#0f172a' },
});

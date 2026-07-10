import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchVendorOrders, formatPrice, updateOrderStatus } from '../../lib/api';

const VENDOR_ACTIONS: Record<string, { label: string; next: string }[]> = {
  pending: [{ label: 'Confirm', next: 'confirmed' }],
  confirmed: [{ label: 'Start preparing', next: 'preparing' }],
  preparing: [{ label: 'Mark ready', next: 'ready' }],
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'New order',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  picked_up: 'Picked up',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function VendorOrders() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: fetchVendorOrders,
    refetchInterval: 10000,
  });

  const orders = data ?? [];

  async function advanceStatus(orderId: string, status: string) {
    try {
      await updateOrderStatus(orderId, status);
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
    } catch (err) {
      console.error('Failed to update order status:', err);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {orders.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>New customer orders will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const actions = VENDOR_ACTIONS[item.status] ?? [];
            const items = item.items ?? [];
            return (
              <View style={styles.card}>
                <View style={styles.header}>
                  <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                  <Text style={styles.status}>{STATUS_LABELS[item.status] ?? item.status}</Text>
                </View>
                <Text style={styles.total}>{formatPrice(Number(item.totalAmount))}</Text>
                {items.map((line: any) => (
                  <Text key={line.id} style={styles.line}>
                    {line.product?.name} × {line.quantity}
                  </Text>
                ))}
                <View style={styles.actions}>
                  {actions.map((action) => (
                    <TouchableOpacity
                      key={action.next}
                      style={styles.actionBtn}
                      onPress={() => advanceStatus(item.id, action.next)}
                    >
                      <Text style={styles.actionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  emptyText: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    margin: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between' },
  orderNumber: { fontWeight: '700', color: '#0f172a' },
  status: { color: '#2563eb', fontWeight: '500' },
  total: { marginTop: 8, fontWeight: '600' },
  line: { color: '#64748b', marginTop: 4, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});

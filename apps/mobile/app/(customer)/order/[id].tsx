import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelOrder, fetchOrder, formatPrice } from '../../../lib/api';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed by shop',
  preparing: 'Being prepared',
  ready: 'Ready for pickup',
  picked_up: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => fetchOrder(id),
    refetchInterval: 15000,
    enabled: !!id,
  });

  async function handleCancel() {
    Alert.alert('Cancel order', 'Cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(id);
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            queryClient.invalidateQueries({ queryKey: ['my-orders'] });
          } catch (err) {
            Alert.alert('Could not cancel', err instanceof Error ? err.message : 'Try again');
          }
        },
      },
    ]);
  }

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#2563eb" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const canCancel = order.status === 'pending';
  const items = order.order_items ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.orderNumber}>{order.order_number}</Text>
        <Text style={styles.vendor}>{order.vendor?.business_name ?? 'Shop'}</Text>
        <Text style={styles.status}>{STATUS_LABELS[order.status] ?? order.status}</Text>

        {order.status !== 'cancelled' && (
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, idx) => (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.dot,
                    idx <= currentStep && styles.dotActive,
                  ]}
                />
                <Text style={[styles.stepLabel, idx <= currentStep && styles.stepLabelActive]}>
                  {STATUS_LABELS[step]}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.items}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.name} × {item.quantity}
              </Text>
              <Text>{formatPrice(Number(item.price) * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>{formatPrice(Number(order.subtotal))}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Delivery</Text>
            <Text>{formatPrice(Number(order.delivery_fee))}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(Number(order.total_amount))}</Text>
          </View>
        </View>

        {order.delivery_address && (
          <View style={styles.addressCard}>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            <Text style={styles.addressText}>{order.delivery_address}</Text>
          </View>
        )}

        {canCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Text style={styles.cancelText}>Cancel order</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(customer)')}>
          <Text style={styles.homeBtnText}>Back to home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  orderNumber: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  vendor: { fontSize: 15, color: '#64748b', marginTop: 4 },
  status: { fontSize: 16, fontWeight: '600', color: '#2563eb', marginTop: 8 },
  timeline: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#e2e8f0', marginRight: 12 },
  dotActive: { backgroundColor: '#2563eb' },
  stepLabel: { color: '#94a3b8', fontSize: 14 },
  stepLabelActive: { color: '#0f172a', fontWeight: '500' },
  items: { marginTop: 20 },
  sectionTitle: { fontWeight: '600', marginBottom: 8, color: '#64748b' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { flex: 1, color: '#334155' },
  summary: { marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontWeight: '600' },
  totalValue: { fontWeight: '700', color: '#2563eb' },
  addressCard: { marginTop: 16, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  addressText: { color: '#334155', fontSize: 14, lineHeight: 20 },
  cancelBtn: {
    marginTop: 20, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca', alignItems: 'center',
  },
  cancelText: { color: '#ef4444', fontWeight: '600' },
  homeBtn: { marginTop: 12, padding: 14, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center' },
  homeBtnText: { color: '#fff', fontWeight: '600' },
});

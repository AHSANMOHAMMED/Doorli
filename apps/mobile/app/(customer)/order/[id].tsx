import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cancelOrder, fetchOrder, formatPrice, type DriverLocationUpdate } from '../../../lib/api';
import { getSocket, joinSocketRooms } from '../../../lib/socket';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order placed',
  confirmed: 'Confirmed by shop',
  preparing: 'Being prepared',
  ready: 'Ready',
  picked_up: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
    refetchInterval: 15000,
  });

  const order = data?.data;

  useEffect(() => {
    if (!id || !order) return;
    if (!['picked_up', 'ready'].includes(order.status)) return;

    joinSocketRooms(`order:${id}`);
    const socket = getSocket();

    const onLocation = (update: DriverLocationUpdate) => {
      if (update.orderId === id) {
        setDriverLocation({ lat: update.lat, lng: update.lng });
      }
    };

    socket.on('driver:location_update', onLocation);
    return () => {
      socket.off('driver:location_update', onLocation);
    };
  }, [id, order?.status]);

  async function handleCancel() {
    Alert.alert('Cancel order', 'Cancel this order within 2 minutes of placing?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          const res = await cancelOrder(id);
          if (res.success) refetch();
          else Alert.alert('Could not cancel', res.error ?? 'Try again');
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

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.vendor}>{order.vendor.businessName}</Text>
        <Text style={styles.status}>{STATUS_LABELS[order.status] ?? order.status}</Text>

        {order.status !== 'cancelled' && (
          <View style={styles.timeline}>
            {STATUS_STEPS.map((step, idx) => (
              <View key={step} style={styles.stepRow}>
                <View
                  style={[
                    styles.dot,
                    idx <= currentStep && styles.dotActive,
                    order.status === 'cancelled' && styles.dotCancelled,
                  ]}
                />
                <Text style={[styles.stepLabel, idx <= currentStep && styles.stepLabelActive]}>
                  {STATUS_LABELS[step]}
                </Text>
              </View>
            ))}
          </View>
        )}

        {order.estimatedDeliveryTime && order.status !== 'delivered' && (
          <Text style={styles.eta}>Est. {order.estimatedDeliveryTime} min</Text>
        )}

        {driverLocation && order.status === 'picked_up' && (
          <View style={styles.trackingCard}>
            <Text style={styles.sectionTitle}>Driver location (live)</Text>
            <Text style={styles.coords}>
              {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}
            </Text>
            <Text style={styles.trackingHint}>Map view coming in a future update</Text>
          </View>
        )}

        <View style={styles.items}>
          <Text style={styles.sectionTitle}>Items</Text>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.product.name} × {item.quantity}
              </Text>
              <Text>{formatPrice(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>Subtotal</Text>
            <Text>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>Delivery</Text>
            <Text>{formatPrice(order.deliveryFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

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
  content: { padding: 16 },
  orderNumber: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  vendor: { fontSize: 15, color: '#64748b', marginTop: 4 },
  status: { fontSize: 16, fontWeight: '600', color: '#2563eb', marginTop: 8 },
  eta: { marginTop: 8, color: '#64748b' },
  trackingCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  coords: { fontSize: 15, fontWeight: '600', color: '#0f172a', marginTop: 4 },
  trackingHint: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  timeline: { marginTop: 20, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
    marginRight: 12,
  },
  dotActive: { backgroundColor: '#2563eb' },
  dotCancelled: { backgroundColor: '#ef4444' },
  stepLabel: { color: '#94a3b8', fontSize: 14 },
  stepLabelActive: { color: '#0f172a', fontWeight: '500' },
  items: { marginTop: 20 },
  sectionTitle: { fontWeight: '600', marginBottom: 8, color: '#64748b' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  itemName: { flex: 1, color: '#334155' },
  summary: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontWeight: '600' },
  totalValue: { fontWeight: '700', color: '#2563eb' },
  cancelBtn: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
  },
  cancelText: { color: '#ef4444', fontWeight: '600' },
  homeBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  homeBtnText: { color: '#fff', fontWeight: '600' },
});

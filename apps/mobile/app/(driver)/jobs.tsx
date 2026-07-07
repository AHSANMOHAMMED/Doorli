import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchDriverDeliveries, updateDeliveryStatus, formatPrice } from '../../lib/api';
import { useAuthStore } from '../../store/auth';

const DELIVERY_ACTIONS: Record<string, { label: string; next: string }[]> = {
  assigned: [{ label: 'Picked up', next: 'picked_up' }],
  picked_up: [{ label: 'Start delivery', next: 'in_transit' }],
  in_transit: [{ label: 'Delivered', next: 'delivered' }],
};

export default function DriverJobs() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-deliveries'],
    queryFn: fetchDriverDeliveries,
    refetchInterval: isOnline ? 10000 : false,
    enabled: !!user,
  });

  const deliveries = data ?? [];

  async function advanceStatus(deliveryId: string, status: string) {
    try {
      await updateDeliveryStatus(deliveryId, status);
      queryClient.invalidateQueries({ queryKey: ['driver-deliveries'] });
    } catch (err) {
      console.error('Failed to update delivery status:', err);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.fullName?.split(' ')[0] ?? 'Driver'}</Text>
          <Text style={styles.subtitle}>{isOnline ? 'Online · Ready for jobs' : 'Offline'}</Text>
        </View>
        <TouchableOpacity
          style={[styles.onlineToggle, isOnline ? styles.onlineOn : styles.onlineOff]}
          onPress={() => setIsOnline(!isOnline)}
        >
          <Text style={styles.onlineToggleText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 48 }} />
      ) : !isOnline ? (
        <View style={styles.center}>
          <Text style={styles.offlineIcon}>🛵</Text>
          <Text style={styles.offlineTitle}>You are offline</Text>
          <Text style={styles.offlineText}>Go online to receive delivery jobs</Text>
        </View>
      ) : deliveries.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>No active deliveries</Text>
          <Text style={styles.emptyText}>Waiting for delivery assignments...</Text>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(d) => d.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => {
            const actions = DELIVERY_ACTIONS[item.status] ?? [];
            const order = item.orders;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.orderNumber}>{order?.order_number ?? 'Order'}</Text>
                  <Text style={styles.status}>{item.status.replace(/_/g, ' ')}</Text>
                </View>
                <Text style={styles.vendor}>{order?.vendor?.business_name ?? 'Shop'}</Text>
                {order?.delivery_address && (
                  <Text style={styles.address}>📍 {order.delivery_address}</Text>
                )}
                {order && (
                  <Text style={styles.total}>{formatPrice(Number(order.total_amount))}</Text>
                )}
                {item.otp && (
                  <View style={styles.otpBox}>
                    <Text style={styles.otpLabel}>OTP</Text>
                    <Text style={styles.otpValue}>{item.otp}</Text>
                  </View>
                )}
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
                  <TouchableOpacity
                    style={styles.navBtn}
                    onPress={() => router.push(`/(driver)/navigate/${item.order_id}`)}
                  >
                    <Text style={styles.navText}>Navigate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  greeting: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  onlineToggle: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  onlineOn: { backgroundColor: '#dcfce7' },
  onlineOff: { backgroundColor: '#f1f5f9' },
  onlineToggleText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  offlineIcon: { fontSize: 48, marginBottom: 12 },
  offlineTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  offlineText: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#64748b', marginTop: 8 },
  card: {
    backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderNumber: { fontWeight: '700', color: '#0f172a' },
  status: { color: '#2563eb', fontWeight: '500', textTransform: 'capitalize' },
  vendor: { marginTop: 6, color: '#64748b' },
  address: { marginTop: 4, color: '#94a3b8', fontSize: 13 },
  total: { marginTop: 4, fontWeight: '600' },
  otpBox: { marginTop: 8, padding: 8, backgroundColor: '#fef3c7', borderRadius: 8, flexDirection: 'row', gap: 8, alignItems: 'center' },
  otpLabel: { fontSize: 12, fontWeight: '600', color: '#92400e' },
  otpValue: { fontSize: 18, fontWeight: 'bold', color: '#92400e' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  navBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#2563eb' },
  navText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
});

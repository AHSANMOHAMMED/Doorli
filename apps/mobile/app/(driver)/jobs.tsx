import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchDriverJobs,
  acceptDelivery,
  declineDelivery,
  updateOrderStatus,
  formatPrice,
  type Order,
} from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../lib/axios';
import { fetchDriverEarnings, useDriverLocationPublish } from '../../lib/driverLocation';

const ACTIVE_ACTIONS: Record<string, { label: string; next: string }[]> = {
  ready: [{ label: 'Picked up', next: 'picked_up' }],
  picked_up: [{ label: 'Delivered', next: 'delivered' }],
};

export default function DriverJobs() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);

  useDriverLocationPublish(isOnline, user?.id);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-jobs'],
    queryFn: fetchDriverJobs,
    refetchInterval: isOnline ? 10000 : false,
    enabled: !!user,
  });

  const { data: earnings } = useQuery({
    queryKey: ['driver-earnings'],
    queryFn: fetchDriverEarnings,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const available = data?.available ?? [];
  const active = data?.active ?? [];

  async function toggleOnline(next: boolean) {
    try {
      if (next) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Location required', 'Enable location to go online and share GPS for live tracking.');
          return;
        }
      }
      await apiClient.patch('/drivers/me/online', { isOnline: next });
      setIsOnline(next);
    } catch {
      Alert.alert('Error', 'Could not update online status');
    }
  }

  async function onAccept(orderId: string) {
    try {
      await acceptDelivery(orderId);
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
      router.push(`/(driver)/navigate/${orderId}`);
    } catch (err) {
      Alert.alert('Accept failed', err instanceof Error ? err.message : 'Try again');
    }
  }

  async function onDecline(orderId: string) {
    try {
      await declineDelivery(orderId);
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
    } catch (err) {
      Alert.alert('Decline failed', err instanceof Error ? err.message : 'Try again');
    }
  }

  async function advanceStatus(orderId: string, status: string) {
    try {
      await updateOrderStatus(orderId, status);
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['driver-earnings'] });
      if (status === 'delivered') {
        router.push(`/(driver)/navigate/${orderId}`);
      }
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again');
    }
  }

  function renderOrder(item: Order, mode: 'available' | 'active') {
    const actions = mode === 'active' ? ACTIVE_ACTIONS[item.status] ?? [] : [];
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>{item.orderNumber}</Text>
          <Text style={styles.status}>{item.status.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.vendor}>{item.vendor?.businessName ?? 'Shop'}</Text>
        {item.deliveryAddress?.addressLine && (
          <Text style={styles.address}>📍 {item.deliveryAddress.addressLine}</Text>
        )}
        <Text style={styles.total}>{formatPrice(Number(item.totalAmount))}</Text>
        <Text style={styles.fee}>Delivery fee {formatPrice(Number(item.deliveryFee))}</Text>
        <View style={styles.actions}>
          {mode === 'available' ? (
            <>
              <TouchableOpacity style={styles.actionBtn} onPress={() => onAccept(item.id)}>
                <Text style={styles.actionText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.navBtn} onPress={() => onDecline(item.id)}>
                <Text style={styles.navText}>Decline</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
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
                onPress={() => router.push(`/(driver)/navigate/${item.id}`)}
              >
                <Text style={styles.navText}>Navigate</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  }

  const listData = [
    ...active.map((o) => ({ ...o, _mode: 'active' as const })),
    ...available.map((o) => ({ ...o, _mode: 'available' as const })),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {user?.fullName?.split(' ')[0] ?? 'Driver'}</Text>
          <Text style={styles.subtitle}>
            {isOnline ? 'Online · GPS sharing for live track' : 'Offline'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.onlineToggle, isOnline ? styles.onlineOn : styles.onlineOff]}
          onPress={() => toggleOnline(!isOnline)}
        >
          <Text style={styles.onlineToggleText}>{isOnline ? 'Go Offline' : 'Go Online'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.earningsRow}>
        <View style={styles.earnBox}>
          <Text style={styles.earnLabel}>Today</Text>
          <Text style={styles.earnValue}>
            LKR {Number(earnings?.earningsToday ?? 0).toFixed(0)}
          </Text>
        </View>
        <View style={styles.earnBox}>
          <Text style={styles.earnLabel}>Deliveries</Text>
          <Text style={styles.earnValue}>{earnings?.totalDeliveries ?? 0}</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#2563eb" style={{ marginTop: 48 }} />
      ) : !isOnline ? (
        <View style={styles.center}>
          <Text style={styles.offlineTitle}>You are offline</Text>
          <Text style={styles.offlineText}>Go online to receive delivery jobs and share GPS</Text>
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No active deliveries</Text>
          <Text style={styles.emptyText}>Waiting for delivery assignments...</Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(d) => `${d._mode}-${d.id}`}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => renderOrder(item, item._mode)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  subtitle: { fontSize: 13, color: '#64748b', marginTop: 4 },
  onlineToggle: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  onlineOn: { backgroundColor: '#dcfce7' },
  onlineOff: { backgroundColor: '#f1f5f9' },
  onlineToggleText: { fontSize: 14, fontWeight: '600', color: '#334155' },
  earningsRow: { flexDirection: 'row', gap: 10, padding: 12 },
  earnBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  earnLabel: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  earnValue: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  offlineTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  offlineText: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#64748b', marginTop: 8 },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  orderNumber: { fontWeight: '700', color: '#0f172a' },
  status: { color: '#2563eb', fontWeight: '500', textTransform: 'capitalize' },
  vendor: { marginTop: 6, color: '#64748b' },
  address: { marginTop: 4, color: '#94a3b8', fontSize: 13 },
  total: { marginTop: 4, fontWeight: '600' },
  fee: { marginTop: 2, fontSize: 12, color: '#64748b' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: { backgroundColor: '#2563eb', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  navBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#2563eb' },
  navText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
});

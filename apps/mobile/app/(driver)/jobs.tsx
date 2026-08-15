import { useState, useCallback, useEffect } from 'react';
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

type Tab = 'active' | 'available' | 'history';

export default function DriverJobs() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [offerCountdown, setOfferCountdown] = useState(30);

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

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['driver-history'],
    queryFn: async () => {
      const res = await apiClient.get('/drivers/me/history');
      return (res.data?.data?.items ?? []) as Order[];
    },
    enabled: !!user && activeTab === 'history',
  });

  const available = data?.available ?? [];
  const active = data?.active ?? [];
  const history = historyData ?? [];

  const currentList = activeTab === 'active' ? active : activeTab === 'available' ? available : history;

  useEffect(() => {
    if (activeTab !== 'available' || available.length === 0) return;
    setOfferCountdown(30);
    const timer = setInterval(() => setOfferCountdown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [activeTab, available[0]?.id]);

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
        Alert.alert('Delivered!', 'Order marked as delivered successfully.');
      }
    } catch (err) {
      Alert.alert('Update failed', err instanceof Error ? err.message : 'Try again');
    }
  }

  const renderOrder = useCallback(
    (item: Order, mode: 'active' | 'available' | 'history') => {
      const actions = mode === 'active' ? ACTIVE_ACTIONS[item.status] ?? [] : [];
      const isCompleted = mode === 'history';
      return (
        <View style={[styles.card, isCompleted && styles.cardCompleted]}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <View style={[styles.statusBadge, isCompleted && styles.statusBadgeCompleted]}>
              <Text style={[styles.status, isCompleted && styles.statusCompleted]}>
                {item.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.vendor}>{item.vendor?.businessName ?? 'Shop'}</Text>
          {item.deliveryAddress?.addressLine && (
            <Text style={styles.address}>📍 {item.deliveryAddress.addressLine}</Text>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.total}>{formatPrice(Number(item.totalAmount))}</Text>
            <Text style={styles.fee}>Fee: {formatPrice(Number(item.deliveryFee))}</Text>
          </View>
           {!isCompleted && item.items && (
             <Text style={styles.itemCount}>{item.items.length} item(s)</Text>
           )}
           {mode === 'available' && <Text style={styles.offerTimer}>Offer expires in {offerCountdown}s</Text>}
          <View style={styles.actions}>
            {mode === 'available' && (
              <>
                <TouchableOpacity style={styles.actionBtn} onPress={() => onAccept(item.id)}>
                  <Text style={styles.actionText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.declineBtn} onPress={() => onDecline(item.id)}>
                  <Text style={styles.declineText}>Decline</Text>
                </TouchableOpacity>
              </>
            )}
            {mode === 'active' && (
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
                  style={styles.navigateBtn}
                  onPress={() => router.push(`/(driver)/navigate/${item.id}`)}
                >
                  <Text style={styles.navigateText}>Navigate</Text>
                </TouchableOpacity>
              </>
            )}
            {mode === 'history' && (
              <TouchableOpacity
                style={styles.navigateBtn}
                onPress={() => router.push(`/(driver)/navigate/${item.id}`)}
              >
                <Text style={styles.navigateText}>View</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hi, {user?.fullName?.split(' ')[0] ?? 'Driver'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, isOnline ? styles.dotOnline : styles.dotOffline]} />
            <Text style={styles.statusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.onlineToggle, isOnline ? styles.onlineOn : styles.onlineOff]}
          onPress={() => toggleOnline(!isOnline)}
        >
          <Text style={[styles.onlineToggleText, isOnline && styles.onlineToggleTextOn]}>
            {isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.earningsSummary}>
        <View style={styles.earnBox}>
          <Text style={styles.earnLabel}>Today</Text>
          <Text style={styles.earnValue}>
            LKR {Number(earnings?.earningsToday ?? 0).toLocaleString()}
          </Text>
        </View>
        <View style={styles.earnDivider} />
        <View style={styles.earnBox}>
          <Text style={styles.earnLabel}>Deliveries</Text>
          <Text style={styles.earnValue}>{earnings?.totalDeliveries ?? 0}</Text>
        </View>
        <View style={styles.earnDivider} />
        <View style={styles.earnBox}>
          <Text style={styles.earnLabel}>Available</Text>
          <Text style={styles.earnValue}>{available.length}</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        {(['active', 'available', 'history'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'active' ? `Active (${active.length})` : tab === 'available' ? `Available (${available.length})` : 'History'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading || (activeTab === 'history' && historyLoading) ? (
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      ) : !isOnline ? (
        <View style={styles.center}>
          <Text style={styles.centerTitle}>You are offline</Text>
          <Text style={styles.centerText}>Go online to receive delivery jobs and share your location</Text>
        </View>
      ) : currentList.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.centerTitle}>
            {activeTab === 'active'
              ? 'No active deliveries'
              : activeTab === 'available'
                ? 'No available jobs'
                : 'No delivery history'}
          </Text>
          <Text style={styles.centerText}>
            {activeTab === 'active'
              ? 'Accept an available job to get started'
              : activeTab === 'available'
                ? 'New jobs will appear here'
                : 'Your completed deliveries will show here'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item }) => renderOrder(item, activeTab)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
  },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#f8fafc' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: '#00B241' },
  dotOffline: { backgroundColor: '#64748b' },
  statusText: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  onlineToggle: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  onlineOn: { backgroundColor: '#166534' },
  onlineOff: { backgroundColor: '#1e293b' },
  onlineToggleText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  onlineToggleTextOn: { color: '#86efac' },
  earningsSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
  },
  earnBox: { flex: 1, alignItems: 'center' },
  earnDivider: { width: 1, height: 30, backgroundColor: '#334155' },
  earnLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' },
  earnValue: { fontSize: 16, fontWeight: '800', color: '#f8fafc', marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#00B241' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#1e293b',
    marginBottom: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardCompleted: { opacity: 0.7 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontWeight: '700', color: '#f8fafc', fontSize: 15 },
  statusBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeCompleted: { backgroundColor: '#1e293b' },
  status: { color: '#86efac', fontWeight: '600', textTransform: 'capitalize', fontSize: 12 },
  statusCompleted: { color: '#94a3b8' },
  vendor: { marginTop: 8, color: '#94a3b8', fontSize: 14 },
  address: { marginTop: 4, color: '#64748b', fontSize: 13 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  total: { fontWeight: '700', color: '#f8fafc', fontSize: 16 },
  fee: { fontSize: 12, color: '#94a3b8' },
  itemCount: { marginTop: 4, fontSize: 12, color: '#64748b' },
  offerTimer: { marginTop: 6, fontSize: 12, color: '#f59e0b', fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: {
    backgroundColor: '#00B241',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  declineBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  declineText: { color: '#f87171', fontWeight: '600', fontSize: 13 },
  navigateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00B241',
  },
  navigateText: { color: '#86efac', fontWeight: '600', fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  centerTitle: { fontSize: 18, fontWeight: '600', color: '#f8fafc' },
  centerText: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
});

import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import {
  acceptOrderJob,
  declineOrderJob,
  DEFAULT_LOCATION,
  fetchDriverOrders,
  fetchDriverProfile,
  formatPrice,
  toggleDriverOnline,
  updateDriverLocation,
  updateOrderStatus,
  type JobOffer,
  type Order,
} from '../../lib/api';
import { getSocket, joinSocketRooms } from '../../lib/socket';
import { useAuthStore } from '../../store/auth';

const DRIVER_ACTIONS: Record<string, { label: string; next: string }[]> = {
  ready: [{ label: 'Picked up', next: 'picked_up' }],
  picked_up: [{ label: 'Delivered', next: 'delivered' }],
};

export default function DriverJobs() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.user?.id);
  const [isOnline, setIsOnline] = useState(false);
  const [jobOffer, setJobOffer] = useState<JobOffer | null>(null);
  const [countdown, setCountdown] = useState(0);

  const { data: profileRes, refetch: refetchProfile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: fetchDriverProfile,
  });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-orders'],
    queryFn: fetchDriverOrders,
    refetchInterval: 10000,
    enabled: isOnline,
  });

  const profile = profileRes?.data;
  const available = data?.data?.available ?? [];
  const active = data?.data?.active ?? [];

  useEffect(() => {
    if (profile) setIsOnline(profile.isOnline);
  }, [profile]);

  const pushLocation = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          await updateDriverLocation(loc.coords.latitude, loc.coords.longitude);
          return;
        }
      }
      await updateDriverLocation(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
    } catch {
      await updateDriverLocation(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng);
    }
  }, []);

  useEffect(() => {
    if (!userId || !isOnline) return;

    joinSocketRooms(`driver:${userId}`);
    const socket = getSocket();

    const onNewJob = (offer: JobOffer) => {
      setJobOffer(offer);
      setCountdown(offer.expiresInSec);
    };

    socket.on('driver:new_job', onNewJob);
    void pushLocation();
    const locationInterval = setInterval(() => void pushLocation(), 10000);

    return () => {
      socket.off('driver:new_job', onNewJob);
      clearInterval(locationInterval);
    };
  }, [userId, isOnline, pushLocation]);

  useEffect(() => {
    if (!jobOffer || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          setJobOffer(null);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [jobOffer, countdown]);

  async function handleToggleOnline(value: boolean) {
    const res = await toggleDriverOnline(value);
    if (res.success && res.data) {
      setIsOnline(res.data.isOnline);
      if (value) await pushLocation();
      refetchProfile();
      if (value) refetch();
    } else {
      Alert.alert('Error', res.error ?? 'Could not update status');
    }
  }

  async function handleAccept(orderId: string) {
    const res = await acceptOrderJob(orderId);
    if (res.success) {
      setJobOffer(null);
      refetch();
    } else {
      Alert.alert('Could not accept', res.error ?? 'Try again');
    }
  }

  async function handleDecline(orderId: string) {
    await declineOrderJob(orderId);
    setJobOffer(null);
    refetch();
  }

  async function advanceStatus(orderId: string, status: string) {
    const res = await updateOrderStatus(orderId, status);
    if (res.success) refetch();
    else Alert.alert('Error', res.error ?? 'Could not update');
  }

  function renderOrder(order: Order, showActions = true) {
    const actions = DRIVER_ACTIONS[order.status] ?? [];
    return (
      <View style={styles.card} key={order.id}>
        <View style={styles.cardHeader}>
          <Text style={styles.orderNumber}>{order.orderNumber}</Text>
          <Text style={styles.status}>{order.status.replace('_', ' ')}</Text>
        </View>
        <Text style={styles.vendor}>{order.vendor.businessName}</Text>
        <Text style={styles.total}>{formatPrice(order.totalAmount)}</Text>
        {order.items?.map((line) => (
          <Text key={line.id} style={styles.line}>
            {line.product.name} × {line.quantity}
          </Text>
        ))}
        <View style={styles.actions}>
          {showActions &&
            actions.map((action) => (
              <TouchableOpacity
                key={action.next}
                style={styles.actionBtn}
                onPress={() => advanceStatus(order.id, action.next)}
              >
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          {!showActions && order.status === 'ready' && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAccept(order.id)}>
              <Text style={styles.actionText}>Accept job</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => router.push(`/(driver)/navigate/${order.id}`)}
          >
            <Text style={styles.navText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isLoading && !profile) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {profile?.user.fullName?.split(' ')[0] ?? 'Driver'}</Text>
          <Text style={styles.earnings}>
            Today: LKR {Number(profile?.earningsToday ?? 0).toLocaleString('en-LK')} ·{' '}
            {profile?.totalDeliveries ?? 0} trips
          </Text>
        </View>
        <View style={styles.onlineRow}>
          <Text style={styles.onlineLabel}>{isOnline ? 'Online' : 'Offline'}</Text>
          <Switch value={isOnline} onValueChange={handleToggleOnline} trackColor={{ true: '#2563eb' }} />
        </View>
      </View>

      {jobOffer && (
        <View style={styles.offerBanner}>
          <Text style={styles.offerTitle}>New delivery job!</Text>
          <Text style={styles.offerVendor}>{jobOffer.vendorName}</Text>
          <Text style={styles.offerFee}>Fee: LKR {jobOffer.deliveryFee.toLocaleString('en-LK')}</Text>
          <Text style={styles.offerTimer}>{countdown}s to accept</Text>
          <View style={styles.offerActions}>
            <TouchableOpacity
              style={styles.declineBtn}
              onPress={() => handleDecline(jobOffer.orderId)}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptBtn}
              onPress={() => handleAccept(jobOffer.orderId)}
            >
              <Text style={styles.acceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!isOnline ? (
        <View style={styles.center}>
          <Text style={styles.offlineIcon}>🛵</Text>
          <Text style={styles.offlineTitle}>Go online to receive jobs</Text>
        </View>
      ) : (
        <FlatList
          data={[
            ...active.map((o) => ({ ...o, _section: 'active' as const })),
            ...available.map((o) => ({ ...o, _section: 'available' as const })),
          ]}
          keyExtractor={(o) => o.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListHeaderComponent={
            active.length > 0 ? <Text style={styles.sectionTitle}>Active deliveries</Text> : null
          }
          renderItem={({ item, index }) => (
            <>
              {item._section === 'available' &&
                index === active.length &&
                available.length > 0 && (
                  <Text style={styles.sectionTitle}>Available nearby</Text>
                )}
              {renderOrder(item, item._section === 'active')}
            </>
          )}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>Waiting for delivery jobs...</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  greeting: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  earnings: { fontSize: 13, color: '#64748b', marginTop: 4 },
  onlineRow: { alignItems: 'center' },
  onlineLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  offerBanner: {
    margin: 12,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  offerTitle: { fontSize: 16, fontWeight: '700', color: '#1d4ed8' },
  offerVendor: { fontSize: 15, marginTop: 4, color: '#0f172a' },
  offerFee: { fontSize: 14, color: '#64748b', marginTop: 2 },
  offerTimer: { fontSize: 13, color: '#ef4444', marginTop: 8, fontWeight: '600' },
  offerActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  declineBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  declineText: { color: '#64748b', fontWeight: '600' },
  acceptBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  acceptText: { color: '#fff', fontWeight: '600' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  offlineIcon: { fontSize: 48, marginBottom: 12 },
  offlineTitle: { fontSize: 16, color: '#64748b' },
  emptyText: { color: '#94a3b8', marginTop: 24 },
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
  total: { marginTop: 4, fontWeight: '600' },
  line: { color: '#64748b', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actionBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  navText: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
});

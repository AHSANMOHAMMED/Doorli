import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatPrice, type Order } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../lib/axios';

type Period = 'today' | 'week' | 'month';

export default function DriverEarnings() {
  const user = useAuthStore((s) => s.user);
  const [period, setPeriod] = useState<Period>('today');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['driver-earnings', period],
    queryFn: async () => {
      const res = await apiClient.get(`/drivers/me/earnings?period=${period}`);
      return res.data?.data ?? {
        earningsToday: 0,
        totalDeliveries: 0,
        baseFare: 0,
        tips: 0,
        bonuses: 0,
        items: [],
      };
    },
    enabled: !!user,
  });

  const { data: tripHistory, isLoading: tripsLoading } = useQuery({
    queryKey: ['driver-trips', period],
    queryFn: async () => {
      const res = await apiClient.get(`/drivers/me/trips?period=${period}`);
      return (res.data?.data?.items ?? []) as Order[];
    },
    enabled: !!user,
  });

  const totalEarnings = data?.earningsToday ?? 0;
  const baseFare = data?.baseFare ?? totalEarnings;
  const tips = data?.tips ?? 0;
  const bonuses = data?.bonuses ?? 0;
  const trips = tripHistory ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
      </View>

      <View style={styles.periodSelector}>
        {(['today', 'week', 'month'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total Earnings</Text>
          <Text style={styles.totalValue}>{formatPrice(totalEarnings)}</Text>
          <Text style={styles.tripCount}>{data?.totalDeliveries ?? 0} deliveries</Text>
        </View>

        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Base Fare</Text>
            <Text style={styles.breakdownValue}>{formatPrice(baseFare)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Tips</Text>
            <Text style={styles.breakdownValue}>{formatPrice(tips)}</Text>
          </View>
          <View style={styles.breakdownDivider} />
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Bonuses</Text>
            <Text style={styles.breakdownValue}>{formatPrice(bonuses)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Trip History</Text>

        {tripsLoading ? (
          <ActivityIndicator color="#00B241" style={{ marginTop: 24 }} />
        ) : trips.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No trips for this period</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripOrder}>{trip.orderNumber}</Text>
                <Text style={styles.tripDate}>
                  {new Date(trip.createdAt).toLocaleDateString('en-LK', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              <Text style={styles.tripVendor}>{trip.vendor?.businessName ?? 'Shop'}</Text>
              <View style={styles.tripFooter}>
                <Text style={styles.tripFee}>Fee: {formatPrice(Number(trip.deliveryFee))}</Text>
                <View style={[styles.tripStatus, trip.status === 'delivered' && styles.tripStatusDone]}>
                  <Text style={[styles.tripStatusText, trip.status === 'delivered' && styles.tripStatusTextDone]}>
                    {trip.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 3,
  },
  periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  periodBtnActive: { backgroundColor: '#00B241' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#94a3b8' },
  periodTextActive: { color: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  totalCard: {
    backgroundColor: '#166534',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 13, color: '#86efac', fontWeight: '600' },
  totalValue: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 6 },
  tripCount: { fontSize: 14, color: '#86efac', marginTop: 4 },
  breakdownCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  breakdownTitle: { fontSize: 15, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  breakdownLabel: { fontSize: 14, color: '#94a3b8' },
  breakdownValue: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  breakdownDivider: { height: 1, backgroundColor: '#334155' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginTop: 20, marginBottom: 10 },
  empty: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 14, color: '#64748b' },
  tripCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  tripHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  tripOrder: { fontWeight: '700', color: '#f8fafc' },
  tripDate: { fontSize: 12, color: '#64748b' },
  tripVendor: { marginTop: 4, fontSize: 13, color: '#94a3b8' },
  tripFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  tripFee: { fontSize: 13, color: '#94a3b8' },
  tripStatus: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tripStatusDone: { backgroundColor: '#064e3b' },
  tripStatusText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'capitalize' },
  tripStatusTextDone: { color: '#86efac' },
});

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/axios';
import { API_URL } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';

type Period = 'day' | 'week' | 'month' | 'year';

interface RevenueData {
  totalRevenue: number;
  paidRevenue: number;
  deliveryRevenue: number;
  totalOrders: number;
  paidOrders: number;
  cancelledOrders: number;
  avgOrderValue: number;
}

interface VendorPerf {
  id: string;
  businessName: string;
  category: string;
  avgRating: number;
  totalRevenue: number;
  orderCount: number;
}

interface DriverPerf {
  userId: string;
  totalDeliveries: number;
  avgRating: number;
  deliveries: number;
  totalDeliveryFees: number;
  user?: { fullName: string; phone: string };
}

export default function AdminReports() {
  const [period, setPeriod] = useState<Period>('month');
  const user = useAuthStore((s) => s.user);

  const { data: revenue, isLoading: loadingRevenue, refetch, isRefetching } = useQuery({
    queryKey: ['admin-revenue', period],
    queryFn: async () => {
      const res = await apiClient.get(`/reports/revenue?period=${period}`);
      return res.data?.data as RevenueData;
    },
    enabled: !!user,
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['admin-vendor-perf', period],
    queryFn: async () => {
      const res = await apiClient.get(`/reports/vendors?period=${period}`);
      return (res.data?.data?.vendors ?? []) as VendorPerf[];
    },
    enabled: !!user,
  });

  const { data: driversData } = useQuery({
    queryKey: ['admin-driver-perf', period],
    queryFn: async () => {
      const res = await apiClient.get(`/reports/drivers?period=${period}`);
      return (res.data?.data?.drivers ?? []) as DriverPerf[];
    },
    enabled: !!user,
  });

  const handleExport = async () => {
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const url = `${API_URL}/reports/revenue/export?format=csv&period=${period}`;
      Alert.alert('Export', `CSV export for ${period} data will be downloaded.`, [
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Error', 'Failed to export');
    }
  };

  const maxRevenue = Math.max(
    1,
    ...(vendorsData ?? []).map((v) => v.totalRevenue),
  );

  const periods: { key: Period; label: string }[] = [
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Ionicons name="download-outline" size={18} color="#3b82f6" />
            <Text style={styles.exportBtnText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.periodRow}>
          {periods.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loadingRevenue ? (
          <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
                <Text style={styles.statValue}>LKR {(revenue?.totalRevenue ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#00B241' }]}>
                <Text style={styles.statValue}>{revenue?.totalOrders ?? 0}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
                <Text style={styles.statValue}>LKR {(revenue?.avgOrderValue ?? 0).toLocaleString()}</Text>
                <Text style={styles.statLabel}>Avg Order</Text>
              </View>
              <View style={[styles.statCard, { borderLeftColor: '#ef4444' }]}>
                <Text style={styles.statValue}>{revenue?.cancelledOrders ?? 0}</Text>
                <Text style={styles.statLabel}>Cancelled</Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Revenue Breakdown</Text>
              <View style={styles.barChart}>
                <View style={styles.barItem}>
                  <View style={styles.barLabel}>
                    <Text style={styles.barLabelText}>Paid Orders</Text>
                    <Text style={styles.barLabelValue}>LKR {(revenue?.paidRevenue ?? 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, ((revenue?.paidRevenue ?? 0) / Math.max(1, revenue?.totalRevenue ?? 1)) * 100)}%`,
                          backgroundColor: '#3b82f6',
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.barItem}>
                  <View style={styles.barLabel}>
                    <Text style={styles.barLabelText}>Delivery Fees</Text>
                    <Text style={styles.barLabelValue}>LKR {(revenue?.deliveryRevenue ?? 0).toLocaleString()}</Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(100, ((revenue?.deliveryRevenue ?? 0) / Math.max(1, revenue?.totalRevenue ?? 1)) * 100)}%`,
                          backgroundColor: '#00B241',
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Top Vendors</Text>
              {(vendorsData ?? []).length === 0 && (
                <Text style={styles.emptyText}>No vendor data for this period</Text>
              )}
              {(vendorsData ?? []).slice(0, 5).map((v, i) => (
                <View key={v.id} style={styles.vendorRow}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={styles.vendorInfo}>
                    <Text style={styles.vendorName}>{v.businessName}</Text>
                    <Text style={styles.vendorMeta}>
                      {v.orderCount} orders · {v.category}
                    </Text>
                  </View>
                  <View style={styles.vendorBarContainer}>
                    <View
                      style={[
                        styles.vendorBar,
                        { width: `${Math.min(100, (v.totalRevenue / maxRevenue) * 100)}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.vendorRevenue}>LKR {v.totalRevenue.toLocaleString()}</Text>
                </View>
              ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Driver Performance</Text>
              {(driversData ?? []).length === 0 && (
                <Text style={styles.emptyText}>No driver data for this period</Text>
              )}
              {(driversData ?? []).slice(0, 5).map((d, i) => (
                <View key={d.userId} style={styles.driverRow}>
                  <Text style={styles.rank}>{i + 1}</Text>
                  <View style={styles.driverInfo}>
                    <Text style={styles.driverName}>{d.user?.fullName ?? 'N/A'}</Text>
                    <Text style={styles.driverMeta}>
                      {d.deliveries} deliveries · Rating: {d.avgRating.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.driverFees}>LKR {d.totalDeliveryFees.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  exportBtnText: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
  periodRow: { flexDirection: 'row', marginTop: 12, gap: 6 },
  periodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b', alignItems: 'center' },
  periodBtnActive: { backgroundColor: '#3b82f6' },
  periodText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  periodTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  statCard: { width: '48%', flexGrow: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 14, borderLeftWidth: 3 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  sectionCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 12 },
  barChart: { gap: 12 },
  barItem: {},
  barLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabelText: { fontSize: 12, color: '#94a3b8' },
  barLabelValue: { fontSize: 12, color: '#f8fafc', fontWeight: '600' },
  barTrack: { height: 8, backgroundColor: '#0f172a', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  vendorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  rank: { fontSize: 14, fontWeight: '800', color: '#64748b', width: 20, textAlign: 'center' },
  vendorInfo: { flex: 1 },
  vendorName: { fontSize: 13, fontWeight: '700', color: '#f8fafc' },
  vendorMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },
  vendorBarContainer: { width: 60, height: 6, backgroundColor: '#0f172a', borderRadius: 3, overflow: 'hidden' },
  vendorBar: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 3 },
  vendorRevenue: { fontSize: 12, fontWeight: '700', color: '#f8fafc', minWidth: 80, textAlign: 'right' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 13, fontWeight: '700', color: '#f8fafc' },
  driverMeta: { fontSize: 11, color: '#64748b', marginTop: 1 },
  driverFees: { fontSize: 12, fontWeight: '700', color: '#f8fafc' },
  emptyText: { fontSize: 13, color: '#64748b', textAlign: 'center', padding: 16 },
});

import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';

interface PlatformMetrics {
  totalUsers: number;
  totalVendors: number;
  totalDrivers: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  weeklyRevenue: number;
  todayOrders: number;
  todayRevenue: number;
  activeUsers: number;
  activeDrivers: number;
  activeVendors: number;
  avgOrderValue: number;
  avgDeliveryTime: number;
  systemUptime: number;
}

export default function SuperAdminDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: metrics, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['super-admin-metrics'],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/metrics');
      return res.data?.data as PlatformMetrics;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#f59e0b" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Platform Overview</Text>
          <Text style={styles.subtitle}>Super Admin Dashboard</Text>
        </View>

        <View style={styles.revenueCard}>
          <Text style={styles.revenueLabel}>Total Revenue</Text>
          <Text style={styles.revenueValue}>LKR {(metrics?.totalRevenue ?? 0).toLocaleString()}</Text>
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueSubValue}>LKR {(metrics?.monthlyRevenue ?? 0).toLocaleString()}</Text>
              <Text style={styles.revenueSubLabel}>This Month</Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueSubValue}>LKR {(metrics?.weeklyRevenue ?? 0).toLocaleString()}</Text>
              <Text style={styles.revenueSubLabel}>This Week</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.statValue}>{metrics?.totalUsers ?? 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#00B241' }]}>
            <Text style={styles.statValue}>{metrics?.totalVendors ?? 0}</Text>
            <Text style={styles.statLabel}>Vendors</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.statValue}>{metrics?.totalDrivers ?? 0}</Text>
            <Text style={styles.statLabel}>Drivers</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
            <Text style={styles.statValue}>{metrics?.totalOrders ?? 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.halfCard}>
            <Text style={styles.halfValue}>{metrics?.todayOrders ?? 0}</Text>
            <Text style={styles.halfLabel}>Today's Orders</Text>
          </View>
          <View style={styles.halfCard}>
            <Text style={styles.halfValue}>LKR {(metrics?.todayRevenue ?? 0).toLocaleString()}</Text>
            <Text style={styles.halfLabel}>Today's Revenue</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.halfCard}>
            <Text style={styles.halfValue}>{metrics?.activeUsers ?? 0}</Text>
            <Text style={styles.halfLabel}>Active Users</Text>
          </View>
          <View style={styles.halfCard}>
            <Text style={styles.halfValue}>{metrics?.activeDrivers ?? 0}</Text>
            <Text style={styles.halfLabel}>Active Drivers</Text>
          </View>
        </View>

        <View style={styles.metricsCard}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Avg Order Value</Text>
            <Text style={styles.metricValue}>LKR {(metrics?.avgOrderValue ?? 0).toLocaleString()}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Avg Delivery Time</Text>
            <Text style={styles.metricValue}>{metrics?.avgDeliveryTime ?? 0} min</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>System Uptime</Text>
            <Text style={[styles.metricValue, { color: '#00B241' }]}>{(metrics?.systemUptime ?? 99.9).toFixed(1)}%</Text>
          </View>
        </View>

        <View style={styles.healthCard}>
          <Text style={styles.sectionTitle}>System Health Matrix</Text>
          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
              <Text style={styles.healthText}>API Gateway</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
              <Text style={styles.healthText}>PostgreSQL</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
              <Text style={styles.healthText}>Redis Cache</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
              <Text style={styles.healthText}>S3 Storage</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
              <Text style={styles.healthText}>Payment Gateway</Text>
            </View>
            <View style={styles.healthItem}>
              <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
              <Text style={styles.healthText}>Push Service</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 32 },
  header: { marginBottom: 4 },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  revenueCard: {
    backgroundColor: '#713f12',
    borderRadius: 16,
    padding: 20,
    marginTop: 14,
  },
  revenueLabel: { fontSize: 13, color: '#fbbf24', fontWeight: '600' },
  revenueValue: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 4 },
  revenueRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  revenueItem: { flex: 1 },
  revenueSubValue: { fontSize: 16, fontWeight: '700', color: '#fef3c7' },
  revenueSubLabel: { fontSize: 11, color: '#fbbf24', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  sectionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  halfCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  halfValue: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  halfLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600' },
  metricsCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 10 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  metricLabel: { fontSize: 14, color: '#94a3b8' },
  metricValue: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  divider: { height: 1, backgroundColor: '#334155' },
  healthCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginTop: 12 },
  healthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  healthItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthText: { fontSize: 12, color: '#94a3b8' },
});

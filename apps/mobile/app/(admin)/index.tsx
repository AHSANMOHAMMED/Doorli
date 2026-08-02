import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';

interface DashboardStats {
  totalUsers: number;
  totalVendors: number;
  totalOrders: number;
  totalRevenue: number;
  activeDrivers: number;
  pendingVerifications: number;
  todayOrders: number;
  todayRevenue: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);

  const { data: stats, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard');
      return res.data?.data as DashboardStats;
    },
    enabled: !!user,
  });

  const { data: activity } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/activity');
      return (res.data?.data?.items ?? []) as RecentActivity[];
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.fullName?.split(' ')[0]}</Text>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.statValue}>{stats?.totalUsers ?? 0}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#00B241' }]}>
            <Text style={styles.statValue}>{stats?.totalVendors ?? 0}</Text>
            <Text style={styles.statLabel}>Vendors</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
            <Text style={styles.statValue}>{stats?.totalOrders ?? 0}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
            <Text style={styles.statValue}>LKR {(stats?.totalRevenue ?? 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.halfCard}>
            <Text style={styles.halfValue}>{stats?.todayOrders ?? 0}</Text>
            <Text style={styles.halfLabel}>Today's Orders</Text>
          </View>
          <View style={styles.halfCard}>
            <Text style={styles.halfValue}>LKR {(stats?.todayRevenue ?? 0).toLocaleString()}</Text>
            <Text style={styles.halfLabel}>Today's Revenue</Text>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <View style={styles.halfCard}>
            <Text style={styles.halfValue}>{stats?.activeDrivers ?? 0}</Text>
            <Text style={styles.halfLabel}>Active Drivers</Text>
          </View>
          <View style={styles.halfCard}>
            <Text style={[styles.halfValue, (stats?.pendingVerifications ?? 0) > 0 && { color: '#f59e0b' }]}>
              {stats?.pendingVerifications ?? 0}
            </Text>
            <Text style={styles.halfLabel}>Pending Verifications</Text>
          </View>
        </View>

        {stats && (
          <View style={styles.healthCard}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthRow}>
              <View style={styles.healthItem}>
                <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
                <Text style={styles.healthText}>API Server</Text>
              </View>
              <View style={styles.healthItem}>
                <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
                <Text style={styles.healthText}>Database</Text>
              </View>
              <View style={styles.healthItem}>
                <View style={[styles.healthDot, { backgroundColor: '#00B241' }]} />
                <Text style={styles.healthText}>Payments</Text>
              </View>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {activity && activity.length > 0 ? (
          activity.slice(0, 10).map((item) => (
            <View key={item.id} style={styles.activityCard}>
              <View style={[styles.activityDot, item.type === 'order' && styles.activityDotOrder]} />
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{item.message}</Text>
                <Text style={styles.activityTime}>
                  {new Date(item.timestamp).toLocaleString('en-LK', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No recent activity</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
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
  healthCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginTop: 16, marginBottom: 8 },
  healthRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  healthItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  healthDot: { width: 8, height: 8, borderRadius: 4 },
  healthText: { fontSize: 12, color: '#94a3b8' },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    gap: 10,
    alignItems: 'flex-start',
  },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginTop: 4 },
  activityDotOrder: { backgroundColor: '#00B241' },
  activityContent: { flex: 1 },
  activityText: { fontSize: 13, color: '#f8fafc' },
  activityTime: { fontSize: 11, color: '#64748b', marginTop: 2 },
  emptyCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#64748b' },
});

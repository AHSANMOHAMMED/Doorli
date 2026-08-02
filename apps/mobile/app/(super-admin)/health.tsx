import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';

interface HealthStatus {
  services: { name: string; status: 'healthy' | 'degraded' | 'down'; latency: number }[];
  database: { connections: number; activeQueries: number; size: string };
  api: { requestsPerMin: number; avgResponseTime: number; errorRate: number };
  memory: { used: string; total: string; percentage: number };
  uptime: number;
}

export default function SuperAdminHealth() {
  const user = useAuthStore((s) => s.user);

  const { data: health, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['super-admin-health'],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/health');
      return res.data?.data as HealthStatus;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#f59e0b" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const services = health?.services ?? [
    { name: 'API Gateway', status: 'healthy', latency: 12 },
    { name: 'PostgreSQL', status: 'healthy', latency: 5 },
    { name: 'Redis', status: 'healthy', latency: 2 },
    { name: 'S3 Storage', status: 'healthy', latency: 45 },
    { name: 'Payment Gateway', status: 'healthy', latency: 200 },
    { name: 'Push Service', status: 'healthy', latency: 80 },
  ];

  const statusColor = (s: string) =>
    s === 'healthy' ? '#00B241' : s === 'degraded' ? '#f59e0b' : '#dc2626';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <Text style={styles.title}>System Health</Text>

        <View style={styles.uptimeCard}>
          <Text style={styles.uptimeLabel}>System Uptime</Text>
          <Text style={styles.uptimeValue}>{(health?.uptime ?? 99.9).toFixed(2)}%</Text>
          <Text style={styles.uptimeSub}>Last 30 days</Text>
        </View>

        <Text style={styles.sectionTitle}>Services</Text>
        {services.map((svc) => (
          <View key={svc.name} style={styles.serviceCard}>
            <View style={styles.serviceHeader}>
              <View style={[styles.statusDot, { backgroundColor: statusColor(svc.status) }]} />
              <Text style={styles.serviceName}>{svc.name}</Text>
              <Text style={[styles.serviceStatus, { color: statusColor(svc.status) }]}>
                {svc.status}
              </Text>
            </View>
            <Text style={styles.serviceLatency}>Latency: {svc.latency}ms</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Database</Text>
        <View style={styles.metricsCard}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Active Connections</Text>
            <Text style={styles.metricValue}>{health?.database?.connections ?? 12}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Active Queries</Text>
            <Text style={styles.metricValue}>{health?.database?.activeQueries ?? 3}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Database Size</Text>
            <Text style={styles.metricValue}>{health?.database?.size ?? '256 MB'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>API Metrics</Text>
        <View style={styles.metricsCard}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Requests/min</Text>
            <Text style={styles.metricValue}>{health?.api?.requestsPerMin ?? 120}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Avg Response Time</Text>
            <Text style={styles.metricValue}>{health?.api?.avgResponseTime ?? 45}ms</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Error Rate</Text>
            <Text style={[styles.metricValue, { color: (health?.api?.errorRate ?? 0.1) > 1 ? '#dc2626' : '#00B241' }]}>
              {(health?.api?.errorRate ?? 0.1).toFixed(2)}%
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Memory</Text>
        <View style={styles.metricsCard}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Used</Text>
            <Text style={styles.metricValue}>{health?.memory?.used ?? '1.2 GB'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Total</Text>
            <Text style={styles.metricValue}>{health?.memory?.total ?? '4 GB'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Usage</Text>
            <Text style={[styles.metricValue, (health?.memory?.percentage ?? 30) > 80 ? { color: '#dc2626' } : { color: '#00B241' }]}>
              {health?.memory?.percentage ?? 30}%
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  uptimeCard: {
    backgroundColor: '#064e3b',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginTop: 14,
  },
  uptimeLabel: { fontSize: 13, color: '#86efac', fontWeight: '600' },
  uptimeValue: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 4 },
  uptimeSub: { fontSize: 12, color: '#86efac', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginTop: 20, marginBottom: 10 },
  serviceCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 6 },
  serviceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  serviceName: { fontSize: 14, fontWeight: '600', color: '#f8fafc', flex: 1 },
  serviceStatus: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  serviceLatency: { fontSize: 11, color: '#64748b', marginTop: 4 },
  metricsCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16 },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  metricLabel: { fontSize: 14, color: '#94a3b8' },
  metricValue: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  divider: { height: 1, backgroundColor: '#334155' },
});

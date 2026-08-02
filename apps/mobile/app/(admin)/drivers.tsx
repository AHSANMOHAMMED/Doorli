import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';

interface Driver {
  id: string;
  userId: string;
  fullName: string;
  phone: string | null;
  isOnline: boolean;
  isVerified: boolean;
  totalDeliveries: number;
  avgRating: number;
  vehicleType?: string;
  plateNumber?: string;
}

export default function AdminDrivers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-drivers', search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await apiClient.get(`/admin/drivers?${params.toString()}`);
      return (res.data?.data?.items ?? []) as Driver[];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ driverId, verify }: { driverId: string; verify: boolean }) => {
      await apiClient.patch(`/admin/drivers/${driverId}/${verify ? 'verify' : 'reject'}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
      Alert.alert('Done', 'Driver status updated');
    },
    onError: () => Alert.alert('Error', 'Failed to update driver'),
  });

  const drivers = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Driver Management</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search drivers..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {isLoading ? (
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={drivers}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item: d }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.driverName}>{d.fullName}</Text>
                  <Text style={styles.driverPhone}>{d.phone ?? 'N/A'}</Text>
                </View>
                <View style={[styles.statusBadge, d.isOnline ? styles.online : styles.offline]}>
                  <Text style={styles.statusText}>{d.isOnline ? 'Online' : 'Offline'}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{d.totalDeliveries}</Text>
                  <Text style={styles.statLabel}>Deliveries</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>⭐ {d.avgRating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, d.isVerified ? { color: '#00B241' } : { color: '#f59e0b' }]}>
                    {d.isVerified ? 'Verified' : 'Pending'}
                  </Text>
                  <Text style={styles.statLabel}>Status</Text>
                </View>
              </View>

              {d.plateNumber && (
                <Text style={styles.vehicleText}>
                  {d.vehicleType ?? 'Vehicle'} · {d.plateNumber}
                </Text>
              )}

              <View style={styles.cardActions}>
                {!d.isVerified && (
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={() =>
                      Alert.alert('Verify Driver', `Verify ${d.fullName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Verify', onPress: () => verifyMutation.mutate({ driverId: d.id, verify: true }) },
                      ])
                    }
                  >
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  </TouchableOpacity>
                )}
                {d.isVerified && (
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() =>
                      Alert.alert('Reject Driver', `Reject ${d.fullName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Reject', style: 'destructive', onPress: () => verifyMutation.mutate({ driverId: d.id, verify: false }) },
                      ])
                    }
                  >
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No drivers found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', paddingHorizontal: 16, paddingTop: 14 },
  searchRow: { paddingHorizontal: 16, marginTop: 12 },
  searchInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  driverName: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  driverPhone: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  online: { backgroundColor: '#064e3b' },
  offline: { backgroundColor: '#334155' },
  statusText: { fontSize: 11, fontWeight: '600', color: '#86efac' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  statItem: { flex: 1 },
  statValue: { fontSize: 16, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2, fontWeight: '600', textTransform: 'uppercase' },
  vehicleText: { fontSize: 12, color: '#64748b', marginTop: 6 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  verifyBtn: { backgroundColor: '#166534', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  verifyBtnText: { fontSize: 12, color: '#86efac', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#991b1b', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  rejectBtnText: { fontSize: 12, color: '#fca5a5', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#64748b' },
});

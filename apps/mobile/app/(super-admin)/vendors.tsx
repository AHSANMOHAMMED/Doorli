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

interface Vendor {
  id: string;
  businessName: string;
  category: string;
  isOpen: boolean;
  isVerified: boolean;
  avgRating: number;
  totalReviews: number;
  totalOrders: number;
  createdAt: string;
}

export default function SuperAdminVendors() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['super-admin-vendors', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiClient.get(`/super-admin/vendors?${params.toString()}`);
      return (res.data?.data?.items ?? []) as Vendor[];
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ vendorId, verify }: { vendorId: string; verify: boolean }) => {
      await apiClient.patch(`/super-admin/vendors/${vendorId}/${verify ? 'verify' : 'reject'}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-vendors'] });
      Alert.alert('Done', 'Vendor status updated');
    },
    onError: () => Alert.alert('Error', 'Failed to update vendor'),
  });

  const vendors = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>All Vendors</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search vendors..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {['all', 'pending', 'verified', 'rejected'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#f59e0b" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={vendors}
          keyExtractor={(v) => v.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item: v }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.vendorName}>{v.businessName}</Text>
                  <Text style={styles.vendorCategory}>{v.category}</Text>
                </View>
                <View style={[styles.verifyBadge, v.isVerified ? styles.verified : styles.pending]}>
                  <Text style={styles.verifyText}>{v.isVerified ? 'Verified' : 'Pending'}</Text>
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>⭐ {v.avgRating.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{v.totalReviews}</Text>
                  <Text style={styles.statLabel}>Reviews</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{v.totalOrders}</Text>
                  <Text style={styles.statLabel}>Orders</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statValue, v.isOpen ? styles.openText : styles.closedText]}>
                    {v.isOpen ? 'Open' : 'Closed'}
                  </Text>
                  <Text style={styles.statLabel}>Status</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                {!v.isVerified && (
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={() =>
                      Alert.alert('Verify', `Verify ${v.businessName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Verify', onPress: () => verifyMutation.mutate({ vendorId: v.id, verify: true }) },
                      ])
                    }
                  >
                    <Text style={styles.verifyBtnText}>Verify</Text>
                  </TouchableOpacity>
                )}
                {v.isVerified && (
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() =>
                      Alert.alert('Reject', `Reject ${v.businessName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Reject', style: 'destructive', onPress: () => verifyMutation.mutate({ vendorId: v.id, verify: false }) },
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
              <Text style={styles.emptyText}>No vendors found</Text>
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
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 10, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#f59e0b' },
  filterText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  filterTextActive: { color: '#0f172a' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  vendorName: { fontSize: 16, fontWeight: '700', color: '#f8fafc' },
  vendorCategory: { fontSize: 12, color: '#94a3b8', marginTop: 2, textTransform: 'capitalize' },
  verifyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  verified: { backgroundColor: '#064e3b' },
  pending: { backgroundColor: '#713f12' },
  verifyText: { fontSize: 11, fontWeight: '600', color: '#fbbf24' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  statItem: { flex: 1 },
  statValue: { fontSize: 14, fontWeight: '700', color: '#f8fafc' },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  openText: { color: '#00B241' },
  closedText: { color: '#dc2626' },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  verifyBtn: { backgroundColor: '#166534', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  verifyBtnText: { fontSize: 12, color: '#86efac', fontWeight: '600' },
  rejectBtn: { backgroundColor: '#991b1b', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
  rejectBtnText: { fontSize: 12, color: '#fca5a5', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#64748b' },
});

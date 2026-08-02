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

interface User {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export default function SuperAdminUsers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['super-admin-users', search, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      const res = await apiClient.get(`/super-admin/users?${params.toString()}`);
      return (res.data?.data?.items ?? []) as User[];
    },
  });

  const blockMutation = useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }) => {
      await apiClient.patch(`/super-admin/users/${userId}/${block ? 'block' : 'unblock'}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-users'] });
      Alert.alert('Done', 'User status updated');
    },
    onError: () => Alert.alert('Error', 'Failed to update user'),
  });

  const users = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>All Users</Text>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#64748b"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {['all', 'customer', 'vendor', 'driver', 'admin'].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterBtn, roleFilter === r && styles.filterBtnActive]}
            onPress={() => setRoleFilter(r)}
          >
            <Text style={[styles.filterText, roleFilter === r && styles.filterTextActive]}>
              {r === 'all' ? 'All' : r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#f59e0b" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item: u }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.fullName}</Text>
                  <Text style={styles.userDetail}>{u.phone ?? u.email ?? 'No contact'}</Text>
                </View>
                <View style={[styles.roleBadge, u.role === 'admin' && styles.roleBadgeAdmin]}>
                  <Text style={styles.roleText}>{u.role}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={[styles.statusDot, u.isBlocked ? styles.dotRed : styles.dotGreen]} />
                <Text style={styles.statusText}>{u.isBlocked ? 'Blocked' : 'Active'}</Text>
                <Text style={styles.dateText}>
                  {new Date(u.createdAt).toLocaleDateString('en-LK')}
                </Text>
                <TouchableOpacity
                  style={[styles.actionBtn, u.isBlocked ? styles.unblockBtn : styles.blockBtn]}
                  onPress={() =>
                    Alert.alert(
                      u.isBlocked ? 'Unblock' : 'Block',
                      `${u.isBlocked ? 'Unblock' : 'Block'} ${u.fullName}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Confirm',
                          style: 'destructive',
                          onPress: () => blockMutation.mutate({ userId: u.id, block: !u.isBlocked }),
                        },
                      ],
                    )
                  }
                >
                  <Text style={styles.actionText}>{u.isBlocked ? 'Unblock' : 'Block'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No users found</Text>
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
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 10, gap: 6, flexWrap: 'wrap' },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#f59e0b' },
  filterText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  filterTextActive: { color: '#0f172a' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userName: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  userDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  roleBadge: { backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  roleBadgeAdmin: { backgroundColor: '#92400e' },
  roleText: { fontSize: 11, color: '#fbbf24', fontWeight: '600', textTransform: 'capitalize' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotGreen: { backgroundColor: '#00B241' },
  dotRed: { backgroundColor: '#dc2626' },
  statusText: { fontSize: 12, color: '#94a3b8', flex: 1 },
  dateText: { fontSize: 11, color: '#64748b' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  blockBtn: { backgroundColor: '#991b1b' },
  unblockBtn: { backgroundColor: '#166534' },
  actionText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#64748b' },
});

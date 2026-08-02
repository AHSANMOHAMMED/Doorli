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
  Modal,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';

interface CorporateAccount {
  id: string;
  companyName: string;
  companyEmail: string;
  contactPhone: string;
  addressLine: string | null;
  city: string | null;
  taxId: string | null;
  creditLimit: number;
  creditUsed: number;
  status: string;
  approvedBy: string | null;
  createdAt: string;
  users?: CorporateUser[];
  _count?: { orders: number };
}

interface CorporateUser {
  id: string;
  role: string;
  department: string | null;
  monthlyLimit: number | null;
  user: { id: string; fullName: string; email: string; phone: string | null };
}

interface CorporateOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  vendor: { businessName: string };
  customer: { fullName: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  active: '#00B241',
  rejected: '#dc2626',
  suspended: '#94a3b8',
};

export default function AdminCorporate() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<CorporateAccount | null>(null);
  const [detailTab, setDetailTab] = useState<'info' | 'users' | 'orders' | 'credit'>('info');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-corporate', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const res = await apiClient.get(`/corporate/all?${params.toString()}`);
      return (res.data?.data ?? []) as CorporateAccount[];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/corporate/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-corporate'] });
      Alert.alert('Approved', 'Corporate account approved');
    },
    onError: () => Alert.alert('Error', 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`/corporate/${id}/reject`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-corporate'] });
      Alert.alert('Rejected', 'Corporate account rejected');
    },
    onError: () => Alert.alert('Error', 'Failed to reject'),
  });

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['admin-corporate-detail', selectedAccount?.id, detailTab],
    queryFn: async () => {
      if (!selectedAccount) return null;
      if (detailTab === 'users') {
        const res = await apiClient.get(`/corporate/${selectedAccount.id}/users`);
        return res.data?.data ?? [];
      }
      if (detailTab === 'orders') {
        const res = await apiClient.get(`/corporate/${selectedAccount.id}/orders`);
        return res.data?.data ?? [];
      }
      if (detailTab === 'credit') {
        const res = await apiClient.get(`/corporate/${selectedAccount.id}/credit`);
        return res.data?.data;
      }
      return null;
    },
    enabled: !!selectedAccount && detailTab !== 'info',
  });

  const accounts = data ?? [];

  const renderDetailModal = () => {
    if (!selectedAccount) return null;
    return (
      <Modal visible={!!selectedAccount} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedAccount.companyName}</Text>
              <TouchableOpacity onPress={() => setSelectedAccount(null)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.tabRow}>
              {(['info', 'users', 'orders', 'credit'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tabBtn, detailTab === t && styles.tabBtnActive]}
                  onPress={() => setDetailTab(t)}
                >
                  <Text style={[styles.tabText, detailTab === t && styles.tabTextActive]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <ScrollView style={styles.modalBody}>
              {detailTab === 'info' && (
                <View>
                  <DetailRow label="Email" value={selectedAccount.companyEmail} />
                  <DetailRow label="Phone" value={selectedAccount.contactPhone} />
                  <DetailRow label="Address" value={selectedAccount.addressLine ?? '—'} />
                  <DetailRow label="City" value={selectedAccount.city ?? '—'} />
                  <DetailRow label="Tax ID" value={selectedAccount.taxId ?? '—'} />
                  <DetailRow label="Status" value={selectedAccount.status} />
                  <DetailRow label="Created" value={new Date(selectedAccount.createdAt).toLocaleDateString('en-LK')} />
                </View>
              )}
              {detailTab === 'users' && (
                <View>
                  {detailLoading ? (
                    <ActivityIndicator color="#3b82f6" style={{ marginTop: 24 }} />
                  ) : ((detailData as CorporateUser[]) ?? []).length === 0 ? (
                    <Text style={styles.emptyText}>No users</Text>
                  ) : (
                    ((detailData as CorporateUser[]) ?? []).map((cu) => (
                      <View key={cu.id} style={styles.userCard}>
                        <Text style={styles.userCardName}>{cu.user.fullName}</Text>
                        <Text style={styles.userCardDetail}>{cu.user.email}</Text>
                        <View style={styles.userCardMeta}>
                          <Text style={styles.userCardRole}>{cu.role}</Text>
                          {cu.department && <Text style={styles.userCardDept}>{cu.department}</Text>}
                        </View>
                      </View>
                    ))
                  )}
                </View>
              )}
              {detailTab === 'orders' && (
                <View>
                  {detailLoading ? (
                    <ActivityIndicator color="#3b82f6" style={{ marginTop: 24 }} />
                  ) : ((detailData as CorporateOrder[]) ?? []).length === 0 ? (
                    <Text style={styles.emptyText}>No orders</Text>
                  ) : (
                    ((detailData as CorporateOrder[]) ?? []).map((o) => (
                      <View key={o.id} style={styles.orderCard}>
                        <View style={styles.orderHeader}>
                          <Text style={styles.orderNumber}>{o.orderNumber}</Text>
                          <View style={[styles.orderStatusBadge, { backgroundColor: STATUS_COLORS[o.status] ?? '#334155' }]}>
                            <Text style={styles.orderStatusText}>{o.status}</Text>
                          </View>
                        </View>
                        <Text style={styles.orderDetail}>{o.vendor.businessName} — {o.customer.fullName}</Text>
                        <Text style={styles.orderAmount}>LKR {o.totalAmount.toFixed(2)}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
              {detailTab === 'credit' && (
                <View>
                  {detailLoading ? (
                    <ActivityIndicator color="#3b82f6" style={{ marginTop: 24 }} />
                  ) : detailData ? (
                    <View>
                      <DetailRow label="Credit Limit" value={`LKR ${(detailData as any).creditLimit.toLocaleString()}`} />
                      <DetailRow label="Credit Used" value={`LKR ${(detailData as any).creditUsed.toLocaleString()}`} />
                      <DetailRow label="Available" value={`LKR ${(detailData as any).availableCredit.toLocaleString()}`} />
                    </View>
                  ) : null}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Corporate Accounts</Text>

      <View style={styles.filterRow}>
        {['all', 'pending', 'active', 'rejected'].map((s) => (
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
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item: account }) => (
            <TouchableOpacity style={styles.card} onPress={() => { setSelectedAccount(account); setDetailTab('info'); }}>
              <View style={styles.cardHeader}>
                <Text style={styles.companyName}>{account.companyName}</Text>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[account.status] ?? '#334155' }]}>
                  <Text style={styles.statusText}>{account.status}</Text>
                </View>
              </View>
              <Text style={styles.cardDetail}>{account.companyEmail}</Text>
              <Text style={styles.cardDetail}>{account.contactPhone}</Text>
              {account.city && <Text style={styles.cardMeta}>{account.city}</Text>}
              <View style={styles.cardFooter}>
                <Text style={styles.creditText}>Credit: LKR {account.creditLimit.toLocaleString()}</Text>
                <Text style={styles.usersText}>{account.users?.length ?? 0} users</Text>
              </View>
              {account.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={() =>
                      Alert.alert('Approve', `Approve ${account.companyName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Approve', onPress: () => approveMutation.mutate(account.id) },
                      ])
                    }
                  >
                    <Text style={styles.actionBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={() =>
                      Alert.alert('Reject', `Reject ${account.companyName}?`, [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Reject', style: 'destructive', onPress: () => rejectMutation.mutate(account.id) },
                      ])
                    }
                  >
                    <Text style={styles.actionBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No corporate accounts found</Text>
            </View>
          }
        />
      )}

      {renderDetailModal()}
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc', paddingHorizontal: 16, paddingTop: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 6 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b' },
  filterBtnActive: { backgroundColor: '#3b82f6' },
  filterText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  companyName: { fontSize: 15, fontWeight: '700', color: '#f8fafc', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, color: '#fff', fontWeight: '600', textTransform: 'capitalize' },
  cardDetail: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  creditText: { fontSize: 12, color: '#94a3b8' },
  usersText: { fontSize: 12, color: '#94a3b8' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  approveBtn: { flex: 1, backgroundColor: '#166534', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  rejectBtn: { flex: 1, backgroundColor: '#991b1b', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 14, color: '#64748b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  modalClose: { fontSize: 14, color: '#3b82f6', fontWeight: '600' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 6 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b' },
  tabBtnActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  modalBody: { padding: 16, paddingBottom: 40 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  detailLabel: { fontSize: 13, color: '#64748b' },
  detailValue: { fontSize: 13, color: '#f8fafc', fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  userCard: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8 },
  userCardName: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  userCardDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  userCardMeta: { flexDirection: 'row', gap: 8, marginTop: 6 },
  userCardRole: { fontSize: 11, color: '#3b82f6', fontWeight: '600' },
  userCardDept: { fontSize: 11, color: '#64748b' },
  orderCard: { backgroundColor: '#1e293b', borderRadius: 8, padding: 12, marginBottom: 8 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderNumber: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  orderStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  orderStatusText: { fontSize: 10, color: '#fff', fontWeight: '600', textTransform: 'capitalize' },
  orderDetail: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  orderAmount: { fontSize: 13, color: '#f8fafc', fontWeight: '600', marginTop: 4 },
});

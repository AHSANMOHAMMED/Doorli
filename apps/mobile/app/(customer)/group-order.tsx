import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { DoorliColors } from '../../constants/colors';
import { Users, Plus, Trash2, Send, Copy, Store, ArrowLeft, Link } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

interface GroupOrderItem {
  id: string;
  quantity: number;
  notes?: string | null;
  user: { fullName: string };
  product: { id: string; name: string; price: number; imageUrl?: string | null };
}

interface GroupOrder {
  id: string;
  createdBy?: string;
  title: string;
  status: string;
  inviteCode: string;
  createdAt: string;
  vendor: { businessName: string; logoUrl?: string | null };
  items?: GroupOrderItem[];
  participants?: Array<{ id: string; name: string }>;
  subtotal?: number;
}

async function fetchMyGroupOrders(): Promise<GroupOrder[]> {
  const res = await apiClient.get('/group-orders/my');
  return (res.data ?? []) as GroupOrder[];
}

async function fetchGroupOrder(id: string): Promise<GroupOrder> {
  const res = await apiClient.get(`/group-orders/${id}`);
  return res.data as GroupOrder;
}

async function joinGroupOrder(inviteCode: string): Promise<GroupOrder> {
  const res = await apiClient.get(`/group-orders/join/${inviteCode}`);
  return res.data as GroupOrder;
}

async function createGroupOrder(params: { title: string; vendorId: string }): Promise<GroupOrder> {
  const res = await apiClient.post('/group-orders', params);
  return res.data as GroupOrder;
}

async function addGroupItem(params: { groupOrderId: string; productId: string; quantity?: number; notes?: string }) {
  const res = await apiClient.post(`/group-orders/${params.groupOrderId}/items`, {
    productId: params.productId,
    quantity: params.quantity ?? 1,
    notes: params.notes,
  });
  return res.data;
}

async function removeGroupItem(groupOrderId: string, itemId: string) {
  const res = await apiClient.delete(`/group-orders/${groupOrderId}/items/${itemId}`);
  return res.data;
}

async function submitGroupOrder(id: string) {
  const res = await apiClient.post(`/group-orders/${id}/submit`);
  return res.data;
}

type ViewMode = 'list' | 'detail' | 'join';

export default function GroupOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ inviteCode?: string; id?: string }>();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<ViewMode>(params.id ? 'detail' : 'list');
  const [activeId, setActiveId] = useState<string>(params.id || '');
  const [joinCode, setJoinCode] = useState(params.inviteCode || '');
  const [newTitle, setNewTitle] = useState('');
  const [newVendorId, setNewVendorId] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: myOrders, isLoading: loadingMy } = useQuery({
    queryKey: ['group-orders-my'],
    queryFn: fetchMyGroupOrders,
    enabled: mode === 'list',
  });

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['group-order', activeId],
    queryFn: () => fetchGroupOrder(activeId),
    enabled: mode === 'detail' && !!activeId,
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (params.inviteCode && mode === 'list') {
      handleJoin(params.inviteCode);
    }
  }, [params.inviteCode]);

  async function handleJoin(code?: string) {
    const c = code || joinCode.trim();
    if (!c) {
      Alert.alert('Enter code', 'Please enter an invite code.');
      return;
    }
    setBusy(true);
    try {
      const order = await joinGroupOrder(c);
      setActiveId(order.id);
      setMode('detail');
    } catch (e: unknown) {
      Alert.alert('Join failed', e instanceof Error ? e.message : 'Invalid code');
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim() || !newVendorId.trim()) {
      Alert.alert('Missing fields', 'Enter a title and vendor ID.');
      return;
    }
    setBusy(true);
    try {
      const order = await createGroupOrder({ title: newTitle.trim(), vendorId: newVendorId.trim() });
      setActiveId(order.id);
      setMode('detail');
      setNewTitle('');
      setNewVendorId('');
    } catch (e: unknown) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(false);
    }
  }

  async function handleShareInvite() {
    if (!detail) return;
    try {
      await Share.share({
        message: `Join my group order "${detail.title}"! Use code: ${detail.inviteCode}`,
      });
    } catch {}
  }

  function handleCopyCode() {
    if (!detail) return;
    // Clipboard API requires expo-clipboard; fallback to Share
    Share.share({ message: detail.inviteCode });
  }

  async function handleRemoveItem(itemId: string) {
    if (!detail) return;
    try {
      await removeGroupItem(detail.id, itemId);
      queryClient.invalidateQueries({ queryKey: ['group-order', detail.id] });
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed');
    }
  }

  async function handleSubmit() {
    if (!detail) return;
    if (detail.items && detail.items.length === 0) {
      Alert.alert('Empty', 'Add items before submitting.');
      return;
    }
    setBusy(true);
    try {
      await submitGroupOrder(detail.id);
      queryClient.invalidateQueries({ queryKey: ['group-order', detail.id] });
      Alert.alert('Submitted', 'Group order has been submitted!');
    } catch (e: unknown) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Only the creator can submit');
    } finally {
      setBusy(false);
    }
  }

  function renderDetail() {
    if (loadingDetail || !detail) {
      return <ActivityIndicator color={PRIMARY} style={{ marginTop: 48 }} />;
    }

    const subtotal = detail.items?.reduce((sum, i) => sum + (i.product.price * i.quantity), 0) ?? 0;
    const isCreator = detail.createdBy === undefined || detail.status === 'open';
    const isOpen = detail.status === 'open';

    return (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setMode('list')} style={styles.backBtn}>
            <ArrowLeft color={DoorliColors.text} size={20} />
          </TouchableOpacity>
          <View style={styles.detailTitleWrap}>
            <Text style={styles.detailTitle} numberOfLines={1}>{detail.title}</Text>
            <Text style={styles.detailVendor}>{detail.vendor.businessName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.1)' }]}>
            <Text style={[styles.statusText, { color: isOpen ? DoorliColors.teal : DoorliColors.textDim }]}>
              {isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        <View style={styles.inviteCard}>
          <View style={styles.inviteHeader}>
            <Link color={PRIMARY} size={16} />
            <Text style={styles.inviteLabel}>Invite Code</Text>
          </View>
          <View style={styles.inviteCodeRow}>
            <Text style={styles.inviteCode}>{detail.inviteCode}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={handleCopyCode}>
              <Copy color={PRIMARY} size={16} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShareInvite}>
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {detail.participants && detail.participants.length > 0 && (
          <View style={styles.participantsCard}>
            <View style={styles.participantsHeader}>
              <Users color={DoorliColors.sky} size={16} />
              <Text style={styles.participantsLabel}>{detail.participants.length} Participants</Text>
            </View>
            <View style={styles.participantsRow}>
              {detail.participants.map((p) => (
                <View key={p.id} style={styles.participantChip}>
                  <Text style={styles.participantName}>{p.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.itemsCard}>
          <Text style={styles.itemsTitle}>Items ({detail.items?.length ?? 0})</Text>
          {(!detail.items || detail.items.length === 0) ? (
            <Text style={styles.noItems}>No items added yet</Text>
          ) : (
            detail.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.product.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.user.fullName} · {item.quantity}x · LKR {Number(item.product.price * item.quantity).toLocaleString()}
                  </Text>
                  {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.itemRemoveBtn}>
                  <Trash2 color={DoorliColors.danger} size={14} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>LKR {Number(subtotal).toLocaleString()}</Text>
          </View>
          {isOpen && (
            <TouchableOpacity style={[styles.submitBtn, busy && { opacity: 0.6 }]} onPress={handleSubmit} disabled={busy}>
              {busy ? <ActivityIndicator color="#fff" /> : <Send color="#fff" size={16} />}
              <Text style={styles.submitBtnText}>Submit Order</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {mode === 'detail' ? (
        renderDetail()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Group Orders</Text>
          </View>

          <View style={styles.joinSection}>
            <Text style={styles.sectionLabel}>Join with code</Text>
            <View style={styles.joinRow}>
              <TextInput
                style={styles.joinInput}
                placeholder="Invite code"
                placeholderTextColor={DoorliColors.textDim}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.joinBtn, busy && { opacity: 0.6 }]}
                onPress={() => handleJoin()}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.joinBtnText}>Join</Text>}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.createSection}>
            <Text style={styles.sectionLabel}>Create new</Text>
            <TextInput
              style={styles.createInput}
              placeholder="Order title (e.g. Lunch order)"
              placeholderTextColor={DoorliColors.textDim}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.createInput}
              placeholder="Vendor ID"
              placeholderTextColor={DoorliColors.textDim}
              value={newVendorId}
              onChangeText={setNewVendorId}
            />
            <TouchableOpacity
              style={[styles.createBtn, busy && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Plus color="#fff" size={16} />}
              <Text style={styles.createBtnText}>Create Group Order</Text>
            </TouchableOpacity>
          </View>

          {loadingMy ? (
            <ActivityIndicator color={PRIMARY} style={{ marginTop: 32 }} />
          ) : (
            <FlatList
              data={myOrders ?? []}
              keyExtractor={(o) => o.id}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                (myOrders ?? []).length > 0 ? <Text style={styles.listHeader}>My Group Orders</Text> : null
              }
              renderItem={({ item }) => {
                const isOpen = item.status === 'open';
                return (
                  <TouchableOpacity
                    style={styles.orderCard}
                    onPress={() => {
                      setActiveId(item.id);
                      setMode('detail');
                    }}
                  >
                    <View style={styles.orderCardHeader}>
                      <View style={styles.orderCardTitleWrap}>
                        <Store color={PRIMARY} size={14} />
                        <Text style={styles.orderCardTitle} numberOfLines={1}>{item.title}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: isOpen ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.1)' }]}>
                        <Text style={[styles.statusText, { color: isOpen ? DoorliColors.teal : DoorliColors.textDim }]}>
                          {isOpen ? 'Open' : 'Closed'}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.orderCardVendor}>{item.vendor.businessName}</Text>
                    <View style={styles.orderCardFooter}>
                      <Text style={styles.orderCardCode}>Code: {item.inviteCode}</Text>
                      <Text style={styles.orderCardItems}>{item.items?.length ?? 0} items</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: DoorliColors.text },
  scrollContent: { padding: 16, paddingBottom: 40 },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailTitleWrap: { flex: 1 },
  detailTitle: { fontSize: 18, fontWeight: '800', color: DoorliColors.text },
  detailVendor: { fontSize: 13, color: DoorliColors.textDim, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  inviteCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 16,
  },
  inviteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  inviteLabel: { fontSize: 14, fontWeight: '700', color: DoorliColors.text },
  inviteCodeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  inviteCode: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: DoorliColors.gold,
    letterSpacing: 3,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  shareBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  participantsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 16,
  },
  participantsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  participantsLabel: { fontSize: 14, fontWeight: '700', color: DoorliColors.text },
  participantsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  participantChip: {
    backgroundColor: 'rgba(55,138,221,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  participantName: { color: DoorliColors.sky, fontSize: 13, fontWeight: '600' },
  itemsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 16,
  },
  itemsTitle: { fontSize: 14, fontWeight: '700', color: DoorliColors.text, marginBottom: 12 },
  noItems: { color: DoorliColors.textDim, fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: DoorliColors.text, marginBottom: 2 },
  itemMeta: { fontSize: 12, color: DoorliColors.textDim },
  itemNotes: { fontSize: 11, color: DoorliColors.textDim, fontStyle: 'italic', marginTop: 2 },
  itemRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(242,102,139,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryLabel: { fontSize: 14, color: DoorliColors.textDim },
  summaryValue: { fontSize: 18, fontWeight: '800', color: DoorliColors.gold },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DoorliColors.teal,
    borderRadius: 14,
    minHeight: 52,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  joinSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: DoorliColors.text, marginBottom: 10 },
  joinRow: { flexDirection: 'row', gap: 8 },
  joinInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: DoorliColors.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 16,
    letterSpacing: 2,
    fontWeight: '700',
  },
  joinBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  createSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  createInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: DoorliColors.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 10,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: DoorliColors.teal,
    borderRadius: 14,
    minHeight: 48,
  },
  createBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  listContent: { padding: 20, paddingBottom: 100 },
  listHeader: { fontSize: 14, fontWeight: '700', color: DoorliColors.textDim, marginBottom: 12 },
  orderCard: {
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderCardTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  orderCardTitle: { fontSize: 16, fontWeight: '700', color: DoorliColors.text, flex: 1 },
  orderCardVendor: { fontSize: 13, color: DoorliColors.textDim, marginBottom: 10 },
  orderCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 10,
  },
  orderCardCode: { fontSize: 13, color: DoorliColors.gold, fontWeight: '600' },
  orderCardItems: { fontSize: 13, color: DoorliColors.textDim },
});

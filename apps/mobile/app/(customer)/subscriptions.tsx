import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchMySubscriptions,
  cancelSubscription,
  createSubscription,
  formatStatus,
} from '../../lib/api';
import { DoorliColors } from '../../constants/colors';
import { RefreshCw, ArrowLeft, XCircle, Pause, Plus } from 'lucide-react-native';
import React, { useState } from 'react';

const PRIMARY = DoorliColors.primary;

export default function SubscriptionsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: fetchMySubscriptions,
  });
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [vendorId, setVendorId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCancel(id: string) {
    Alert.alert('Cancel subscription?', 'You can create a new one anytime.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSubscription(id);
            queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
          } catch (e: unknown) {
            Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
          }
        },
      },
    ]);
  }

  async function handleCreate() {
    if (!vendorId.trim() || !deliveryAddress.trim()) {
      Alert.alert('Required', 'Please enter a vendor ID and delivery address.');
      return;
    }
    setCreating(true);
    try {
      await createSubscription({
        vendorId: vendorId.trim(),
        frequency,
        items: [],
        deliveryAddress: deliveryAddress.trim(),
      });
      setCreateModalVisible(false);
      setVendorId('');
      setDeliveryAddress('');
      setFrequency('weekly');
      queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
      Alert.alert('Success', 'Subscription created!');
    } catch (e: unknown) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>
      <Text style={styles.subtitle}>Recurring grocery & essentials delivery</Text>

      <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalVisible(true)}>
        <Plus color="#fff" size={18} />
        <Text style={styles.createBtnText}>New Subscription</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(s) => s.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <RefreshCw color={DoorliColors.textDim} size={40} />
              </View>
              <Text style={styles.emptyTitle}>No active subscriptions</Text>
              <Text style={styles.emptyText}>
                Set up recurring delivery for your favorite items from local shops.
              </Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreateModalVisible(true)}>
                <Plus color="#fff" size={16} />
                <Text style={styles.emptyBtnText}>Create Subscription</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.freqBadge}>
                  <RefreshCw color={DoorliColors.teal} size={14} />
                  <Text style={styles.freqText}>{item.frequency}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: item.isActive ? DoorliColors.success : DoorliColors.danger }]}>
                  <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
              <Text style={styles.addr} numberOfLines={2}>{item.deliveryAddress}</Text>
              <Text style={styles.meta}>
                Next delivery: {new Date(item.nextDeliveryAt).toLocaleDateString()}
              </Text>
              {item.items && item.items.length > 0 && (
                <Text style={styles.itemCount}>{item.items.length} item{item.items.length !== 1 ? 's' : ''}</Text>
              )}
              {item.isActive && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                  <XCircle color={DoorliColors.danger} size={16} />
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}

      <Modal visible={createModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Subscription</Text>
            <Text style={styles.modalDesc}>Set up recurring delivery for your items.</Text>

            <Text style={styles.fieldLabel}>Vendor ID</Text>
            <TextInput
              style={styles.modalInput}
              value={vendorId}
              onChangeText={setVendorId}
              placeholder="Enter vendor ID"
              placeholderTextColor={DoorliColors.textDim}
            />

            <Text style={styles.fieldLabel}>Delivery Address</Text>
            <TextInput
              style={styles.modalInput}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
              placeholder="Enter delivery address"
              placeholderTextColor={DoorliColors.textDim}
            />

            <Text style={styles.fieldLabel}>Frequency</Text>
            <View style={styles.freqRow}>
              {(['weekly', 'biweekly', 'monthly'] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.freqOption, frequency === f && styles.freqOptionActive]}
                  onPress={() => setFrequency(f)}
                >
                  <Text style={[styles.freqOptionText, frequency === f && styles.freqOptionTextActive]}>
                    {f === 'biweekly' ? 'Bi-weekly' : f.charAt(0).toUpperCase() + f.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setCreateModalVisible(false)}
                disabled={creating}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, creating && { opacity: 0.6 }]}
                onPress={handleCreate}
                disabled={creating}
              >
                <Text style={styles.modalConfirmText}>{creating ? 'Creating...' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: DoorliColors.text },
  subtitle: { color: DoorliColors.textDim, paddingHorizontal: 20, marginBottom: 16 },
  list: { paddingBottom: 100, paddingHorizontal: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  freqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(29,158,117,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  freqText: { color: DoorliColors.teal, fontWeight: '700', textTransform: 'capitalize', fontSize: 13 },
  statusDot: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 11 },
  addr: { color: DoorliColors.text, fontSize: 14, lineHeight: 20 },
  meta: { color: DoorliColors.textDim, marginTop: 8, fontSize: 13 },
  itemCount: { color: DoorliColors.textMuted, marginTop: 4, fontSize: 12, fontWeight: '500' },
  cancelBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(242,102,139,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,102,139,0.25)',
  },
  cancelText: { color: DoorliColors.danger, fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 12, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  emptyText: { color: DoorliColors.textMuted, textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  createBtn: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: DoorliColors.navyMid,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: DoorliColors.text,
    marginBottom: 4,
  },
  modalDesc: {
    fontSize: 14,
    color: DoorliColors.textDim,
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: DoorliColors.textDim,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    color: DoorliColors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  freqOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  freqOptionActive: {
    backgroundColor: 'rgba(24,95,165,0.2)',
    borderColor: PRIMARY,
  },
  freqOptionText: {
    color: DoorliColors.textDim,
    fontWeight: '600',
    fontSize: 13,
  },
  freqOptionTextActive: {
    color: PRIMARY,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  modalCancelText: {
    color: DoorliColors.text,
    fontWeight: '600',
    fontSize: 15,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

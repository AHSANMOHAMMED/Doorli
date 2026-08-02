import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, X, Plus, Minus, ArrowRightLeft, Package } from 'lucide-react-native';
import { apiClient } from '../../lib/axios';

type StockItem = {
  id: string;
  name: string;
  barcode?: string | null;
  sku?: string | null;
  category?: string | null;
  price: number;
  stockQuantity: number;
  liveStock: number;
  isLowStock: boolean;
  isAvailable: boolean;
  unit?: string | null;
};

export default function StockScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [lowOnly, setLowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQty, setAdjustmentQty] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [transferTo, setTransferTo] = useState('');

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['pos-stock', lowOnly],
    queryFn: async () => {
      const res = await apiClient.get('/pos/stock', {
        params: lowOnly ? { lowOnly: '1' } : {},
      });
      return res.data?.data as {
        businessName: string;
        erpLinked: boolean;
        lowStockCount: number;
        items: StockItem[];
      };
    },
  });

  const filteredItems = (data?.items ?? []).filter((item) => {
    if (searchQuery === '') return true;
    return (
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  function openAdjustModal(item: StockItem, type: 'add' | 'remove') {
    setSelectedItem(item);
    setAdjustmentType(type);
    setAdjustmentQty('');
    setAdjustmentReason('');
    setShowAdjustModal(true);
  }

  function openTransferModal(item: StockItem) {
    setSelectedItem(item);
    setTransferQty('');
    setTransferTo('');
    setShowTransferModal(true);
  }

  async function handleAdjustment() {
    if (!selectedItem || !adjustmentQty) return;
    
    const qty = parseInt(adjustmentQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid positive number');
      return;
    }

    try {
      const newStock = adjustmentType === 'add' 
        ? selectedItem.liveStock + qty
        : selectedItem.liveStock - qty;

      if (newStock < 0) {
        Alert.alert('Insufficient stock', 'Cannot remove more than available stock');
        return;
      }

      await apiClient.patch(`/products/${selectedItem.id}`, {
        stockQuantity: newStock,
      });

      queryClient.invalidateQueries({ queryKey: ['pos-stock'] });
      setShowAdjustModal(false);
      Alert.alert('Success', `Stock ${adjustmentType === 'add' ? 'added' : 'removed'} successfully`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to adjust stock');
    }
  }

  async function handleTransfer() {
    if (!selectedItem || !transferQty || !transferTo) return;
    
    const qty = parseInt(transferQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Invalid quantity', 'Please enter a valid positive number');
      return;
    }

    if (qty > selectedItem.liveStock) {
      Alert.alert('Insufficient stock', 'Cannot transfer more than available stock');
      return;
    }

    try {
      // This would typically call a transfer API endpoint
      // For now, we'll just deduct from current stock
      await apiClient.patch(`/products/${selectedItem.id}`, {
        stockQuantity: selectedItem.liveStock - qty,
      });

      queryClient.invalidateQueries({ queryKey: ['pos-stock'] });
      setShowTransferModal(false);
      Alert.alert('Success', `Transferred ${qty} units to ${transferTo}`);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to transfer stock');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Hub</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live Stock</Text>
        <View style={{ width: 48 }} />
      </View>

      {data && (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>{data.businessName}</Text>
          <Text style={styles.bannerMeta}>
            {data.erpLinked ? 'ERP linked · live overlay' : 'Doorli stock'} ·{' '}
            <Text style={{ color: data.lowStockCount ? '#b45309' : '#059669' }}>
              {data.lowStockCount} low
            </Text>
          </Text>
        </View>
      )}

      <View style={styles.searchBar}>
        <Search color="#94a3b8" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X color="#94a3b8" size={18} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !lowOnly && styles.tabOn]}
          onPress={() => setLowOnly(false)}
        >
          <Text style={[styles.tabText, !lowOnly && styles.tabTextOn]}>All ({data?.items?.length ?? 0})</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, lowOnly && styles.tabOn]}
          onPress={() => setLowOnly(true)}
        >
          <Text style={[styles.tabText, lowOnly && styles.tabTextOn]}>Low Stock ({data?.lowStockCount ?? 0})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(i) => i.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package color="#94a3b8" size={48} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>{searchQuery ? 'Try a different search' : 'No products in stock'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.isLowStock && styles.cardLow]}>
            <View style={styles.cardContent}>
              <View style={styles.cardInfo}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {[item.category, item.sku, item.barcode].filter(Boolean).join(' · ') || '—'}
                </Text>
                <Text style={styles.price}>
                  LKR {Number(item.price).toLocaleString()}
                  {item.unit ? ` / ${item.unit}` : ''}
                </Text>
              </View>
              <View style={styles.stockBox}>
                <Text style={[styles.stockNum, item.isLowStock && { color: '#b45309' }]}>
                  {item.liveStock}
                </Text>
                <Text style={styles.stockLbl}>{item.isLowStock ? 'LOW' : 'in stock'}</Text>
                {!item.isAvailable && <Text style={styles.off}>Off</Text>}
              </View>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.adjustBtn}
                onPress={() => openAdjustModal(item, 'remove')}
              >
                <Minus color="#ef4444" size={14} />
                <Text style={styles.adjustBtnText}>Remove</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adjustBtn, styles.addBtn]}
                onPress={() => openAdjustModal(item, 'add')}
              >
                <Plus color="#059669" size={14} />
                <Text style={[styles.adjustBtnText, { color: '#059669' }]}>Add</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.adjustBtn, styles.transferBtn]}
                onPress={() => openTransferModal(item)}
              >
                <ArrowRightLeft color="#3b82f6" size={14} />
                <Text style={[styles.adjustBtnText, { color: '#3b82f6' }]}>Transfer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={showAdjustModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
              </Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.productName}>{selectedItem?.name}</Text>
              <Text style={styles.currentStock}>Current stock: {selectedItem?.liveStock}</Text>

              <TextInput
                style={styles.input}
                placeholder="Quantity"
                keyboardType="numeric"
                value={adjustmentQty}
                onChangeText={setAdjustmentQty}
              />

              <TextInput
                style={styles.input}
                placeholder="Reason (optional)"
                value={adjustmentReason}
                onChangeText={setAdjustmentReason}
              />

              <TouchableOpacity
                style={[styles.submitBtn, adjustmentType === 'add' ? styles.addSubmitBtn : styles.removeSubmitBtn]}
                onPress={handleAdjustment}
              >
                <Text style={styles.submitBtnText}>
                  {adjustmentType === 'add' ? 'Add Stock' : 'Remove Stock'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showTransferModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transfer Stock</Text>
              <TouchableOpacity onPress={() => setShowTransferModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.productName}>{selectedItem?.name}</Text>
              <Text style={styles.currentStock}>Available: {selectedItem?.liveStock}</Text>

              <TextInput
                style={styles.input}
                placeholder="Quantity to transfer"
                keyboardType="numeric"
                value={transferQty}
                onChangeText={setTransferQty}
              />

              <TextInput
                style={styles.input}
                placeholder="Transfer to (location/branch)"
                value={transferTo}
                onChangeText={setTransferTo}
              />

              <TouchableOpacity style={styles.transferSubmitBtn} onPress={handleTransfer}>
                <Text style={styles.submitBtnText}>Transfer Stock</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { color: '#00B241', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  banner: {
    marginHorizontal: 16,
    backgroundColor: '#eff6ff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  bannerTitle: { fontWeight: '700', color: '#1e3a8a' },
  bannerMeta: { fontSize: 12, color: '#64748b', marginTop: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    minHeight: 40,
  },
  tabOn: { backgroundColor: '#0f172a' },
  tabText: { fontWeight: '600', color: '#64748b' },
  tabTextOn: { color: '#fff' },
  emptyContainer: { alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 16 },
  emptyText: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLow: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInfo: { flex: 1 },
  name: { fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  price: { fontSize: 13, color: '#059669', marginTop: 4, fontWeight: '600' },
  stockBox: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 64 },
  stockNum: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  stockLbl: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' },
  off: { fontSize: 11, color: '#b91c1c', marginTop: 4, fontWeight: '700' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  adjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  adjustBtnText: { fontSize: 12, fontWeight: '600', color: '#ef4444' },
  addBtn: { backgroundColor: '#dcfce7' },
  transferBtn: { backgroundColor: '#dbeafe' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalBody: { padding: 16 },
  productName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 4 },
  currentStock: { color: '#64748b', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  submitBtn: {
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addSubmitBtn: { backgroundColor: '#059669' },
  removeSubmitBtn: { backgroundColor: '#ef4444' },
  transferSubmitBtn: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
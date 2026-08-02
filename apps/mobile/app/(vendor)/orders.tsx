import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Clock, CheckCircle, ChefHat, Package, Truck, XCircle } from 'lucide-react-native';
import { apiClient } from '../../lib/axios';
import { formatPrice, updateOrderStatus } from '../../lib/api';

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  totalAmount: number | string;
  createdAt: string;
  specialInstructions?: string | null;
  customer?: { fullName?: string; phone?: string };
  items?: Array<{
    id: string;
    product?: { name?: string; imageUrl?: string | null };
    unitPrice: number | string;
    quantity: number;
    totalPrice: number | string;
  }>;
};

const STATUS_TABS = [
  { key: 'all', label: 'All', icon: Clock },
  { key: 'pending', label: 'New', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: Package },
  { key: 'delivered', label: 'Delivered', icon: Truck },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  ready: '#00B241',
  picked_up: '#10b981',
  delivered: '#10b981',
  cancelled: '#ef4444',
};

const VENDOR_ACTIONS: Record<string, { label: string; next: string }[]> = {
  pending: [
    { label: 'Accept', next: 'confirmed' },
    { label: 'Reject', next: 'cancelled' },
  ],
  confirmed: [{ label: 'Start Preparing', next: 'preparing' }],
  preparing: [{ label: 'Mark Ready', next: 'ready' }],
};

export default function VendorOrders() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: orders, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-orders'],
    queryFn: async () => {
      const res = await apiClient.get('/orders/vendor/mine');
      return (res.data?.data?.items ?? []) as Order[];
    },
    refetchInterval: 10000,
  });

  const filteredOrders = (orders ?? []).filter((order) => {
    const matchesTab = activeTab === 'all' || order.status === activeTab;
    const matchesSearch = searchQuery === '' || 
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: orders?.length ?? 0 };
    orders?.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  async function handleAction(orderId: string, status: string) {
    try {
      await updateOrderStatus(orderId, status);
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      if (status === 'cancelled') {
        Alert.alert('Order Rejected', 'The order has been rejected');
      }
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update order');
    }
  }

  function openOrderDetail(order: Order) {
    setSelectedOrder(order);
    setShowDetail(true);
  }

  function renderOrder({ item }: { item: Order }) {
    const actions = VENDOR_ACTIONS[item.status] ?? [];
    const items = item.items ?? [];
    
    return (
      <TouchableOpacity style={styles.orderCard} onPress={() => openOrderDetail(item)}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
            <Text style={styles.customerName}>{item.customer?.fullName || 'Customer'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status] || '#64748b'}20` }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#64748b' }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.orderItems}>
          {items.slice(0, 3).map((line) => (
            <Text key={line.id} style={styles.itemLine}>
              {line.product?.name || 'Item'} × {line.quantity}
            </Text>
          ))}
          {items.length > 3 && (
            <Text style={styles.moreItems}>+{items.length - 3} more items</Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.orderTotal}>{formatPrice(Number(item.totalAmount))}</Text>
            <Text style={styles.orderTime}>
              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.actions}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.next}
                style={[
                  styles.actionBtn,
                  action.next === 'cancelled' && styles.rejectBtn
                ]}
                onPress={() => handleAction(item.id, action.next)}
              >
                <Text style={[
                  styles.actionText,
                  action.next === 'cancelled' && styles.rejectText
                ]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBar}>
        <Search color="#94a3b8" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search orders..."
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

      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === item.key && styles.activeTab]}
            onPress={() => setActiveTab(item.key)}
          >
            <Text style={[styles.tabText, activeTab === item.key && styles.activeTabText]}>
              {item.label}
            </Text>
            {statusCounts[item.key] != null && statusCounts[item.key] > 0 && (
              <View style={[styles.tabBadge, activeTab === item.key && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, activeTab === item.key && styles.activeTabBadgeText]}>
                  {statusCounts[item.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package color="#94a3b8" size={48} />
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search' : 'Orders will appear here'}
            </Text>
          </View>
        }
        renderItem={renderOrder}
      />

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order #{selectedOrder?.orderNumber}</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <FlatList
                data={selectedOrder.items ?? []}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.detailItem}>
                    <View style={styles.detailItemInfo}>
                      <Text style={styles.detailItemName}>{item.product?.name || 'Item'}</Text>
                      <Text style={styles.detailItemQty}>× {item.quantity}</Text>
                    </View>
                    <Text style={styles.detailItemPrice}>{formatPrice(Number(item.totalPrice))}</Text>
                  </View>
                )}
                ListFooterComponent={
                  <View style={styles.detailFooter}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment</Text>
                      <Text style={styles.detailValue}>{selectedOrder.paymentMethod}</Text>
                    </View>
                    {selectedOrder.specialInstructions && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Notes</Text>
                        <Text style={styles.detailValue}>{selectedOrder.specialInstructions}</Text>
                      </View>
                    )}
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Total</Text>
                      <Text style={[styles.detailValue, styles.detailTotal]}>
                        {formatPrice(Number(selectedOrder.totalAmount))}
                      </Text>
                    </View>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
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
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    gap: 6,
  },
  activeTab: { backgroundColor: '#0f172a' },
  tabText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  activeTabText: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  activeTabBadge: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#0f172a' },
  activeTabBadgeText: { color: '#fff' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 16 },
  emptyText: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  customerName: { color: '#64748b', fontSize: 13, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderItems: { marginTop: 12 },
  itemLine: { color: '#475569', fontSize: 14, marginBottom: 4 },
  moreItems: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  orderTotal: { fontWeight: '700', color: '#059669', fontSize: 16 },
  orderTime: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    backgroundColor: '#00B241',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  rejectBtn: { backgroundColor: '#fee2e2' },
  rejectText: { color: '#ef4444' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  detailItemInfo: { flex: 1 },
  detailItemName: { fontWeight: '600', color: '#0f172a' },
  detailItemQty: { color: '#64748b', fontSize: 13, marginTop: 2 },
  detailItemPrice: { fontWeight: '600', color: '#059669' },
  detailFooter: { padding: 16 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: { color: '#64748b' },
  detailValue: { fontWeight: '600', color: '#0f172a' },
  detailTotal: { fontSize: 18, color: '#059669' },
});
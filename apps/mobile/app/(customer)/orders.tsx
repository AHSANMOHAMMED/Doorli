import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyOrders, formatPrice, formatStatus } from '../../lib/api';
import { Package, Clock, CheckCircle, XCircle, Store, ChevronRight, Truck } from 'lucide-react-native';

const STATUS_CONFIG: Record<string, { color: string, bg: string, icon: any }> = {
  pending: { color: '#f59e0b', bg: '#fef3c7', icon: Clock },
  confirmed: { color: '#2563eb', bg: '#eff6ff', icon: CheckCircle },
  preparing: { color: '#8b5cf6', bg: '#f3e8ff', icon: Package },
  ready: { color: '#2563eb', bg: '#eff6ff', icon: Store },
  picked_up: { color: '#0ea5e9', bg: '#e0f2fe', icon: Truck },
  delivered: { color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
  cancelled: { color: '#ef4444', bg: '#fee2e2', icon: XCircle },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  });

  const orders = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>My Orders</Text>
      
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#2563eb" />
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Package color="#94a3b8" size={48} />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your order history will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const config = STATUS_CONFIG[item.status] || { color: '#64748b', bg: '#f1f5f9', icon: Package };
            const StatusIcon = config.icon;
            
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => router.push(`/(customer)/order/${item.id}`)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.vendorInfo}>
                    <Store color="#64748b" size={16} />
                    <Text style={styles.vendor}>{item.vendor?.business_name ?? 'Shop'}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: config.bg }]}>
                    <StatusIcon color={config.color} size={12} />
                    <Text style={[styles.badgeText, { color: config.color }]}>
                      {formatStatus(item.status)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardBody}>
                  <View style={styles.orderNumberContainer}>
                    <Text style={styles.orderLabel}>Order ID</Text>
                    <Text style={styles.orderNumber}>{item.order_number}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.total}>{formatPrice(Number(item.total_amount))}</Text>
                    <Text style={styles.date}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <Text style={styles.viewDetailsText}>View Details</Text>
                  <ChevronRight color="#2563eb" size={16} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  loader: { marginTop: 48 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#64748b', textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  vendorInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vendor: { color: '#0f172a', fontSize: 16, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  orderNumberContainer: { gap: 4 },
  orderLabel: { fontSize: 13, color: '#94a3b8', fontWeight: '500' },
  orderNumber: { fontWeight: '700', color: '#334155', fontSize: 15 },
  priceContainer: { alignItems: 'flex-end', gap: 4 },
  total: { fontWeight: '800', color: '#2563eb', fontSize: 16 },
  date: { color: '#64748b', fontSize: 13 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  viewDetailsText: { color: '#2563eb', fontSize: 14, fontWeight: '600' },
});

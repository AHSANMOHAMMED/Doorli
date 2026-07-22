import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyOrders, formatPrice, formatStatus } from '../../lib/api';
import { Package, Clock, CheckCircle, XCircle, Store, ChevronRight, Truck } from 'lucide-react-native';

const STATUS_CONFIG: Record<string, { color: string, bg: string, icon: any }> = {
  pending: { color: '#fbbf24', bg: 'rgba(245,158,11,0.2)', icon: Clock },
  confirmed: { color: '#60a5fa', bg: 'rgba(37,99,235,0.2)', icon: CheckCircle },
  preparing: { color: '#a78bfa', bg: 'rgba(139,92,246,0.2)', icon: Package },
  ready: { color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', icon: Store },
  picked_up: { color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', icon: Truck },
  delivered: { color: '#34d399', bg: 'rgba(16,185,129,0.2)', icon: CheckCircle },
  cancelled: { color: '#f87171', bg: 'rgba(239,68,68,0.2)', icon: XCircle },
};

export default function OrdersScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-orders'],
    queryFn: fetchMyOrders,
  });

  const orders = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>My Orders</Text>
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push("/(customer)/bookings" as any)}
        >
          <Text style={styles.quickLinkText}>Bookings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={() => router.push("/(customer)/subscriptions" as any)}
        >
          <Text style={styles.quickLinkText}>Subscriptions</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#0ea5e9" />
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Package color="#6b7280" size={48} />
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
                activeOpacity={0.7}
                onPress={() => router.push(`/(customer)/order/${item.id}`)}
              >
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.vendorInfo}>
                      <Store color="#6b7280" size={16} />
                      <Text style={styles.vendor}>{item.vendor?.businessName ?? 'Shop'}</Text>
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
                    <Text style={styles.orderNumber}>{item.orderNumber}</Text>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={styles.total}>{formatPrice(Number(item.totalAmount))}</Text>
                    <Text style={styles.date}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={styles.footerBtn}
                    onPress={() => router.push(`/(customer)/order/${item.id}`)}
                  >
                    <Text style={styles.viewDetailsText}>Details</Text>
                    <ChevronRight color="#00B241" size={16} />
                  </TouchableOpacity>
                  {!['delivered', 'cancelled'].includes(item.status) && (
                    <TouchableOpacity
                      style={styles.footerBtn}
                      onPress={() => router.push(`/(customer)/track/${item.id}`)}
                    >
                      <Truck color="#5DCAA5" size={16} />
                      <Text style={[styles.viewDetailsText, { color: '#5DCAA5' }]}>Track</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: '800', color: '#002b5b', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  quickLinks: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickLink: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#002b5b',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  quickLinkText: { color: '#002b5b', fontWeight: '600', fontSize: 13 },
  loader: { marginTop: 48 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#002b5b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#002b5b', marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  listContent: { padding: 16, paddingBottom: 100 },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  card: {
    marginBottom: 16,
    padding: 0,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    shadowColor: '#002b5b',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  vendorInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vendor: { color: '#002b5b', fontSize: 16, fontWeight: '700' },
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
  orderLabel: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  orderNumber: { fontWeight: '700', color: '#002b5b', fontSize: 15 },
  priceContainer: { alignItems: 'flex-end', gap: 4 },
  total: { fontWeight: '800', color: '#00B241', fontSize: 16 },
  date: { color: '#6b7280', fontSize: 13 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    gap: 8,
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewDetailsText: { color: '#00B241', fontSize: 14, fontWeight: '600' },
});

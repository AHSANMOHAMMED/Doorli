import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchMyOrders, formatPrice, formatStatus } from '../../lib/api';
import { DoorliColors } from '../../constants/colors';
import { Package, Clock, CheckCircle, XCircle, Store, ChevronRight, Truck, CalendarDays, RefreshCw } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
  pending: { color: DoorliColors.warning, bg: 'rgba(250,199,117,0.15)', icon: Clock },
  confirmed: { color: DoorliColors.info, bg: 'rgba(55,138,221,0.15)', icon: CheckCircle },
  preparing: { color: DoorliColors.purple, bg: 'rgba(139,92,246,0.15)', icon: Package },
  ready: { color: DoorliColors.sky, bg: 'rgba(55,138,221,0.1)', icon: Store },
  picked_up: { color: DoorliColors.teal, bg: 'rgba(29,158,117,0.15)', icon: Truck },
  delivered: { color: DoorliColors.success, bg: 'rgba(29,158,117,0.15)', icon: CheckCircle },
  cancelled: { color: DoorliColors.danger, bg: 'rgba(242,102,139,0.15)', icon: XCircle },
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
      <View style={styles.header}>
        <Text style={styles.title}>My Orders</Text>
        <View style={styles.quickLinks}>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(customer)/bookings')}
          >
            <CalendarDays color={PRIMARY} size={14} />
            <Text style={styles.quickLinkText}>Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickLink}
            onPress={() => router.push('/(customer)/subscriptions')}
          >
            <RefreshCw color={DoorliColors.teal} size={14} />
            <Text style={styles.quickLinkText}>Subscriptions</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 48 }} />
      ) : orders.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Package color={DoorliColors.textDim} size={48} />
          </View>
          <Text style={styles.emptyTitle}>No orders yet</Text>
          <Text style={styles.emptyText}>Your order history will appear here.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(customer)/search')}>
            <Text style={styles.browseBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const config = STATUS_CONFIG[item.status] || { color: DoorliColors.textDim, bg: 'rgba(255,255,255,0.05)', icon: Package };
            const StatusIcon = config.icon;

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push(`/(customer)/order/${item.id}`)}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.vendorInfo}>
                    <View style={styles.vendorIconWrap}>
                      <Store color={PRIMARY} size={14} />
                    </View>
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
                    <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
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
                    <Text style={styles.footerBtnText}>Details</Text>
                    <ChevronRight color={PRIMARY} size={14} />
                  </TouchableOpacity>
                  {!['delivered', 'cancelled'].includes(item.status) && (
                    <TouchableOpacity
                      style={[styles.footerBtn, styles.trackFooterBtn]}
                      onPress={() => router.push(`/(customer)/track/${item.id}`)}
                    >
                      <Truck color={DoorliColors.teal} size={14} />
                      <Text style={[styles.footerBtnText, { color: DoorliColors.teal }]}>Track</Text>
                    </TouchableOpacity>
                  )}
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
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: DoorliColors.text, marginBottom: 12 },
  quickLinks: { flexDirection: 'row', gap: 8 },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  quickLinkText: { color: DoorliColors.textMuted, fontWeight: '600', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: DoorliColors.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: DoorliColors.textMuted, textAlign: 'center', marginBottom: 24 },
  browseBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  vendorInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vendorIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(24,95,165,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendor: { color: DoorliColors.text, fontSize: 15, fontWeight: '700' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  orderNumberContainer: { gap: 4 },
  orderLabel: { fontSize: 12, color: DoorliColors.textDim, fontWeight: '500' },
  orderNumber: { fontWeight: '700', color: DoorliColors.text, fontSize: 15 },
  priceContainer: { alignItems: 'flex-end', gap: 4 },
  total: { fontWeight: '800', color: DoorliColors.gold, fontSize: 16 },
  date: { color: DoorliColors.textDim, fontSize: 12 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  footerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  trackFooterBtn: {
    backgroundColor: 'rgba(29,158,117,0.1)',
  },
  footerBtnText: { color: PRIMARY, fontSize: 14, fontWeight: '600' },
});

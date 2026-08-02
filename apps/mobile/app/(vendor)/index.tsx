import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  CalendarDays,
  Package,
  TrendingUp,
  Clock,
  ChevronRight,
  ScanBarcode,
  LayoutGrid,
  Wrench,
  ChartBar,
} from 'lucide-react-native';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';
import { formatPrice } from '../../lib/api';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  todayBookings: number;
  pendingOrders: number;
  lowStockItems: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items?: Array<{
    product?: { name?: string };
    quantity: number;
  }>;
}

export default function VendorDashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['vendor-dashboard-stats'],
    queryFn: async () => {
      const [ordersRes, bookingsRes, stockRes] = await Promise.all([
        apiClient.get('/orders/vendor/mine'),
        apiClient.get('/vendors/me'),
        apiClient.get('/pos/stock'),
      ]);

      const orders = ordersRes.data?.data?.items ?? [];
      const vendorId = bookingsRes.data?.data?.id;

      let bookings: any[] = [];
      if (vendorId) {
        const bookingsRes = await apiClient.get(`/bookings/vendor/${vendorId}`);
        bookings = bookingsRes.data?.data ?? [];
      }

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const todayOrders = orders.filter((o: any) => 
        new Date(o.createdAt) >= todayStart
      );
      
      const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount), 0);
      
      const todayBookings = bookings.filter((b: any) => 
        new Date(b.createdAt) >= todayStart
      );

      const pendingOrders = orders.filter((o: any) => o.status === 'pending');

      return {
        todayOrders: todayOrders.length,
        todayRevenue,
        todayBookings: todayBookings.length,
        pendingOrders: pendingOrders.length,
        lowStockItems: stockRes.data?.data?.lowStockCount ?? 0,
      };
    },
    refetchInterval: 30000,
  });

  const { data: recentOrders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['vendor-recent-orders'],
    queryFn: async () => {
      const res = await apiClient.get('/orders/vendor/mine');
      return (res.data?.data?.items ?? []).slice(0, 5) as RecentOrder[];
    },
    refetchInterval: 15000,
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchStats(), refetchOrders()]);
  }, [refetchStats, refetchOrders]);

  const quickLinks = [
    { href: '/(vendor)/cashier', label: 'Cashier', icon: ScanBarcode, color: '#00B241' },
    { href: '/(vendor)/orders', label: 'Orders', icon: ShoppingBag, color: '#d97706', badge: stats?.pendingOrders },
    { href: '/(vendor)/menu', label: 'Products', icon: LayoutGrid, color: '#7c3aed' },
    { href: '/(vendor)/stock', label: 'Stock', icon: Package, color: '#059669', badge: stats?.lowStockItems },
    { href: '/(vendor)/bookings', label: 'Bookings', icon: CalendarDays, color: '#db2777' },
    { href: '/(vendor)/services', label: 'Services', icon: Wrench, color: '#0d9488' },
    { href: '/(vendor)/admin', label: 'Analytics', icon: ChartBar, color: '#475569' },
    { href: '/(vendor)/purchases', label: 'Purchases', icon: TrendingUp, color: '#0ea5e9' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'confirmed': return '#3b82f6';
      case 'preparing': return '#8b5cf6';
      case 'ready': return '#00B241';
      case 'delivered': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={statsLoading || ordersLoading} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Doorli Vendor</Text>
            <Text style={styles.greeting}>Hi {user?.fullName || 'Vendor'}!</Text>
            <Text style={styles.subtitle}>Here's your business overview</Text>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#00B241' }]}>
            <Text style={styles.statValue}>{stats?.todayOrders ?? 0}</Text>
            <Text style={styles.statLabel}>Today's Orders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#059669' }]}>
            <Text style={styles.statValue}>{formatPrice(stats?.todayRevenue ?? 0)}</Text>
            <Text style={styles.statLabel}>Today's Revenue</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#db2777' }]}>
            <Text style={styles.statValue}>{stats?.todayBookings ?? 0}</Text>
            <Text style={styles.statLabel}>Today's Bookings</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#d97706' }]}>
            <Text style={styles.statValue}>{stats?.pendingOrders ?? 0}</Text>
            <Text style={styles.statLabel}>Pending Orders</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickLinksGrid}>
            {quickLinks.map((link) => (
              <TouchableOpacity
                key={link.href}
                style={styles.quickLink}
                onPress={() => router.push(link.href as any)}
              >
                <View style={[styles.quickLinkIcon, { backgroundColor: `${link.color}15` }]}>
                  <link.icon color={link.color} size={22} />
                  {link.badge != null && link.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{link.badge > 99 ? '99+' : link.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.quickLinkLabel}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => router.push('/(vendor)/orders')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders?.length === 0 ? (
            <View style={styles.emptyCard}>
              <Clock color="#94a3b8" size={32} />
              <Text style={styles.emptyText}>No recent orders</Text>
              <Text style={styles.emptySubtext}>New orders will appear here</Text>
            </View>
          ) : (
            recentOrders?.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/(vendor)/orders?orderId=${order.id}` as any)}
              >
                <View style={styles.orderHeader}>
                  <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.orderTotal}>{formatPrice(Number(order.totalAmount))}</Text>
                <Text style={styles.orderTime}>
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <ChevronRight color="#94a3b8" size={16} style={styles.orderChevron} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  container: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brand: { fontSize: 12, fontWeight: '700', color: '#00B241', letterSpacing: 0.5 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  subtitle: { color: '#64748b', marginTop: 2 },
  logoutBtn: { padding: 8 },
  logoutText: { color: '#ef4444', fontWeight: '600', fontSize: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    minHeight: 90,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  viewAll: { color: '#00B241', fontWeight: '600', fontSize: 14 },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickLink: {
    width: '20%',
    alignItems: 'center',
  },
  quickLinkIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLinkLabel: { fontSize: 11, color: '#475569', marginTop: 6, fontWeight: '500' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#64748b', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
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
    alignItems: 'center',
  },
  orderNumber: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  orderTotal: { fontWeight: '700', color: '#059669', marginTop: 8, fontSize: 16 },
  orderTime: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  orderChevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
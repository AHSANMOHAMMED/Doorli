import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Users, ShoppingBag } from 'lucide-react-native';
import { apiClient, formatPrice } from '../../lib/axios';
import { printReceipt, type Receipt } from '../../lib/receipt';

type SalesData = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  dailySales: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
};

type RecentSale = {
  id: string;
  orderNumber: string;
  totalAmount: number | string;
  createdAt: string;
  paymentMethod: string;
  items: Array<{
    quantity: number;
    unitPrice: number | string;
    product?: { name?: string; barcode?: string };
  }>;
  vendor?: { businessName?: string };
  specialInstructions?: string | null;
};

const TIME_PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export default function VendorAdminScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState('today');

  const { data: salesData, isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['pos-sales', period],
    queryFn: async () => {
      const res = await apiClient.get('/pos/sales/analytics', {
        params: { period },
      });
      return res.data?.data as SalesData;
    },
  });

  const { data: stockData, isLoading: stockLoading, refetch: refetchStock } = useQuery({
    queryKey: ['pos-stock-admin'],
    queryFn: async () => {
      const res = await apiClient.get('/pos/stock');
      return res.data?.data as {
        lowStockCount: number;
        items: unknown[];
        erpLinked: boolean;
        businessName: string;
      };
    },
  });

  const { data: recentSales, isLoading: recentLoading } = useQuery({
    queryKey: ['pos-sales-recent'],
    queryFn: async () => {
      const res = await apiClient.get('/pos/sales');
      return (res.data?.data?.items ?? []) as RecentSale[];
    },
  });

  const onRefresh = async () => {
    await Promise.all([refetchSales(), refetchStock()]);
  };

  if (salesLoading || stockLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={salesLoading || stockLoading} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Hub</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Analytics</Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={styles.periodSelector}>
          {TIME_PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
              onPress={() => setPeriod(p.key)}
            >
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.revenueCard]}>
            <View style={styles.statIcon}>
              <TrendingUp color="#059669" size={20} />
            </View>
            <Text style={styles.statValue}>{formatPrice(salesData?.totalRevenue ?? 0)}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={[styles.statCard, styles.ordersCard]}>
            <View style={styles.statIcon}>
              <ShoppingBag color="#d97706" size={20} />
            </View>
            <Text style={styles.statValue}>{salesData?.totalOrders ?? 0}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
          <View style={[styles.statCard, styles.avgCard]}>
            <View style={styles.statIcon}>
              <BarChart3 color="#7c3aed" size={20} />
            </View>
            <Text style={styles.statValue}>{formatPrice(salesData?.averageOrderValue ?? 0)}</Text>
            <Text style={styles.statLabel}>Avg Order</Text>
          </View>
          <View style={[styles.statCard, styles.stockCard]}>
            <View style={styles.statIcon}>
              <Calendar color={stockData?.lowStockCount ? '#b45309' : '#059669'} size={20} />
            </View>
            <Text style={[styles.statValue, { color: stockData?.lowStockCount ? '#b45309' : '#0f172a' }]}>
              {stockData?.lowStockCount ?? 0}
            </Text>
            <Text style={styles.statLabel}>Low Stock</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          {salesData?.topSellingItems?.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No sales data for this period</Text>
            </View>
          ) : (
            salesData?.topSellingItems?.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.topItem}>
                <View style={styles.topItemRank}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemQty}>{item.quantity} sold</Text>
                </View>
                <Text style={styles.topItemRevenue}>{formatPrice(item.revenue)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Sales</Text>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/(vendor)/cashier' as any)}
            >
              <Text style={styles.viewAllText}>Open Cashier</Text>
            </TouchableOpacity>
          </View>

          {recentSales?.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No POS sales yet</Text>
            </View>
          ) : (
            recentSales?.slice(0, 10).map((sale) => (
              <TouchableOpacity
                key={sale.id}
                style={styles.saleCard}
                onPress={() => {
                  const receipt: Receipt = {
                    orderId: sale.id,
                    orderNumber: sale.orderNumber,
                    businessName: stockData?.businessName || 'Doorli Shop',
                    customerName: 'Walk-in',
                    paymentMethod: sale.paymentMethod,
                    paidAt: sale.createdAt,
                    items: (sale.items || []).map((li) => ({
                      name: li.product?.name || 'Item',
                      barcode: li.product?.barcode,
                      quantity: li.quantity,
                      unitPrice: Number(li.unitPrice),
                      totalPrice: Number(li.unitPrice) * li.quantity,
                    })),
                    subtotal: Number(sale.totalAmount),
                    total: Number(sale.totalAmount),
                  };
                  void printReceipt(receipt);
                }}
              >
                <View style={styles.saleHeader}>
                  <View>
                    <Text style={styles.saleNumber}>{sale.orderNumber}</Text>
                    <Text style={styles.saleTime}>
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.saleAmount}>{formatPrice(Number(sale.totalAmount))}</Text>
                </View>
                <View style={styles.saleFooter}>
                  <Text style={styles.salePayment}>{sale.paymentMethod}</Text>
                  <Text style={styles.saleItems}>{sale.items?.length ?? 0} items</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(vendor)/cashier' as any)}
            >
              <Text style={styles.quickActionText}>Open Cashier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(vendor)/stock' as any)}
            >
              <Text style={styles.quickActionText}>Stock Board</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(vendor)/orders')}
            >
              <Text style={styles.quickActionText}>Online Orders</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => router.push('/(vendor)/menu')}
            >
              <Text style={styles.quickActionText}>Products</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.businessInfo}>
          <Text style={styles.businessName}>{stockData?.businessName || 'Your Shop'}</Text>
          <Text style={styles.businessMeta}>
            {stockData?.erpLinked ? 'ERP linked · ' : ''}Doorli POS
          </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { color: '#00B241', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodBtnActive: { backgroundColor: '#fff' },
  periodText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  periodTextActive: { color: '#0f172a' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  revenueCard: { borderLeftWidth: 3, borderLeftColor: '#059669' },
  ordersCard: { borderLeftWidth: 3, borderLeftColor: '#d97706' },
  avgCard: { borderLeftWidth: 3, borderLeftColor: '#7c3aed' },
  stockCard: { borderLeftWidth: 3, borderLeftColor: '#0ea5e9' },
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
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  viewAllBtn: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  viewAllText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyText: { color: '#64748b' },
  topItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  topItemRank: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: { fontWeight: '700', color: '#0f172a' },
  topItemInfo: { flex: 1 },
  topItemName: { fontWeight: '600', color: '#0f172a' },
  topItemQty: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  topItemRevenue: { fontWeight: '700', color: '#059669' },
  saleCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  saleNumber: { fontWeight: '700', color: '#0f172a' },
  saleTime: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  saleAmount: { fontWeight: '700', color: '#059669', fontSize: 16 },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  salePayment: { fontSize: 12, color: '#64748b' },
  saleItems: { fontSize: 12, color: '#64748b' },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAction: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: '48%',
  },
  quickActionText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  businessInfo: {
    marginTop: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  businessName: { fontWeight: '700', color: '#0f172a' },
  businessMeta: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
});
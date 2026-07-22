import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '../../lib/axios';
import { printReceipt, type Receipt } from '../../lib/receipt';

export default function VendorAdminScreen() {
  const router = useRouter();

  const stockQ = useQuery({
    queryKey: ['pos-stock-admin'],
    queryFn: async () => {
      const res = await apiClient.get('/pos/stock');
      return res.data?.data as { lowStockCount: number; items: unknown[]; erpLinked: boolean; businessName: string };
    },
  });

  const salesQ = useQuery({
    queryKey: ['pos-sales'],
    queryFn: async () => {
      const res = await apiClient.get('/pos/sales');
      return (res.data?.data?.items ?? []) as Array<{
        id: string;
        orderNumber: string;
        totalAmount: number | string;
        createdAt: string;
        paymentMethod: string;
        items: Array<{ quantity: number; unitPrice: number | string; product?: { name?: string; barcode?: string } }>;
        vendor?: { businessName?: string };
        specialInstructions?: string | null;
      }>;
    },
  });

  const todaySales = (salesQ.data ?? []).filter((s) => {
    const d = new Date(s.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayTotal = todaySales.reduce((s, o) => s + Number(o.totalAmount), 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Hub</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Shop admin</Text>
        <View style={{ width: 48 }} />
      </View>

      {(stockQ.isLoading || salesQ.isLoading) && (
        <ActivityIndicator style={{ marginTop: 24 }} color="#00B241" />
      )}

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>LKR {todayTotal.toLocaleString()}</Text>
          <Text style={styles.statLbl}>Today POS</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{todaySales.length}</Text>
          <Text style={styles.statLbl}>Bills today</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: '#b45309' }]}>
            {stockQ.data?.lowStockCount ?? '—'}
          </Text>
          <Text style={styles.statLbl}>Low stock</Text>
        </View>
      </View>

      <Text style={styles.section}>
        {stockQ.data?.businessName || 'Shop'}
        {stockQ.data?.erpLinked ? ' · ERP linked' : ''}
      </Text>

      <View style={styles.quick}>
        <TouchableOpacity style={styles.qBtn} onPress={() => router.push("/(vendor)/cashier" as any)}>
          <Text style={styles.qText}>Open cashier</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qBtn} onPress={() => router.push("/(vendor)/stock" as any)}>
          <Text style={styles.qText}>Stock board</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.qBtn} onPress={() => router.push('/(vendor)/orders')}>
          <Text style={styles.qText}>Online orders</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Recent POS bills</Text>
      <FlatList
        data={salesQ.data ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        ListEmptyComponent={<Text style={styles.empty}>No POS sales yet</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              const receipt: Receipt = {
                orderId: item.id,
                orderNumber: item.orderNumber,
                businessName: stockQ.data?.businessName || 'Doorli Shop',
                customerName: 'Walk-in',
                paymentMethod: item.paymentMethod,
                paidAt: item.createdAt,
                items: (item.items || []).map((li) => ({
                  name: li.product?.name || 'Item',
                  barcode: li.product?.barcode,
                  quantity: li.quantity,
                  unitPrice: Number(li.unitPrice),
                  totalPrice: Number(li.unitPrice) * li.quantity,
                })),
                subtotal: Number(item.totalAmount),
                total: Number(item.totalAmount),
              };
              void printReceipt(receipt);
            }}
          >
            <Text style={styles.cardTitle}>{item.orderNumber}</Text>
            <Text style={styles.cardMeta}>
              {new Date(item.createdAt).toLocaleString()} · {item.paymentMethod}
            </Text>
            <Text style={styles.cardAmt}>LKR {Number(item.totalAmount).toLocaleString()}</Text>
            <Text style={styles.reprint}>Tap to print / share</Text>
          </TouchableOpacity>
        )}
      />
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
  stats: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  stat: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statVal: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  statLbl: { fontSize: 11, color: '#94a3b8', marginTop: 4 },
  section: {
    marginTop: 16,
    marginHorizontal: 16,
    fontWeight: '700',
    color: '#475569',
    fontSize: 13,
  },
  quick: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16 },
  qBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
  },
  qText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTitle: { fontWeight: '700', color: '#0f172a' },
  cardMeta: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  cardAmt: { fontWeight: '800', color: '#059669', marginTop: 8 },
  reprint: { fontSize: 11, color: '#00B241', marginTop: 6 },
});

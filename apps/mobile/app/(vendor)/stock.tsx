import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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
  const [lowOnly, setLowOnly] = useState(false);

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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Hub</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Live stock</Text>
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

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, !lowOnly && styles.tabOn]}
          onPress={() => setLowOnly(false)}
        >
          <Text style={[styles.tabText, !lowOnly && styles.tabTextOn]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, lowOnly && styles.tabOn]}
          onPress={() => setLowOnly(true)}
        >
          <Text style={[styles.tabText, lowOnly && styles.tabTextOn]}>Low stock</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.empty}>No products</Text>}
          renderItem={({ item }) => (
            <View style={[styles.card, item.isLowStock && styles.cardLow]}>
              <View style={{ flex: 1 }}>
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
          )}
        />
      )}
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
  back: { color: '#2563eb', fontWeight: '600' },
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
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardLow: { borderColor: '#fcd34d', backgroundColor: '#fffbeb' },
  name: { fontWeight: '700', color: '#0f172a' },
  meta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  price: { fontSize: 13, color: '#059669', marginTop: 4, fontWeight: '600' },
  stockBox: { alignItems: 'flex-end', justifyContent: 'center', minWidth: 64 },
  stockNum: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  stockLbl: { fontSize: 10, color: '#94a3b8', textTransform: 'uppercase' },
  off: { fontSize: 11, color: '#b91c1c', marginTop: 4, fontWeight: '700' },
});

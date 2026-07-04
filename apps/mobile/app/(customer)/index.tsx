import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VendorCategory } from '@doorli/types';
import { CategoryTabs } from '../../components/CategoryTabs';
import { VendorCard } from '../../components/VendorCard';
import { fetchNearbyVendors, fetchVendors } from '../../lib/api';
import { useCartStore } from '../../store/cart';
import { useAuthStore } from '../../store/auth';

export default function CustomerHome() {
  const router = useRouter();
  const [category, setCategory] = useState<VendorCategory | 'all'>('all');
  const cartCount = useCartStore((s) => s.totalItems());
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendors', category],
    queryFn: async () => {
      if (category === 'all') {
        const res = await fetchVendors();
        return res.data?.items ?? [];
      }
      const res = await fetchNearbyVendors(category);
      return res.data ?? [];
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.fullName?.split(' ')[0] ?? 'there'} 👋</Text>
          <Text style={styles.subtitle}>What do you need from your neighbourhood?</Text>
        </View>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/(customer)/cart')}>
          <Text style={styles.cartIcon}>🛒</Text>
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => router.push('/(customer)/search')}
      >
        <Text style={styles.searchPlaceholder}>🔍 Search shops and products...</Text>
      </TouchableOpacity>

      <CategoryTabs selected={category} onSelect={setCategory} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#2563eb" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              onPress={() => router.push(`/(customer)/vendor/${item.id}`)}
            />
          )}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No shops found nearby. Pull to refresh.</Text>
          }
          contentContainerStyle={data?.length === 0 ? styles.emptyContainer : undefined}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  cartBtn: { position: 'relative', padding: 8 },
  cartIcon: { fontSize: 24 },
  cartBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  searchBar: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchPlaceholder: { color: '#94a3b8', fontSize: 15 },
  loader: { marginTop: 40 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40, paddingHorizontal: 24 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
});

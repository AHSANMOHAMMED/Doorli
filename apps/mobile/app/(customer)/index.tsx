import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VendorCategory } from '@doorli/types';
import { CategoryTabs } from '../../components/CategoryTabs';
import { VendorCard } from '../../components/VendorCard';
import { GlassInput } from '../../components/GlassInput';
import {
  Search,
  ShoppingCart,
  Bell,
  Car,
  PartyPopper,
  Wrench,
  Hotel,
  Utensils,
  Store,
  Sparkles,
} from 'lucide-react-native';
import { fetchNearbyVendors, type Vendor, DEFAULT_LOCATION } from '../../lib/api';
import { useCartStore } from '../../store/cart';
import { useAuthStore } from '../../store/auth';

const QUICK = [
  { label: 'Grocery', emoji: '🛒', category: 'grocery' as const, icon: Store },
  { label: 'Food', emoji: '🍽️', category: 'restaurant' as const, icon: Utensils },
  { label: 'Hotels', emoji: '🏨', category: 'hotel' as const, icon: Hotel },
  { label: 'Beauty', emoji: '💈', category: 'beauty' as const, icon: Sparkles },
  { label: 'Services', emoji: '🔧', category: 'service' as const, icon: Wrench },
  { label: 'Events', emoji: '🎉', href: '/(customer)/events', icon: PartyPopper },
  { label: 'Ride', emoji: '🚗', href: '/(customer)/ride', icon: Car },
] as const;

export default function CustomerHome() {
  const router = useRouter();
  const [category, setCategory] = useState<VendorCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const cartCount = useCartStore((s) => s.totalItems());
  const user = useAuthStore((s) => s.user);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendors-nearby', category],
    queryFn: async () =>
      fetchNearbyVendors({
        lat: DEFAULT_LOCATION.lat,
        lng: DEFAULT_LOCATION.lng,
        radius: 10,
        category,
      }),
  });

  const filtered = (data ?? []).filter(
    (v: Vendor) =>
      !search ||
      v.businessName.toLowerCase().includes(search.toLowerCase()) ||
      (v.city ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.brand}>Doorli</Text>
          <Text style={styles.greeting}>
            Hello, {user?.fullName?.split(' ')[0] ?? 'there'}
          </Text>
          <Text style={styles.subtitle}>Everything from your neighbourhood</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/(customer)/notifications')}
          >
            <Bell color="#fff" size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(customer)/cart')}>
            <ShoppingCart color="#fff" size={20} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <GlassInput
          icon={<Search color="rgba(255,255,255,0.5)" size={18} />}
          placeholder="Search shops and products..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => router.push('/(customer)/search')}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
      >
        {QUICK.map((q) => (
          <TouchableOpacity
            key={q.label}
            style={styles.quickChip}
            onPress={() => {
              if ('href' in q && q.href) {
                router.push(q.href as never);
              } else if ('category' in q) {
                setCategory(q.category);
              }
            }}
          >
            <Text style={styles.quickEmoji}>{q.emoji}</Text>
            <Text style={styles.quickLabel}>{q.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <CategoryTabs selected={category} onSelect={setCategory} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#0ea5e9" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              onPress={() => router.push(`/(customer)/vendor/${item.id}`)}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0ea5e9" />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No shops found nearby. Pull to refresh.</Text>
          }
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 ? styles.emptyContainer : undefined,
          ]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    color: '#5DCAA5',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  quickRow: { paddingHorizontal: 16, gap: 10, paddingTop: 12, paddingBottom: 4 },
  quickChip: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  quickEmoji: { fontSize: 22, marginBottom: 4 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  loader: { marginTop: 40 },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', padding: 24 },
});

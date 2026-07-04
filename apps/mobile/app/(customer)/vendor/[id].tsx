import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '../../../components/ProductCard';
import { fetchVendor, formatPrice } from '../../../lib/api';
import { useCartStore } from '../../../store/cart';

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const addItem = useCartStore((s) => s.addItem);

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => {
      const res = await fetchVendor(id!);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Vendor not found');
      return res.data;
    },
    enabled: !!id,
  });

  function handleAdd(product: NonNullable<typeof vendor>['products'][number]) {
    if (!vendor) return;
    const price = parseFloat(String(product.discountPrice ?? product.price));
    addItem({
      productId: product.id,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      name: product.name,
      price,
      unit: product.unit ?? null,
    });
    Alert.alert('Added to cart', `${product.name} added`);
  }

  if (isLoading || !vendor) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#2563eb" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.name}>{vendor.businessName}</Text>
        <Text style={styles.meta}>
          {vendor.category} · ⭐ {Number(vendor.avgRating).toFixed(1)} ·{' '}
          {vendor.isOpen ? 'Open' : 'Closed'}
        </Text>
        {vendor.description && <Text style={styles.desc}>{vendor.description}</Text>}
        {vendor.addressLine && <Text style={styles.address}>{vendor.addressLine}</Text>}
        {vendor.minOrderAmount && (
          <Text style={styles.minOrder}>Min order: {formatPrice(vendor.minOrderAmount)}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Menu</Text>
      <FlatList
        data={vendor.products}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ProductCard product={item} onAdd={() => handleAdd(item)} />
        )}
        ListEmptyComponent={<Text style={styles.empty}>No products available</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  meta: { fontSize: 14, color: '#64748b', marginTop: 4, textTransform: 'capitalize' },
  desc: { fontSize: 14, color: '#475569', marginTop: 8, lineHeight: 20 },
  address: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  minOrder: { fontSize: 13, color: '#2563eb', marginTop: 8, fontWeight: '500' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 32 },
});

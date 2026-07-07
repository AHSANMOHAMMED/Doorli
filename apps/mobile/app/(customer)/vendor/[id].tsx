import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProductCard } from '../../../components/ProductCard';
import { fetchVendor, fetchVendorReviews, formatPrice } from '../../../lib/api';
import { useCartStore } from '../../../store/cart';

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const { data: vendor, isLoading } = useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => fetchVendor(id!),
    enabled: !!id,
  });

  const { data: reviews } = useQuery({
    queryKey: ['vendor-reviews', id],
    queryFn: async () => fetchVendorReviews(id!),
    enabled: !!id,
  });

  function handleAdd(product: (typeof vendor extends { products: infer P } ? P : never)[number]) {
    if (!vendor) return;
    const price = Number(product.discount_price ?? product.price);
    addItem({
      productId: product.id,
      vendorId: vendor.id,
      vendorName: vendor.business_name,
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

  const isBookable = ['hotel', 'hall', 'beauty'].includes(vendor.category);
  const isService = vendor.category === 'service';

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.name}>{vendor.business_name}</Text>
          <Text style={styles.meta}>
            {vendor.category} · ⭐ {Number(vendor.avg_rating).toFixed(1)} ·{' '}
            {vendor.is_open ? 'Open' : 'Closed'}
          </Text>
          {vendor.description && <Text style={styles.desc}>{vendor.description}</Text>}
          {vendor.address_line && <Text style={styles.address}>{vendor.address_line}</Text>}
          {vendor.min_order_amount && (
            <Text style={styles.minOrder}>Min order: {formatPrice(Number(vendor.min_order_amount))}</Text>
          )}
        </View>

        {(isBookable || isService) && (
          <View style={styles.actionRow}>
            {isBookable && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/(customer)/vendor/${vendor.id}/book`)}
              >
                <Text style={styles.actionBtnText}>📅 Book Now</Text>
              </TouchableOpacity>
            )}
            {isService && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/(customer)/vendor/${vendor.id}/request`)}
              >
                <Text style={styles.actionBtnText}>🔧 Request Service</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Products</Text>
        <FlatList
          data={vendor.products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard product={item} onAdd={() => handleAdd(item)} />}
          ListEmptyComponent={<Text style={styles.empty}>No products available</Text>}
          scrollEnabled={false}
        />

        {reviews && reviews.length > 0 && (
          <View style={styles.reviewsSection}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            {reviews.slice(0, 5).map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <Text style={styles.reviewStars}>{'⭐'.repeat(r.rating)}</Text>
                {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
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
  actionRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 32, padding: 16 },
  reviewsSection: { marginBottom: 20 },
  reviewCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  reviewStars: { fontSize: 14, marginBottom: 4 },
  reviewComment: { fontSize: 14, color: '#475569', lineHeight: 20 },
});

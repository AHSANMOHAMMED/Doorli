import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '../../../components/ProductCard';
import { fetchVendor, fetchVendorReviews, formatPrice } from '../../../lib/api';
import { useCartStore } from '../../../store/cart';
import { Star, MapPin, Clock, ArrowLeft, CalendarDays, Wrench } from 'lucide-react-native';

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }

  const isBookable = ['hotel', 'hall', 'beauty'].includes(vendor.category);
  const isService = vendor.category === 'service';
  
  // Use a generic placeholder or the vendor's actual banner
  const bannerImage = vendor.banner_url ? { uri: vendor.banner_url } : { uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop' };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <ImageBackground source={bannerImage} style={styles.banner}>
          <View style={styles.overlay} />
          <SafeAreaView edges={['top']} style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color="#1e293b" size={24} />
            </TouchableOpacity>
          </SafeAreaView>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerCategory}>{vendor.category}</Text>
            <Text style={styles.bannerTitle}>{vendor.business_name}</Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Star color="#f59e0b" fill="#f59e0b" size={18} />
              <Text style={styles.ratingText}>{Number(vendor.avg_rating).toFixed(1)}</Text>
              <Text style={styles.reviewsText}>({vendor.total_reviews} reviews)</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Clock color="#64748b" size={16} />
              <Text style={[styles.statusText, { color: vendor.is_open ? '#10b981' : '#ef4444' }]}>
                {vendor.is_open ? 'Open Now' : 'Closed'}
              </Text>
              {vendor.min_order_amount && (
                <Text style={styles.minOrderText}>· Min {formatPrice(Number(vendor.min_order_amount))}</Text>
              )}
            </View>

            {vendor.address_line && (
              <View style={styles.infoRow}>
                <MapPin color="#64748b" size={16} />
                <Text style={styles.addressText} numberOfLines={2}>{vendor.address_line}</Text>
              </View>
            )}

            {vendor.description && <Text style={styles.desc}>{vendor.description}</Text>}
          </View>

          {(isBookable || isService) && (
            <View style={styles.actionRow}>
              {isBookable && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => router.push(`/(customer)/vendor/${vendor.id}/book`)}
                >
                  <CalendarDays color="#fff" size={20} />
                  <Text style={styles.actionBtnText}>Book Now</Text>
                </TouchableOpacity>
              )}
              {isService && (
                <TouchableOpacity
                  style={styles.actionBtnPrimary}
                  onPress={() => router.push(`/(customer)/vendor/${vendor.id}/request`)}
                >
                  <Wrench color="#fff" size={20} />
                  <Text style={styles.actionBtnText}>Request Service</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>Products</Text>
          <View style={styles.productsList}>
            {vendor.products?.map((item: any) => (
              <ProductCard key={item.id} product={item} onAdd={() => handleAdd(item)} />
            ))}
            {(!vendor.products || vendor.products.length === 0) && (
              <View style={styles.emptyCard}>
                <Text style={styles.empty}>No products available right now.</Text>
              </View>
            )}
          </View>

          {reviews && reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Customer Reviews ({reviews.length})</Text>
              {reviews.slice(0, 5).map((r: any) => (
                <View key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} color={i < r.rating ? '#f59e0b' : '#cbd5e1'} fill={i < r.rating ? '#f59e0b' : 'transparent'} size={14} />
                    ))}
                  </View>
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: {
    height: 280,
    width: '100%',
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  navRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 16 : 0,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerContent: {
    padding: 24,
    paddingBottom: 32,
  },
  bannerCategory: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#f8fafc',
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  ratingText: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  reviewsText: { fontSize: 14, color: '#64748b' },
  statusText: { fontSize: 14, fontWeight: '600' },
  minOrderText: { fontSize: 14, color: '#64748b' },
  addressText: { fontSize: 14, color: '#475569', flex: 1, lineHeight: 20 },
  desc: { fontSize: 14, color: '#475569', lineHeight: 22, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  productsList: {
    gap: 12,
    marginBottom: 32,
  },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  empty: { textAlign: 'center', color: '#64748b', fontSize: 15 },
  reviewsSection: { marginBottom: 20 },
  reviewCard: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  reviewStarsRow: { flexDirection: 'row', gap: 2, marginBottom: 8 },
  reviewComment: { fontSize: 15, color: '#334155', lineHeight: 22 },
});

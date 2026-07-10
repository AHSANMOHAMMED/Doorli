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
import { GlassCard } from '../../../components/GlassCard';
import { fetchVendor, fetchVendorReviews, formatPrice, Product } from '../../../lib/api';
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

  function handleAdd(product: Product) {
    if (!vendor) return;
    const price = Number(product.discountPrice ?? product.price);
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
        <ActivityIndicator color="#2563eb" size="large" />
      </View>
    );
  }

  const isBookable = ['hotel', 'hall', 'beauty'].includes(vendor.category);
  const isService = vendor.category === 'service';
  
  // Use a generic placeholder or the vendor's actual banner
  const bannerImage = vendor.bannerUrl ? { uri: vendor.bannerUrl } : { uri: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1000&auto=format&fit=crop' };

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
            <Text style={styles.bannerTitle}>{vendor.businessName}</Text>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          <GlassCard style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Star color="#f59e0b" fill="#f59e0b" size={18} />
              <Text style={styles.ratingText}>{Number(vendor.avgRating).toFixed(1)}</Text>
              <Text style={styles.reviewsText}>({vendor.totalReviews} reviews)</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Clock color="rgba(255,255,255,0.7)" size={16} />
              <Text style={[styles.statusText, { color: vendor.isOpen ? '#10b981' : '#ef4444' }]}>
                {vendor.isOpen ? 'Open Now' : 'Closed'}
              </Text>
              {vendor.minOrderAmount && (
                <Text style={styles.minOrderText}>· Min {formatPrice(Number(vendor.minOrderAmount))}</Text>
              )}
            </View>

            {vendor.addressLine && (
              <View style={styles.infoRow}>
                <MapPin color="rgba(255,255,255,0.7)" size={16} />
                <Text style={styles.addressText} numberOfLines={2}>{vendor.addressLine}</Text>
              </View>
            )}

            {vendor.description && <Text style={styles.desc}>{vendor.description}</Text>}
          </GlassCard>

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
              <GlassCard style={styles.emptyCard}>
                <Text style={styles.empty}>No products available right now.</Text>
              </GlassCard>
            )}
          </View>

          {reviews && reviews.length > 0 && (
            <View style={styles.reviewsSection}>
              <Text style={styles.sectionTitle}>Customer Reviews ({reviews.length})</Text>
              {reviews.slice(0, 5).map((r: any) => (
                <GlassCard key={r.id} style={styles.reviewCard}>
                  <View style={styles.reviewStarsRow}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} color={i < r.rating ? '#f59e0b' : 'rgba(255,255,255,0.2)'} fill={i < r.rating ? '#f59e0b' : 'transparent'} size={14} />
                    ))}
                  </View>
                  {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
                </GlassCard>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: {
    height: 280,
    width: '100%',
    justifyContent: 'space-between',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)', // Darker overlay for better contrast
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
    backgroundColor: 'rgba(255,255,255,0.1)', // Glass back btn
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: -20,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  infoCard: {
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  ratingText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  reviewsText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  statusText: { fontSize: 14, fontWeight: '600' },
  minOrderText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  addressText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', flex: 1, lineHeight: 20 },
  desc: { fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 22, marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(37, 99, 235, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.8)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 16,
  },
  productsList: {
    gap: 12,
    marginBottom: 32,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: 15 },
  reviewsSection: { marginBottom: 20 },
  reviewCard: {
    marginBottom: 12,
    padding: 16,
  },
  reviewStarsRow: { flexDirection: 'row', gap: 2, marginBottom: 8 },
  reviewComment: { fontSize: 15, color: '#fff', lineHeight: 22 },
});

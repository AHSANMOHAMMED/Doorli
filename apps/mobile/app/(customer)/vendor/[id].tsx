import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Platform,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from '../../../components/ProductCard';
import { fetchVendor, fetchVendorReviews, formatPrice, Product } from '../../../lib/api';
import { useCartStore } from '../../../store/cart';
import { 
  Star, 
  ArrowLeft, 
  Heart, 
  Share2, 
  Clock,
  Bike
} from 'lucide-react-native';

const PRIMARY = '#006e25';
const PRIMARY_CONTAINER = '#00b241';
const ON_SURFACE = '#191c1d';
const ON_SURFACE_VARIANT = '#3d4a3c';
const SURFACE = '#f8f9fa';

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = useCartStore((s) => s.totalItems());
  const cartTotal = useCartStore((s) => s.subtotal());
  const [activeTab, setActiveTab] = useState('Popular');

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
      imageUrl: product.imageUrl ?? null,
    });
    // Removed Alert to match smoother UX, relying on cart indicator
  }

  if (isLoading || !vendor) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </View>
    );
  }

  const bannerImage = vendor.bannerUrl 
    ? { uri: vendor.bannerUrl } 
    : { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBvMZhghRpqyr-rqBmlkEGZD2qzWYzZ6us8m3qrgUEfxsVY6FJUdw0WmuxskI_ejcPUqCyrLfkbQ9WFHXX37URdhBRTIpd6_TB1o_53aSTKt_6KR8GXnD4UlFHk_XotyLLdc2vLLNTdhU6wij7uA5A9nWRabguj4KA7F5mbHyFYDD0UmkGT5X32uoSNKa7MsRJr2N4-rkItftFU6NKRYO038zvy0Se3cNzS4TqzgIyzmhGHrduGnjorLyZj8iUX5AYqT7RrihYCBww' };
    
  const logoImage = vendor.logoUrl 
    ? { uri: vendor.logoUrl } 
    : { uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPUcbQkpB4mSXypwdGv0_4u_xqIAcCu_og1IcYYqVdR2Bzi12yuPqdGr0c-m-vM_JfFFYuBUv4BwfPfOqEAYCMlYTpVbxD_zLCOGMqpSAnnPlYyMELDRZzgOfZOzJ0GBCeraid7Qjw8ZTZdJ6ab0wbnb84q-WbbuabCBwnjELYd8eOZZe3Gczcah-CHQSYyZFT_0KXsDRT-sJR0i8Gs3qDKbr6TGaZIOp6tkLe3j0e9hOulSievi-KthOAt--esG5IWKwxwxXMEkM' };

  const tabs = ['Popular', 'Main Course', 'Organic Bowls', 'Drinks', 'Sides'];

  return (
    <View style={styles.container}>
      {/* Top Action Bar (Overlaying Hero) */}
      <View style={[styles.topActionBar, { top: Math.max(insets.top, 16) }]}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft color={ON_SURFACE} size={24} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.iconButton}>
            <Heart color={ON_SURFACE} size={24} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Share2 color={ON_SURFACE} size={24} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero Banner */}
        <ImageBackground source={bannerImage} style={styles.heroBanner}>
          <View style={styles.heroGradient} />
        </ImageBackground>

        {/* Content Section */}
        <View style={styles.mainContent}>
          {/* Info Overlay Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoTopRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.topRatedBadge}>
                  <Text style={styles.topRatedText}>TOP RATED</Text>
                </View>
                <Text style={styles.vendorName}>{vendor.businessName}</Text>
                <Text style={styles.vendorTags}>{vendor.category} • Organic • Bowls</Text>
              </View>
              <View style={styles.logoContainer}>
                <Image source={logoImage} style={styles.logoImage} />
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconRow}>
                  <Star color={PRIMARY} size={20} fill={PRIMARY} />
                  <Text style={styles.statValue}>{vendor.avgRating ? Number(vendor.avgRating).toFixed(1) : '4.8'}</Text>
                </View>
                <Text style={styles.statLabel}>{vendor.totalReviews ?? '500+'} Reviews</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconRow}>
                  <Clock color={ON_SURFACE} size={20} />
                  <Text style={[styles.statValue, { color: ON_SURFACE }]}>20-35</Text>
                </View>
                <Text style={styles.statLabel}>mins</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <View style={styles.statIconRow}>
                  <Bike color="#914c00" size={20} />
                  <Text style={[styles.statValue, { color: '#914c00' }]}>Free</Text>
                </View>
                <Text style={styles.statLabel}>Delivery</Text>
              </View>
            </View>
          </View>

          {/* Menu Tabs */}
          <View style={styles.tabsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
              {tabs.map((tab) => (
                <TouchableOpacity 
                  key={tab} 
                  style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Product Sections */}
          <View style={styles.productsSection}>
            <Text style={styles.sectionTitle}>Popular Items</Text>
            
            {vendor.products?.length ? vendor.products.map((item: any) => (
              <ProductCard key={item.id} product={item} onAdd={() => handleAdd(item)} />
            )) : (
              <Text style={{ textAlign: 'center', marginTop: 32, color: ON_SURFACE_VARIANT }}>
                No products available at the moment.
              </Text>
            )}
            

          </View>
        </View>
      </ScrollView>

      {/* Floating Cart Summary */}
      {cartCount > 0 && (
        <View style={styles.floatingCartWrapper}>
          <TouchableOpacity 
            style={styles.floatingCartBtn}
            onPress={() => router.push('/(customer)/cart')}
            activeOpacity={0.9}
          >
            <View style={styles.cartLeftGroup}>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
              <Text style={styles.cartText}>View Cart</Text>
            </View>
            <Text style={styles.cartPrice}>{formatPrice(cartTotal)}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SURFACE,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topActionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  heroBanner: {
    height: 288,
    width: '100%',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  mainContent: {
    paddingHorizontal: 16,
    marginTop: -64,
    paddingBottom: 100,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(188, 203, 183, 0.1)',
  },
  infoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  topRatedBadge: {
    backgroundColor: 'rgba(0,178,65,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  topRatedText: {
    color: PRIMARY,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
  },
  vendorName: {
    fontSize: 24,
    fontWeight: '700',
    color: ON_SURFACE,
    marginBottom: 8,
  },
  vendorTags: {
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(188, 203, 183, 0.2)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(188, 203, 183, 0.2)',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: PRIMARY,
  },
  statLabel: {
    fontSize: 12,
    color: ON_SURFACE_VARIANT,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(188, 203, 183, 0.3)',
  },
  tabsWrapper: {
    marginTop: 24,
    marginBottom: 16,
  },
  tabsContainer: {
    gap: 8,
    paddingRight: 16,
  },
  tabButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 32,
    backgroundColor: '#e7e8e9', 
  },
  tabButtonActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: ON_SURFACE_VARIANT,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  productsSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ON_SURFACE,
    marginBottom: 16,
  },
  floatingCartWrapper: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  floatingCartBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  cartLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cartBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cartText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  cartPrice: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
});

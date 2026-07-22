import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VendorCategory } from '@doorli/types';
import {
  Search,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  Utensils,
  ShoppingBasket,
  Bed,
  DoorOpen,
  Wrench,
  Scissors,
  CarTaxiFront,
  Star,
  Clock,
  ShoppingCart
} from 'lucide-react-native';
import { fetchNearbyVendors, type Vendor, DEFAULT_LOCATION } from '../../lib/api';
import { useCartStore } from '../../store/cart';

const PRIMARY = '#006e25';
const ON_SURFACE = '#191c1d';
const ON_SURFACE_VARIANT = '#3d4a3c';

export default function CustomerHome() {
  const router = useRouter();
  const [category, setCategory] = useState<VendorCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const cartCount = useCartStore((s) => s.totalItems());

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

  const categories = [
    { id: 'restaurant', label: 'Food', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop', color: '#00b241', bg: 'rgba(0,178,65,0.1)' },
    { id: 'grocery', label: 'Grocery', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop', color: '#ff8a00', bg: 'rgba(255,138,0,0.1)' },
    { id: 'hotel', label: 'Hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=400&auto=format&fit=crop', color: '#7c9bd1', bg: 'rgba(124,155,209,0.1)' },
    { id: 'hall', label: 'Halls', image: 'https://images.unsplash.com/photo-1519167758481-83f54085356e?q=80&w=400&auto=format&fit=crop', color: '#ffdad6', bg: 'rgba(255,218,214,0.1)' },
    { id: 'service', label: 'Services', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=400&auto=format&fit=crop', color: '#70ff82', bg: 'rgba(112,255,130,0.1)' },
    { id: 'beauty', label: 'Beauty', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=400&auto=format&fit=crop', color: '#ffb77f', bg: 'rgba(255,183,127,0.1)' },
    { id: 'transport', label: 'Transport', image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=400&auto=format&fit=crop', color: '#264778', bg: 'rgba(38,71,120,0.1)' },
  ];

  const getFallbackImage = (vendorCategory?: string) => {
    const match = categories.find(c => c.id === vendorCategory);
    return match?.image || 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500&auto=format&fit=crop';
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Top Navigation Shell */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'column' }}>
            <Text style={styles.deliverToLabel}>Deliver to:</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.deliverToValue}>Home</Text>
              <ChevronDown color={PRIMARY} size={20} />
            </View>
          </View>
          <View style={styles.headerRightIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Search color={ON_SURFACE} size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Bell color={ON_SURFACE} size={24} />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PRIMARY} />
          }
        >
          {/* Search Bar Section */}
          <View style={styles.searchSection}>
            <TouchableOpacity 
              style={styles.searchContainer} 
              activeOpacity={0.9} 
              onPress={() => router.push('/(customer)/search')}
            >
              <Search color="#3d4a3c" size={20} style={{ marginLeft: 16 }} />
              <View style={styles.searchInputWrapper} pointerEvents="none">
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for shops or services"
                  placeholderTextColor="#3d4a3c"
                  editable={false}
                />
              </View>
              <View style={{ padding: 8, marginRight: 8 }}>
                <SlidersHorizontal color={PRIMARY} size={20} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Hero Promotional Banner */}
          <View style={styles.heroSection}>
            <View style={styles.heroBanner}>
              {/* Decorative backgrounds */}
              <View style={styles.heroDecorTopRight} />
              <View style={styles.heroDecorBottomLeft} />
              
              <View style={styles.heroContent}>
                <View style={{ flex: 2 }}>
                  <View style={styles.offerBadge}>
                    <Text style={styles.offerBadgeText}>NEW USER OFFER</Text>
                  </View>
                  <Text style={styles.heroTitle}>50% Off Your{'\n'}First Order</Text>
                  <TouchableOpacity style={styles.claimButton}>
                    <Text style={styles.claimButtonText}>Claim Now</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.heroImageContainer}>
                  <Image 
                    source={{ uri: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=500&auto=format&fit=crop' }}
                    style={styles.heroImage}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Category Grid Section */}
          <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <TouchableOpacity onPress={() => setCategory('all')}>
                <Text style={styles.viewAllBtn}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map((cat) => {
                return (
                  <TouchableOpacity 
                    key={cat.id} 
                    style={styles.categoryItem}
                    onPress={() => {
                      if (cat.id === 'transport') {
                        router.push('/(customer)/ride-booking');
                      } else {
                        router.push(`/(customer)/search?category=${cat.id}`);
                      }
                    }}
                  >
                    <View style={[styles.categoryIconWrap, { backgroundColor: cat.bg }]}>
                      <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                    </View>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>

          {/* Nearby Shops Section */}
          <View style={styles.nearbySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nearby Shops</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllBtn}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyScroll}>
              {isLoading ? (
                <ActivityIndicator color={PRIMARY} size="large" style={{ margin: 32 }} />
              ) : filtered.length === 0 ? (
                <Text style={{ color: ON_SURFACE_VARIANT, margin: 32 }}>No shops found nearby.</Text>
              ) : (
                filtered.map((shop) => (
                  <TouchableOpacity 
                    key={`nearby-${shop.id}`} 
                    style={styles.nearbyCard}
                    onPress={() => router.push(`/(customer)/vendor/${shop.id}`)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.nearbyImageContainer}>
                      <Image source={{ uri: shop.logoUrl || getFallbackImage(shop.category) }} style={styles.nearbyImage} />
                      <View style={styles.nearbyRatingBadge}>
                        <Star color="#914c00" size={12} fill="#914c00" />
                        <Text style={styles.nearbyRatingText}>{shop.avgRating ? Number(shop.avgRating).toFixed(1) : 'New'}</Text>
                      </View>
                    </View>
                    <View style={styles.nearbyCardInfo}>
                      <Text style={styles.nearbyCardTitle} numberOfLines={1}>{shop.businessName}</Text>
                      <View style={styles.nearbyCardMeta}>
                        <Clock color={ON_SURFACE_VARIANT} size={12} />
                        <Text style={styles.nearbyCardMetaText}>15-25 min</Text>
                        <View style={styles.metaDot} />
                        <Text style={styles.nearbyCardMetaText}>Delivery fee applies</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          {/* Popular & Recommended Section */}
          <View style={styles.popularSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular & Recommended</Text>
            </View>
            <View style={styles.popularList}>
              {isLoading ? (
                <ActivityIndicator color={PRIMARY} size="large" style={{ marginTop: 24 }} />
              ) : filtered.length === 0 ? (
                <Text style={styles.emptyText}>No shops found in this area.</Text>
              ) : (
                filtered.map((vendor) => (
                  <TouchableOpacity 
                    key={vendor.id} 
                    style={styles.popularCard}
                    onPress={() => router.push(`/(customer)/vendor/${vendor.id}`)}
                  >
                    <View style={styles.popularImageContainer}>
                      <Image 
                        source={{ uri: vendor.logoUrl || getFallbackImage(vendor.category) }} 
                        style={styles.popularImage} 
                      />
                    </View>
                    <View style={styles.popularCardInfo}>
                      <View style={styles.popularTitleRow}>
                        <Text style={styles.popularTitle} numberOfLines={1}>{vendor.businessName}</Text>
                        {(vendor.avgRating && vendor.avgRating > 4.5) && (
                          <View style={styles.topRatedBadge}>
                            <Text style={styles.topRatedText}>TOP RATED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.popularSubtitle}>{vendor.category || 'Food'} • {vendor.city || 'Nearby'}</Text>
                      <View style={styles.popularMetaRow}>
                        <View style={styles.popularRating}>
                          <Star color="#914c00" size={14} fill="#914c00" />
                          <Text style={styles.popularRatingText}>{vendor.avgRating ? Number(vendor.avgRating).toFixed(1) : 'New'}</Text>
                        </View>
                        <Text style={styles.popularMinOrder}>Min order: $10</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        </ScrollView>

      </SafeAreaView>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <TouchableOpacity 
          style={styles.floatingCart}
          onPress={() => router.push('/(customer)/cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
          <Text style={styles.floatingCartText}>View Cart</Text>
          <ShoppingCart color="#fff" size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  deliverToLabel: {
    fontFamily: 'System',
    fontSize: 12,
    color: ON_SURFACE_VARIANT,
    fontWeight: '600',
  },
  deliverToValue: {
    fontFamily: 'System',
    fontSize: 18,
    fontWeight: '600',
    color: PRIMARY,
  },
  headerRightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'transparent',
    borderRadius: 20,
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#914c00', // secondary color
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#f8f9fa',
  },
  searchSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    height: 56,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchInputWrapper: {
    flex: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    fontSize: 14,
    color: ON_SURFACE,
  },
  heroSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  heroBanner: {
    backgroundColor: PRIMARY,
    borderRadius: 16,
    height: 176,
    overflow: 'hidden',
  },
  heroDecorTopRight: {
    position: 'absolute',
    top: -128,
    right: -64,
    width: 256,
    height: 256,
    backgroundColor: '#00b241',
    opacity: 0.2,
    borderRadius: 128,
  },
  heroDecorBottomLeft: {
    position: 'absolute',
    bottom: -64,
    left: -32,
    width: 128,
    height: 128,
    backgroundColor: '#50e169',
    opacity: 0.1,
    borderRadius: 64,
  },
  heroContent: {
    flex: 1,
    flexDirection: 'row',
    padding: 24,
    alignItems: 'center',
  },
  offerBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  offerBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    marginBottom: 12,
  },
  claimButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  claimButtonText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  heroImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
    transform: [{ rotate: '12deg' }],
  },
  categorySection: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  viewAllBtn: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '600',
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 24,
  },
  categoryItem: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  nearbySection: {
    marginTop: 24,
  },
  nearbyScroll: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 16,
  },
  nearbyCard: {
    width: 256,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  nearbyImageContainer: {
    height: 128,
    width: '100%',
    position: 'relative',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  nearbyImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  nearbyRatingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  nearbyRatingText: {
    fontSize: 10,
    fontWeight: '600',
    color: ON_SURFACE,
  },
  nearbyCardInfo: {
    padding: 12,
  },
  nearbyCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ON_SURFACE,
    marginBottom: 4,
  },
  nearbyCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nearbyCardMetaText: {
    fontSize: 11,
    color: ON_SURFACE_VARIANT,
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#bccbb7',
  },
  popularSection: {
    marginTop: 24,
  },
  popularList: {
    paddingHorizontal: 16,
    gap: 16,
  },
  popularCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  popularImageContainer: {
    width: 96,
    height: 96,
    borderRadius: 12,
    overflow: 'hidden',
  },
  popularImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  popularCardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  popularTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  popularTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: ON_SURFACE,
    flex: 1,
  },
  topRatedBadge: {
    backgroundColor: 'rgba(0,178,65,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  topRatedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00b241',
  },
  popularSubtitle: {
    fontSize: 14,
    color: ON_SURFACE_VARIANT,
    marginTop: 4,
    marginBottom: 8,
  },
  popularMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  popularRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  popularRatingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#914c00',
  },
  popularMinOrder: {
    fontSize: 12,
    color: ON_SURFACE_VARIANT,
  },
  emptyText: {
    textAlign: 'center',
    color: ON_SURFACE_VARIANT,
    marginTop: 24,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    height: 56,
    backgroundColor: PRIMARY,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  cartBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  cartBadgeText: { color: PRIMARY, fontSize: 12, fontWeight: '800' },
  floatingCartText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

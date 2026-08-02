import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { DoorliColors } from '../../constants/colors';
import { Heart, ShoppingCart, Trash2, Store } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    imageUrl?: string | null;
    vendor: {
      id: string;
      businessName: string;
      logoUrl?: string | null;
    };
  };
}

async function fetchWishlist(): Promise<WishlistItem[]> {
  const res = await apiClient.get('/wishlist');
  return (res.data ?? []) as WishlistItem[];
}

async function toggleWishlist(productId: string) {
  try {
    await apiClient.delete(`/wishlist/${productId}`);
  } catch {
    await apiClient.post('/wishlist', { productId });
  }
}

export default function WishlistScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['wishlist'],
    queryFn: fetchWishlist,
  });

  const items = data ?? [];

  function handleRemove(item: WishlistItem) {
    Alert.alert('Remove', `Remove ${item.product.name} from wishlist?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await toggleWishlist(item.productId);
          queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
      },
    ]);
  }

  function handleAddToCart(item: WishlistItem) {
    router.push(`/(customer)/vendor/${item.product.vendor.id}`);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Wishlist</Text>
        <Text style={styles.subtitle}>{items.length} saved items</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 48 }} />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <Heart color={DoorliColors.textDim} size={48} />
          </View>
          <Text style={styles.emptyTitle}>No saved items</Text>
          <Text style={styles.emptyText}>Tap the heart icon on any product to save it here.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => router.push('/(customer)/search')}>
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const product = item.product;
            const displayPrice = product.discountPrice ?? product.price;
            return (
              <View style={styles.card}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push(`/(customer)/vendor/${product.vendor.id}`)}
                  style={styles.cardImageWrap}
                >
                  {product.imageUrl ? (
                    <View style={styles.cardImagePlaceholder}>
                      <Store color={DoorliColors.textDim} size={24} />
                    </View>
                  ) : (
                    <View style={styles.cardImagePlaceholder}>
                      <Store color={DoorliColors.textDim} size={24} />
                    </View>
                  )}
                  <TouchableOpacity style={styles.heartBtn} onPress={() => handleRemove(item)}>
                    <Heart color={DoorliColors.rose} size={18} fill={DoorliColors.rose} />
                  </TouchableOpacity>
                </TouchableOpacity>

                <View style={styles.cardBody}>
                  <Text style={styles.vendorName} numberOfLines={1}>{product.vendor.businessName}</Text>
                  <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.price}>LKR {Number(displayPrice).toLocaleString()}</Text>
                    {product.discountPrice && (
                      <Text style={styles.originalPrice}>LKR {Number(product.price).toLocaleString()}</Text>
                    )}
                  </View>
                  <TouchableOpacity style={styles.cartBtn} onPress={() => handleAddToCart(item)}>
                    <ShoppingCart color="#fff" size={14} />
                    <Text style={styles.cartBtnText}>View</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: DoorliColors.text, marginBottom: 4 },
  subtitle: { color: DoorliColors.textDim, fontSize: 14 },
  listContent: { padding: 12, paddingBottom: 100 },
  row: { gap: 12 },
  card: {
    flex: 1,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  cardImageWrap: { position: 'relative', height: 120 },
  cardImagePlaceholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { padding: 12 },
  vendorName: { fontSize: 11, color: DoorliColors.textDim, fontWeight: '500', marginBottom: 2 },
  productName: { fontSize: 14, fontWeight: '700', color: DoorliColors.text, marginBottom: 6, lineHeight: 18 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  price: { fontSize: 15, fontWeight: '800', color: DoorliColors.gold },
  originalPrice: { fontSize: 12, color: DoorliColors.textDim, textDecorationLine: 'line-through' },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PRIMARY,
    borderRadius: 10,
    paddingVertical: 8,
  },
  cartBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: DoorliColors.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: DoorliColors.textMuted, textAlign: 'center', marginBottom: 24 },
  browseBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  browseBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

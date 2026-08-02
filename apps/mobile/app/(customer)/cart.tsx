import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { useCartStore } from '../../store/cart';
import { formatPrice } from '../../lib/api';
import { DoorliColors } from '../../constants/colors';
import { ShoppingCart, Plus, Minus, Trash2, Store, ChevronRight, ArrowLeft, PackageOpen } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;
const SURFACE = DoorliColors.navy;

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const subtotal = useCartStore((s) => s.subtotal());

  const byVendor = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.vendorId]) acc[item.vendorId] = [];
    acc[item.vendorId].push(item);
    return acc;
  }, {});

  const vendorCount = Object.keys(byVendor).length;
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  function handleClearCart() {
    Alert.alert('Clear cart?', 'All items will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  }

  function renderRightActions(productName: string, productId: string) {
    return (
      <TouchableOpacity
        style={styles.swipeDelete}
        onPress={() => {
          Alert.alert('Remove item?', `Remove "${productName}" from cart?`, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId) },
          ]);
        }}
      >
        <Trash2 color="#fff" size={20} />
        <Text style={styles.swipeDeleteText}>Remove</Text>
      </TouchableOpacity>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={DoorliColors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Cart</Text>
          <View style={{ width: 44 }} />
        </View>
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <PackageOpen color={DoorliColors.textDim} size={56} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>
            Browse shops and add items to get started.
          </Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push('/(customer)/search')}>
            <Text style={styles.primaryBtnText}>Browse Vendors</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={DoorliColors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Cart</Text>
          <Text style={styles.headerSub}>{totalItems} item{totalItems !== 1 ? 's' : ''} · {vendorCount} shop{vendorCount !== 1 ? 's' : ''}</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClearCart}>
          <Trash2 color={DoorliColors.danger} size={18} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={Object.entries(byVendor)}
        keyExtractor={([vendorId]) => vendorId}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: [vendorId, vendorItems] }) => {
          const vendorSubtotal = vendorItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return (
            <View style={styles.vendorGroup}>
              <View style={styles.vendorHeader}>
                <View style={styles.vendorIconWrap}>
                  <Store color={PRIMARY} size={16} />
                </View>
                <Text style={styles.vendorName}>{vendorItems[0].vendorName}</Text>
                <Text style={styles.vendorCount}>{vendorItems.length} item{vendorItems.length !== 1 ? 's' : ''}</Text>
              </View>

              {vendorItems.map((cartItem, index) => (
                <Swipeable
                  key={cartItem.productId}
                  renderRightActions={() => renderRightActions(cartItem.name, cartItem.productId)}
                  overshootRight={false}
                >
                  <View style={[styles.row, index === vendorItems.length - 1 && styles.lastRow]}>
                    <Image
                      source={{ uri: cartItem.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop' }}
                      style={styles.itemImage}
                    />
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>{cartItem.name}</Text>
                      <Text style={styles.itemPrice}>{formatPrice(cartItem.price)}</Text>
                      {cartItem.unit && (
                        <Text style={styles.itemUnit}>per {cartItem.unit}</Text>
                      )}
                    </View>

                    <View style={styles.qtySection}>
                      <View style={styles.qtyRow}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => updateQuantity(cartItem.productId, cartItem.quantity - 1)}
                        >
                          <Minus color={DoorliColors.textMuted} size={14} />
                        </TouchableOpacity>
                        <Text style={styles.qty}>{cartItem.quantity}</Text>
                        <TouchableOpacity
                          style={[styles.qtyBtn, styles.qtyBtnPlus]}
                          onPress={() => updateQuantity(cartItem.productId, cartItem.quantity + 1)}
                        >
                          <Plus color="#fff" size={14} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.lineTotal}>
                        {formatPrice(cartItem.price * cartItem.quantity)}
                      </Text>
                    </View>
                  </View>
                </Swipeable>
              ))}

              <View style={styles.vendorFooter}>
                <View>
                  <Text style={styles.vendorSubtotalLabel}>Shop subtotal</Text>
                  <Text style={styles.vendorSubtotal}>{formatPrice(vendorSubtotal)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.checkoutShopBtn}
                  onPress={() => router.push(`/(customer)/checkout/${vendorId}`)}
                >
                  <Text style={styles.checkoutShopText}>Checkout</Text>
                  <ChevronRight color="#fff" size={16} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalItems} items)</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            const firstVendor = Object.keys(byVendor)[0];
            if (firstVendor) router.push(`/(customer)/checkout/${firstVendor}`);
          }}
        >
          <Text style={styles.primaryBtnText}>
            Proceed to Checkout · {formatPrice(subtotal)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SURFACE },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  headerSub: { fontSize: 12, color: DoorliColors.textDim, marginTop: 2 },
  clearBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(242,102,139,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: DoorliColors.text, marginBottom: 8 },
  emptyText: { fontSize: 15, color: DoorliColors.textMuted, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  listContent: { paddingBottom: 120, paddingTop: 8 },
  vendorGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  vendorIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(24,95,165,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vendorName: { flex: 1, fontSize: 15, fontWeight: '700', color: DoorliColors.text },
  vendorCount: { fontSize: 12, color: DoorliColors.textDim, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  lastRow: { borderBottomWidth: 0 },
  itemImage: {
    width: 52,
    height: 52,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  itemInfo: { flex: 1, paddingRight: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: DoorliColors.text, marginBottom: 4 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: DoorliColors.primary },
  itemUnit: { fontSize: 11, color: DoorliColors.textDim, marginTop: 2 },
  qtySection: { alignItems: 'flex-end', gap: 6 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnPlus: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  qty: { fontSize: 15, fontWeight: '700', minWidth: 20, textAlign: 'center', color: DoorliColors.text },
  lineTotal: { fontSize: 13, fontWeight: '700', color: DoorliColors.gold },
  vendorFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  vendorSubtotalLabel: { fontSize: 11, color: DoorliColors.textDim, fontWeight: '500' },
  vendorSubtotal: { fontSize: 16, fontWeight: '800', color: DoorliColors.gold },
  checkoutShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  checkoutShopText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  swipeDelete: {
    backgroundColor: DoorliColors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    marginRight: 16,
    borderRadius: 12,
    gap: 4,
  },
  swipeDeleteText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    backgroundColor: 'rgba(6,11,28,0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  footerSummary: { marginBottom: 14 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14, color: DoorliColors.textMuted, fontWeight: '500' },
  summaryValue: { fontSize: 18, fontWeight: '800', color: DoorliColors.text },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});

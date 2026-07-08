import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../components/GlassCard';
import { GlassButton } from '../../components/GlassButton';
import { useCartStore } from '../../store/cart';
import { formatPrice } from '../../lib/api';
import { ShoppingCart, Plus, Minus, Trash2, Store, ChevronRight } from 'lucide-react-native';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal());

  const byVendor = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.vendorId]) acc[item.vendorId] = [];
    acc[item.vendorId].push(item);
    return acc;
  }, {});

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {items.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconCircle}>
            <ShoppingCart color="rgba(255,255,255,0.8)" size={48} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added anything yet.</Text>
          <GlassButton title="Start Shopping" onPress={() => router.back()} />
        </View>
      ) : (
        <>
          <FlatList
            data={Object.entries(byVendor)}
            keyExtractor={([vendorId]) => vendorId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: [vendorId, vendorItems] }) => (
              <GlassCard style={styles.vendorGroup}>
                <View style={styles.vendorHeader}>
                  <Store color="#0ea5e9" size={20} />
                  <Text style={styles.vendorName}>{vendorItems[0].vendorName}</Text>
                </View>
                
                {vendorItems.map((cartItem, index) => (
                  <View 
                    key={cartItem.productId} 
                    style={[styles.row, index === vendorItems.length - 1 && styles.lastRow]}
                  >
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>{cartItem.name}</Text>
                      <Text style={styles.itemPrice}>
                        {formatPrice(cartItem.price)}
                      </Text>
                    </View>
                    
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(cartItem.productId, cartItem.quantity - 1)}
                      >
                        <Minus color="rgba(255,255,255,0.7)" size={16} />
                      </TouchableOpacity>
                      
                      <Text style={styles.qty}>{cartItem.quantity}</Text>
                      
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(cartItem.productId, cartItem.quantity + 1)}
                      >
                        <Plus color="rgba(255,255,255,0.7)" size={16} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.removeBtn} 
                        onPress={() => removeItem(cartItem.productId)}
                      >
                        <Trash2 color="#ef4444" size={18} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  style={styles.vendorCheckout}
                  onPress={() => router.push(`/(customer)/checkout/${vendorId}`)}
                >
                  <Text style={styles.vendorCheckoutText}>Checkout this shop</Text>
                  <ChevronRight color="#0ea5e9" size={18} />
                </TouchableOpacity>
              </GlassCard>
            )}
          />
          <BlurView intensity={30} tint="dark" style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
            </View>
            <GlassButton
              title="Proceed to checkout"
              onPress={() => {
                const firstVendor = Object.keys(byVendor)[0];
                if (firstVendor) router.push(`/(customer)/checkout/${firstVendor}`);
              }}
            />
          </BlurView>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 16, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 32 },
  listContent: { paddingBottom: 24, paddingTop: 16 },
  vendorGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 0, // override GlassCard padding since we structure it internally
    overflow: 'hidden',
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lastRow: { borderBottomWidth: 0 },
  itemInfo: { flex: 1, paddingRight: 16 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 6 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center', color: '#fff' },
  removeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  vendorCheckout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'transparent',
  },
  vendorCheckoutText: { color: '#0ea5e9', fontWeight: '700', fontSize: 15 },
  footer: {
    padding: 20,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
});

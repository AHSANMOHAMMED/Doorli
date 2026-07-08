import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
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
            <ShoppingCart color="#94a3b8" size={48} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added anything yet.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={Object.entries(byVendor)}
            keyExtractor={([vendorId]) => vendorId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item: [vendorId, vendorItems] }) => (
              <View style={styles.vendorGroup}>
                <View style={styles.vendorHeader}>
                  <Store color="#2563eb" size={20} />
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
                        <Minus color="#64748b" size={16} />
                      </TouchableOpacity>
                      
                      <Text style={styles.qty}>{cartItem.quantity}</Text>
                      
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(cartItem.productId, cartItem.quantity + 1)}
                      >
                        <Plus color="#64748b" size={16} />
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
                  <ChevronRight color="#2563eb" size={18} />
                </TouchableOpacity>
              </View>
            )}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatPrice(subtotal)}</Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => {
                const firstVendor = Object.keys(byVendor)[0];
                if (firstVendor) router.push(`/(customer)/checkout/${firstVendor}`);
              }}
            >
              <Text style={styles.checkoutText}>Proceed to checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 32 },
  btn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  listContent: { paddingBottom: 24, paddingTop: 16 },
  vendorGroup: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#eff6ff',
    borderBottomWidth: 1,
    borderBottomColor: '#dbeafe',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastRow: { borderBottomWidth: 0 },
  itemInfo: { flex: 1, paddingRight: 16 },
  itemName: { fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 6 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#64748b' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center', color: '#0f172a' },
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
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  vendorCheckoutText: { color: '#2563eb', fontWeight: '700', fontSize: 15 },
  footer: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 16, color: '#64748b', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  checkoutBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

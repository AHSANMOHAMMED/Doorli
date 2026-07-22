import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image } from 'react-native';
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
            <ShoppingCart color="#6b7280" size={48} />
          </View>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Looks like you haven't added anything yet.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
            <Text style={styles.primaryBtnText}>Start Shopping</Text>
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
                  <Store color="#00B241" size={20} />
                  <Text style={styles.vendorName}>{vendorItems[0].vendorName}</Text>
                </View>
                
                {vendorItems.map((cartItem, index) => (
                  <View 
                    key={cartItem.productId} 
                    style={[styles.row, index === vendorItems.length - 1 && styles.lastRow]}
                  >
                    <Image 
                      source={{ uri: cartItem.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop' }}
                      style={styles.itemImage}
                    />
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
                        <Minus color="#6b7280" size={16} />
                      </TouchableOpacity>
                      
                      <Text style={styles.qty}>{cartItem.quantity}</Text>
                      
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(cartItem.productId, cartItem.quantity + 1)}
                      >
                        <Plus color="#6b7280" size={16} />
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
                  <ChevronRight color="#00B241" size={18} />
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
              style={styles.primaryBtn}
              onPress={() => {
                const firstVendor = Object.keys(byVendor)[0];
                if (firstVendor) router.push(`/(customer)/checkout/${firstVendor}`);
              }}
            >
              <Text style={styles.primaryBtnText}>Proceed to checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#002b5b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  emptyTitle: { fontSize: 24, fontWeight: '800', color: '#002b5b', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  listContent: { paddingBottom: 24, paddingTop: 16 },
  vendorGroup: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    shadowColor: '#002b5b',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  vendorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  vendorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002b5b',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  lastRow: { borderBottomWidth: 0 },
  itemImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
  },
  itemInfo: { flex: 1, paddingRight: 16, justifyContent: 'center' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#002b5b', marginBottom: 4 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#00B241' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center', color: '#002b5b' },
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
    borderTopColor: '#f3f4f6',
    backgroundColor: '#ffffff',
  },
  vendorCheckoutText: { color: '#00B241', fontWeight: '700', fontSize: 15 },
  footer: {
    padding: 20,
    paddingTop: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#002b5b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  totalLabel: { fontSize: 16, color: '#6b7280', fontWeight: '600' },
  totalValue: { fontSize: 22, fontWeight: '800', color: '#002b5b' },
  primaryBtn: {
    backgroundColor: '#00B241',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});

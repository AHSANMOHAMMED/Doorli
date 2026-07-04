import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '../../store/cart';
import { formatPrice } from '../../lib/api';

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
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Browse shops and add items to get started</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Browse shops</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={Object.entries(byVendor)}
            keyExtractor={([vendorId]) => vendorId}
            renderItem={({ item: [vendorId, vendorItems] }) => (
              <View style={styles.vendorGroup}>
                <Text style={styles.vendorName}>{vendorItems[0].vendorName}</Text>
                {vendorItems.map((cartItem) => (
                  <View key={cartItem.productId} style={styles.row}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{cartItem.name}</Text>
                      <Text style={styles.itemPrice}>
                        {formatPrice(cartItem.price)} × {cartItem.quantity}
                      </Text>
                    </View>
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(cartItem.productId, cartItem.quantity - 1)}
                      >
                        <Text style={styles.qtyText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.qty}>{cartItem.quantity}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(cartItem.productId, cartItem.quantity + 1)}
                      >
                        <Text style={styles.qtyText}>+</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => removeItem(cartItem.productId)}>
                        <Text style={styles.remove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
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
              onPress={() =>
                Alert.alert('Coming soon', 'Checkout ships in Week 9–10')
              }
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
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  emptyText: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  btn: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  vendorGroup: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
    padding: 12,
    backgroundColor: '#eff6ff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 15, fontWeight: '500', color: '#0f172a' },
  itemPrice: { fontSize: 13, color: '#64748b', marginTop: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: { fontSize: 16, fontWeight: '600', color: '#334155' },
  qty: { fontSize: 15, fontWeight: '600', minWidth: 20, textAlign: 'center' },
  remove: { fontSize: 16, color: '#ef4444', marginLeft: 8 },
  footer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 16, color: '#64748b' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },
  checkoutBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

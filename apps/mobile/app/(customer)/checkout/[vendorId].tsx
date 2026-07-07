import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createOrder, formatPrice } from '../../../lib/api';
import { useCartStore } from '../../../store/cart';

export default function CheckoutScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const router = useRouter();
  const items = useCartStore((s) => s.items.filter((i) => i.vendorId === vendorId));
  const clearVendor = useCartStore((s) => s.clearVendor);
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card' | 'wallet'>('cod');
  const [placing, setPlacing] = useState(false);

  const vendorName = items[0]?.vendorName ?? 'Shop';
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = 30;
  const total = subtotal + deliveryFee;

  async function placeOrder() {
    if (!items.length) return;
    if (!address.trim()) {
      Alert.alert('Address required', 'Please enter a delivery address');
      return;
    }
    setPlacing(true);
    try {
      const order = await createOrder({
        vendorId,
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        deliveryAddress: address.trim(),
        paymentMethod,
        notes: instructions.trim() || undefined,
        deliveryFee,
      });
      clearVendor(vendorId);
      router.replace(`/(customer)/order/${order.id}`);
    } catch (err) {
      Alert.alert('Order failed', err instanceof Error ? err.message : 'Could not place order');
    } finally {
      setPlacing(false);
    }
  }

  if (!items.length) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.empty}>No items for this shop in your cart.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
          <Text style={styles.btnText}>Back to cart</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.shopName}>{vendorName}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your delivery address"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {items.map((item) => (
            <View key={item.productId} style={styles.itemRow}>
              <Text style={styles.itemName}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment method</Text>
          <View style={styles.row}>
            {([
              { key: 'cod', label: '💵 Cash on Delivery' },
              { key: 'card', label: '💳 Card' },
              { key: 'wallet', label: '👛 Wallet' },
            ] as const).map((m) => (
              <TouchableOpacity
                key={m.key}
                style={[styles.chip, paymentMethod === m.key && styles.chipActive]}
                onPress={() => setPaymentMethod(m.key)}
              >
                <Text style={[styles.chipText, paymentMethod === m.key && styles.chipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special instructions</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional notes for the shop"
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text>{formatPrice(deliveryFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeBtn, placing && styles.placeBtnDisabled]}
          onPress={placeOrder}
          disabled={placing}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeBtnText}>Place order · {formatPrice(total)}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', marginTop: 48, color: '#64748b' },
  btn: {
    alignSelf: 'center',
    marginTop: 16,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: '#fff', fontWeight: '600' },
  shopName: { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#64748b', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  chipText: { fontSize: 14, color: '#64748b' },
  chipTextActive: { color: '#2563eb', fontWeight: '600' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: { flex: 1, color: '#334155' },
  itemPrice: { fontWeight: '500', color: '#0f172a' },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { color: '#64748b' },
  totalRow: { marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 16, fontWeight: '600' },
  totalValue: { fontSize: 18, fontWeight: 'bold', color: '#2563eb' },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  placeBtn: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  placeBtnDisabled: { opacity: 0.7 },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

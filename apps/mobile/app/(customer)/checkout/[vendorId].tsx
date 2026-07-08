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
import { MapPin, Banknote, CreditCard, Wallet, FileText, ShoppingBag, ArrowLeft } from 'lucide-react-native';

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
        <View style={styles.emptyCard}>
          <ShoppingBag color="#cbd5e1" size={48} />
          <Text style={styles.empty}>No items for this shop in your cart.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Back to cart</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#0f172a" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.shopName}>Order from {vendorName}</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color="#2563eb" size={20} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Enter your exact delivery address..."
            placeholderTextColor="#94a3b8"
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShoppingBag color="#2563eb" size={20} />
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>
          <View style={styles.itemsCard}>
            {items.map((item, index) => (
              <View key={item.productId} style={[styles.itemRow, index === items.length - 1 && styles.lastItemRow]}>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Wallet color="#2563eb" size={20} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <View style={styles.row}>
            {([
              { key: 'cod', label: 'Cash', icon: Banknote },
              { key: 'card', label: 'Card', icon: CreditCard },
              { key: 'wallet', label: 'Wallet', icon: Wallet },
            ] as const).map((m) => {
              const Icon = m.icon;
              const isActive = paymentMethod === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setPaymentMethod(m.key)}
                >
                  <Icon color={isActive ? '#2563eb' : '#64748b'} size={18} />
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText color="#2563eb" size={20} />
            <Text style={styles.sectionTitle}>Special Instructions</Text>
          </View>
          <TextInput
            style={styles.input}
            placeholder="E.g. Ring the bell, drop at the door..."
            placeholderTextColor="#94a3b8"
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total to Pay</Text>
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
            <View style={styles.placeBtnContent}>
              <Text style={styles.placeBtnText}>Confirm & Pay</Text>
              <Text style={styles.placeBtnTotal}>{formatPrice(total)}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { padding: 16, paddingBottom: 32 },
  emptyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  empty: { textAlign: 'center', marginTop: 16, color: '#64748b', fontSize: 16 },
  btn: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  shopName: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#3b82f6', borderWidth: 2 },
  chipText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  chipTextActive: { color: '#2563eb' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#0f172a',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastItemRow: { borderBottomWidth: 0, paddingBottom: 0 },
  itemName: { flex: 1, color: '#334155', fontSize: 15, fontWeight: '500', paddingRight: 16 },
  itemPrice: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  summary: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 2,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#64748b', fontSize: 15 },
  summaryValue: { color: '#0f172a', fontSize: 15, fontWeight: '600' },
  totalRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#2563eb' },
  footer: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  placeBtn: {
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
  placeBtnDisabled: { opacity: 0.7 },
  placeBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 8,
  },
  placeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  placeBtnTotal: { color: '#fff', fontSize: 16, fontWeight: '800', opacity: 0.9 },
});

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
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  createOrder,
  DEFAULT_LOCATION,
  fetchAddresses,
  formatPrice,
  previewOrder,
} from '../../../lib/api';
import { useCartStore } from '../../../store/cart';

export default function CheckoutScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const router = useRouter();
  const items = useCartStore((s) => s.items.filter((i) => i.vendorId === vendorId));
  const clearVendor = useCartStore((s) => s.clearVendor);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');
  const [instructions, setInstructions] = useState('');
  const [placing, setPlacing] = useState(false);

  const vendorName = items[0]?.vendorName ?? 'Shop';
  const lineItems = items.map((i) => ({ productId: i.productId, quantity: i.quantity }));

  const { data: addressesRes } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });
  const addresses = addressesRes?.data ?? [];
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  const { data: previewRes, isLoading: previewLoading } = useQuery({
    queryKey: ['order-preview', vendorId, orderType, lineItems],
    queryFn: () =>
      previewOrder({
        vendorId,
        items: lineItems,
        orderType,
        latitude: defaultAddress?.latitude
          ? Number(defaultAddress.latitude)
          : DEFAULT_LOCATION.lat,
        longitude: defaultAddress?.longitude
          ? Number(defaultAddress.longitude)
          : DEFAULT_LOCATION.lng,
      }),
    enabled: items.length > 0,
  });

  const preview = previewRes?.data;

  async function placeOrder() {
    if (!items.length) return;
    setPlacing(true);

    const body = {
      vendorId,
      items: lineItems,
      orderType,
      paymentMethod: 'cod' as const,
      specialInstructions: instructions.trim() || undefined,
      ...(orderType === 'delivery'
        ? defaultAddress
          ? { deliveryAddressId: defaultAddress.id }
          : {
              newAddress: {
                label: 'Home',
                addressLine: 'Colombo City Centre area',
                city: 'Colombo',
                latitude: DEFAULT_LOCATION.lat,
                longitude: DEFAULT_LOCATION.lng,
                isDefault: true,
              },
            }
        : {}),
    };

    const res = await createOrder(body);
    setPlacing(false);

    if (!res.success || !res.data) {
      Alert.alert('Order failed', res.error ?? 'Could not place order');
      return;
    }

    clearVendor(vendorId);
    router.replace(`/(customer)/order/${res.data.id}`);
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
          <Text style={styles.sectionTitle}>Order type</Text>
          <View style={styles.row}>
            {(['delivery', 'pickup'] as const).map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, orderType === type && styles.chipActive]}
                onPress={() => setOrderType(type)}
              >
                <Text style={[styles.chipText, orderType === type && styles.chipTextActive]}>
                  {type === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {orderType === 'delivery' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery address</Text>
            {defaultAddress ? (
              <View style={styles.addressCard}>
                <Text style={styles.addressLabel}>{defaultAddress.label ?? 'Address'}</Text>
                <Text style={styles.addressLine}>{defaultAddress.addressLine}</Text>
                {defaultAddress.city && (
                  <Text style={styles.addressCity}>{defaultAddress.city}</Text>
                )}
              </View>
            ) : (
              <Text style={styles.hint}>
                Using default Colombo location for this order.
              </Text>
            )}
          </View>
        )}

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
          <Text style={styles.sectionTitle}>Special instructions</Text>
          <TextInput
            style={styles.input}
            placeholder="Optional notes for the shop"
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
        </View>

        {previewLoading ? (
          <ActivityIndicator color="#2563eb" />
        ) : preview ? (
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text>{formatPrice(preview.subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery fee</Text>
              <Text>{formatPrice(preview.deliveryFee)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(preview.totalAmount)}</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeBtn, placing && styles.placeBtnDisabled]}
          onPress={placeOrder}
          disabled={placing || previewLoading}
        >
          {placing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.placeBtnText}>
              Place order · {preview ? formatPrice(preview.totalAmount) : '...'}
            </Text>
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
  row: { flexDirection: 'row', gap: 8 },
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
  addressCard: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  addressLabel: { fontWeight: '600', color: '#0f172a' },
  addressLine: { color: '#334155', marginTop: 4 },
  addressCity: { color: '#64748b', fontSize: 13, marginTop: 2 },
  hint: { fontSize: 13, color: '#64748b' },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemName: { flex: 1, color: '#334155' },
  itemPrice: { fontWeight: '500', color: '#0f172a' },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    textAlignVertical: 'top',
  },
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

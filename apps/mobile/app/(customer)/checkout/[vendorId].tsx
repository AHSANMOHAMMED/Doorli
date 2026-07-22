import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { GlassCard } from '../../../components/GlassCard';
import { GlassInput } from '../../../components/GlassInput';
import { GlassButton } from '../../../components/GlassButton';
import {
  createOrder,
  formatPrice,
  DEFAULT_LOCATION,
  validatePromo,
  confirmPaymentDev,
} from '../../../lib/api';
import { useCartStore } from '../../../store/cart';
import { MapPin, Banknote, CreditCard, FileText, ShoppingBag, ArrowLeft, Tag } from 'lucide-react-native';
import { apiClient } from '../../../lib/axios';

type CardGateway = 'stripe' | 'payhere';

export default function CheckoutScreen() {
  const { vendorId } = useLocalSearchParams<{ vendorId: string }>();
  const router = useRouter();
  const items = useCartStore((s) => s.items.filter((i) => i.vendorId === vendorId));
  const clearVendor = useCartStore((s) => s.clearVendor);
  const [address, setAddress] = useState('');
  const [instructions, setInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [cardGateway, setCardGateway] = useState<CardGateway>('stripe');
  const [placing, setPlacing] = useState(false);
  const [estimatedDeliveryFee, setEstimatedDeliveryFee] = useState(125);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');
  const [discount, setDiscount] = useState(0);

  useEffect(() => {
    if (!vendorId) return;
    void apiClient
      .get('/orders/estimate-fee', {
        params: {
          vendorId,
          lat: DEFAULT_LOCATION.lat,
          lng: DEFAULT_LOCATION.lng,
        },
      })
      .then((res) => {
        if (res.data?.success && res.data.data?.deliveryFee != null) {
          setEstimatedDeliveryFee(Number(res.data.data.deliveryFee));
        }
      })
      .catch(() => undefined);
  }, [vendorId]);

  const vendorName = items[0]?.vendorName ?? 'Shop';
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal + estimatedDeliveryFee - discount);

  async function applyPromo() {
    if (!promoCode.trim()) return;
    try {
      const result = await validatePromo(promoCode.trim(), subtotal + estimatedDeliveryFee);
      setDiscount(Number(result.discount) || 0);
      setAppliedPromo(promoCode.trim().toUpperCase());
      Alert.alert('Promo applied', `You save ${formatPrice(Number(result.discount) || 0)}`);
    } catch (e) {
      setDiscount(0);
      setAppliedPromo('');
      Alert.alert('Invalid promo', e instanceof Error ? e.message : 'Try another code');
    }
  }

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
        promoCode: appliedPromo || undefined,
        paymentGateway: paymentMethod === 'cod' ? 'manual' : cardGateway,
      });

      const payment = (
        order as {
          payment?: {
            id: string;
            clientSecret?: string | null;
            gateway?: string;
            payHere?: Record<string, string> | null;
          };
        }
      ).payment;

      if (paymentMethod === 'card') {
        router.push(`/(customer)/checkout/payment?orderId=${order.id}&amount=${total.toFixed(2)}`);
        return;
      }

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
        <GlassCard style={styles.emptyCard}>
          <ShoppingBag color="rgba(255,255,255,0.7)" size={48} />
          <Text style={styles.empty}>No items for this shop in your cart.</Text>
          <GlassButton style={{ marginTop: 24 }} title="Back to cart" onPress={() => router.back()} />
        </GlassCard>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.shopName}>Order from {vendorName}</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color="#0ea5e9" size={20} />
            <Text style={styles.sectionTitle}>Delivery Address</Text>
          </View>
          <GlassInput
            style={{ minHeight: 80, textAlignVertical: 'top' }}
            placeholder="Enter your exact delivery address..."
            value={address}
            onChangeText={setAddress}
            multiline
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShoppingBag color="#0ea5e9" size={20} />
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>
          <GlassCard style={styles.itemsCard}>
            {items.map((item, index) => (
              <View
                key={item.productId}
                style={[styles.itemRow, index === items.length - 1 && styles.lastItemRow]}
              >
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.itemPrice}>{formatPrice(item.price * item.quantity)}</Text>
              </View>
            ))}
          </GlassCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Tag color="#0ea5e9" size={20} />
            <Text style={styles.sectionTitle}>Promo code</Text>
          </View>
          <View style={styles.promoRow}>
            <View style={{ flex: 1 }}>
              <GlassInput
                placeholder="Enter code"
                autoCapitalize="characters"
                value={promoCode}
                onChangeText={(t) => {
                  setPromoCode(t);
                  setAppliedPromo('');
                  setDiscount(0);
                }}
              />
            </View>
            <TouchableOpacity style={styles.promoBtn} onPress={applyPromo}>
              <Text style={styles.promoBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
          {appliedPromo && discount > 0 ? (
            <Text style={styles.promoOk}>
              {appliedPromo} − {formatPrice(discount)}
            </Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Banknote color="#0ea5e9" size={20} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          <View style={styles.row}>
            {(
              [
                { key: 'cod' as const, label: 'Cash', icon: Banknote },
                { key: 'card' as const, label: 'Card', icon: CreditCard },
              ] as const
            ).map((m) => {
              const Icon = m.icon;
              const isActive = paymentMethod === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.chipWrapper, isActive && styles.chipWrapperActive]}
                  onPress={() => setPaymentMethod(m.key)}
                  activeOpacity={0.7}
                >
                  <BlurView intensity={20} tint="dark" style={[styles.chip, isActive && styles.chipActive]}>
                    <Icon color={isActive ? '#fff' : 'rgba(255,255,255,0.7)'} size={18} />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{m.label}</Text>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </View>
          {paymentMethod === 'card' && (
            <View style={[styles.row, { marginTop: 10 }]}>
              {(['stripe', 'payhere'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chipWrapper, cardGateway === g && styles.chipWrapperActive]}
                  onPress={() => setCardGateway(g)}
                >
                  <BlurView
                    intensity={20}
                    tint="dark"
                    style={[styles.chip, cardGateway === g && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, cardGateway === g && styles.chipTextActive]}>
                      {g === 'stripe' ? 'Stripe' : 'PayHere'}
                    </Text>
                  </BlurView>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText color="#0ea5e9" size={20} />
            <Text style={styles.sectionTitle}>Special Instructions</Text>
          </View>
          <GlassInput
            style={{ minHeight: 80, textAlignVertical: 'top' }}
            placeholder="E.g. Ring the bell, drop at the door..."
            value={instructions}
            onChangeText={setInstructions}
            multiline
          />
        </View>

        <GlassCard style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>{formatPrice(estimatedDeliveryFee)}</Text>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: '#34d399' }]}>Promo</Text>
              <Text style={[styles.summaryValue, { color: '#34d399' }]}>-{formatPrice(discount)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total to Pay</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
        </GlassCard>
      </ScrollView>

      <BlurView intensity={30} tint="dark" style={styles.footer}>
        <GlassButton
          onPress={placeOrder}
          disabled={placing}
          title={placing ? 'Processing...' : `Confirm & Pay  •  ${formatPrice(total)}`}
        />
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16, paddingBottom: 32 },
  emptyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    margin: 16,
  },
  empty: { textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  shopName: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 24 },
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  promoRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  promoBtn: {
    backgroundColor: 'rgba(14,165,233,0.45)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  promoBtnText: { color: '#fff', fontWeight: '700' },
  promoOk: { marginTop: 8, color: '#34d399', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  chipWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  chipWrapperActive: {
    borderColor: 'rgba(14, 165, 233, 0.8)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipActive: { backgroundColor: 'rgba(14, 165, 233, 0.4)' },
  chipText: { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  chipTextActive: { color: '#fff' },
  itemsCard: {
    padding: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lastItemRow: { borderBottomWidth: 0, paddingBottom: 0 },
  itemName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500', paddingRight: 16 },
  itemPrice: { fontWeight: '700', color: '#fff', fontSize: 15 },
  summary: {
    padding: 20,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  summaryValue: { color: '#fff', fontSize: 15, fontWeight: '600' },
  totalRow: { marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#fff' },
  totalValue: { fontSize: 20, fontWeight: '800', color: '#0ea5e9' },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
});

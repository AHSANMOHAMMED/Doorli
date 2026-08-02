import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOrder, formatPrice, formatStatus, cancelOrder } from '../../../lib/api';
import { DoorliColors } from '../../../constants/colors';
import { useCartStore } from '../../../store/cart';
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Store,
  MapPin,
  CreditCard,
  StickyNote,
  RotateCcw,
  Star,
  Phone,
  Copy,
} from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'preparing', label: 'Preparing', icon: Package },
  { key: 'ready', label: 'Ready', icon: Store },
  { key: 'picked_up', label: 'Picked Up', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle },
];

const STATUS_COLORS: Record<string, string> = {
  pending: DoorliColors.warning,
  confirmed: DoorliColors.info,
  preparing: DoorliColors.purple,
  ready: DoorliColors.sky,
  picked_up: DoorliColors.teal,
  delivered: DoorliColors.success,
  cancelled: DoorliColors.danger,
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const [cancelling, setCancelling] = useState(false);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['order', id],
    queryFn: () => fetchOrder(id),
    enabled: !!id,
  });

  function getStatusIndex(status: string): number {
    const idx = STATUS_STEPS.findIndex((s) => s.key === status);
    return idx >= 0 ? idx : 0;
  }

  function handleReorder() {
    if (!order?.items?.length || !order.vendor) return;
    let cleared = false;
    for (const item of order.items) {
      addItem(
        {
          productId: item.id,
          vendorId: order.vendor.id,
          vendorName: order.vendor.businessName,
          name: item.product.name,
          price: item.unitPrice,
          imageUrl: item.product.imageUrl ?? null,
          unit: null,
        },
        item.quantity,
      );
      if (!cleared) {
        cleared = true;
      }
    }
    Alert.alert('Added to cart', 'Items added. Go to cart to checkout.', [
      { text: 'View Cart', onPress: () => router.push('/(customer)/cart') },
      { text: 'Continue Shopping' },
    ]);
  }

  function handleCancel() {
    Alert.alert('Cancel order?', 'This action cannot be undone.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true);
          try {
            await cancelOrder(order!.id);
            refetch();
            Alert.alert('Order cancelled');
          } catch (e: any) {
            Alert.alert('Failed', e.message || 'Could not cancel');
          } finally {
            setCancelling(false);
          }
        },
      },
    ]);
  }

  function copyOrderId() {
    if (order?.orderNumber) {
      Alert.alert('Copied', `Order #${order.orderNumber} copied`);
    }
  }

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </SafeAreaView>
    );
  }

  const currentIdx = getStatusIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const canCancel = ['pending', 'confirmed'].includes(order.status);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={DoorliColors.text} size={24} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Order Details</Text>
          <TouchableOpacity onPress={copyOrderId} style={styles.orderIdRow}>
            <Text style={styles.orderIdText}>#{order.orderNumber}</Text>
            <Copy color={DoorliColors.textDim} size={12} />
          </TouchableOpacity>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[order.status] || DoorliColors.textDim }]}>
              {isCancelled ? (
                <XCircle color="#fff" size={24} />
              ) : (
                <CheckCircle color="#fff" size={24} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statusTitle}>{formatStatus(order.status)}</Text>
              <Text style={styles.statusTime}>
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>

          {/* Timeline */}
          {!isCancelled && (
            <View style={styles.timeline}>
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentIdx;
                const isCurrent = idx === currentIdx;
                const Icon = step.icon;
                return (
                  <View key={step.key} style={styles.timelineStep}>
                    <View style={[
                      styles.timelineIcon,
                      isCompleted && styles.timelineIconActive,
                      isCurrent && styles.timelineIconCurrent,
                    ]}>
                      <Icon color={isCompleted ? '#fff' : DoorliColors.textDim} size={14} />
                    </View>
                    <Text style={[
                      styles.timelineLabel,
                      isCompleted && styles.timelineLabelActive,
                      isCurrent && styles.timelineLabelCurrent,
                    ]}>
                      {step.label}
                    </Text>
                    {idx < STATUS_STEPS.length - 1 && (
                      <View style={[
                        styles.timelineConnector,
                        idx < currentIdx && styles.timelineConnectorActive,
                      ]} />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Vendor Info */}
        {order.vendor && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <Store color={PRIMARY} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Vendor</Text>
                <Text style={styles.infoValue}>{order.vendor.businessName}</Text>
              </View>
              {order.vendor.phone && (
                <TouchableOpacity style={styles.callBtn}>
                  <Phone color={PRIMARY} size={18} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Delivery Address */}
        {order.deliveryAddress && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <MapPin color={DoorliColors.teal} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Delivery Address</Text>
                <Text style={styles.infoValue}>{order.deliveryAddress.addressLine}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <CreditCard color={DoorliColors.gold} size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>Payment</Text>
              <Text style={styles.infoValue}>
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Card'} · {formatStatus(order.paymentStatus)}
              </Text>
            </View>
          </View>
        </View>

        {/* Special Instructions */}
        {order.specialInstructions && (
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <StickyNote color={DoorliColors.purple} size={18} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Special Instructions</Text>
                <Text style={styles.infoValue}>{order.specialInstructions}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.items?.map((item, index) => (
            <View key={item.id} style={[styles.itemRow, index === (order.items?.length ?? 0) - 1 && styles.lastItemRow]}>
              <Image
                source={{ uri: item.product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop' }}
                style={styles.itemImage}
              />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.itemMeta}>Qty: {item.quantity} × {formatPrice(item.unitPrice)}</Text>
              </View>
              <Text style={styles.itemTotal}>{formatPrice(item.totalPrice)}</Text>
            </View>
          ))}
        </View>

        {/* Order Summary */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>{formatPrice(order.deliveryFee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(order.totalAmount)}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {!isCancelled && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => router.push(`/(customer)/track/${order.id}`)}
            >
              <Truck color="#fff" size={18} />
              <Text style={styles.trackBtnText}>Track Order</Text>
            </TouchableOpacity>
          )}

          {canCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? (
                <ActivityIndicator color={DoorliColors.danger} size="small" />
              ) : (
                <>
                  <XCircle color={DoorliColors.danger} size={18} />
                  <Text style={styles.cancelBtnText}>Cancel Order</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.reorderBtn} onPress={handleReorder}>
            <RotateCcw color={PRIMARY} size={18} />
            <Text style={styles.reorderBtnText}>Re-order</Text>
          </TouchableOpacity>

          {order.status === 'delivered' && (
            <TouchableOpacity
              style={styles.reviewBtn}
              onPress={() => router.push(`/(customer)/review?vendorId=${order.vendor?.id}&orderId=${order.id}`)}
            >
              <Star color={DoorliColors.gold} size={18} />
              <Text style={styles.reviewBtnText}>Write a Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DoorliColors.navy },
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
  orderIdRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  orderIdText: { fontSize: 12, color: DoorliColors.textDim, fontWeight: '500' },
  content: { padding: 16, paddingBottom: 40 },

  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    marginBottom: 16,
  },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  statusDot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTitle: { fontSize: 20, fontWeight: '800', color: DoorliColors.text },
  statusTime: { fontSize: 13, color: DoorliColors.textDim, marginTop: 2 },

  timeline: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  timelineStep: { flex: 1, alignItems: 'center', position: 'relative' },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    marginBottom: 6,
  },
  timelineIconActive: { backgroundColor: PRIMARY },
  timelineIconCurrent: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  timelineLabel: { fontSize: 10, color: DoorliColors.textDim, textAlign: 'center', fontWeight: '500' },
  timelineLabelActive: { color: DoorliColors.textMuted },
  timelineLabelCurrent: { color: '#fff', fontWeight: '700' },
  timelineConnector: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-60%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 1,
  },
  timelineConnectorActive: { backgroundColor: PRIMARY },

  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 14,
    marginBottom: 10,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { fontSize: 12, color: DoorliColors.textDim, fontWeight: '500', marginBottom: 2 },
  infoValue: { fontSize: 14, color: DoorliColors.text, fontWeight: '600' },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(24,95,165,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 18,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DoorliColors.text, marginBottom: 14 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 12,
  },
  lastItemRow: { borderBottomWidth: 0, paddingBottom: 0 },
  itemImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', color: DoorliColors.text },
  itemMeta: { fontSize: 12, color: DoorliColors.textDim, marginTop: 2 },
  itemTotal: { fontSize: 14, fontWeight: '700', color: DoorliColors.gold },

  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: DoorliColors.textMuted },
  summaryValue: { fontSize: 14, fontWeight: '600', color: DoorliColors.text },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  totalLabel: { fontSize: 16, fontWeight: '700', color: DoorliColors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: DoorliColors.primary },

  actions: { gap: 10, marginTop: 8 },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 14,
  },
  trackBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(242,102,139,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,102,139,0.3)',
    padding: 14,
    borderRadius: 14,
  },
  cancelBtnText: { color: DoorliColors.danger, fontSize: 15, fontWeight: '600' },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(24,95,165,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(24,95,165,0.3)',
    padding: 14,
    borderRadius: 14,
  },
  reorderBtnText: { color: PRIMARY, fontSize: 15, fontWeight: '600' },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(250,199,117,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250,199,117,0.3)',
    padding: 14,
    borderRadius: 14,
  },
  reviewBtnText: { color: DoorliColors.gold, fontSize: 15, fontWeight: '600' },
});

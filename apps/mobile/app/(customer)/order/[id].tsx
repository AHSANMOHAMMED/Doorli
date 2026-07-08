import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { GlassButton } from '../../../components/GlassButton';
import { cancelOrder, fetchOrder, formatPrice } from '../../../lib/api';
import { MapPin, Phone, MessageSquare, Clock, CheckCircle, Package, Store, ArrowLeft, MoreHorizontal } from 'lucide-react-native';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Confirmed by Shop',
  preparing: 'Being Prepared',
  ready: 'Ready for Pickup',
  picked_up: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  ready: Store,
  picked_up: MapPin,
  delivered: CheckCircle,
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => fetchOrder(id),
    refetchInterval: 15000,
    enabled: !!id,
  });

  async function handleCancel() {
    Alert.alert('Cancel order', 'Are you sure you want to cancel this order?', [
      { text: 'No, keep it', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelOrder(id);
            queryClient.invalidateQueries({ queryKey: ['order', id] });
            queryClient.invalidateQueries({ queryKey: ['my-orders'] });
          } catch (err) {
            Alert.alert('Could not cancel', err instanceof Error ? err.message : 'Try again');
          }
        },
      },
    ]);
  }

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const canCancel = order.status === 'pending';
  const items = order.order_items ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order #{order.order_number}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerTitle}>{STATUS_LABELS[order.status] ?? order.status}</Text>
          <Text style={styles.statusBannerSubtitle}>
            {order.vendor?.business_name ?? 'Shop'}
          </Text>
        </View>

        {order.status !== 'cancelled' && (
          <GlassCard style={styles.timelineCard}>
            {STATUS_STEPS.map((step, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const isFuture = idx > currentStep;
              const Icon = STATUS_ICONS[step] || Clock;

              return (
                <View key={step} style={styles.timelineRow}>
                  <View style={styles.timelineIconContainer}>
                    <View
                      style={[
                        styles.timelineIconBg,
                        isPast && styles.bgSuccess,
                        isCurrent && styles.bgActive,
                        isFuture && styles.bgInactive,
                      ]}
                    >
                      <Icon
                        color={isPast ? '#4ade80' : isCurrent ? '#38bdf8' : 'rgba(255,255,255,0.4)'}
                        size={16}
                      />
                    </View>
                    {idx < STATUS_STEPS.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          isPast ? styles.lineActive : styles.lineInactive,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineTextContainer}>
                    <Text
                      style={[
                        styles.timelineText,
                        (isPast || isCurrent) ? styles.textActive : styles.textInactive,
                        isCurrent && styles.textBold,
                      ]}
                    >
                      {STATUS_LABELS[step]}
                    </Text>
                    {isCurrent && (
                      <Text style={styles.timelineTime}>
                        Updated {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </GlassCard>
        )}

        {(order.status === 'picked_up' || order.status === 'delivered') && (
          <GlassCard style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>JD</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>John Driver</Text>
              <Text style={styles.driverVehicle}>Toyota Prius · ABC-123</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn}>
              <Phone color="#0ea5e9" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <MessageSquare color="#0ea5e9" size={20} />
            </TouchableOpacity>
          </GlassCard>
        )}

        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {items.map((item, idx) => (
            <View key={item.id} style={[styles.itemRow, idx === items.length - 1 && styles.lastRow]}>
              <View style={styles.qtyBadge}>
                <Text style={styles.qtyText}>{item.quantity}x</Text>
              </View>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{formatPrice(Number(item.price) * item.quantity)}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{formatPrice(Number(order.subtotal))}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={styles.summaryValue}>{formatPrice(Number(order.delivery_fee))}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(Number(order.total_amount))}</Text>
          </View>
        </GlassCard>

        {order.delivery_address && (
          <GlassCard style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.addressRow}>
              <MapPin color="rgba(255,255,255,0.7)" size={20} />
              <Text style={styles.addressText}>{order.delivery_address}</Text>
            </View>
          </GlassCard>
        )}

        <View style={styles.actionsContainer}>
          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          <GlassButton title="Back to Home" onPress={() => router.replace('/(customer)')} />
        </View>
      </ScrollView>
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
  headerPlaceholder: { width: 44 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { padding: 16, paddingBottom: 48 },
  statusBanner: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statusBannerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  statusBannerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  timelineCard: {
    padding: 24,
    marginBottom: 16,
  },
  timelineRow: { flexDirection: 'row', minHeight: 60 },
  timelineIconContainer: { alignItems: 'center', width: 32, marginRight: 16 },
  timelineIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  bgSuccess: { backgroundColor: 'rgba(74, 222, 128, 0.15)', borderColor: 'rgba(74, 222, 128, 0.3)' },
  bgActive: { backgroundColor: 'rgba(14, 165, 233, 0.15)', borderColor: 'rgba(14, 165, 233, 0.3)' },
  bgInactive: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' },
  timelineLine: { width: 2, flex: 1, marginVertical: -4, zIndex: 1 },
  lineActive: { backgroundColor: '#4ade80' },
  lineInactive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  timelineTextContainer: { flex: 1, paddingBottom: 24, paddingTop: 4 },
  timelineText: { fontSize: 15, fontWeight: '500' },
  textActive: { color: '#fff' },
  textInactive: { color: 'rgba(255,255,255,0.4)' },
  textBold: { fontWeight: '700', color: '#38bdf8' },
  timelineTime: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(14, 165, 233, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInitials: { color: '#0ea5e9', fontWeight: '700', fontSize: 16 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  driverVehicle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 16 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  lastRow: { borderBottomWidth: 0, paddingBottom: 0 },
  qtyBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  qtyText: { fontWeight: '700', color: '#fff', fontSize: 13 },
  itemName: { flex: 1, color: '#fff', fontSize: 15, fontWeight: '500' },
  itemPrice: { fontWeight: '700', color: '#fff', fontSize: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 15 },
  summaryValue: { color: '#fff', fontSize: 15, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16, marginTop: 4 },
  totalLabel: { fontWeight: '700', fontSize: 16, color: '#fff' },
  totalValue: { fontWeight: '800', color: '#0ea5e9', fontSize: 18 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addressText: { flex: 1, color: '#fff', fontSize: 15, lineHeight: 22 },
  actionsContainer: { marginTop: 8, gap: 12 },
  cancelBtn: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
  },
  cancelText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
});

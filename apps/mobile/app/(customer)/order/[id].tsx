import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
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
        <ActivityIndicator color="#2563eb" style={{ marginTop: 48 }} />
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
          <ArrowLeft color="#0f172a" size={24} />
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
          <View style={styles.timelineCard}>
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
                        color={isPast ? '#16a34a' : isCurrent ? '#2563eb' : '#94a3b8'}
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
          </View>
        )}

        {(order.status === 'picked_up' || order.status === 'delivered') && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitials}>JD</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>John Driver</Text>
              <Text style={styles.driverVehicle}>Toyota Prius · ABC-123</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn}>
              <Phone color="#2563eb" size={20} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}>
              <MessageSquare color="#2563eb" size={20} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.sectionCard}>
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
        </View>

        <View style={styles.sectionCard}>
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
        </View>

        {order.delivery_address && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Delivery Details</Text>
            <View style={styles.addressRow}>
              <MapPin color="#64748b" size={20} />
              <Text style={styles.addressText}>{order.delivery_address}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionsContainer}>
          {canCancel && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(customer)')}>
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerPlaceholder: { width: 44 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  content: { padding: 16, paddingBottom: 48 },
  statusBanner: {
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
  },
  statusBannerTitle: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 4 },
  statusBannerSubtitle: { fontSize: 16, color: '#64748b', fontWeight: '500' },
  timelineCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
  },
  bgSuccess: { backgroundColor: '#dcfce7' },
  bgActive: { backgroundColor: '#eff6ff' },
  bgInactive: { backgroundColor: '#f1f5f9' },
  timelineLine: { width: 2, flex: 1, marginVertical: -4, zIndex: 1 },
  lineActive: { backgroundColor: '#16a34a' },
  lineInactive: { backgroundColor: '#e2e8f0' },
  timelineTextContainer: { flex: 1, paddingBottom: 24, paddingTop: 4 },
  timelineText: { fontSize: 15, fontWeight: '500' },
  textActive: { color: '#0f172a' },
  textInactive: { color: '#94a3b8' },
  textBold: { fontWeight: '700', color: '#2563eb' },
  timelineTime: { fontSize: 13, color: '#64748b', marginTop: 4 },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  driverInitials: { color: '#0284c7', fontWeight: '700', fontSize: 16 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  driverVehicle: { fontSize: 13, color: '#64748b', marginTop: 2 },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  lastRow: { borderBottomWidth: 0, paddingBottom: 0 },
  qtyBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 12,
  },
  qtyText: { fontWeight: '700', color: '#475569', fontSize: 13 },
  itemName: { flex: 1, color: '#334155', fontSize: 15, fontWeight: '500' },
  itemPrice: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  summaryLabel: { color: '#64748b', fontSize: 15 },
  summaryValue: { color: '#0f172a', fontSize: 15, fontWeight: '500' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16, marginTop: 4 },
  totalLabel: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
  totalValue: { fontWeight: '800', color: '#2563eb', fontSize: 18 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addressText: { flex: 1, color: '#334155', fontSize: 15, lineHeight: 22 },
  actionsContainer: { marginTop: 8, gap: 12 },
  cancelBtn: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  cancelText: { color: '#ef4444', fontWeight: '700', fontSize: 16 },
  homeBtn: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  homeBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

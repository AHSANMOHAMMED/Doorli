import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOrder, formatPrice, updateOrderStatus, DEFAULT_LOCATION } from '../../../lib/api';
import { useAuthStore } from '../../../store/auth';
import { useDriverLocationPublish } from '../../../lib/driverLocation';
import { apiClient } from '../../../lib/axios';

function openMaps(lat: number, lng: number, label: string) {
  const url =
    Platform.OS === 'ios'
      ? `maps:0,0?q=${label}@${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(label)})`;
  Linking.openURL(url).catch(() => {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
  });
}

function callNumber(phone: string) {
  Linking.openURL(`tel:${phone}`).catch(() => {
    Alert.alert('Error', 'Could not open phone dialer');
  });
}

export default function NavigateScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  useDriverLocationPublish(true, user?.id);

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['driver-order', orderId],
    queryFn: () => fetchOrder(orderId!),
    enabled: !!orderId,
    refetchInterval: 10000,
  });

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const dropoff = order.deliveryAddress;
  const dropLat = dropoff?.latitude != null ? Number(dropoff.latitude) : DEFAULT_LOCATION.lat;
  const dropLng = dropoff?.longitude != null ? Number(dropoff.longitude) : DEFAULT_LOCATION.lng;
  const vendorLat =
    order.vendor?.latitude != null ? Number(order.vendor.latitude) : DEFAULT_LOCATION.lat + 0.01;
  const vendorLng =
    order.vendor?.longitude != null ? Number(order.vendor.longitude) : DEFAULT_LOCATION.lng + 0.01;

  const nextAction =
    order.status === 'ready'
      ? { label: 'Picked up', next: 'picked_up' }
      : order.status === 'picked_up'
        ? { label: 'Delivered', next: 'delivered' }
        : null;

  async function advanceStatus() {
    if (!nextAction) return;
    setBusy(true);
    try {
      await updateOrderStatus(order!.id, nextAction.next);
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
      queryClient.invalidateQueries({ queryKey: ['driver-earnings'] });
      await refetch();
      if (nextAction.next === 'delivered') {
        Alert.alert('Delivered!', 'Order marked as delivered. Collect COD if needed.');
      }
    } catch (e: unknown) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(false);
    }
  }

  async function collectCod() {
    setBusy(true);
    try {
      const res = await apiClient.post('/payments/collect-cod-for-order', { orderId: order!.id });
      if (!res.data?.success) throw new Error(res.data?.error || 'Collect failed');
      Alert.alert('COD collected', 'Cash on delivery marked as paid.');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['driver-earnings'] });
    } catch (e: unknown) {
      Alert.alert('COD', e instanceof Error ? e.message : 'Could not collect COD');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: dropLat,
            longitude: dropLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation
        >
          <Marker
            coordinate={{ latitude: vendorLat, longitude: vendorLng }}
            title="Pickup"
            description={order.vendor?.businessName}
            pinColor="#00B241"
          />
          <Marker
            coordinate={{ latitude: dropLat, longitude: dropLng }}
            title="Drop-off"
            description={dropoff?.addressLine}
            pinColor="#ef4444"
          />
        </MapView>
      </View>

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView contentContainerStyle={styles.sheetContent}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.orderNumber}>{order.orderNumber}</Text>
              <Text style={styles.status}>
                {order.status.replace(/_/g, ' ')}
              </Text>
            </View>
            <Text style={styles.total}>{formatPrice(Number(order.totalAmount))}</Text>
          </View>

          <View style={styles.instructions}>
            <Text style={styles.instructionLabel}>Navigation</Text>
            <Text style={styles.instructionText}>
              {order.status === 'ready'
                ? 'Head to the pickup location'
                : order.status === 'picked_up'
                  ? 'Head to the drop-off location'
                  : 'Delivery complete'}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.label}>Pickup</Text>
              <TouchableOpacity onPress={() => openMaps(vendorLat, vendorLng, order.vendor?.businessName ?? 'Pickup')}>
                <Text style={styles.openMapText}>Open Map</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.name}>{order.vendor?.businessName}</Text>
            {order.vendor?.phone && (
              <TouchableOpacity style={styles.contactBtn} onPress={() => callNumber(order.vendor!.phone!)}>
                <Text style={styles.contactText}>📞 Call Vendor</Text>
              </TouchableOpacity>
            )}
          </View>

          {dropoff && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.label}>Drop-off</Text>
                <TouchableOpacity onPress={() => openMaps(dropLat, dropLng, dropoff.addressLine)}>
                  <Text style={styles.openMapText}>Open Map</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.address}>{dropoff.addressLine}</Text>
            </View>
          )}

          {order.specialInstructions && (
            <View style={styles.instructionsCard}>
              <Text style={styles.label}>Special Instructions</Text>
              <Text style={styles.instructionsText}>{order.specialInstructions}</Text>
            </View>
          )}

          <View style={styles.actions}>
            {nextAction && (
              <TouchableOpacity
                style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
                disabled={busy}
                onPress={advanceStatus}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>{nextAction.label}</Text>
                )}
              </TouchableOpacity>
            )}
            {(order.status === 'delivered' || order.paymentMethod === 'cod') && (
              <TouchableOpacity
                style={[styles.codBtn, busy && { opacity: 0.6 }]}
                disabled={busy}
                onPress={collectCod}
              >
                <Text style={styles.codText}>Collect COD</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.back()}>
              <Text style={styles.secondaryText}>Back to Jobs</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapWrap: { height: '40%' },
  map: { flex: 1 },
  sheet: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
  },
  sheetContent: { padding: 16, paddingBottom: 32 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumber: { fontSize: 20, fontWeight: '800', color: '#0f172a' },
  status: { color: '#00B241', marginTop: 4, textTransform: 'capitalize', fontWeight: '600' },
  total: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  instructions: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
  },
  instructionLabel: { fontSize: 11, fontWeight: '700', color: '#3b82f6', textTransform: 'uppercase' },
  instructionText: { fontSize: 14, color: '#1e40af', marginTop: 4, fontWeight: '500' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  openMapText: { fontSize: 12, color: '#00B241', fontWeight: '600' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  address: { fontSize: 15, color: '#0f172a', marginTop: 4 },
  contactBtn: {
    marginTop: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactText: { color: '#166534', fontWeight: '600', fontSize: 13 },
  instructionsCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  instructionsText: { fontSize: 14, color: '#92400e', marginTop: 4 },
  actions: { marginTop: 16, gap: 8 },
  primaryBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  codBtn: {
    backgroundColor: '#FAC775',
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codText: { color: '#07101f', fontWeight: '800', fontSize: 16 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#475569', fontWeight: '600' },
});

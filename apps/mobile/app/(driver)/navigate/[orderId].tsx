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
} from 'react-native';
const MapView = ({ children, style }: any) => <View style={[style, { backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' }]}><Text style={{color: '#94a3b8', marginBottom: 10}}>Interactive Map (Dev Client Required)</Text><View style={{flexDirection:'row', gap: 20}}>{children}</View></View>;
const Marker = ({ children }: any) => <View>{children}</View>;
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

  async function markDelivered() {
    setBusy(true);
    try {
      await updateOrderStatus(order!.id, 'delivered');
      queryClient.invalidateQueries({ queryKey: ['driver-jobs'] });
      await refetch();
      Alert.alert('Delivered', 'Order marked delivered. Collect COD if needed.');
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
          initialRegion={{
            latitude: dropLat,
            longitude: dropLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
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
            pinColor="#059669"
          />
        </MapView>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.status}>Status: {order.status.replace(/_/g, ' ')}</Text>
        <Text style={styles.total}>{formatPrice(Number(order.totalAmount))}</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Pickup</Text>
          <Text style={styles.name}>{order.vendor?.businessName}</Text>
        </View>

        {dropoff && (
          <View style={styles.card}>
            <Text style={styles.label}>Drop-off</Text>
            <Text style={styles.address}>{dropoff.addressLine}</Text>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => openMaps(dropLat, dropLng, dropoff.addressLine)}
            >
              <Text style={styles.mapBtnText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.actions}>
          {order.status === 'picked_up' && (
            <TouchableOpacity
              style={[styles.primary, busy && { opacity: 0.6 }]}
              disabled={busy}
              onPress={markDelivered}
            >
              <Text style={styles.primaryText}>Mark delivered</Text>
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
          <TouchableOpacity style={styles.secondary} onPress={() => router.back()}>
            <Text style={styles.secondaryText}>Back to jobs</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapWrap: { height: '42%' },
  map: { flex: 1 },
  sheet: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    marginTop: -12,
  },
  orderNumber: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  status: { color: '#00B241', marginTop: 4, textTransform: 'capitalize', fontWeight: '600' },
  total: { fontWeight: '700', marginTop: 4, color: '#0f172a' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  address: { fontSize: 15, color: '#0f172a', marginTop: 4 },
  mapBtn: {
    marginTop: 10,
    backgroundColor: '#00B241',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapBtnText: { color: '#fff', fontWeight: '600' },
  actions: { marginTop: 12, gap: 8 },
  primary: {
    backgroundColor: '#059669',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { color: '#fff', fontWeight: '800' },
  codBtn: {
    backgroundColor: '#FAC775',
    borderRadius: 12,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codText: { color: '#07101f', fontWeight: '800' },
  secondary: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { color: '#475569', fontWeight: '600' },
});

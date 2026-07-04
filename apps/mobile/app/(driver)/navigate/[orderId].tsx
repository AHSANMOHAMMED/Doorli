import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchOrder } from '../../../lib/api';

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

  const { data, isLoading } = useQuery({
    queryKey: ['driver-order', orderId],
    queryFn: () => fetchOrder(orderId),
  });

  const order = data?.data;

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#2563eb" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const dropoff = order.deliveryAddress;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.card}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.name}>{order.vendor.businessName}</Text>
        <Text style={styles.hint}>Collect order from the shop</Text>
      </View>

      {dropoff && (
        <View style={styles.card}>
          <Text style={styles.label}>Drop-off</Text>
          <Text style={styles.address}>{dropoff.addressLine}</Text>
          {dropoff.city && <Text style={styles.city}>{dropoff.city}</Text>}
          {dropoff.latitude && dropoff.longitude && (
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() =>
                openMaps(Number(dropoff.latitude), Number(dropoff.longitude), dropoff.addressLine)
              }
            >
              <Text style={styles.mapBtnText}>Open in Maps</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Order</Text>
        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
        <Text style={styles.status}>Status: {order.status.replace('_', ' ')}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: { fontSize: 12, fontWeight: '600', color: '#64748b', textTransform: 'uppercase' },
  name: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 4 },
  hint: { fontSize: 14, color: '#64748b', marginTop: 4 },
  address: { fontSize: 16, color: '#0f172a', marginTop: 4 },
  city: { fontSize: 14, color: '#64748b', marginTop: 2 },
  mapBtn: {
    marginTop: 12,
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  mapBtnText: { color: '#fff', fontWeight: '600' },
  orderNumber: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  status: { fontSize: 14, color: '#2563eb', marginTop: 4, textTransform: 'capitalize' },
});

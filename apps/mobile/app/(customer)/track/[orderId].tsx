import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../../../lib/api';
import { getSocket, joinSocketRooms } from '../../../lib/socket';
import { ArrowLeft, Navigation } from 'lucide-react-native';

export default function TrackOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: !!orderId,
    refetchInterval: 20000,
  });

  useEffect(() => {
    if (!orderId) return;
    const socket = getSocket();
    joinSocketRooms([`order:${orderId}`, order?.customerId ? `customer:${order.customerId}` : ''].filter(Boolean));
    const onLoc = (payload: { orderId?: string; lat: number; lng: number }) => {
      if (!payload.orderId || payload.orderId === orderId) {
        setDriverLoc({ lat: payload.lat, lng: payload.lng });
      }
    };
    socket.on('driver:location_update', onLoc);
    return () => {
      socket.off('driver:location_update', onLoc);
    };
  }, [orderId, order?.customerId]);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const vendorLat = Number(order.vendor?.latitude ?? 6.9271);
  const vendorLng = Number(order.vendor?.longitude ?? 79.8612);
  const dropLat = Number(order.deliveryAddress?.latitude ?? vendorLat + 0.01);
  const dropLng = Number(order.deliveryAddress?.longitude ?? vendorLng + 0.01);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color="#fff" size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>Live tracking</Text>
        <Text style={styles.status}>{order.status.replace(/_/g, ' ')}</Text>
      </View>

      <MapView
        style={styles.map}
        initialRegion={{
          latitude: driverLoc?.lat ?? vendorLat,
          longitude: driverLoc?.lng ?? vendorLng,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker coordinate={{ latitude: vendorLat, longitude: vendorLng }} title="Shop" pinColor="#2563eb" />
        <Marker coordinate={{ latitude: dropLat, longitude: dropLng }} title="Delivery" pinColor="#dc2626" />
        {driverLoc && (
          <Marker coordinate={{ latitude: driverLoc.lat, longitude: driverLoc.lng }} title="Driver">
            <View style={styles.driverDot}>
              <Navigation size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      <View style={styles.sheet}>
        <Text style={styles.sheetTitle}>Order #{order.orderNumber}</Text>
        <Text style={styles.sheetSub}>
          {driverLoc ? 'Driver location updating live' : 'Waiting for driver location...'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { padding: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  status: { color: '#38bdf8', marginTop: 4, textTransform: 'capitalize' },
  map: { flex: 1 },
  driverDot: { backgroundColor: '#10b981', padding: 8, borderRadius: 20 },
  sheet: { padding: 20, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  sheetSub: { marginTop: 6, color: '#64748b' },
});

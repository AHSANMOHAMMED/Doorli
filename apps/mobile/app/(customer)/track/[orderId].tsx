import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
const MapView = ({ children, style, initialRegion }: any) => <View style={[style, { backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }]}><Text style={{color: '#6b7280', marginBottom: 10}}>Interactive Map</Text><Text style={{color: '#9ca3af', fontSize: 10}}>{initialRegion?.latitude.toFixed(4)}, {initialRegion?.longitude.toFixed(4)}</Text><View style={{flexDirection:'row', gap: 20}}>{children}</View></View>;
const Marker = ({ children }: any) => <View>{children}</View>;
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from '../../../lib/api';
import { getSocket, joinSocketRooms } from '../../../lib/socket';
import { ArrowLeft, Navigation, Package, Truck, CheckCircle2, Phone, Star } from 'lucide-react-native';
import { Image } from 'react-native';

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
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
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
          <ArrowLeft color="#002b5b" size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Track Order</Text>
        <View style={{ width: 40 }} />
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
        <Marker coordinate={{ latitude: vendorLat, longitude: vendorLng }} title="Shop" pinColor="#00B241" />
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
        <View style={styles.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Order #{order.orderNumber}</Text>
              <Text style={styles.sheetSub}>
                {order.vendor?.businessName || 'Store'} • {order.items?.length || 0} items
              </Text>
            </View>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
            </View>
          </View>
          
          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, { backgroundColor: '#00B241' }]}>
                <Package color="#fff" size={20} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Preparing Order</Text>
                <Text style={styles.timelineDesc}>The shop is getting your order ready.</Text>
              </View>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, { backgroundColor: order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' ? '#00B241' : '#e5e7eb' }]}>
                <Truck color={order.status === 'OUT_FOR_DELIVERY' || order.status === 'DELIVERED' ? '#fff' : '#9ca3af'} size={20} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Out for Delivery</Text>
                <Text style={styles.timelineDesc}>
                  {driverLoc ? 'Driver is on the way with your order.' : 'Waiting for driver to pick up.'}
                </Text>
              </View>
            </View>
            <View style={styles.timelineLine} />
            <View style={styles.timelineItem}>
              <View style={[styles.timelineIcon, { backgroundColor: order.status === 'DELIVERED' ? '#00B241' : '#e5e7eb' }]}>
                <CheckCircle2 color={order.status === 'DELIVERED' ? '#fff' : '#9ca3af'} size={20} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Delivered</Text>
                <Text style={styles.timelineDesc}>Enjoy your order!</Text>
              </View>
            </View>
          </View>

          {/* Driver Profile Placeholder */}
          {(order.status === 'OUT_FOR_DELIVERY' || driverLoc) && (
            <View style={styles.driverCard}>
              <View style={styles.driverInfoRow}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=150&auto=format&fit=crop' }} 
                  style={styles.driverAvatar} 
                />
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>John Doe</Text>
                  <View style={styles.driverMeta}>
                    <Text style={styles.driverVehicle}>Honda PCX • AB-1234</Text>
                    <View style={styles.driverRating}>
                      <Star color="#914c00" size={12} fill="#914c00" />
                      <Text style={styles.driverRatingText}>4.9</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity style={styles.callButton}>
                  <Phone color="#00B241" size={20} />
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  backBtn: { 
    width: 40, height: 40, 
    borderRadius: 20, 
    backgroundColor: '#f3f4f6', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { color: '#002b5b', fontSize: 18, fontWeight: '700' },
  map: { flex: 1 },
  driverDot: { backgroundColor: '#00B241', padding: 8, borderRadius: 20 },
  sheet: { 
    flex: 1,
    paddingHorizontal: 20, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    shadowColor: '#002b5b',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#002b5b' },
  sheetSub: { marginTop: 4, color: '#6b7280', fontSize: 14, fontWeight: '500' },
  statusBadge: {
    backgroundColor: 'rgba(0, 178, 65, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#00B241',
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: '#e5e7eb',
    marginLeft: 19,
    marginTop: -8,
    marginBottom: -8,
    zIndex: 1,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
    paddingTop: 8,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002b5b',
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  driverCard: {
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  driverInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#002b5b',
  },
  driverMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  driverVehicle: {
    fontSize: 13,
    color: '#6b7280',
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 220, 196, 0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  driverRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#914c00',
    marginLeft: 4,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 178, 65, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

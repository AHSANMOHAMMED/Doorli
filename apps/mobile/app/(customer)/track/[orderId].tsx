import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchOrder, DEFAULT_LOCATION } from '../../../lib/api';
import { getSocket, joinSocketRooms } from '../../../lib/socket';
import { DoorliColors } from '../../../constants/colors';
import { ArrowLeft, Navigation, Package, Truck, CheckCircle2, Phone, Star, MapPin } from 'lucide-react-native';
import { Image } from 'react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

export default function TrackOrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [driverLoc, setDriverLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

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
    const onStatus = (payload: { orderId?: string; newStatus?: string; status?: string }) => {
      if ((!payload.orderId || payload.orderId === orderId) && (payload.newStatus || payload.status)) {
        setLiveStatus(payload.newStatus || payload.status || null);
      }
    };
    socket.on('driver:location_update', onLoc);
    socket.on('order:status_update', onStatus);
    return () => {
      socket.off('driver:location_update', onLoc);
      socket.off('order:status_update', onStatus);
    };
  }, [orderId, order?.customerId]);

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </SafeAreaView>
    );
  }

  const status = liveStatus || order.status;
  const vendorLat = Number(order.vendor?.latitude ?? DEFAULT_LOCATION.lat);
  const vendorLng = Number(order.vendor?.longitude ?? DEFAULT_LOCATION.lng);
  const dropLat = Number(order.deliveryAddress?.latitude ?? vendorLat + 0.01);
  const dropLng = Number(order.deliveryAddress?.longitude ?? vendorLng + 0.01);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={DoorliColors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Track Order</Text>
        <View style={{ width: 44 }} />
      </View>

      {vendorLat && vendorLng ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: driverLoc?.lat ?? vendorLat,
            longitude: driverLoc?.lng ?? vendorLng,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={false}
        >
          <Marker coordinate={{ latitude: vendorLat, longitude: vendorLng }} title="Shop" pinColor={PRIMARY} />
          <Marker coordinate={{ latitude: dropLat, longitude: dropLng }} title="Delivery" pinColor={DoorliColors.danger} />
          {driverLoc && (
            <Marker coordinate={{ latitude: driverLoc.lat, longitude: driverLoc.lng }} title="Driver">
              <View style={styles.driverDot}>
                <Navigation size={16} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={[styles.map, { backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' }]}>
          <MapPin color={DoorliColors.textDim} size={32} />
          <Text style={{ color: DoorliColors.textDim, marginTop: 10, fontSize: 14, fontWeight: '600' }}>Map unavailable</Text>
          {order.deliveryAddress && (
            <Text style={{ color: DoorliColors.textDim, fontSize: 12, marginTop: 4 }}>{order.deliveryAddress.addressLine}</Text>
          )}
        </View>
      )}

      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Order #{order.orderNumber}</Text>
              <Text style={styles.sheetSub}>
                {order.vendor?.businessName || 'Store'} · {order.items?.length || 0} items
              </Text>
            </View>
            <View style={styles.statusBadge}>
               <Text style={styles.statusText}>{status.replace(/_/g, ' ')}</Text>
            </View>
          </View>

          <View style={styles.timeline}>
            {[
              { label: 'Order Placed', desc: 'Your order has been placed.', done: true },
               { label: 'Preparing', desc: 'The shop is getting your order ready.', done: ['preparing', 'ready', 'picked_up', 'delivered'].includes(status) },
               { label: 'Out for Delivery', desc: driverLoc ? 'Driver is on the way.' : 'Waiting for driver to pick up.', done: ['picked_up', 'delivered'].includes(status) },
               { label: 'Delivered', desc: 'Enjoy your order!', done: status === 'delivered' },
            ].map((step, idx) => (
              <View key={idx} style={styles.timelineItem}>
                <View style={[styles.timelineIcon, { backgroundColor: step.done ? PRIMARY : 'rgba(255,255,255,0.08)' }]}>
                  {idx === 0 && <Package color="#fff" size={16} />}
                  {idx === 1 && <Package color={step.done ? '#fff' : DoorliColors.textDim} size={16} />}
                  {idx === 2 && <Truck color={step.done ? '#fff' : DoorliColors.textDim} size={16} />}
                  {idx === 3 && <CheckCircle2 color={step.done ? '#fff' : DoorliColors.textDim} size={16} />}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.timelineTitle, step.done && styles.timelineTitleActive]}>
                    {step.label}
                  </Text>
                  <Text style={styles.timelineDesc}>{step.desc}</Text>
                </View>
                {idx < 3 && <View style={[styles.timelineLine, step.done && styles.timelineLineActive]} />}
              </View>
            ))}
          </View>

          {/* Driver Profile */}
          {(order.status === 'picked_up' || driverLoc) && (
            <View style={styles.driverCard}>
              <View style={styles.driverInfoRow}>
                <Image
                  source={{ uri: order.driver?.avatarUrl || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=150&auto=format&fit=crop' }}
                  style={styles.driverAvatar}
                />
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>{order.driver?.fullName || 'Driver'}</Text>
                  <View style={styles.driverMeta}>
                    <Text style={styles.driverVehicle}>{order.driver?.vehicle || 'Vehicle info unavailable'}</Text>
                    {order.driver?.avgRating != null && (
                      <View style={styles.driverRating}>
                        <Star color={DoorliColors.gold} size={12} fill={DoorliColors.gold} />
                        <Text style={styles.driverRatingText}>{Number(order.driver.avgRating).toFixed(1)}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => order.driver?.phone && Linking.openURL(`tel:${order.driver.phone}`)}
                >
                  <Phone color={PRIMARY} size={20} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Delivery Address */}
          {order.deliveryAddress && (
            <View style={styles.addressCard}>
              <MapPin color={DoorliColors.teal} size={18} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.addressLabel}>Delivering to</Text>
                <Text style={styles.addressText}>{order.deliveryAddress.addressLine}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
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
  title: { color: DoorliColors.text, fontSize: 18, fontWeight: '700' },
  map: { flex: 1, margin: 16, borderRadius: 16 },
  driverDot: { backgroundColor: PRIMARY, padding: 8, borderRadius: 20 },
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: DoorliColors.navyMid,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
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
  sheetTitle: { fontSize: 20, fontWeight: '800', color: DoorliColors.text },
  sheetSub: { marginTop: 4, color: DoorliColors.textDim, fontSize: 14, fontWeight: '500' },
  statusBadge: {
    backgroundColor: 'rgba(24,95,165,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: PRIMARY,
    fontWeight: '700',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', position: 'relative' },
  timelineIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineLine: {
    position: 'absolute',
    left: 17,
    top: 36,
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 1,
  },
  timelineLineActive: { backgroundColor: PRIMARY },
  timelineContent: { flex: 1, marginLeft: 14, paddingTop: 6 },
  timelineTitle: { fontSize: 15, fontWeight: '600', color: DoorliColors.textDim, marginBottom: 2 },
  timelineTitleActive: { color: DoorliColors.text, fontWeight: '700' },
  timelineDesc: { fontSize: 13, color: DoorliColors.textDim, lineHeight: 18 },
  driverCard: {
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  driverInfoRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.06)' },
  driverDetails: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: '700', color: DoorliColors.text },
  driverMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  driverVehicle: { fontSize: 13, color: DoorliColors.textDim },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(250,199,117,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  driverRatingText: { fontSize: 11, fontWeight: '700', color: DoorliColors.gold, marginLeft: 4 },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(24,95,165,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  addressLabel: { fontSize: 12, color: DoorliColors.textDim, fontWeight: '500', marginBottom: 2 },
  addressText: { fontSize: 14, color: DoorliColors.text, fontWeight: '600' },
});

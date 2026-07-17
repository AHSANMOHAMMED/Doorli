import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Stack, router } from 'expo-router';
import { getRideSocket, disconnectRideSocket } from '../../lib/socket';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';
import { MapPin, Navigation, Car } from 'lucide-react-native';
import * as Location from 'expo-location';

export default function RideBookingScreen() {
  const user = useAuthStore((s) => s.user);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [rideStatus, setRideStatus] = useState('Finding your driver...');
  const [rideId, setRideId] = useState<string | null>(null);
  const [driverInfo, setDriverInfo] = useState<{ name?: string; vehicle?: string } | null>(null);
  const [pickupLocation, setPickupLocation] = useState({ lat: 6.9271, lng: 79.8612 });
  const dropoffLocation = { lat: 6.8649, lng: 79.8997 };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setPickupLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        }
      }

      try {
        const res = await apiClient.post('/rides', {
          pickupLat: pickupLocation.lat,
          pickupLng: pickupLocation.lng,
          dropoffLat: dropoffLocation.lat,
          dropoffLng: dropoffLocation.lng,
        });

        const ride = res.data?.data ?? res.data;
        const id = ride?.id ?? ride?.rideId;
        if (id) setRideId(id);

        const socket = getRideSocket();
        socket.connect();
        if (id) socket.emit('subscribe_ride', id);

        socket.on('ride_assigned', (data: { rideId?: string; driverId?: string; driverName?: string; vehicleNumber?: string }) => {
          if (cancelled) return;
          setIsSearching(false);
          setRideStatus('Driver is on the way');
          setDriverInfo({ name: data.driverName, vehicle: data.vehicleNumber });
          if (data.driverId) {
            socket.emit('subscribe_driver', data.driverId);
          }
        });

        socket.on('driver_location_changed', (data: { lat: number; lng: number }) => {
          if (!cancelled) setDriverLocation({ lat: data.lat, lng: data.lng });
        });

        // Fallback: if no assignment within 15s, show nearby search state
        setTimeout(() => {
          if (!cancelled && isSearching) {
            setRideStatus('Still searching for nearby drivers...');
          }
        }, 15000);
      } catch (err) {
        if (!cancelled) {
          setIsSearching(false);
          setRideStatus('Could not create ride — try again');
          console.warn(err);
        }
      }
    })();

    return () => {
      cancelled = true;
      disconnectRideSocket();
    };
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Ride Details', headerBackTitle: 'Back' }} />

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: pickupLocation.lat,
            longitude: pickupLocation.lng,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
        >
          <Marker coordinate={{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }}>
            <View style={styles.markerContainer}>
              <MapPin size={24} color="#2563eb" />
            </View>
          </Marker>
          <Marker coordinate={{ latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }}>
            <View style={styles.markerContainer}>
              <Navigation size={24} color="#dc2626" />
            </View>
          </Marker>
          {driverLocation && (
            <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}>
              <View style={styles.driverMarker}>
                <Car size={20} color="#fff" />
              </View>
            </Marker>
          )}
          <Polyline
            coordinates={[
              { latitude: pickupLocation.lat, longitude: pickupLocation.lng },
              { latitude: dropoffLocation.lat, longitude: dropoffLocation.lng },
            ]}
            strokeColor="#3b82f6"
            strokeWidth={4}
          />
        </MapView>
      </View>

      <View style={styles.bottomSheet}>
        <Text style={styles.statusTitle}>{rideStatus}</Text>
        {rideId && <Text style={styles.rideId}>Ride {rideId.slice(0, 8)}</Text>}

        {isSearching ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : driverInfo ? (
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Car size={24} color="#6b7280" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{driverInfo.name ?? 'Your driver'}</Text>
              <Text style={styles.carInfo}>{driverInfo.vehicle ?? 'Vehicle assigned'}</Text>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => {
            Alert.alert('Cancel Ride', 'Are you sure?', [
              { text: 'No', style: 'cancel' },
              { text: 'Yes', style: 'destructive', onPress: () => router.back() },
            ]);
          }}
        >
          <Text style={styles.cancelBtnText}>Cancel Request</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mapContainer: { flex: 1 },
  map: { width: '100%', height: '100%' },
  markerContainer: { backgroundColor: '#fff', padding: 4, borderRadius: 20 },
  driverMarker: { backgroundColor: '#10b981', padding: 6, borderRadius: 20 },
  bottomSheet: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  rideId: { textAlign: 'center', color: '#6b7280', marginTop: 4, fontSize: 12 },
  driverInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 16 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  carInfo: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  cancelBtn: { marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: '#fee2e2', alignItems: 'center' },
  cancelBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 },
});

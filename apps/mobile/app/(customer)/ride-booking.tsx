import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getRideSocket, disconnectRideSocket } from '../../lib/socket';
import { apiClient } from '../../lib/axios';
import { MapPin, Car } from 'lucide-react-native';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RideBookingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ rideId?: string }>();
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [rideStatus, setRideStatus] = useState('Finding your driver...');
  const [rideId, setRideId] = useState<string | null>(params.rideId ?? null);
  const [driverInfo, setDriverInfo] = useState<{ name?: string; vehicle?: string } | null>(null);
  const [pickupLocation, setPickupLocation] = useState({ lat: 6.9271, lng: 79.8612 });
  const dropoffLocation = { lat: 6.8649, lng: 79.8997 };

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          if (!cancelled) {
            setPickupLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }
        }
      } catch {
        // keep default
      }

      try {
        let id = params.rideId ?? null;

        // Only create a new ride if none was passed from the Ride tab
        if (!id) {
          const res = await apiClient.post('/rides', {
            pickupLat: pickupLocation.lat,
            pickupLng: pickupLocation.lng,
            dropoffLat: dropoffLocation.lat,
            dropoffLng: dropoffLocation.lng,
          });
          const ride = res.data?.data ?? res.data;
          id = ride?.id ?? ride?.rideId ?? null;
        }

        if (id) setRideId(id);

        const socket = getRideSocket();
        socket.connect();
        if (id) socket.emit('subscribe_ride', id);

        socket.on(
          'ride_assigned',
          (data: {
            rideId?: string;
            driverId?: string;
            driverName?: string;
            vehicleNumber?: string;
          }) => {
            if (cancelled) return;
            setIsSearching(false);
            setRideStatus('Driver is on the way');
            setDriverInfo({ name: data.driverName, vehicle: data.vehicleNumber });
            if (data.driverId) socket.emit('subscribe_driver', data.driverId);
          },
        );

        socket.on('driver_location_changed', (data: { lat: number; lng: number }) => {
          if (!cancelled) setDriverLocation({ lat: data.lat, lng: data.lng });
        });

        setTimeout(() => {
          if (!cancelled) {
            setRideStatus((s) =>
              s.includes('Finding') ? 'Still searching for nearby drivers…' : s,
            );
          }
        }, 15000);
      } catch (err) {
        if (!cancelled) {
          setIsSearching(false);
          setRideStatus('Could not load ride — go back and try again');
          console.warn(err);
        }
      }
    })();

    return () => {
      cancelled = true;
      disconnectRideSocket();
    };
  }, [params.rideId]);

  return (
    <View style={styles.container}>
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
          <Marker
            coordinate={{ latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }}
          >
            <View style={styles.markerContainer}>
              <MapPin size={24} color="#5DCAA5" />
            </View>
          </Marker>
          {driverLocation && (
            <Marker
              coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            >
              <View style={styles.markerContainer}>
                <Car size={24} color="#FAC775" />
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.sheet}>
        {isSearching && <ActivityIndicator color="#5DCAA5" style={{ marginBottom: 12 }} />}
        <Text style={styles.status}>{rideStatus}</Text>
        {driverInfo && (
          <Text style={styles.driver}>
            {driverInfo.name ?? 'Driver'}
            {driverInfo.vehicle ? ` · ${driverInfo.vehicle}` : ''}
          </Text>
        )}
        {rideId && <Text style={styles.rideId}>Ride {rideId.slice(0, 8)}…</Text>}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Done</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07101f' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  markerContainer: {
    backgroundColor: 'rgba(7,16,31,0.9)',
    padding: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  sheet: {
    padding: 20,
    backgroundColor: 'rgba(7,16,31,0.96)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  status: { color: '#fff', fontSize: 18, fontWeight: '700' },
  driver: { color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  rideId: { color: 'rgba(255,255,255,0.4)', marginTop: 4, fontSize: 12 },
  backBtn: {
    marginTop: 16,
    backgroundColor: '#5DCAA5',
    borderRadius: 14,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontWeight: '800', color: '#07101f' },
});

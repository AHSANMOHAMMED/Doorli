import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
const MapView = ({ children, style }: any) => <View style={[style, { backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' }]}><Text style={{color: '#9ca3af', marginBottom: 10, fontWeight: '500'}}>Interactive Map (Dev Client Required)</Text><View style={{flexDirection:'row', gap: 20}}>{children}</View></View>;
const Marker = ({ children }: any) => <View>{children}</View>;
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
  const [rideStatus, setRideStatus] = useState('Finding a driver nearby...');
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
            setRideStatus('Your driver is on the way');
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
              s.includes('Finding') ? 'Still looking for nearby drivers...' : s,
            );
          }
        }, 15000);
      } catch (err) {
        if (!cancelled) {
          setIsSearching(false);
          setRideStatus('Could not load ride — please try again.');
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
              <MapPin size={24} color="#000" />
            </View>
          </Marker>
          <Marker
            coordinate={{ latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }}
          >
            <View style={styles.markerContainer}>
              <MapPin size={24} color="#6b7280" />
            </View>
          </Marker>
          {driverLocation && (
            <Marker
              coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}
            >
              <View style={[styles.markerContainer, { backgroundColor: '#000' }]}>
                <Car size={24} color="#fff" />
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      <View style={styles.sheetContainer}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          
          <View style={styles.statusRow}>
            {isSearching ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Car color="#000" size={24} />
            )}
            <View style={{ flex: 1, marginLeft: 16 }}>
              <Text style={styles.status}>{rideStatus}</Text>
              {rideId && <Text style={styles.rideId}>Booking #{rideId.slice(0, 8).toUpperCase()}</Text>}
            </View>
          </View>

          {driverInfo && (
            <View style={styles.driverCard}>
              <View style={styles.driverAvatar}>
                <Text style={styles.avatarText}>{driverInfo.name?.[0] ?? 'D'}</Text>
              </View>
              <View>
                <Text style={styles.driverName}>{driverInfo.name ?? 'Driver'}</Text>
                {driverInfo.vehicle && <Text style={styles.driverVehicle}>{driverInfo.vehicle}</Text>}
              </View>
            </View>
          )}
          
          <SafeAreaView edges={['bottom']}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backText}>Close</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  mapContainer: { flex: 1 },
  map: { flex: 1 },
  markerContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  sheet: {
    padding: 24,
    backgroundColor: '#ffffff',
  },
  sheetHandle: {
    width: 32,
    height: 4,
    backgroundColor: '#d1d5db',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  status: { color: '#000000', fontSize: 18, fontWeight: '600' },
  rideId: { color: '#6b7280', marginTop: 4, fontSize: 13, fontWeight: '500' },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#374151', fontSize: 18, fontWeight: '600' },
  driverName: { color: '#002b5b', fontSize: 16, fontWeight: '600' },
  driverVehicle: { color: '#6b7280', marginTop: 2, fontSize: 14, fontWeight: '400' },
  backBtn: {
    backgroundColor: '#00B241',
    borderRadius: 8,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { fontWeight: '700', color: '#ffffff', fontSize: 16 },
});

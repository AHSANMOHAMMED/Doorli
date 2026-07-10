import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Stack, router } from 'expo-router';
import { getRideSocket, disconnectRideSocket } from '../../../lib/socket';
import { MapPin, Navigation, Car } from 'lucide-react-native';

export default function RideBookingScreen() {
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSearching, setIsSearching] = useState(true);
  const [rideStatus, setRideStatus] = useState('Finding your driver...');

  // Mock pickup/dropoff points for demonstration
  const pickupLocation = { lat: 6.9271, lng: 79.8612 }; // Colombo
  const dropoffLocation = { lat: 6.8649, lng: 79.8997 }; // Nugegoda

  useEffect(() => {
    // Connect to Ride Hailing WebSocket
    const socket = getRideSocket();
    socket.connect();

    // After 3 seconds, mock finding a driver
    const timer = setTimeout(() => {
      setIsSearching(false);
      setRideStatus('Driver is on the way');
      setDriverLocation({ lat: 6.9100, lng: 79.8700 });
      
      // Simulate subscribing to driver location updates
      const MOCK_DRIVER_ID = "driver_123";
      socket.emit('subscribe_driver', MOCK_DRIVER_ID);
      
      socket.on('driver_location_changed', (data: any) => {
        if (data.driverId === MOCK_DRIVER_ID) {
          setDriverLocation({ lat: data.lat, lng: data.lng });
        }
      });
    }, 3000);

    return () => {
      clearTimeout(timer);
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
          {/* Pickup Marker */}
          <Marker coordinate={{ latitude: pickupLocation.lat, longitude: pickupLocation.lng }}>
            <View style={styles.markerContainer}>
              <MapPin size={24} color="#2563eb" />
            </View>
          </Marker>

          {/* Dropoff Marker */}
          <Marker coordinate={{ latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }}>
            <View style={styles.markerContainer}>
              <Navigation size={24} color="#dc2626" />
            </View>
          </Marker>

          {/* Driver Live Location Marker */}
          {driverLocation && (
            <Marker coordinate={{ latitude: driverLocation.lat, longitude: driverLocation.lng }}>
              <View style={styles.driverMarker}>
                <Car size={20} color="#fff" />
              </View>
            </Marker>
          )}

          {/* Polyline Route */}
          <Polyline
            coordinates={[
              { latitude: pickupLocation.lat, longitude: pickupLocation.lng },
              { latitude: dropoffLocation.lat, longitude: dropoffLocation.lng }
            ]}
            strokeColor="#3b82f6"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        </MapView>
      </View>

      <View style={styles.bottomSheet}>
        <Text style={styles.statusTitle}>{rideStatus}</Text>
        
        {isSearching ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Car size={24} color="#6b7280" />
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>Kamal Perera</Text>
              <Text style={styles.carInfo}>Toyota Prius (WP CAA-1234)</Text>
              <Text style={styles.rating}>⭐ 4.9</Text>
            </View>
          </View>
        )}

        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => {
            Alert.alert('Cancel Ride', 'Are you sure you want to cancel?');
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
  markerContainer: { backgroundColor: '#fff', padding: 4, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, elevation: 3 },
  driverMarker: { backgroundColor: '#10b981', padding: 6, borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, elevation: 4 },
  bottomSheet: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  driverInfo: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 16, backgroundColor: '#f3f4f6', borderRadius: 16 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  driverDetails: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  carInfo: { fontSize: 14, color: '#4b5563', marginTop: 2 },
  rating: { fontSize: 14, fontWeight: '500', color: '#f59e0b', marginTop: 4 },
  cancelBtn: { marginTop: 20, padding: 16, borderRadius: 12, backgroundColor: '#fee2e2', alignItems: 'center' },
  cancelBtnText: { color: '#dc2626', fontWeight: 'bold', fontSize: 16 }
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Power } from 'lucide-react-native';
import { getRideSocket, disconnectRideSocket } from '../../../lib/socket';
import * as Location from 'expo-location';

// Use a mock driver ID until we integrate the auth provider fully
const MOCK_DRIVER_ID = "driver_123";

export default function DriverHomeScreen() {
  const [isOnline, setIsOnline] = useState(false);
  const [locationSub, setLocationSub] = useState<Location.LocationSubscription | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (locationSub) {
        locationSub.remove();
      }
      disconnectRideSocket();
    };
  }, [locationSub]);

  const toggleOnline = async (value: boolean) => {
    if (value) {
      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location is required to receive rides.');
        return;
      }

      setIsOnline(true);
      
      const socket = getRideSocket();
      socket.connect();
      
      socket.on('connect', () => {
        console.log('Connected to Ride-Hailing Socket');
        socket.emit('join_driver', MOCK_DRIVER_ID);
      });

      // Listen for assigned rides
      socket.on(`ride_assigned_${MOCK_DRIVER_ID}`, (data) => {
        console.log('Ride assigned via socket:', data);
        Alert.alert("New Ride!", "You have been assigned a new ride.", [
          { text: "View Details", onPress: () => router.push('/driver/job-offer') }
        ]);
      });

      // Start tracking location
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          socket.emit('driver_location_update', {
            driverId: MOCK_DRIVER_ID,
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        }
      );
      setLocationSub(sub);

    } else {
      setIsOnline(false);
      
      if (locationSub) {
        locationSub.remove();
        setLocationSub(null);
      }

      const socket = getRideSocket();
      socket.off(`ride_assigned_${MOCK_DRIVER_ID}`);
      socket.disconnect();
      console.log('Disconnected from Ride-Hailing Socket');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Driver Dashboard' }} />
      
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>{isOnline ? "You're Online" : "You're Offline"}</Text>
          <Switch 
            value={isOnline} 
            onValueChange={toggleOnline} 
            trackColor={{ false: '#d1d5db', true: '#34d399' }}
            thumbColor={'#fff'}
          />
        </View>
        <Text style={styles.statusDesc}>
          {isOnline ? 'Searching for nearby ride requests...' : 'Go online to start receiving ride requests.'}
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Today's Earnings</Text>
          <Text style={styles.statValue}>LKR 2,450</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Completed Trips</Text>
          <Text style={styles.statValue}>4</Text>
        </View>
      </View>

      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Driver Live Map Here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  statusCard: { backgroundColor: '#fff', padding: 20, margin: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statusDesc: { color: '#6b7280', fontSize: 14 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  statLabel: { color: '#6b7280', fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  mapPlaceholder: { flex: 1, backgroundColor: '#e5e7eb', margin: 16, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#9ca3af', fontWeight: 'bold' }
});

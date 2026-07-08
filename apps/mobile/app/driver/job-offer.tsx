import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { MapPin, Navigation, Clock } from 'lucide-react-native';

export default function JobOfferScreen() {
  const acceptJob = async () => {
    try {
      // Mock accept job request
      await fetch('http://localhost:4000/api/v1/rides/accept-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: 'test-driver-id',
          rideId: 'mock-ride-id', // Would come from the websocket event payload
        })
      });
      Alert.alert('Job Accepted', 'Navigate to pickup location.');
      router.back();
    } catch (e) {
      Alert.alert('Error', 'Failed to accept job');
    }
  };

  const declineJob = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ presentation: 'modal', title: 'New Ride Request' }} />
      
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Route Preview Map</Text>
      </View>

      <View style={styles.detailsCard}>
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareValue}>LKR 1,250</Text>
        </View>

        <View style={styles.premiumBadge}>
          <Text style={styles.premiumText}>Includes +LKR 250 Return Premium</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationRow}>
          <MapPin color="#EF4444" size={20} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Pickup</Text>
            <Text style={styles.locationDesc}>Colombo 03 (3 mins away)</Text>
          </View>
        </View>
        
        <View style={styles.locationRow}>
          <Navigation color="#3B82F6" size={20} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Dropoff</Text>
            <Text style={styles.locationDesc}>Nugegoda (12 km trip)</Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.button, styles.declineBtn]} onPress={declineJob}>
            <Text style={styles.declineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.acceptBtn]} onPress={acceptJob}>
            <Text style={styles.acceptText}>Accept Job</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  mapPlaceholder: { flex: 1, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#9ca3af', fontWeight: 'bold' },
  detailsCard: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  fareContainer: { alignItems: 'center', marginBottom: 12 },
  fareLabel: { color: '#6b7280', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  fareValue: { fontSize: 32, fontWeight: '900', color: '#111827', marginVertical: 4 },
  premiumBadge: { backgroundColor: '#FEF3C7', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  premiumText: { color: '#D97706', fontWeight: 'bold', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationTextContainer: { marginLeft: 16 },
  locationTitle: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  locationDesc: { fontSize: 16, color: '#111827', fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 16, marginTop: 20 },
  button: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center' },
  declineBtn: { backgroundColor: '#f3f4f6' },
  acceptBtn: { backgroundColor: '#10B981' },
  declineText: { color: '#374151', fontSize: 16, fontWeight: 'bold' },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

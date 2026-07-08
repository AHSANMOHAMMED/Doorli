import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { MapPin, Navigation, Car } from 'lucide-react-native';

export default function RideBookingScreen() {
  const [loading, setLoading] = useState(false);
  const [fareEstimate, setFareEstimate] = useState<any>(null);

  const calculateFare = async () => {
    setLoading(true);
    try {
      // Mock request to our new Ride Hailing API via the API Gateway
      const res = await fetch('http://localhost:4000/api/v1/rides/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseFare: 100,
          pickupZoneDemand: 5, // High demand zone
          dropoffZoneDemand: 1, // Low demand zone (causes a premium)
          distanceKm: 12
        })
      });
      const data = await res.json();
      setFareEstimate(data);
    } catch (e) {
      Alert.alert('Error', 'Failed to calculate fare');
    } finally {
      setLoading(false);
    }
  };

  const bookRide = async () => {
    setLoading(true);
    try {
      await fetch('http://localhost:4000/api/v1/rides/request-ride', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'test-customer-id', // Replace with real auth user
          pickupLat: 6.9271,
          pickupLng: 79.8612,
          dropoffLat: 6.8654,
          dropoffLng: 79.8973,
          distanceKm: 12,
          baseFare: 100
        })
      });
      Alert.alert('Success', 'Searching for a nearby driver...');
    } catch (e) {
      Alert.alert('Error', 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Book a Ride' }} />
      
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Interactive Map Here</Text>
      </View>

      <View style={styles.bookingCard}>
        <View style={styles.locationInput}>
          <MapPin color="#EF4444" size={20} />
          <Text style={styles.locationText}>Current Location (Colombo 03)</Text>
        </View>
        
        <View style={styles.locationInput}>
          <Navigation color="#3B82F6" size={20} />
          <Text style={styles.locationText}>Destination (Nugegoda)</Text>
        </View>

        {!fareEstimate ? (
          <TouchableOpacity style={styles.button} onPress={calculateFare}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Get Fare Estimate</Text>}
          </TouchableOpacity>
        ) : (
          <View style={styles.estimateContainer}>
            <Text style={styles.fareTitle}>Calculated Fare</Text>
            <View style={styles.fareRow}>
              <Text>Base Fare</Text>
              <Text>LKR 100</Text>
            </View>
            {fareEstimate.returnPremium > 0 && (
              <View style={styles.fareRow}>
                <Text style={styles.premiumText}>Geographic Return Premium (To low-demand zone)</Text>
                <Text style={styles.premiumText}>+ LKR {fareEstimate.returnPremium}</Text>
              </View>
            )}
            <View style={[styles.fareRow, styles.totalRow]}>
              <Text style={styles.totalText}>Total Fare</Text>
              <Text style={styles.totalText}>LKR {fareEstimate.fare}</Text>
            </View>
            
            <TouchableOpacity style={[styles.button, { marginTop: 20 }]} onPress={bookRide}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirm Ride</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  mapPlaceholder: { flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' },
  mapText: { color: '#9ca3af', fontWeight: 'bold' },
  bookingCard: { 
    backgroundColor: '#ffffff', 
    padding: 24, 
    borderTopLeftRadius: 32, 
    borderTopRightRadius: 32, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 16, 
    elevation: 8,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  locationInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', padding: 18, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#f3f4f6' },
  locationText: { marginLeft: 16, fontSize: 16, color: '#374151', fontWeight: '500' },
  button: { backgroundColor: '#000000', padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  estimateContainer: { marginTop: 16 },
  fareTitle: { fontSize: 22, fontWeight: '800', marginBottom: 16, color: '#111827' },
  fareRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  premiumText: { color: '#d97706', fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 16, marginTop: 8 },
  totalText: { fontSize: 20, fontWeight: '800', color: '#111827' }
});

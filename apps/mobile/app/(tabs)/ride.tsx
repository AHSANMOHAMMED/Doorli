import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';
import * as Location from 'expo-location';

export default function RideTabScreen() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [fareEstimate, setFareEstimate] = useState<{
    totalFare?: number;
    baseFare?: number;
    returnPremium?: number;
  } | null>(null);

  const calculateFare = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/rides/estimate', {
        baseFare: 100,
        pickupZoneDemand: 5,
        dropoffZoneDemand: 1,
        distanceKm: 12,
      });
      setFareEstimate(res.data?.data ?? res.data);
    } catch {
      Alert.alert('Error', 'Failed to calculate fare');
    } finally {
      setLoading(false);
    }
  };

  const bookRide = async () => {
    if (!user) {
      Alert.alert('Sign in', 'Please log in to book a ride');
      return;
    }
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let pickupLat = 6.9271;
      let pickupLng = 79.8612;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        pickupLat = loc.coords.latitude;
        pickupLng = loc.coords.longitude;
      }

      await apiClient.post('/rides', {
        customerId: user.id,
        pickupLat,
        pickupLng,
        dropoffLat: 6.8654,
        dropoffLng: 79.8973,
        distanceKm: 12,
        baseFare: 100,
      });
      router.push('/(customer)/ride-booking');
    } catch {
      Alert.alert('Error', 'Failed to request ride');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Book a Ride' }} />
      <Text style={styles.title}>Where to?</Text>
      <Text style={styles.sub}>Get a fare estimate, then request a nearby driver.</Text>

      <TouchableOpacity style={styles.btn} onPress={calculateFare} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Estimate fare</Text>}
      </TouchableOpacity>

      {fareEstimate && (
        <View style={styles.card}>
          <Text style={styles.fare}>LKR {Number(fareEstimate.totalFare ?? 0).toFixed(0)}</Text>
          <Text style={styles.meta}>
            Base {fareEstimate.baseFare} · Premium {fareEstimate.returnPremium ?? 0}
          </Text>
          <TouchableOpacity style={[styles.btn, styles.book]} onPress={bookRide} disabled={loading}>
            <Text style={styles.btnText}>Request ride</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#64748b', marginTop: 8, marginBottom: 24 },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center' },
  book: { marginTop: 16, backgroundColor: '#059669' },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: { marginTop: 24, backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  fare: { fontSize: 32, fontWeight: '900', color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4 },
});

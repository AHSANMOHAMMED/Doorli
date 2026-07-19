import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MapPin, Navigation } from 'lucide-react-native';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';

export default function JobOfferScreen() {
  const user = useAuthStore((s) => s.user);
  const { payload } = useLocalSearchParams<{ payload?: string }>();

  const offer = useMemo(() => {
    try {
      return payload ? JSON.parse(payload) : null;
    } catch {
      return null;
    }
  }, [payload]);

  const fare = offer?.totalFare ?? offer?.fare ?? offer?.estimatedEarnings ?? '—';
  const pickup = offer?.pickupAddress ?? offer?.pickup ?? 'Pickup location';
  const dropoff = offer?.dropoffAddress ?? offer?.dropoff ?? 'Dropoff location';
  const rideId = offer?.rideId ?? offer?.id ?? offer?.orderId;
  const orderId = offer?.orderId;

  const acceptJob = async () => {
    try {
      if (orderId) {
        await apiClient.patch(`/drivers/accept-delivery/${orderId}`);
        Alert.alert('Job Accepted', 'Navigate to pickup location.');
        router.replace(`/(driver)/navigate/${orderId}`);
        return;
      }
      if (rideId) {
        await apiClient.post('/rides/accept-ride', {
          rideId,
          driverId: user?.id,
        });
        Alert.alert('Job Accepted', 'Navigate to pickup location.');
        router.back();
        return;
      }
      Alert.alert('Error', 'Missing job id');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to accept job');
    }
  };

  const declineJob = async () => {
    try {
      if (orderId) {
        await apiClient.patch(`/drivers/decline-delivery/${orderId}`);
      }
      router.back();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to decline');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ presentation: 'modal', title: 'New Job Request' }} />

      <View style={styles.detailsCard}>
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Estimated Earnings</Text>
          <Text style={styles.fareValue}>{typeof fare === 'number' ? `LKR ${fare}` : String(fare)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.locationRow}>
          <MapPin color="#EF4444" size={20} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Pickup</Text>
            <Text style={styles.locationDesc}>{String(pickup)}</Text>
          </View>
        </View>

        <View style={styles.locationRow}>
          <Navigation color="#3B82F6" size={20} />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationTitle}>Dropoff</Text>
            <Text style={styles.locationDesc}>{String(dropoff)}</Text>
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
  container: { flex: 1, backgroundColor: '#111827', justifyContent: 'flex-end' },
  detailsCard: { backgroundColor: '#fff', padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  fareContainer: { alignItems: 'center', marginBottom: 12 },
  fareLabel: { color: '#6b7280', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  fareValue: { fontSize: 32, fontWeight: '900', color: '#111827', marginVertical: 4 },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginVertical: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locationTextContainer: { marginLeft: 16, flex: 1 },
  locationTitle: { fontSize: 14, color: '#6b7280', fontWeight: '500' },
  locationDesc: { fontSize: 16, color: '#111827', fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 16, marginTop: 20 },
  button: { flex: 1, padding: 18, borderRadius: 12, alignItems: 'center' },
  declineBtn: { backgroundColor: '#f3f4f6' },
  acceptBtn: { backgroundColor: '#10B981' },
  declineText: { color: '#374151', fontSize: 16, fontWeight: 'bold' },
  acceptText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

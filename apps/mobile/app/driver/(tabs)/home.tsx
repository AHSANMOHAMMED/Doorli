import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { getRideSocket, getSocket, joinSocketRooms, disconnectRideSocket } from '../../../lib/socket';
import { useAuthStore } from '../../../store/auth';
import { apiClient } from '../../../lib/axios';
import * as Location from 'expo-location';

export default function DriverHomeScreen() {
  const user = useAuthStore((s) => s.user);
  const [isOnline, setIsOnline] = useState(false);
  const [locationSub, setLocationSub] = useState<Location.LocationSubscription | null>(null);
  const [earnings, setEarnings] = useState({ earningsToday: 0, totalDeliveries: 0 });
  const [driverId, setDriverId] = useState<string | null>(null);
  const [pendingOffer, setPendingOffer] = useState<Record<string, unknown> | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, earningsRes] = await Promise.all([
        apiClient.get('/drivers/me'),
        apiClient.get('/drivers/me/earnings'),
      ]);
      if (profileRes.data?.success) {
        setDriverId(profileRes.data.data.id);
        setIsOnline(!!profileRes.data.data.isOnline);
      }
      if (earningsRes.data?.success) {
        setEarnings(earningsRes.data.data);
      }
    } catch (err) {
      console.warn('Failed to load driver profile', err);
    }
  }, []);

  useEffect(() => {
    loadProfile();
    return () => {
      locationSub?.remove();
      disconnectRideSocket();
    };
  }, []);

  const toggleOnline = async (value: boolean) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please log in as a driver first.');
      return;
    }

    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location is required to receive jobs.');
        return;
      }

      try {
        await apiClient.patch('/drivers/me/online', { isOnline: true });
      } catch (err) {
        Alert.alert('Error', 'Could not go online');
        return;
      }

      setIsOnline(true);

      const apiSocket = getSocket();
      joinSocketRooms([`driver:${user.id}`]);
      apiSocket.on('driver:new_job', (payload: Record<string, unknown>) => {
        setPendingOffer(payload);
        Alert.alert('New delivery job', 'You have a new delivery offer.', [
          { text: 'View', onPress: () => router.push({ pathname: '/driver/job-offer', params: { payload: JSON.stringify(payload) } }) },
        ]);
      });

      const rideSocket = getRideSocket();
      rideSocket.connect();
      const id = driverId || user.id;
      rideSocket.emit('join_driver', id);
      rideSocket.on(`ride_assigned_${id}`, (data: Record<string, unknown>) => {
        setPendingOffer(data);
        router.push({ pathname: '/driver/job-offer', params: { payload: JSON.stringify(data) } });
      });

      const sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, distanceInterval: 10 },
        async (location) => {
          const lat = location.coords.latitude;
          const lng = location.coords.longitude;
          rideSocket.emit('driver_location_update', { driverId: id, lat, lng });
          try {
            await apiClient.patch('/drivers/me/location', { latitude: lat, longitude: lng });
          } catch {
            // non-fatal
          }
        },
      );
      setLocationSub(sub);
    } else {
      setIsOnline(false);
      locationSub?.remove();
      setLocationSub(null);
      try {
        await apiClient.patch('/drivers/me/online', { isOnline: false });
      } catch {
        // ignore
      }
      const rideSocket = getRideSocket();
      rideSocket.disconnect();
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
          {isOnline ? 'Searching for nearby delivery & ride requests...' : 'Go online to start receiving jobs.'}
        </Text>
        {user && <Text style={styles.userLine}>{user.fullName}</Text>}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Today's Earnings</Text>
          <Text style={styles.statValue}>LKR {Number(earnings.earningsToday).toFixed(0)}</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Completed Trips</Text>
          <Text style={styles.statValue}>{earnings.totalDeliveries}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.jobsBtn} onPress={() => router.push('/(driver)/jobs')}>
        <Text style={styles.jobsBtnText}>View active deliveries</Text>
      </TouchableOpacity>

      {pendingOffer && (
        <View style={styles.offerBanner}>
          <Text style={styles.offerText}>Pending job offer</Text>
          <TouchableOpacity onPress={() => router.push({ pathname: '/driver/job-offer', params: { payload: JSON.stringify(pendingOffer) } })}>
            <Text style={styles.offerLink}>Open</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  statusCard: { backgroundColor: '#fff', padding: 20, margin: 16, borderRadius: 16 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  statusDesc: { color: '#6b7280', fontSize: 14 },
  userLine: { marginTop: 8, color: '#374151', fontWeight: '600' },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  statLabel: { color: '#6b7280', fontSize: 12, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  jobsBtn: { margin: 16, backgroundColor: '#00B241', padding: 16, borderRadius: 12, alignItems: 'center' },
  jobsBtnText: { color: '#fff', fontWeight: '700' },
  offerBanner: { marginHorizontal: 16, padding: 12, backgroundColor: '#ecfdf5', borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between' },
  offerText: { color: '#065f46', fontWeight: '600' },
  offerLink: { color: '#059669', fontWeight: '700' },
});

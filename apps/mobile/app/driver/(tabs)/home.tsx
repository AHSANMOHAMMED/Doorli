import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { Power } from 'lucide-react-native';

export default function DriverHomeScreen() {
  const [isOnline, setIsOnline] = useState(false);

  const toggleOnline = (value: boolean) => {
    setIsOnline(value);
    if (value) {
      // In real implementation, would emit 'join_driver' over socket
      console.log('Driver went online');
      // Simulate receiving a job offer after 3 seconds
      setTimeout(() => {
        router.push('/driver/job-offer');
      }, 3000);
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

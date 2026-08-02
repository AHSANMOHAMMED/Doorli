import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/auth';
import { apiClient } from '../../lib/axios';

export default function DriverProfile() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: async () => {
      const res = await apiClient.get('/drivers/me/profile');
      return res.data?.data ?? null;
    },
    enabled: !!user,
  });

  const { data: vehicle } = useQuery({
    queryKey: ['driver-vehicle'],
    queryFn: async () => {
      const res = await apiClient.get('/drivers/me/vehicle');
      return res.data?.data ?? null;
    },
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/drivers/me/stats');
      return res.data?.data ?? {
        totalDeliveries: 0,
        avgRating: 0,
        acceptanceRate: 0,
        onTimeRate: 0,
      };
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/users/me', { fullName });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      setEditing(false);
      Alert.alert('Updated', 'Profile updated successfully');
    },
    onError: () => Alert.alert('Error', 'Failed to update profile'),
  });

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.fullName ?? 'D')[0].toUpperCase()}
            </Text>
          </View>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#64748b"
            />
          ) : (
            <Text style={styles.name}>{user?.fullName ?? 'Driver'}</Text>
          )}
          <Text style={styles.phone}>{user?.phone ?? ''}</Text>
        </View>

        {editing ? (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              <Text style={styles.saveBtnText}>
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        )}

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.totalDeliveries ?? 0}</Text>
            <Text style={styles.statLabel}>Deliveries</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{(stats?.avgRating ?? 0).toFixed(1)} ⭐</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.acceptanceRate ?? 0}%</Text>
            <Text style={styles.statLabel}>Acceptance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats?.onTimeRate ?? 0}%</Text>
            <Text style={styles.statLabel}>On-Time</Text>
          </View>
        </View>

        {vehicle && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vehicle Details</Text>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Type</Text>
              <Text style={styles.cardValue}>{vehicle.type ?? 'N/A'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Plate</Text>
              <Text style={styles.cardValue}>{vehicle.plateNumber ?? 'N/A'}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Color</Text>
              <Text style={styles.cardValue}>{vehicle.color ?? 'N/A'}</Text>
            </View>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Documents</Text>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>License</Text>
            <View style={[styles.badge, profile?.licenseVerified ? styles.badgeGreen : styles.badgeYellow]}>
              <Text style={styles.badgeText}>
                {profile?.licenseVerified ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Insurance</Text>
            <View style={[styles.badge, profile?.insuranceVerified ? styles.badgeGreen : styles.badgeYellow]}>
              <Text style={styles.badgeText}>
                {profile?.insuranceVerified ? 'Verified' : 'Pending'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  avatarSection: { alignItems: 'center', marginTop: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#166534',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#f8fafc', marginTop: 12 },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#00B241',
    paddingBottom: 4,
    textAlign: 'center',
    minWidth: 200,
  },
  phone: { fontSize: 14, color: '#64748b', marginTop: 4 },
  editActions: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16 },
  saveBtn: { backgroundColor: '#00B241', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  cancelBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  cancelBtnText: { color: '#94a3b8', fontWeight: '600' },
  editBtn: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#00B241',
  },
  editBtnText: { color: '#86efac', fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  statBox: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 20, fontWeight: '800', color: '#f8fafc' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, fontWeight: '600', textTransform: 'uppercase' },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#f8fafc', marginBottom: 10 },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  cardLabel: { fontSize: 14, color: '#94a3b8' },
  cardValue: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeGreen: { backgroundColor: '#064e3b' },
  badgeYellow: { backgroundColor: '#713f12' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#fbbf24' },
  signOutBtn: {
    marginTop: 24,
    backgroundColor: '#991b1b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  signOutText: { color: '#fff', fontWeight: '700' },
});

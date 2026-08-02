import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';

interface PlatformConfig {
  platformName: string;
  defaultCity: string;
  defaultRadius: number;
  minOrderAmount: number;
  maxDeliveryFee: number;
  driverCommissionRate: number;
  vendorCommissionRate: number;
  maintenanceMode: boolean;
  newOrdersEnabled: boolean;
  newDriversEnabled: boolean;
  newVendorsEnabled: boolean;
}

interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

export default function SuperAdminSettings() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const { data: config, isLoading } = useQuery({
    queryKey: ['super-admin-config'],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/settings');
      return res.data?.data as PlatformConfig;
    },
    enabled: !!user,
  });

  const { data: admins } = useQuery({
    queryKey: ['super-admin-admins'],
    queryFn: async () => {
      const res = await apiClient.get('/super-admin/admins');
      return (res.data?.data?.items ?? []) as AdminUser[];
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<PlatformConfig>) => {
      await apiClient.patch('/super-admin/settings', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-config'] });
      Alert.alert('Done', 'Settings updated');
    },
    onError: () => Alert.alert('Error', 'Failed to update settings'),
  });

  const addAdminMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiClient.post('/super-admin/admins', { email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-admins'] });
      setNewAdminEmail('');
      Alert.alert('Done', 'Admin added');
    },
    onError: () => Alert.alert('Error', 'Failed to add admin'),
  });

  const removeAdminMutation = useMutation({
    mutationFn: async (adminId: string) => {
      await apiClient.delete(`/super-admin/admins/${adminId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['super-admin-admins'] });
      Alert.alert('Done', 'Admin removed');
    },
    onError: () => Alert.alert('Error', 'Failed to remove admin'),
  });

  if (isLoading || !config) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#f59e0b" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const toggleSetting = (key: keyof PlatformConfig) => {
    updateMutation.mutate({ [key]: !config[key] });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Platform Configuration</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Platform Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform Name</Text>
            <Text style={styles.infoValue}>{config.platformName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Default City</Text>
            <Text style={styles.infoValue}>{config.defaultCity}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Default Radius</Text>
            <Text style={styles.infoValue}>{config.defaultRadius} km</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Commission Rates</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Driver Commission</Text>
            <Text style={styles.infoValue}>{config.driverCommissionRate}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vendor Commission</Text>
            <Text style={styles.infoValue}>{config.vendorCommissionRate}%</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feature Flags</Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Maintenance Mode</Text>
              <Text style={styles.settingDesc}>Disable entire platform</Text>
            </View>
            <Switch
              value={config.maintenanceMode}
              onValueChange={() => toggleSetting('maintenanceMode')}
              trackColor={{ false: '#334155', true: '#dc2626' }}
              thumbColor={config.maintenanceMode ? '#fff' : '#94a3b8'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>New Orders</Text>
            </View>
            <Switch
              value={config.newOrdersEnabled}
              onValueChange={() => toggleSetting('newOrdersEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={config.newOrdersEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>New Driver Registrations</Text>
            </View>
            <Switch
              value={config.newDriversEnabled}
              onValueChange={() => toggleSetting('newDriversEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={config.newDriversEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>New Vendor Registrations</Text>
            </View>
            <Switch
              value={config.newVendorsEnabled}
              onValueChange={() => toggleSetting('newVendorsEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={config.newVendorsEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Management</Text>
          <View style={styles.addAdminRow}>
            <TextInput
              style={styles.adminInput}
              placeholder="Add admin by email..."
              placeholderTextColor="#64748b"
              value={newAdminEmail}
              onChangeText={setNewAdminEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                if (!newAdminEmail.includes('@')) {
                  Alert.alert('Error', 'Enter a valid email');
                  return;
                }
                addAdminMutation.mutate(newAdminEmail);
              }}
            >
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {admins?.map((admin) => (
            <View key={admin.id} style={styles.adminCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.adminName}>{admin.fullName}</Text>
                <Text style={styles.adminEmail}>{admin.email}</Text>
              </View>
              {admin.id !== user?.id && (
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() =>
                    Alert.alert('Remove Admin', `Remove ${admin.fullName}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => removeAdminMutation.mutate(admin.id) },
                    ])
                  }
                >
                  <Text style={styles.removeBtnText}>Remove</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  section: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontSize: 14, color: '#94a3b8' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  settingDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  addAdminRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  adminInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 16, borderRadius: 10, justifyContent: 'center' },
  addBtnText: { color: '#0f172a', fontWeight: '700' },
  adminCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  adminName: { fontSize: 14, fontWeight: '600', color: '#f8fafc' },
  adminEmail: { fontSize: 12, color: '#64748b', marginTop: 2 },
  removeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#991b1b' },
  removeBtnText: { fontSize: 11, color: '#fca5a5', fontWeight: '600' },
});

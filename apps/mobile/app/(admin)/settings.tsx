import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { useAuthStore } from '../../store/auth';

interface PlatformSettings {
  maintenanceMode: boolean;
  newOrdersEnabled: boolean;
  newDriversEnabled: boolean;
  newVendorsEnabled: boolean;
  codEnabled: boolean;
  cardPaymentsEnabled: boolean;
  pushNotificationsEnabled: boolean;
}

export default function AdminSettings() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/settings');
      return res.data?.data as PlatformSettings;
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<PlatformSettings>) => {
      await apiClient.patch('/admin/settings', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: () => Alert.alert('Error', 'Failed to update settings'),
  });

  if (isLoading || !settings) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  const toggleSetting = (key: keyof PlatformSettings) => {
    updateMutation.mutate({ [key]: !settings[key] });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Platform Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Maintenance Mode</Text>
              <Text style={styles.settingDesc}>Disable the app for all users</Text>
            </View>
            <Switch
              value={settings.maintenanceMode}
              onValueChange={() => toggleSetting('maintenanceMode')}
              trackColor={{ false: '#334155', true: '#dc2626' }}
              thumbColor={settings.maintenanceMode ? '#fff' : '#94a3b8'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Enable push notifications</Text>
            </View>
            <Switch
              value={settings.pushNotificationsEnabled}
              onValueChange={() => toggleSetting('pushNotificationsEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={settings.pushNotificationsEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders & Payments</Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>New Orders</Text>
              <Text style={styles.settingDesc}>Allow customers to place orders</Text>
            </View>
            <Switch
              value={settings.newOrdersEnabled}
              onValueChange={() => toggleSetting('newOrdersEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={settings.newOrdersEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Cash on Delivery</Text>
              <Text style={styles.settingDesc}>Allow COD payment method</Text>
            </View>
            <Switch
              value={settings.codEnabled}
              onValueChange={() => toggleSetting('codEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={settings.codEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Card Payments</Text>
              <Text style={styles.settingDesc}>Allow card payment method</Text>
            </View>
            <Switch
              value={settings.cardPaymentsEnabled}
              onValueChange={() => toggleSetting('cardPaymentsEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={settings.cardPaymentsEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Registrations</Text>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>New Driver Registrations</Text>
              <Text style={styles.settingDesc}>Allow new drivers to sign up</Text>
            </View>
            <Switch
              value={settings.newDriversEnabled}
              onValueChange={() => toggleSetting('newDriversEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={settings.newDriversEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>New Vendor Registrations</Text>
              <Text style={styles.settingDesc}>Allow new vendors to sign up</Text>
            </View>
            <Switch
              value={settings.newVendorsEnabled}
              onValueChange={() => toggleSetting('newVendorsEnabled')}
              trackColor={{ false: '#334155', true: '#166534' }}
              thumbColor={settings.newVendorsEnabled ? '#fff' : '#94a3b8'}
            />
          </View>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Changes take effect immediately. Contact super admin for platform-wide configuration.
          </Text>
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
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  settingLabel: { fontSize: 15, fontWeight: '600', color: '#f8fafc' },
  settingDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#334155', marginVertical: 4 },
  infoCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 14, marginTop: 16 },
  infoText: { fontSize: 13, color: '#94a3b8', lineHeight: 20 },
});

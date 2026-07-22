import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Bell, Moon, Globe, Shield, Trash2, ChevronRight } from 'lucide-react-native';

const PRIMARY = '#00B241';
const ON_SURFACE = '#002b5b';

export default function SettingsScreen() {
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
          <ArrowLeft color={ON_SURFACE} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <Bell color={PRIMARY} size={20} />
            </View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}
              thumbColor={pushEnabled ? PRIMARY : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <Moon color={PRIMARY} size={20} />
            </View>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Switch
              value={darkModeEnabled}
              onValueChange={setDarkModeEnabled}
              trackColor={{ false: '#d1d5db', true: '#bbf7d0' }}
              thumbColor={darkModeEnabled ? PRIMARY : '#f3f4f6'}
            />
          </View>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <Globe color={PRIMARY} size={20} />
            </View>
            <Text style={styles.settingLabel}>Language</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.settingValue}>English</Text>
              <ChevronRight color="#9ca3af" size={20} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Privacy & Security</Text>
        
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <Shield color={PRIMARY} size={20} />
            </View>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <ChevronRight color="#9ca3af" size={20} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
        
        <View style={[styles.settingsCard, { borderColor: '#fee2e2' }]}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={[styles.settingIconWrapper, { backgroundColor: '#fee2e2' }]}>
              <Trash2 color="#ef4444" size={20} />
            </View>
            <Text style={[styles.settingLabel, { color: '#ef4444' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.versionText}>App Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
    paddingLeft: 4,
  },
  settingsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 178, 65, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: ON_SURFACE,
  },
  settingValue: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 48,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 32,
    marginBottom: 16,
  },
});

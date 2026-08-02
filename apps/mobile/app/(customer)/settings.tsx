import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Bell, Moon, Globe, Shield, Trash2, ChevronRight, LogOut, Info } from 'lucide-react-native';
import { DoorliColors } from '../../constants/colors';
import { useAuthStore } from '../../store/auth';
import { useI18nStore } from '../../lib/i18n';
import React from 'react';

const PRIMARY = DoorliColors.primary;

export default function SettingsScreen() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);
  const { language, setLanguage } = useI18nStore();
  const [pushEnabled, setPushEnabled] = useState(true);

  function handleLanguageChange() {
    Alert.alert('Language', 'Choose your preferred language', [
      { text: 'English', onPress: () => setLanguage('en') },
      { text: 'Sinhala', onPress: () => setLanguage('si') },
      { text: 'Tamil', onPress: () => setLanguage('ta') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleSignOut() {
    Alert.alert('Sign out?', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)');
        },
      },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Delete account?',
      'This action is permanent and cannot be undone. All your data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ],
    );
  }

  const languageLabel = language === 'en' ? 'English' : language === 'si' ? 'Sinhala' : 'Tamil';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={DoorliColors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        {user && (
          <View style={styles.userCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.fullName?.charAt(0) || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userEmail}>{user.email || user.phone}</Text>
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <Bell color={PRIMARY} size={18} />
            </View>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(24,95,165,0.4)' }}
              thumbColor={pushEnabled ? PRIMARY : DoorliColors.textDim}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleLanguageChange}>
            <View style={styles.settingIconWrapper}>
              <Globe color={DoorliColors.teal} size={18} />
            </View>
            <Text style={styles.settingLabel}>Language</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>{languageLabel}</Text>
              <ChevronRight color={DoorliColors.textDim} size={18} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Privacy & Security</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <Shield color={DoorliColors.gold} size={18} />
            </View>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
            <ChevronRight color={DoorliColors.textDim} size={18} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIconWrapper}>
              <Info color={DoorliColors.sky} size={18} />
            </View>
            <Text style={styles.settingLabel}>About Doorli</Text>
            <View style={styles.settingRight}>
              <Text style={styles.settingValue}>v1.0.0</Text>
              <ChevronRight color={DoorliColors.textDim} size={18} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>

        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} onPress={handleSignOut}>
            <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(242,102,139,0.12)' }]}>
              <LogOut color={DoorliColors.danger} size={18} />
            </View>
            <Text style={[styles.settingLabel, { color: DoorliColors.danger }]}>Sign Out</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount}>
            <View style={[styles.settingIconWrapper, { backgroundColor: 'rgba(242,102,139,0.12)' }]}>
              <Trash2 color={DoorliColors.danger} size={18} />
            </View>
            <Text style={[styles.settingLabel, { color: DoorliColors.danger }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.versionText}>Doorli v1.0.0 · Built with ❤️</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  content: { padding: 16, paddingBottom: 40 },

  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 20,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  userName: { fontSize: 16, fontWeight: '700', color: DoorliColors.text },
  userEmail: { fontSize: 13, color: DoorliColors.textDim, marginTop: 2 },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: DoorliColors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 8,
    paddingLeft: 4,
  },
  settingsCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: DoorliColors.text,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 13,
    color: DoorliColors.textDim,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginLeft: 48,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: DoorliColors.textDim,
    marginTop: 24,
    marginBottom: 16,
  },
});

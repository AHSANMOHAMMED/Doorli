import { useEffect, useState } from 'react';
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/auth';
import { GlassCard } from '../../components/GlassCard';
import { fetchLoyalty, fetchCities, fetchProfile, type CityZone } from '../../lib/api';
import {
  User,
  MapPin,
  Bell,
  PartyPopper,
  Gift,
  RefreshCw,
  CalendarDays,
  LogOut,
  ChevronRight,
  Package,
} from 'lucide-react-native';

const CITY_KEY = 'doorli_city';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, isAuthenticated } = useAuthStore();
  const [city, setCity] = useState('Colombo');

  const { data: loyalty } = useQuery({
    queryKey: ['loyalty'],
    queryFn: fetchLoyalty,
    enabled: isAuthenticated,
  });

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    AsyncStorage.getItem(CITY_KEY).then((v) => {
      if (v) setCity(v);
    });
  }, []);

  async function pickCity(next: string) {
    setCity(next);
    await AsyncStorage.setItem(CITY_KEY, next);
  }

  async function handleLogout() {
    await signOut();
    router.replace('/(auth)/login');
  }

  const cityOptions: string[] = cities?.length
    ? cities.map((c: CityZone) => c.city || c.name)
    : ['Colombo', 'Kandy', 'Galle', 'Jaffna'];

  const links = [
    { label: 'My orders', href: '/(customer)/orders', icon: Package },
    { label: 'Bookings', href: '/(customer)/bookings', icon: CalendarDays },
    { label: 'Saved addresses', href: '/(customer)/addresses', icon: MapPin },
    { label: 'Event planning', href: '/(customer)/events', icon: PartyPopper },
    { label: 'Loyalty points', href: '/(customer)/loyalty', icon: Gift },
    { label: 'Subscriptions', href: '/(customer)/subscriptions', icon: RefreshCw },
    { label: 'Notifications', href: '/(customer)/notifications', icon: Bell },
  ] as const;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guest}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Sign in to manage orders, loyalty & bookings</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.primaryText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Account, city & loyalty</Text>

        <GlassCard style={styles.hero}>
          <View style={styles.avatar}>
            <User color="#5DCAA5" size={28} />
          </View>
          <Text style={styles.name}>
            {profile?.fullName || user?.fullName || 'Customer'}
          </Text>
          <Text style={styles.meta}>{profile?.phone || user?.phone || user?.email || '—'}</Text>
          {loyalty && (
            <TouchableOpacity
              style={styles.pointsPill}
              onPress={() => router.push('/(customer)/loyalty')}
            >
              <Gift color="#FAC775" size={14} />
              <Text style={styles.pointsText}>{loyalty.points} pts</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        <Text style={styles.section}>City</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <View style={styles.cityRow}>
            {cityOptions.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.cityChip, city === c && styles.cityChipActive]}
                onPress={() => pickCity(c)}
              >
                <Text style={[styles.cityText, city === c && styles.cityTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {links.map(({ label, href, icon: Icon }) => (
          <TouchableOpacity
            key={href}
            style={styles.link}
            onPress={() => router.push(href as never)}
          >
            <View style={styles.linkIcon}>
              <Icon color="#0ea5e9" size={18} />
            </View>
            <Text style={styles.linkLabel}>{label}</Text>
            <ChevronRight color="rgba(255,255,255,0.35)" size={18} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.logout} onPress={handleLogout}>
          <LogOut color="#f87171" size={18} />
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 120 },
  guest: { padding: 24, flex: 1, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.65)', marginTop: 6, marginBottom: 20 },
  hero: { alignItems: 'center', padding: 24, marginBottom: 20 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(93,202,165,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '700', color: '#fff' },
  meta: { color: 'rgba(255,255,255,0.55)', marginTop: 4 },
  pointsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(250,199,117,0.15)',
  },
  pointsText: { color: '#FAC775', fontWeight: '700' },
  section: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  cityRow: { flexDirection: 'row', gap: 8 },
  cityChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cityChipActive: {
    backgroundColor: 'rgba(93,202,165,0.2)',
    borderColor: '#5DCAA5',
  },
  cityText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  cityTextActive: { color: '#5DCAA5' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 52,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(14,165,233,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkLabel: { flex: 1, color: '#fff', fontWeight: '600' },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(239,68,68,0.12)',
  },
  logoutText: { color: '#f87171', fontWeight: '700' },
  primaryBtn: {
    marginTop: 24,
    backgroundColor: '#5DCAA5',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontWeight: '800', color: '#07101f', fontSize: 16 },
});

import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore, homeForRole } from '../../store/auth';
import { DoorliColors } from '../../constants/colors';

const AUTH_URL = process.env.EXPO_PUBLIC_AUTH_URL ?? 'http://localhost:4001';

type Role = 'customer' | 'vendor' | 'driver';

const ROLES: { value: Role; label: string; description: string }[] = [
  { value: 'customer', label: '🛒 Customer', description: 'Order food, book services & deliveries' },
  { value: 'vendor', label: '🏪 Vendor', description: 'List your shop and receive orders' },
  { value: 'driver', label: '🚗 Driver', description: 'Earn by delivering orders near you' },
];

export default function SelectRoleScreen() {
  const router = useRouter();
  const { tempToken } = useLocalSearchParams<{ tempToken: string }>();
  const [selected, setSelected] = useState<Role>('customer');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!tempToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${AUTH_URL}/auth/google/complete-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken, role: selected }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
      router.replace(homeForRole(selected) as any);
    } catch (err: any) {
      alert(err.message || 'Could not complete registration');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>How will you use Doorli?</Text>
        <Text style={styles.subheading}>You can change this later in settings.</Text>

        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleCard, selected === r.value && styles.roleCardActive]}
            onPress={() => setSelected(r.value)}
            activeOpacity={0.8}
          >
            <Text style={styles.roleLabel}>{r.label}</Text>
            <Text style={styles.roleDesc}>{r.description}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#003b10" />
          ) : (
            <Text style={styles.confirmBtnText}>Continue as {selected}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: DoorliColors.navyMid },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 12 },
  heading: { fontSize: 26, fontWeight: '800', color: DoorliColors.text, textAlign: 'center' },
  subheading: { fontSize: 14, color: DoorliColors.textMuted, textAlign: 'center', marginBottom: 8 },
  roleCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: DoorliColors.navyMid ?? '#1e2d4a',
    backgroundColor: '#0d1a2e',
  },
  roleCardActive: {
    borderColor: DoorliColors.primary,
    backgroundColor: '#0d2040',
  },
  roleLabel: { fontSize: 17, fontWeight: '700', color: DoorliColors.text, marginBottom: 4 },
  roleDesc: { fontSize: 13, color: DoorliColors.textMuted },
  confirmBtn: {
    marginTop: 16,
    backgroundColor: DoorliColors.sky,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#003b10', fontSize: 17, fontWeight: '700' },
});

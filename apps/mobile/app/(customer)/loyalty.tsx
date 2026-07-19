import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { fetchLoyalty, redeemLoyalty } from '../../lib/api';
import { Gift } from 'lucide-react-native';

export default function LoyaltyScreen() {
  const queryClient = useQueryClient();
  const [points, setPoints] = useState('100');
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['loyalty'],
    queryFn: fetchLoyalty,
  });

  async function handleRedeem() {
    const n = Number(points);
    if (!n || n < 1) {
      Alert.alert('Enter points', 'Choose how many points to redeem.');
      return;
    }
    setBusy(true);
    try {
      const result = await redeemLoyalty(n);
      queryClient.invalidateQueries({ queryKey: ['loyalty'] });
      Alert.alert(
        'Redeemed!',
        `Promo code: ${result.promoCode}\nUse it at checkout (1 pt = LKR 1).`,
      );
    } catch (e: unknown) {
      Alert.alert('Redeem failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Loyalty</Text>
      <Text style={styles.subtitle}>Earn points on orders — redeem for discounts</Text>

      {isLoading || !data ? (
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <>
          <GlassCard style={styles.hero}>
            <Gift color="#FAC775" size={36} />
            <Text style={styles.points}>{data.points}</Text>
            <Text style={styles.pointsLabel}>available points</Text>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{data.earned}</Text>
                <Text style={styles.statLbl}>Earned</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{data.redeemed}</Text>
                <Text style={styles.statLbl}>Redeemed</Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.form}>
            <Text style={styles.formTitle}>Redeem for promo code</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={points}
              onChangeText={setPoints}
              placeholderTextColor="rgba(255,255,255,0.4)"
              placeholder="Points"
            />
            <TouchableOpacity
              style={[styles.btn, busy && { opacity: 0.6 }]}
              onPress={handleRedeem}
              disabled={busy}
            >
              <Text style={styles.btnText}>{busy ? 'Redeeming…' : 'Redeem'}</Text>
            </TouchableOpacity>
          </GlassCard>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  subtitle: { color: 'rgba(255,255,255,0.65)', marginTop: 6, marginBottom: 20 },
  hero: { alignItems: 'center', padding: 28, marginBottom: 16 },
  points: { fontSize: 48, fontWeight: '900', color: '#FAC775', marginTop: 8 },
  pointsLabel: { color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  stats: { flexDirection: 'row', gap: 32, marginTop: 20 },
  stat: { alignItems: 'center' },
  statVal: { color: '#fff', fontWeight: '700', fontSize: 18 },
  statLbl: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 },
  form: { padding: 16, gap: 12 },
  formTitle: { color: '#fff', fontWeight: '700' },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minHeight: 48,
  },
  btn: {
    backgroundColor: '#5DCAA5',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontWeight: '800', color: '#07101f', fontSize: 16 },
});

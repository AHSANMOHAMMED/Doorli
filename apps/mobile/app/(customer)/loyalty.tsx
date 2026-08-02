import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchLoyalty, redeemLoyalty } from '../../lib/api';
import { DoorliColors } from '../../constants/colors';
import { Gift, ArrowLeft, TrendingUp, TrendingDown, Star, Sparkles } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Loyalty</Text>
        <Text style={styles.subtitle}>Earn points on orders — redeem for discounts</Text>

        {isLoading || !data ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Hero Points Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroBgCircle} />
              <View style={styles.heroContent}>
                <View style={styles.giftIconWrap}>
                  <Gift color={DoorliColors.gold} size={32} />
                </View>
                <Text style={styles.points}>{data.points}</Text>
                <Text style={styles.pointsLabel}>available points</Text>

                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <TrendingUp color={DoorliColors.success} size={18} />
                    <Text style={styles.statVal}>{data.earned}</Text>
                    <Text style={styles.statLbl}>Earned</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.stat}>
                    <TrendingDown color={DoorliColors.danger} size={18} />
                    <Text style={styles.statVal}>{data.redeemed}</Text>
                    <Text style={styles.statLbl}>Redeemed</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* How It Works */}
            <View style={styles.howCard}>
              <Text style={styles.howTitle}>How it works</Text>
              <View style={styles.howRow}>
                <View style={styles.howStep}>
                  <View style={[styles.howStepNum, { backgroundColor: 'rgba(24,95,165,0.2)' }]}>
                    <Text style={styles.howStepText}>1</Text>
                  </View>
                  <Text style={styles.howStepLabel}>Place orders</Text>
                </View>
                <View style={styles.howConnector} />
                <View style={styles.howStep}>
                  <View style={[styles.howStepNum, { backgroundColor: 'rgba(250,199,117,0.2)' }]}>
                    <Star color={DoorliColors.gold} size={14} />
                  </View>
                  <Text style={styles.howStepLabel}>Earn points</Text>
                </View>
                <View style={styles.howConnector} />
                <View style={styles.howStep}>
                  <View style={[styles.howStepNum, { backgroundColor: 'rgba(29,158,117,0.2)' }]}>
                    <Sparkles color={DoorliColors.teal} size={14} />
                  </View>
                  <Text style={styles.howStepLabel}>Redeem</Text>
                </View>
              </View>
            </View>

            {/* Redeem Section */}
            <View style={styles.redeemCard}>
              <Text style={styles.redeemTitle}>Redeem for promo code</Text>
              <Text style={styles.redeemSub}>1 point = LKR 1 discount</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={points}
                onChangeText={setPoints}
                placeholderTextColor={DoorliColors.textDim}
                placeholder="Points to redeem"
              />
              <TouchableOpacity
                style={[styles.redeemBtn, busy && { opacity: 0.6 }]}
                onPress={handleRedeem}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Gift color="#fff" size={18} />
                    <Text style={styles.redeemBtnText}>Redeem</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  scroll: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: '800', color: DoorliColors.text, marginTop: 8 },
  subtitle: { color: DoorliColors.textDim, marginTop: 6, marginBottom: 20 },

  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroBgCircle: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(250,199,117,0.08)',
  },
  heroContent: { alignItems: 'center', padding: 28 },
  giftIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(250,199,117,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  points: { fontSize: 48, fontWeight: '900', color: DoorliColors.gold },
  pointsLabel: { color: DoorliColors.textDim, marginTop: 4, fontSize: 14 },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  stat: { alignItems: 'center', gap: 4 },
  statVal: { color: DoorliColors.text, fontWeight: '700', fontSize: 20 },
  statLbl: { color: DoorliColors.textDim, fontSize: 12, marginTop: 2 },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  howCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    marginBottom: 16,
  },
  howTitle: { fontSize: 16, fontWeight: '700', color: DoorliColors.text, marginBottom: 16 },
  howRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  howStep: { alignItems: 'center', gap: 8, flex: 1 },
  howStepNum: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howStepText: { color: PRIMARY, fontWeight: '700', fontSize: 16 },
  howStepLabel: { fontSize: 12, color: DoorliColors.textMuted, fontWeight: '500' },
  howConnector: {
    width: 24,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 20,
  },

  redeemCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
  },
  redeemTitle: { fontSize: 16, fontWeight: '700', color: DoorliColors.text },
  redeemSub: { color: DoorliColors.textDim, marginTop: 4, marginBottom: 16, fontSize: 13 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 14,
    color: DoorliColors.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 48,
    marginBottom: 16,
  },
  redeemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    minHeight: 52,
  },
  redeemBtnText: { fontWeight: '800', color: '#fff', fontSize: 16 },
});

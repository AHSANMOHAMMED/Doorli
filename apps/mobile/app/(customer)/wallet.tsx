import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { WalletCards } from 'lucide-react-native';
import { apiClient } from '../../lib/axios';
import { GlassButton } from '../../components/GlassButton';
import { DoorliColors } from '../../constants/colors';

export default function WalletScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('1000');
  const [message, setMessage] = useState('');
  useEffect(() => { apiClient.get('/wallet/balance').then((res) => setBalance(Number(res.data.data?.balance ?? res.data.balance ?? 0))).catch(() => setMessage('Please sign in to view your wallet.')); }, []);
  async function topUp() { try { const res = await apiClient.post('/wallet/topup', { amount: Number(amount), method: 'upi' }, { headers: { 'Idempotency-Key': `${Date.now()}-mobile-topup` } }); setBalance(Number(res.data.data.balanceAfter ?? res.data.data.balance)); setMessage('Funds added successfully.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Top-up failed.'); } }
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}><Text style={styles.eyebrow}>DAILY MONEY LAYER</Text><Text style={styles.title}>Doorli Wallet</Text><View style={styles.card}><WalletCards color="#fff" size={24} /><Text style={styles.cardLabel}>Available balance</Text><Text style={styles.balance}>LKR {balance.toLocaleString()}</Text></View><View style={styles.panel}><Text style={styles.heading}>Add funds</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="Amount in LKR" placeholderTextColor="#6b86a6" style={styles.input} /><GlassButton title="Add funds" onPress={topUp} /><GlassButton title="View bills" variant="secondary" onPress={() => router.push('/(customer)/bills' as never)} />{message ? <Text style={styles.message}>{message}</Text> : null}</View></ScrollView>;
}
const styles = StyleSheet.create({ page: { flex: 1, backgroundColor: DoorliColors.deep }, content: { padding: 20, paddingTop: 55, gap: 16 }, eyebrow: { color: DoorliColors.mint, fontSize: 11, letterSpacing: 2 }, title: { color: '#fff', fontSize: 32, fontWeight: '800' }, card: { backgroundColor: DoorliColors.primary, borderRadius: 24, padding: 24, gap: 10 }, cardLabel: { color: '#d7e7f7', fontSize: 14 }, balance: { color: '#fff', fontSize: 34, fontWeight: '800' }, panel: { backgroundColor: 'rgba(255,255,255,.08)', borderRadius: 24, padding: 20, gap: 12 }, heading: { color: '#fff', fontSize: 20, fontWeight: '700' }, input: { backgroundColor: 'rgba(0,0,0,.2)', color: '#fff', borderRadius: 14, padding: 15, fontSize: 16 }, message: { color: DoorliColors.mint, fontSize: 13 } });

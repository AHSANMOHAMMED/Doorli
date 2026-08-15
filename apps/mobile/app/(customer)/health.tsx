import { useEffect, useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiClient } from '../../lib/axios';

type Provider = { id: string; name: string; type: string; specialty?: string; fee: number };

export default function HealthScreen() {
  const [type, setType] = useState('doctor');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [slot, setSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [medicineQty, setMedicineQty] = useState('1');
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [medicineStatus, setMedicineStatus] = useState('');

  useEffect(() => {
    apiClient.get(`/health/providers/search?type=${type}`).then((res) => {
      const items = res.data?.data || [];
      setProviders(items);
      setSelected(items[0] || null);
    }).catch(() => Alert.alert('Health', 'Providers are unavailable right now.'));
  }, [type]);

  async function book() {
    if (!selected || !slot) return Alert.alert('Health', 'Choose a provider and date/time.');
    setBusy(true);
    try {
      const res = await apiClient.post('/health/appointments', { providerId: selected.id, slotTime: new Date(slot).toISOString(), type, notes });
      Alert.alert('Confirmed', `${res.data?.data?.provider} appointment booked.`);
    } catch (error: any) { Alert.alert('Booking failed', error.response?.data?.error || 'Try again.'); }
    finally { setBusy(false); }
  }

  async function orderMedicine() {
    if (!medicineName.trim()) return Alert.alert('Pharmacy', 'Enter a medicine name.');
    setBusy(true);
    try {
      const res = await apiClient.post('/health/medicine-orders', {
        pharmacyId: 'pharm1',
        items: [{ name: medicineName.trim(), qty: Number(medicineQty) || 1, isRx: Boolean(prescriptionUrl) }],
        ...(prescriptionUrl ? { prescriptionUrl: prescriptionUrl.trim() } : {}),
      }, { headers: { 'Idempotency-Key': `medicine-${Date.now()}` } });
      setMedicineStatus(`Order ${res.data?.data?.ref || res.data?.data?.reference} is pending pharmacy review.`);
      setMedicineName('');
    } catch (error: any) { Alert.alert('Medicine order failed', error.response?.data?.error || 'Try again.'); }
    finally { setBusy(false); }
  }

  return <SafeAreaView style={styles.screen}><Text style={styles.title}>Health & Wellness</Text><View style={styles.types}>{['doctor', 'lab', 'gym', 'nurse'].map((item) => <TouchableOpacity key={item} onPress={() => setType(item)} style={[styles.type, type === item && styles.active]}><Text style={styles.text}>{item}</Text></TouchableOpacity>)}</View><FlatList data={providers} keyExtractor={(item) => item.id} renderItem={({ item }) => <TouchableOpacity onPress={() => setSelected(item)} style={[styles.card, selected?.id === item.id && styles.selected]}><Text style={styles.name}>{item.name}</Text><Text style={styles.muted}>{item.specialty || item.type} · LKR {item.fee}</Text></TouchableOpacity>} ListEmptyComponent={<Text style={styles.muted}>No providers found.</Text>} ListFooterComponent={<View><TextInput style={styles.input} placeholder="Date/time e.g. 2026-08-20T10:00" placeholderTextColor="#94a3b8" value={slot} onChangeText={setSlot} /><TextInput style={styles.input} placeholder="Notes (optional)" placeholderTextColor="#94a3b8" value={notes} onChangeText={setNotes} /><TouchableOpacity disabled={busy} onPress={book} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Booking...' : 'Book appointment'}</Text></TouchableOpacity><View style={styles.pharmacy}><Text style={styles.sectionTitle}>Order medicine</Text><TextInput style={styles.input} placeholder="Medicine name" placeholderTextColor="#94a3b8" value={medicineName} onChangeText={setMedicineName} /><TextInput style={styles.input} placeholder="Quantity" placeholderTextColor="#94a3b8" keyboardType="number-pad" value={medicineQty} onChangeText={setMedicineQty} /><TextInput style={styles.input} placeholder="Prescription URL for Rx medicine" placeholderTextColor="#94a3b8" value={prescriptionUrl} onChangeText={setPrescriptionUrl} autoCapitalize="none" /><TouchableOpacity disabled={busy} onPress={orderMedicine} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Submitting...' : 'Submit medicine order'}</Text></TouchableOpacity>{medicineStatus ? <Text style={styles.muted}>{medicineStatus}</Text> : null}</View></View>} contentContainerStyle={styles.list} /></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#060b1c', padding: 16 }, title: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 16 }, types: { flexDirection: 'row', gap: 8, marginBottom: 12 }, type: { padding: 10, borderRadius: 10, backgroundColor: '#14213b' }, active: { backgroundColor: '#185fa5' }, text: { color: '#fff', textTransform: 'capitalize' }, list: { gap: 10, paddingBottom: 30 }, card: { padding: 16, borderRadius: 14, backgroundColor: '#101c35', borderWidth: 1, borderColor: '#243452' }, selected: { borderColor: '#5dcaa5' }, name: { color: '#fff', fontWeight: '700', fontSize: 16 }, muted: { color: '#94a3b8', marginTop: 5 }, input: { backgroundColor: '#101c35', color: '#fff', padding: 14, borderRadius: 12, marginTop: 10 }, button: { backgroundColor: '#1d9e75', padding: 15, borderRadius: 12, marginTop: 12, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '800' }, pharmacy: { marginTop: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#243452' }, sectionTitle: { color: '#fff', fontSize: 20, fontWeight: '800' } });

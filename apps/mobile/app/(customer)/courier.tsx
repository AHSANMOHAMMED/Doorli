import { useState } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { apiClient } from '../../lib/axios';

export default function CourierScreen() {
  const [type, setType] = useState<'package' | 'document'>('package');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [busy, setBusy] = useState(false);
  async function create() {
    if (!pickup || !dropoff) return Alert.alert('Courier', 'Enter pickup and drop-off addresses.');
    setBusy(true);
    try { const res = await apiClient.post('/courier/jobs', { type, pickupAddress: pickup, dropoffAddress: dropoff, pickupLat: 6.9271, pickupLng: 79.8612, dropoffLat: 6.9344, dropoffLng: 79.8428 }); Alert.alert('Courier created', `Ref ${res.data?.data?.jobRef} · LKR ${res.data?.data?.fareEstimate}`); }
    catch (error: any) { Alert.alert('Courier failed', error.response?.data?.error || 'Try again.'); }
    finally { setBusy(false); }
  }
  return <SafeAreaView style={styles.screen}><Text style={styles.title}>Courier & Errands</Text><TouchableOpacity onPress={() => setType(type === 'package' ? 'document' : 'package')} style={styles.switch}><Text style={styles.text}>Type: {type} (tap to change)</Text></TouchableOpacity><TextInput style={styles.input} placeholder="Pickup address" placeholderTextColor="#94a3b8" value={pickup} onChangeText={setPickup} /><TextInput style={styles.input} placeholder="Drop-off address" placeholderTextColor="#94a3b8" value={dropoff} onChangeText={setDropoff} /><TouchableOpacity onPress={create} disabled={busy} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Creating...' : 'Request runner'}</Text></TouchableOpacity></SafeAreaView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#060b1c', padding: 16 }, title: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 20 }, switch: { backgroundColor: '#14213b', padding: 15, borderRadius: 12 }, text: { color: '#fff', textTransform: 'capitalize' }, input: { backgroundColor: '#101c35', color: '#fff', padding: 15, borderRadius: 12, marginTop: 12 }, button: { backgroundColor: '#185fa5', padding: 16, borderRadius: 12, marginTop: 16, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '800' } });

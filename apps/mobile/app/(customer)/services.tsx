import { useState } from 'react';
import { Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { apiClient } from '../../lib/axios';

const TYPES = ['plumbing', 'electrical', 'ac_repair', 'carpentry', 'cleaning', 'painting', 'pest_control', 'laundry', 'other'] as const;

export default function ServicesScreen() {
  const [type, setType] = useState<(typeof TYPES)[number]>('laundry');
  const [title, setTitle] = useState('Laundry pickup and delivery');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!title.trim() || address.trim().length < 5) return Alert.alert('Service request', 'Add a title and pickup/service address.');
    setBusy(true);
    try {
      const response = await apiClient.post('/service-requests', {
        serviceType: type,
        title: title.trim(),
        description: description.trim() || undefined,
        addressLine: address.trim(),
        isUrgent: urgent,
        metadata: type === 'laundry' ? { laundry: true, pickup: true, dropoffAddress: address.trim() } : undefined,
      }, { headers: { 'Idempotency-Key': `service-${Date.now()}` } });
      setMessage(`Request created. Status: ${response.data?.data?.status || 'open'}`);
    } catch (error: any) {
      Alert.alert('Request failed', error.response?.data?.error || 'Please try again.');
    } finally { setBusy(false); }
  }

  return <SafeAreaView style={styles.screen}><Text style={styles.title}>Home Services</Text><Text style={styles.subtitle}>Book a trusted local professional or schedule laundry pickup.</Text><FlatList horizontal data={TYPES} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.types} renderItem={({ item }) => <TouchableOpacity onPress={() => { setType(item); if (item === 'laundry') setTitle('Laundry pickup and delivery'); else setTitle(`${item.replace('_', ' ')} service`); }} style={[styles.type, item === type && styles.active]}><Text style={styles.typeText}>{item.replace('_', ' ')}</Text></TouchableOpacity>} /><View style={styles.card}><TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What do you need?" placeholderTextColor="#94a3b8" /><TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Describe the job or laundry items" placeholderTextColor="#94a3b8" multiline /><TextInput style={styles.input} value={address} onChangeText={setAddress} placeholder="Service or pickup address" placeholderTextColor="#94a3b8" /><TouchableOpacity onPress={() => setUrgent(!urgent)} style={styles.urgent}><Text style={styles.text}>{urgent ? '✓ Urgent request' : 'Mark as urgent'}</Text></TouchableOpacity><TouchableOpacity disabled={busy} onPress={submit} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Submitting...' : 'Request service'}</Text></TouchableOpacity>{message ? <Text style={styles.message}>{message}</Text> : null}</View></SafeAreaView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: '#060b1c', padding: 16 }, title: { color: '#fff', fontSize: 30, fontWeight: '800' }, subtitle: { color: '#94a3b8', marginTop: 8, lineHeight: 20 }, types: { gap: 8, paddingVertical: 18 }, type: { backgroundColor: '#14213b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 }, active: { backgroundColor: '#185fa5' }, typeText: { color: '#fff', textTransform: 'capitalize' }, card: { backgroundColor: '#101c35', borderRadius: 18, padding: 16, gap: 10 }, input: { backgroundColor: '#182744', color: '#fff', borderRadius: 12, padding: 14, minHeight: 48 }, urgent: { paddingVertical: 10 }, text: { color: '#fff' }, button: { backgroundColor: '#1d9e75', padding: 15, borderRadius: 12, alignItems: 'center' }, buttonText: { color: '#fff', fontWeight: '800' }, message: { color: '#5dcaa5', marginTop: 8 } });

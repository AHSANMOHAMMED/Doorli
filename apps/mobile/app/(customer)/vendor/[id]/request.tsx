import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { createServiceRequest, fetchVendor } from '../../../../lib/api';

export default function ServiceRequestScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: vendor } = useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => fetchVendor(id!),
    enabled: !!id,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!vendor) return;
    if (!title || !description || !address || !contactName || !contactPhone) {
      Alert.alert('Missing fields', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await createServiceRequest({
        vendorId: vendor.id,
        serviceType: vendor.category,
        title,
        description,
        address,
        city: city || undefined,
        preferredDate: preferredDate || undefined,
        preferredTime: preferredTime || undefined,
        urgency,
        contactName,
        contactPhone,
      });
      Alert.alert('Request sent', 'Your service request has been submitted', [
        { text: 'OK', onPress: () => router.replace('/(customer)/orders') },
      ]);
    } catch (err) {
      Alert.alert('Request failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setLoading(false);
    }
  }

  if (!vendor) return <ActivityIndicator color="#2563eb" style={{ marginTop: 48 }} />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Request Service from {vendor.businessName}</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} placeholder="e.g. Leaking tap repair" value={title} onChangeText={setTitle} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description *</Text>
          <TextInput style={styles.input} multiline placeholder="Describe the problem..." value={description} onChangeText={setDescription} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Address *</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>City</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Preferred Date</Text>
            <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={preferredDate} onChangeText={setPreferredDate} />
          </View>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Preferred Time</Text>
            <TextInput style={styles.input} placeholder="HH:MM" value={preferredTime} onChangeText={setPreferredTime} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Urgency</Text>
          <View style={styles.urgencyRow}>
            {(['low', 'medium', 'high'] as const).map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.chip, urgency === u && styles.chipActive]}
                onPress={() => setUrgency(u)}
              >
                <Text style={[styles.chipText, urgency === u && styles.chipTextActive]}>
                  {u.charAt(0).toUpperCase() + u.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contact Name *</Text>
          <TextInput style={styles.input} value={contactName} onChangeText={setContactName} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contact Phone *</Text>
          <TextInput style={styles.input} keyboardType="phone-pad" value={contactPhone} onChangeText={setContactPhone} />
        </View>

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Request</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 20 },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15,
  },
  urgencyRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#eff6ff', borderColor: '#2563eb' },
  chipText: { fontSize: 14, color: '#64748b' },
  chipTextActive: { color: '#2563eb', fontWeight: '600' },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

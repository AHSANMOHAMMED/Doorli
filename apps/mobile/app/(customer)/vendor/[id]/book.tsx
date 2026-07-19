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
import { createBooking, fetchVendor } from '../../../../lib/api';

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: vendor } = useQuery({
    queryKey: ['vendor', id],
    queryFn: async () => fetchVendor(id!),
    enabled: !!id,
  });

  const [serviceName, setServiceName] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [partySize, setPartySize] = useState('1');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);

  const bookingType =
    vendor?.category === 'hotel' ? 'hotel' :
    vendor?.category === 'hall' ? 'hall' :
    vendor?.category === 'beauty' ? 'beauty' :
    'service';

  async function submit() {
    if (!vendor) return;
    if (!serviceName || !bookingDate || !startTime || !contactName || !contactPhone) {
      Alert.alert('Missing fields', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      await createBooking({
        vendorId: vendor.id,
        bookingType,
        serviceName,
        bookingDate,
        startTime,
        partySize: parseInt(partySize, 10) || 1,
        totalAmount: 500,
        contactName,
        contactPhone,
        specialRequests: specialRequests || undefined,
        requirements: `Contact: ${contactName} ${contactPhone}`,
      });
      Alert.alert('Booking placed', 'Your booking has been submitted', [
        { text: 'OK', onPress: () => router.replace('/(customer)/orders') },
      ]);
    } catch (err) {
      Alert.alert('Booking failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setLoading(false);
    }
  }

  if (!vendor) return <ActivityIndicator color="#2563eb" style={{ marginTop: 48 }} />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Book at {vendor.businessName}</Text>
        <Text style={styles.subtitle}>Fill in the details to make a reservation</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Service / Room Type *</Text>
          <TextInput style={styles.input} placeholder="e.g. Deluxe Room, Hall A, Haircut" value={serviceName} onChangeText={setServiceName} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Date *</Text>
          <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={bookingDate} onChangeText={setBookingDate} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Start Time *</Text>
          <TextInput style={styles.input} placeholder="HH:MM" value={startTime} onChangeText={setStartTime} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Party Size</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={partySize} onChangeText={setPartySize} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contact Name *</Text>
          <TextInput style={styles.input} value={contactName} onChangeText={setContactName} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contact Phone *</Text>
          <TextInput style={styles.input} keyboardType="phone-pad" value={contactPhone} onChangeText={setContactPhone} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Special Requests</Text>
          <TextInput style={styles.input} multiline value={specialRequests} onChangeText={setSpecialRequests} />
        </View>

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirm Booking</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#64748b', marginTop: 4, marginBottom: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, fontSize: 15,
  },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { createBooking, fetchVendor } from '../../../../lib/api';
import { DoorliColors } from '../../../../constants/colors';
import { ArrowLeft, Calendar, Clock, Users, FileText, Phone, User, Send } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

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
        totalAmount: vendor.minOrderAmount ?? 0,
        contactName,
        contactPhone,
        specialRequests: specialRequests || undefined,
        requirements: `Contact: ${contactName} ${contactPhone}`,
      });
      Alert.alert('Booking placed', 'Your booking has been submitted', [
        { text: 'OK', onPress: () => router.replace('/(customer)/bookings') },
      ]);
    } catch (err) {
      Alert.alert('Booking failed', err instanceof Error ? err.message : 'Try again');
    } finally {
      setLoading(false);
    }
  }

  if (!vendor) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={PRIMARY} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft color={DoorliColors.text} size={24} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Book a Service</Text>
            <Text style={styles.headerSub}>{vendor.businessName}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <FileText color={PRIMARY} size={16} />
              <Text style={styles.label}>Service / Room Type *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Deluxe Room, Hall A, Haircut"
              placeholderTextColor={DoorliColors.textDim}
              value={serviceName}
              onChangeText={setServiceName}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <View style={styles.labelRow}>
                <Calendar color={DoorliColors.teal} size={16} />
                <Text style={styles.label}>Date *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={DoorliColors.textDim}
                value={bookingDate}
                onChangeText={setBookingDate}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <View style={styles.labelRow}>
                <Clock color={DoorliColors.gold} size={16} />
                <Text style={styles.label}>Start Time *</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={DoorliColors.textDim}
                value={startTime}
                onChangeText={setStartTime}
              />
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Users color={DoorliColors.sky} size={16} />
              <Text style={styles.label}>Party Size</Text>
            </View>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholderTextColor={DoorliColors.textDim}
              value={partySize}
              onChangeText={setPartySize}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <User color={DoorliColors.purple} size={16} />
              <Text style={styles.label}>Contact Name *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholderTextColor={DoorliColors.textDim}
              value={contactName}
              onChangeText={setContactName}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Phone color={DoorliColors.mint} size={16} />
              <Text style={styles.label}>Contact Phone *</Text>
            </View>
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              placeholderTextColor={DoorliColors.textDim}
              value={contactPhone}
              onChangeText={setContactPhone}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <FileText color={DoorliColors.textDim} size={16} />
              <Text style={styles.label}>Special Requests</Text>
            </View>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholderTextColor={DoorliColors.textDim}
              placeholder="Any special requirements..."
              value={specialRequests}
              onChangeText={setSpecialRequests}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={submit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Send color="#fff" size={18} />
                <Text style={styles.submitText}>Confirm Booking</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DoorliColors.navy },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  headerSub: { fontSize: 12, color: DoorliColors.textDim, marginTop: 2 },
  content: { padding: 16, paddingBottom: 40 },
  field: { marginBottom: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', color: DoorliColors.textMuted },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: DoorliColors.text,
  },
  multiline: { minHeight: 80 },
  row: { flexDirection: 'row' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PRIMARY,
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

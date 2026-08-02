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
import { createServiceRequest, fetchVendor } from '../../../../lib/api';
import { DoorliColors } from '../../../../constants/colors';
import { ArrowLeft, FileText, MapPin, Calendar, Clock, AlertTriangle, User, Phone, Send } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

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
        { text: 'OK', onPress: () => router.replace('/(customer)/bookings') },
      ]);
    } catch (err) {
      Alert.alert('Request failed', err instanceof Error ? err.message : 'Try again');
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
            <Text style={styles.headerTitle}>Request Service</Text>
            <Text style={styles.headerSub}>{vendor.businessName}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <FileText color={PRIMARY} size={16} />
              <Text style={styles.label}>Title *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="e.g. Leaking tap repair"
              placeholderTextColor={DoorliColors.textDim}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <FileText color={DoorliColors.sky} size={16} />
              <Text style={styles.label}>Description *</Text>
            </View>
            <TextInput
              style={[styles.input, styles.multiline]}
              multiline
              placeholder="Describe the problem..."
              placeholderTextColor={DoorliColors.textDim}
              value={description}
              onChangeText={setDescription}
              textAlignVertical="top"
              numberOfLines={4}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MapPin color={DoorliColors.teal} size={16} />
              <Text style={styles.label}>Address *</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholderTextColor={DoorliColors.textDim}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <MapPin color={DoorliColors.textDim} size={16} />
              <Text style={styles.label}>City</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholderTextColor={DoorliColors.textDim}
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <View style={styles.labelRow}>
                <Calendar color={DoorliColors.gold} size={16} />
                <Text style={styles.label}>Preferred Date</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={DoorliColors.textDim}
                value={preferredDate}
                onChangeText={setPreferredDate}
              />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <View style={styles.labelRow}>
                <Clock color={DoorliColors.purple} size={16} />
                <Text style={styles.label}>Preferred Time</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="HH:MM"
                placeholderTextColor={DoorliColors.textDim}
                value={preferredTime}
                onChangeText={setPreferredTime}
              />
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <AlertTriangle color={DoorliColors.warning} size={16} />
              <Text style={styles.label}>Urgency</Text>
            </View>
            <View style={styles.urgencyRow}>
              {(['low', 'medium', 'high'] as const).map((u) => {
                const colors = { low: DoorliColors.teal, medium: DoorliColors.warning, high: DoorliColors.danger };
                const isActive = urgency === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[styles.chip, isActive && { backgroundColor: `${colors[u]}20`, borderColor: colors[u] }]}
                    onPress={() => setUrgency(u)}
                  >
                    <Text style={[styles.chipText, isActive && { color: colors[u], fontWeight: '700' }]}>
                      {u.charAt(0).toUpperCase() + u.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <User color={DoorliColors.mint} size={16} />
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
              <Phone color={DoorliColors.sky} size={16} />
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
                <Text style={styles.submitText}>Submit Request</Text>
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
  multiline: { minHeight: 100 },
  row: { flexDirection: 'row' },
  urgencyRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  chipText: { fontSize: 14, color: DoorliColors.textMuted },
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

import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAddresses, createAddress, DEFAULT_LOCATION } from '../../lib/api';
import { MapPin, ArrowLeft } from 'lucide-react-native';
import { useRouter, Stack } from 'expo-router';

const PRIMARY = '#00B241';
const ON_SURFACE = '#002b5b';

export default function AddressesScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [label, setLabel] = useState('Home');
  const [addressLine, setAddressLine] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  });

  async function handleSave() {
    if (addressLine.trim().length < 5) {
      Alert.alert('Address needed', 'Enter a full street address.');
      return;
    }
    setSaving(true);
    try {
      await createAddress({
        label: label.trim() || 'Home',
        addressLine: addressLine.trim(),
        city: 'Colombo',
        latitude: DEFAULT_LOCATION.lat,
        longitude: DEFAULT_LOCATION.lng,
        isDefault: !(data?.length),
      });
      setAddressLine('');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      Alert.alert('Saved', 'Address added to your account.');
    } catch (e: unknown) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={ON_SURFACE} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>My Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Add New Address</Text>
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="Label (e.g. Home, Work)"
            placeholderTextColor="#9ca3af"
            value={label}
            onChangeText={setLabel}
          />
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            placeholder="Street address"
            placeholderTextColor="#9ca3af"
            value={addressLine}
            onChangeText={setAddressLine}
            multiline
          />
          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Address'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text style={styles.sectionTitle}>Saved Addresses</Text>
        {isLoading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(a) => a.id}
            refreshing={isRefetching}
            onRefresh={refetch}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MapPin color="#d1d5db" size={48} />
                <Text style={styles.emptyTitle}>No saved addresses</Text>
                <Text style={styles.emptyText}>Add your first address above</Text>
              </View>
            }
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrapper}>
                    <MapPin color={PRIMARY} size={20} />
                  </View>
                  <Text style={styles.label}>{item.label}</Text>
                  {item.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.line}>{item.addressLine}</Text>
                  {item.city ? <Text style={styles.city}>{item.city}</Text> : null}
                </View>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9fafb' 
  },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  backBtn: { 
    width: 40, height: 40, 
    borderRadius: 20, 
    backgroundColor: '#f3f4f6', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  title: { color: ON_SURFACE, fontSize: 18, fontWeight: '700' },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ON_SURFACE,
    marginBottom: 12,
  },
  formContainer: {
    padding: 16,
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#002b5b',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    gap: 12,
  },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: ON_SURFACE,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  list: { paddingBottom: 100 },
  card: { 
    backgroundColor: '#ffffff',
    padding: 16, 
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  cardHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 178, 65, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { 
    color: ON_SURFACE, 
    fontWeight: '700', 
    fontSize: 16,
    flex: 1 
  },
  defaultBadge: {
    backgroundColor: 'rgba(0, 178, 65, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardContent: {
    marginLeft: 48,
  },
  line: { 
    color: '#4b5563', 
    fontSize: 14,
    marginTop: 4 
  },
  city: { 
    color: '#9ca3af', 
    marginTop: 2, 
    fontSize: 13 
  },
  empty: { 
    alignItems: 'center', 
    paddingTop: 40, 
    gap: 12 
  },
  emptyTitle: { 
    color: ON_SURFACE,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyText: { 
    color: '#6b7280',
    fontSize: 14,
  },
});

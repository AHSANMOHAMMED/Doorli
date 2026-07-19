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
import { GlassCard } from '../../components/GlassCard';
import { GlassButton } from '../../components/GlassButton';
import { fetchAddresses, createAddress, DEFAULT_LOCATION } from '../../lib/api';
import { MapPin } from 'lucide-react-native';

export default function AddressesScreen() {
  const queryClient = useQueryClient();
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
      <Text style={styles.title}>Addresses</Text>
      <Text style={styles.subtitle}>Saved places for faster checkout</Text>

      <GlassCard style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Label (Home, Work…)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={label}
          onChangeText={setLabel}
        />
        <TextInput
          style={[styles.input, { minHeight: 72 }]}
          placeholder="Street address"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={addressLine}
          onChangeText={setAddressLine}
          multiline
        />
        <GlassButton
          title={saving ? 'Saving…' : 'Save address'}
          onPress={handleSave}
          disabled={saving}
        />
      </GlassCard>

      {isLoading ? (
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(a) => a.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MapPin color="rgba(255,255,255,0.5)" size={36} />
              <Text style={styles.emptyText}>No saved addresses yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <View style={styles.row}>
                <MapPin color="#5DCAA5" size={16} />
                <Text style={styles.label}>{item.label}</Text>
                {item.isDefault && <Text style={styles.default}>Default</Text>}
              </View>
              <Text style={styles.line}>{item.addressLine}</Text>
              {item.city ? <Text style={styles.city}>{item.city}</Text> : null}
            </GlassCard>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  subtitle: { color: 'rgba(255,255,255,0.65)', marginTop: 6, marginBottom: 16 },
  form: { padding: 14, gap: 10, marginBottom: 16 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minHeight: 48,
  },
  list: { paddingBottom: 100 },
  card: { padding: 16, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#fff', fontWeight: '700', flex: 1 },
  default: {
    color: '#FAC775',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  line: { color: 'rgba(255,255,255,0.8)', marginTop: 8 },
  city: { color: 'rgba(255,255,255,0.45)', marginTop: 4, fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { color: 'rgba(255,255,255,0.5)' },
});

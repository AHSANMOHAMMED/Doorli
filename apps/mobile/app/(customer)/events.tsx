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
import { createEvent, fetchMyEvents, formatPrice, formatStatus } from '../../lib/api';
import { PartyPopper } from 'lucide-react-native';

export default function EventsScreen() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [guestCount, setGuestCount] = useState('50');
  const [creating, setCreating] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-events'],
    queryFn: fetchMyEvents,
  });

  async function handleCreate() {
    if (title.trim().length < 3) {
      Alert.alert('Title needed', 'Give your event a name (3+ characters).');
      return;
    }
    setCreating(true);
    try {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      await createEvent({
        title: title.trim(),
        eventDate: date.toISOString(),
        guestCount: Number(guestCount) || undefined,
        items: [
          { role: 'venue', label: 'Venue TBD', estimatedCost: 50000 },
          { role: 'catering', label: 'Catering TBD', estimatedCost: 30000 },
        ],
      });
      setTitle('');
      queryClient.invalidateQueries({ queryKey: ['my-events'] });
      Alert.alert('Draft created', 'Your event package is ready to refine.');
    } catch (e: unknown) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setCreating(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Event planning</Text>
      <Text style={styles.subtitle}>Venue, catering & more in one package</Text>

      <GlassCard style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Event title (e.g. Wedding)"
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={styles.input}
          placeholder="Guest count"
          placeholderTextColor="rgba(255,255,255,0.4)"
          keyboardType="number-pad"
          value={guestCount}
          onChangeText={setGuestCount}
        />
        <GlassButton
          title={creating ? 'Creating…' : 'Create draft package'}
          onPress={handleCreate}
          disabled={creating}
        />
      </GlassCard>

      {isLoading ? (
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(e) => e.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <PartyPopper color="rgba(255,255,255,0.5)" size={40} />
              <Text style={styles.emptyText}>No event packages yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardMeta}>
                {new Date(item.eventDate).toLocaleDateString()} ·{' '}
                {item.guestCount ? `${item.guestCount} guests` : 'Guests TBD'}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.status}>{formatStatus(item.status)}</Text>
                <Text style={styles.estimate}>
                  {item.totalEstimate != null
                    ? formatPrice(Number(item.totalEstimate))
                    : 'Estimate TBD'}
                </Text>
              </View>
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
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cardMeta: { color: 'rgba(255,255,255,0.55)', marginTop: 4, fontSize: 13 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  status: { color: '#5DCAA5', fontWeight: '600', textTransform: 'capitalize' },
  estimate: { color: '#FAC775', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyText: { color: 'rgba(255,255,255,0.5)' },
});

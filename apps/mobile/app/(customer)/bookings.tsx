import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import {
  fetchMyBookings,
  fetchMyServiceRequests,
  formatPrice,
  formatStatus,
} from '../../lib/api';
import { CalendarDays, Wrench } from 'lucide-react-native';
import { useState } from 'react';

type Tab = 'bookings' | 'services';

export default function BookingsScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('bookings');

  const bookingsQ = useQuery({ queryKey: ['my-bookings'], queryFn: fetchMyBookings });
  const servicesQ = useQuery({
    queryKey: ['my-service-requests'],
    queryFn: fetchMyServiceRequests,
  });

  const loading = tab === 'bookings' ? bookingsQ.isLoading : servicesQ.isLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Bookings</Text>
      <Text style={styles.subtitle}>Hotels, halls, beauty & home services</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'bookings' && styles.tabActive]}
          onPress={() => setTab('bookings')}
        >
          <CalendarDays color={tab === 'bookings' ? '#5DCAA5' : 'rgba(255,255,255,0.5)'} size={16} />
          <Text style={[styles.tabText, tab === 'bookings' && styles.tabTextActive]}>
            Bookings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'services' && styles.tabActive]}
          onPress={() => setTab('services')}
        >
          <Wrench color={tab === 'services' ? '#5DCAA5' : 'rgba(255,255,255,0.5)'} size={16} />
          <Text style={[styles.tabText, tab === 'services' && styles.tabTextActive]}>
            Services
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : tab === 'bookings' ? (
        <FlatList
          data={bookingsQ.data ?? []}
          keyExtractor={(b) => b.id}
          refreshing={bookingsQ.isRefetching}
          onRefresh={bookingsQ.refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>No bookings yet</Text>}
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>{item.vendor?.businessName ?? 'Vendor'}</Text>
              <Text style={styles.meta}>
                {item.bookingType} · {item.bookingNumber}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.status}>{formatStatus(item.status)}</Text>
                <Text style={styles.amount}>{formatPrice(Number(item.totalAmount))}</Text>
              </View>
            </GlassCard>
          )}
        />
      ) : (
        <FlatList
          data={servicesQ.data ?? []}
          keyExtractor={(s) => s.id}
          refreshing={servicesQ.isRefetching}
          onRefresh={servicesQ.refetch}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.empty}>No service requests yet</Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/search')}>
                <Text style={styles.link}>Find a pro →</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <GlassCard style={styles.card}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.serviceType}
                {item.addressLine ? ` · ${item.addressLine}` : ''}
              </Text>
              <Text style={styles.status}>{formatStatus(item.status)}</Text>
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
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: 'rgba(93,202,165,0.15)',
    borderColor: '#5DCAA5',
  },
  tabText: { color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  tabTextActive: { color: '#5DCAA5' },
  list: { paddingBottom: 100 },
  card: { padding: 16, marginBottom: 10 },
  cardTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  meta: { color: 'rgba(255,255,255,0.5)', marginTop: 4, fontSize: 13 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    alignItems: 'center',
  },
  status: { color: '#5DCAA5', fontWeight: '600', textTransform: 'capitalize', marginTop: 8 },
  amount: { color: '#FAC775', fontWeight: '700' },
  empty: { textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: 40 },
  emptyBox: { alignItems: 'center', gap: 12 },
  link: { color: '#0ea5e9', fontWeight: '700' },
});

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
import {
  fetchMyBookings,
  fetchMyServiceRequests,
  formatPrice,
  formatStatus,
} from '../../lib/api';
import { DoorliColors } from '../../constants/colors';
import { CalendarDays, Wrench, ArrowLeft, Search } from 'lucide-react-native';
import { useState } from 'react';
import React from 'react';

const PRIMARY = DoorliColors.primary;

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
  const data = tab === 'bookings' ? (bookingsQ.data ?? []) : (servicesQ.data ?? []);
  const isRefetching = tab === 'bookings' ? bookingsQ.isRefetching : servicesQ.isRefetching;
  const refetch = tab === 'bookings' ? bookingsQ.refetch : servicesQ.refetch;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={DoorliColors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bookings</Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.subtitle}>Hotels, halls, beauty & home services</Text>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'bookings' && styles.tabActive]}
          onPress={() => setTab('bookings')}
        >
          <CalendarDays color={tab === 'bookings' ? '#fff' : DoorliColors.textDim} size={16} />
          <Text style={[styles.tabText, tab === 'bookings' && styles.tabTextActive]}>
            Bookings
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'services' && styles.tabActive]}
          onPress={() => setTab('services')}
        >
          <Wrench color={tab === 'services' ? '#fff' : DoorliColors.textDim} size={16} />
          <Text style={[styles.tabText, tab === 'services' && styles.tabTextActive]}>
            Services
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: any) => item.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <CalendarDays color={DoorliColors.textDim} size={40} />
              </View>
              <Text style={styles.emptyText}>
                {tab === 'bookings'
                  ? 'No bookings yet. Browse vendors to make a reservation.'
                  : 'No service requests yet. Find a pro to help.'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/(customer)/search')}>
                <Text style={styles.link}>Browse Vendors →</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }: { item: any }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardIconWrap}>
                  <CalendarDays color={PRIMARY} size={16} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>
                    {tab === 'bookings' ? (item.vendor?.businessName ?? 'Vendor') : item.title}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {tab === 'bookings'
                      ? `${item.bookingType} · ${item.bookingNumber}`
                      : `${item.serviceType}${item.addressLine ? ` · ${item.addressLine}` : ''}`}
                  </Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                    {formatStatus(item.status)}
                  </Text>
                </View>
                {tab === 'bookings' && (
                  <Text style={styles.amount}>{formatPrice(Number(item.totalAmount))}</Text>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function getStatusColor(status: string) {
  if (['completed', 'delivered', 'confirmed'].includes(status)) return DoorliColors.success;
  if (['cancelled', 'rejected'].includes(status)) return DoorliColors.danger;
  if (['pending', 'requested'].includes(status)) return DoorliColors.warning;
  return DoorliColors.sky;
}

function getStatusBg(status: string) {
  if (['completed', 'delivered', 'confirmed'].includes(status)) return 'rgba(29,158,117,0.15)';
  if (['cancelled', 'rejected'].includes(status)) return 'rgba(242,102,139,0.15)';
  if (['pending', 'requested'].includes(status)) return 'rgba(250,199,117,0.15)';
  return 'rgba(55,138,221,0.15)';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  subtitle: { color: DoorliColors.textDim, marginTop: 8, marginBottom: 16, paddingHorizontal: 20 },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
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
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  tabText: { color: DoorliColors.textDim, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { paddingBottom: 100, paddingHorizontal: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(24,95,165,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: DoorliColors.text, fontWeight: '700', fontSize: 15 },
  cardMeta: { color: DoorliColors.textDim, marginTop: 2, fontSize: 13 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontWeight: '600', fontSize: 12, textTransform: 'capitalize' },
  amount: { color: DoorliColors.gold, fontWeight: '700', fontSize: 16 },
  empty: { alignItems: 'center', paddingTop: 48, gap: 12, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyText: { color: DoorliColors.textMuted, textAlign: 'center', lineHeight: 20 },
  link: { color: PRIMARY, fontWeight: '700', marginTop: 8 },
});

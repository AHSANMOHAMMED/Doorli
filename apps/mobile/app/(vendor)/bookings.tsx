import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, Clock, User, MapPin, X, CheckCircle, XCircle } from 'lucide-react-native';
import { apiClient, formatPrice, formatStatus } from '../../lib/api';

type Booking = {
  id: string;
  bookingNumber: string;
  status: string;
  totalAmount: number | string;
  bookingType?: string;
  checkInDate?: string;
  checkOutDate?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  requirements?: string;
  customer?: { fullName?: string; phone?: string };
  vendor?: { businessName?: string };
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#00B241',
  cancelled: '#ef4444',
};

export default function VendorBookings() {
  const qc = useQueryClient();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    apiClient
      .get('/vendors/me')
      .then((res) => setVendorId(res.data?.data?.id ?? null))
      .catch(() => undefined);
  }, []);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-bookings', vendorId],
    enabled: !!vendorId,
    queryFn: async () => {
      const res = await apiClient.get(`/bookings/vendor/${vendorId}`);
      return (res.data?.data ?? []) as Booking[];
    },
  });

  const filteredBookings = (data ?? []).filter((booking) => {
    return activeTab === 'all' || booking.status === activeTab;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: data?.length ?? 0 };
    data?.forEach((booking) => {
      counts[booking.status] = (counts[booking.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  async function setStatus(id: string, status: string) {
    try {
      await apiClient.patch(`/bookings/${id}/status`, { status });
      qc.invalidateQueries({ queryKey: ['vendor-bookings'] });
      setShowDetail(false);
      if (status === 'cancelled') {
        Alert.alert('Booking Declined', 'The booking has been declined');
      }
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again');
    }
  }

  function openBookingDetail(booking: Booking) {
    setSelectedBooking(booking);
    setShowDetail(true);
  }

  const getBookingTypeIcon = (type?: string) => {
    switch (type) {
      case 'hotel': return '🏨';
      case 'hall': return '🏛️';
      case 'beauty': return '💄';
      default: return '📅';
    }
  };

  function renderBooking({ item }: { item: Booking }) {
    return (
      <TouchableOpacity style={styles.bookingCard} onPress={() => openBookingDetail(item)}>
        <View style={styles.bookingHeader}>
          <View style={styles.bookingTypeContainer}>
            <Text style={styles.bookingTypeIcon}>{getBookingTypeIcon(item.bookingType)}</Text>
            <View>
              <Text style={styles.bookingNumber}>#{item.bookingNumber}</Text>
              <Text style={styles.bookingType}>{formatStatus(item.bookingType || 'booking')}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status] || '#64748b'}20` }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#64748b' }]}>
              {formatStatus(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetails}>
          <View style={styles.detailRow}>
            <User color="#94a3b8" size={14} />
            <Text style={styles.detailText}>{item.customer?.fullName || 'Customer'}</Text>
          </View>
          {item.eventDate && (
            <View style={styles.detailRow}>
              <Calendar color="#94a3b8" size={14} />
              <Text style={styles.detailText}>
                {new Date(item.eventDate).toLocaleDateString()}
                {item.startTime ? ` at ${item.startTime}` : ''}
              </Text>
            </View>
          )}
          {item.guestCount && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>👥 {item.guestCount} guests</Text>
            </View>
          )}
        </View>

        <View style={styles.bookingFooter}>
          <Text style={styles.bookingAmount}>{formatPrice(Number(item.totalAmount))}</Text>
          {item.status === 'pending' && (
            <View style={styles.actions}>
              <TouchableOpacity style={styles.declineBtn} onPress={() => setStatus(item.id, 'cancelled')}>
                <XCircle color="#ef4444" size={18} />
                <Text style={styles.declineText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={() => setStatus(item.id, 'confirmed')}>
                <CheckCircle color="#fff" size={18} />
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === item.key && styles.activeTab]}
            onPress={() => setActiveTab(item.key)}
          >
            <Text style={[styles.tabText, activeTab === item.key && styles.activeTabText]}>
              {item.label}
            </Text>
            {statusCounts[item.key] != null && statusCounts[item.key] > 0 && (
              <View style={[styles.tabBadge, activeTab === item.key && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, activeTab === item.key && styles.activeTabBadgeText]}>
                  {statusCounts[item.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Calendar color="#94a3b8" size={48} />
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptyText}>Bookings will appear here</Text>
          </View>
        }
        renderItem={renderBooking}
      />

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Booking #{selectedBooking?.bookingNumber}</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <View style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Booking Details</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>
                      {getBookingTypeIcon(selectedBooking.bookingType)} {formatStatus(selectedBooking.bookingType || 'booking')}
                    </Text>
                  </View>
                  {selectedBooking.eventDate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Date</Text>
                      <Text style={styles.detailValue}>
                        {new Date(selectedBooking.eventDate).toLocaleDateString()}
                        {selectedBooking.startTime ? ` at ${selectedBooking.startTime}` : ''}
                      </Text>
                    </View>
                  )}
                  {selectedBooking.guestCount && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Guests</Text>
                      <Text style={styles.detailValue}>{selectedBooking.guestCount}</Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Amount</Text>
                    <Text style={[styles.detailValue, styles.detailAmount]}>
                      {formatPrice(Number(selectedBooking.totalAmount))}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Customer</Text>
                  <Text style={styles.customerName}>{selectedBooking.customer?.fullName || 'Customer'}</Text>
                  {selectedBooking.customer?.phone && (
                    <Text style={styles.customerPhone}>{selectedBooking.customer.phone}</Text>
                  )}
                </View>

                {selectedBooking.requirements && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Requirements</Text>
                    <Text style={styles.requirementsText}>{selectedBooking.requirements}</Text>
                  </View>
                )}

                {selectedBooking.status === 'pending' && (
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.declineModalBtn}
                      onPress={() => setStatus(selectedBooking.id, 'cancelled')}
                    >
                      <Text style={styles.declineModalText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmModalBtn}
                      onPress={() => setStatus(selectedBooking.id, 'confirmed')}
                    >
                      <Text style={styles.confirmModalText}>Confirm Booking</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    gap: 6,
  },
  activeTab: { backgroundColor: '#0f172a' },
  tabText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  activeTabText: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  activeTabBadge: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#0f172a' },
  activeTabBadgeText: { color: '#fff' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 16 },
  emptyText: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingTypeIcon: { fontSize: 24 },
  bookingNumber: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  bookingType: { color: '#64748b', fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  bookingDetails: { marginTop: 12 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: { color: '#475569', fontSize: 14 },
  bookingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  bookingAmount: { fontWeight: '700', color: '#059669', fontSize: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  declineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
  },
  declineText: { color: '#ef4444', fontWeight: '600', fontSize: 13 },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00B241',
  },
  confirmText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalBody: { padding: 16 },
  detailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  detailCardTitle: { fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: { color: '#64748b' },
  detailValue: { fontWeight: '600', color: '#0f172a' },
  detailAmount: { fontSize: 18, color: '#059669' },
  customerName: { fontWeight: '600', color: '#0f172a' },
  customerPhone: { color: '#64748b', marginTop: 4 },
  requirementsText: { color: '#475569', lineHeight: 20 },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  declineModalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
  },
  declineModalText: { color: '#ef4444', fontWeight: '600' },
  confirmModalBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#00B241',
    alignItems: 'center',
  },
  confirmModalText: { color: '#fff', fontWeight: '600' },
});
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  fetchMySubscriptions,
  cancelSubscription,
  formatStatus,
} from '../../lib/api';
import { DoorliColors } from '../../constants/colors';
import { RefreshCw, ArrowLeft, XCircle, Pause } from 'lucide-react-native';
import React from 'react';

const PRIMARY = DoorliColors.primary;

export default function SubscriptionsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['my-subscriptions'],
    queryFn: fetchMySubscriptions,
  });

  async function handleCancel(id: string) {
    Alert.alert('Cancel subscription?', 'You can create a new one anytime.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelSubscription(id);
            queryClient.invalidateQueries({ queryKey: ['my-subscriptions'] });
          } catch (e: unknown) {
            Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Subscriptions</Text>
      </View>
      <Text style={styles.subtitle}>Recurring grocery & essentials delivery</Text>

      {isLoading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(s) => s.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <RefreshCw color={DoorliColors.textDim} size={40} />
              </View>
              <Text style={styles.emptyTitle}>No active subscriptions</Text>
              <Text style={styles.emptyText}>
                Add items from a grocery shop to start a recurring delivery.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.freqBadge}>
                  <RefreshCw color={DoorliColors.teal} size={14} />
                  <Text style={styles.freqText}>{item.frequency}</Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: item.isActive ? DoorliColors.success : DoorliColors.danger }]}>
                  <Text style={styles.statusText}>{item.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>
              <Text style={styles.addr} numberOfLines={2}>{item.deliveryAddress}</Text>
              <Text style={styles.meta}>
                Next delivery: {new Date(item.nextDeliveryAt).toLocaleDateString()}
              </Text>
              {item.items && item.items.length > 0 && (
                <Text style={styles.itemCount}>{item.items.length} item{item.items.length !== 1 ? 's' : ''}</Text>
              )}
              {item.isActive && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(item.id)}>
                  <XCircle color={DoorliColors.danger} size={16} />
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DoorliColors.navy },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: DoorliColors.text },
  subtitle: { color: DoorliColors.textDim, paddingHorizontal: 20, marginBottom: 16 },
  list: { paddingBottom: 100, paddingHorizontal: 16 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  freqBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(29,158,117,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  freqText: { color: DoorliColors.teal, fontWeight: '700', textTransform: 'capitalize', fontSize: 13 },
  statusDot: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: { color: '#fff', fontWeight: '600', fontSize: 11 },
  addr: { color: DoorliColors.text, fontSize: 14, lineHeight: 20 },
  meta: { color: DoorliColors.textDim, marginTop: 8, fontSize: 13 },
  itemCount: { color: DoorliColors.textMuted, marginTop: 4, fontSize: 12, fontWeight: '500' },
  cancelBtn: {
    marginTop: 14,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(242,102,139,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,102,139,0.25)',
  },
  cancelText: { color: DoorliColors.danger, fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 64, gap: 12, paddingHorizontal: 24 },
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
  emptyTitle: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  emptyText: { color: DoorliColors.textMuted, textAlign: 'center', lineHeight: 20 },
});

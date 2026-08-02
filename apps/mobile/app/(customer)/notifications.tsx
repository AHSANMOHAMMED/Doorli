import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Bell, BellRing } from 'lucide-react-native';
import { DoorliColors } from '../../constants/colors';
import React from 'react';

const PRIMARY = DoorliColors.primary;

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data?.data?.items ?? res.data?.data ?? [];
    },
    refetchInterval: 15000,
  });

  async function markRead(id: string) {
    await apiClient.patch(`/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function markAllRead() {
    await apiClient.patch('/notifications/read-all');
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={DoorliColors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Recent</Text>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(n: { id: string }) => n.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyIconWrapper}>
                  <Bell color={DoorliColors.textDim} size={32} />
                </View>
                <Text style={styles.emptyTitle}>You're all caught up</Text>
                <Text style={styles.emptyText}>We'll let you know when there's an update.</Text>
              </View>
            }
            renderItem={({
              item,
            }: {
              item: { id: string; title: string; body: string; isRead: boolean; sentAt: string };
            }) => (
              <TouchableOpacity
                style={[styles.card, !item.isRead && styles.unread]}
                onPress={() => markRead(item.id)}
                activeOpacity={0.8}
              >
                <View style={[styles.iconWrapper, !item.isRead ? { backgroundColor: PRIMARY } : { backgroundColor: 'rgba(255,255,255,0.06)' }]}>
                  {!item.isRead ? <BellRing color="#ffffff" size={20} /> : <Bell color={DoorliColors.textDim} size={20} />}
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, !item.isRead && styles.unreadText]} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.time}>
                      {new Date(item.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
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
  title: { fontSize: 18, fontWeight: '700', color: DoorliColors.text },
  content: { flex: 1, paddingHorizontal: 16 },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: DoorliColors.text },
  markAll: { color: PRIMARY, fontWeight: '600', fontSize: 14 },
  list: { paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrapper: {
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
  emptyTitle: { color: DoorliColors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { color: DoorliColors.textMuted, fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  card: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  unread: {
    borderColor: 'rgba(24,95,165,0.3)',
    backgroundColor: 'rgba(24,95,165,0.06)',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: { color: DoorliColors.textMuted, fontWeight: '600', fontSize: 14, flex: 1, marginRight: 8 },
  unreadText: { color: DoorliColors.text, fontWeight: '700' },
  cardBody: { color: DoorliColors.textDim, fontSize: 13, lineHeight: 18 },
  time: { color: DoorliColors.textDim, fontSize: 11, fontWeight: '500' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PRIMARY,
    position: 'absolute',
    top: 16,
    right: 16,
  },
});

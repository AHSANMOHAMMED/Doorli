import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';
import { useRouter, Stack } from 'expo-router';
import { ArrowLeft, Bell, BellRing } from 'lucide-react-native';

const PRIMARY = '#00B241';
const ON_SURFACE = '#002b5b';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/users/notifications');
      return res.data?.data ?? [];
    },
    refetchInterval: 15000,
  });

  async function markRead(id: string) {
    await apiClient.patch(`/users/notifications/${id}/read`);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function markAllRead() {
    await apiClient.patch('/users/notifications/read-all');
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft color={ON_SURFACE} size={24} />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        <View style={{ width: 40 }} />
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
                  <Bell color="#9ca3af" size={32} />
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
                <View style={[styles.iconWrapper, !item.isRead ? { backgroundColor: PRIMARY } : { backgroundColor: '#f3f4f6' }]}>
                  {!item.isRead ? <BellRing color="#ffffff" size={20} /> : <Bell color="#9ca3af" size={20} />}
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitle, !item.isRead && styles.unreadText]}>{item.title}</Text>
                    <Text style={styles.time}>{new Date(item.sentAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ON_SURFACE,
  },
  markAll: { color: PRIMARY, fontWeight: '600', fontSize: 14 },
  list: { paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: 80, gap: 12 },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { color: ON_SURFACE, fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#6b7280', fontSize: 14, textAlign: 'center', paddingHorizontal: 32 },
  card: { 
    flexDirection: 'row',
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
  unread: { 
    borderColor: PRIMARY,
    backgroundColor: 'rgba(0, 178, 65, 0.02)',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: { color: '#4b5563', fontWeight: '600', fontSize: 15, flex: 1, marginRight: 8 },
  unreadText: { color: ON_SURFACE, fontWeight: '700' },
  cardBody: { color: '#6b7280', fontSize: 14, lineHeight: 20 },
  time: { color: '#9ca3af', fontSize: 12, fontWeight: '500' },
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

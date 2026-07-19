import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';

export default function NotificationsScreen() {
  const queryClient = useQueryClient();
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
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator color="#0ea5e9" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(n: { id: string }) => n.id}
          ListEmptyComponent={<Text style={styles.empty}>No notifications yet</Text>}
          renderItem={({
            item,
          }: {
            item: { id: string; title: string; body: string; isRead: boolean; sentAt: string };
          }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.unread]}
              onPress={() => markRead(item.id)}
            >
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
              <Text style={styles.time}>{new Date(item.sentAt).toLocaleString()}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  markAll: { color: '#0ea5e9', fontWeight: '600', fontSize: 13 },
  empty: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 48 },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', padding: 14, borderRadius: 12, marginBottom: 10 },
  unread: { borderWidth: 1, borderColor: 'rgba(14,165,233,0.5)' },
  cardTitle: { color: '#fff', fontWeight: '700' },
  cardBody: { color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  time: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 8 },
});

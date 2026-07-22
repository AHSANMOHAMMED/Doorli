import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../lib/axios';

type Job = {
  id: string;
  title: string;
  serviceType: string;
  status: string;
  addressLine?: string | null;
};

export default function VendorServiceJobs() {
  const qc = useQueryClient();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-service-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/service-requests/my-jobs');
      return (res.data?.data ?? []) as Job[];
    },
  });

  async function act(id: string, action: string) {
    try {
      await apiClient.patch(`/service-requests/${id}/${action}`);
      qc.invalidateQueries({ queryKey: ['vendor-service-jobs'] });
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Service jobs</Text>
      {isLoading ? (
        <ActivityIndicator color="#00B241" />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(i) => i.id}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.empty}>No jobs assigned</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.num}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.serviceType} · {item.status}
              </Text>
              {item.addressLine ? <Text style={styles.meta}>{item.addressLine}</Text> : null}
              <View style={styles.row}>
                {item.status === 'open' || item.status === 'assigned' ? (
                  <TouchableOpacity style={styles.btn} onPress={() => act(item.id, 'accept')}>
                    <Text style={styles.btnText}>Accept</Text>
                  </TouchableOpacity>
                ) : null}
                {item.status === 'assigned' || item.status === 'accepted' ? (
                  <TouchableOpacity style={styles.btn} onPress={() => act(item.id, 'start')}>
                    <Text style={styles.btnText}>Start</Text>
                  </TouchableOpacity>
                ) : null}
                {item.status === 'in_progress' ? (
                  <TouchableOpacity style={styles.btn} onPress={() => act(item.id, 'complete')}>
                    <Text style={styles.btnText}>Complete</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#0f172a' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  num: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
  meta: { color: '#64748b', marginTop: 4, fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  btn: {
    backgroundColor: '#00B241',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600' },
});

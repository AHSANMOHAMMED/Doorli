import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VendorCard } from '../../components/VendorCard';
import { fetchVendors } from '../../lib/api';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendors-search'],
    queryFn: async () => {
      const res = await fetchVendors();
      return res;
    },
  });

  const filtered = (data ?? []).filter(
      (v: any) => v.businessName.toLowerCase().includes(query.toLowerCase()) ||
      v.category.toLowerCase().includes(query.toLowerCase()) ||
      (v.city?.toLowerCase().includes(query.toLowerCase()) ?? false),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TextInput
        style={styles.input}
        placeholder="Search by shop name, category, or city..."
        value={query}
        onChangeText={setQuery}
        autoFocus
      />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#2563eb" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              onPress={() => router.push(`/(customer)/vendor/${item.id}`)}
            />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No results for "{query}"</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  input: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  loader: { marginTop: 40 },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 40 },
});

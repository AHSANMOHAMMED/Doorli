import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { VendorCategory } from '@doorli/types';
import { VendorCard } from '../../components/VendorCard';
import { GlassInput } from '../../components/GlassInput';
import { CategoryTabs } from '../../components/CategoryTabs';
import { fetchVendors } from '../../lib/api';
import { Search } from 'lucide-react-native';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; q?: string }>();
  const [query, setQuery] = useState(params.q ?? '');
  const [category, setCategory] = useState<VendorCategory | 'all'>(
    (params.category as VendorCategory) || 'all',
  );

  const { data, isLoading } = useQuery({
    queryKey: ['vendors-search', category],
    queryFn: async () => fetchVendors(category),
  });

  const filtered = (data ?? []).filter(
    (v) =>
      !query ||
      v.businessName.toLowerCase().includes(query.toLowerCase()) ||
      v.category.toLowerCase().includes(query.toLowerCase()) ||
      (v.city?.toLowerCase().includes(query.toLowerCase()) ?? false),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Search</Text>
      <View style={styles.inputWrap}>
        <GlassInput
          icon={<Search color="#00B241" size={20} />}
          placeholder="Shop name, category, or city..."
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
      </View>
      <CategoryTabs selected={category} onSelect={setCategory} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#00B241" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <VendorCard
              vendor={item}
              onPress={() => router.push(`/(customer)/vendor/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {query ? `No results for "${query}"` : 'No shops in this category'}
            </Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#002b5b',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  inputWrap: { paddingHorizontal: 16, marginTop: 12 },
  loader: { marginTop: 40 },
  list: { paddingBottom: 100 },
  empty: { textAlign: 'center', color: '#6b7280', marginTop: 40, padding: 16 },
});

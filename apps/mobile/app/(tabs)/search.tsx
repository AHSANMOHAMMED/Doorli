import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search as SearchIcon } from 'lucide-react-native';
import { fetchVendors, type Vendor } from '../../lib/api';
import { VendorCard } from '../../components/VendorCard';

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['vendors-tabs-search'],
    queryFn: () => fetchVendors('all'),
  });

  const filtered = (data ?? []).filter(
    (v) =>
      !query ||
      v.businessName.toLowerCase().includes(query.toLowerCase()) ||
      v.category.toLowerCase().includes(query.toLowerCase()) ||
      (v.city?.toLowerCase().includes(query.toLowerCase()) ?? false),
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <SearchIcon color="#9ca3af" size={20} style={styles.icon} />
          <TextInput 
            style={styles.searchInput} 
            placeholder="Search stores, dishes, products..." 
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>
      {isLoading ? (
        <ActivityIndicator color="#00B241" style={{ marginTop: 40 }} />
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
          ListHeaderComponent={
            query ? null : (
              <Text style={styles.subtitle}>All Shops</Text>
            )
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {query ? `No results for "${query}"` : 'No shops available'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  icon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
});

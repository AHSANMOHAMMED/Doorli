import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingBag, UtensilsCrossed, Car, AlertTriangle, Search } from 'lucide-react-native';

const CATEGORIES = [
  { id: '1', name: 'Grocery', icon: ShoppingBag, color: '#3b82f6', bg: '#eff6ff' },
  { id: '2', name: 'Food', icon: UtensilsCrossed, color: '#f97316', bg: '#fff7ed' },
  { id: '3', name: 'Rides', icon: Car, color: '#a855f7', bg: '#faf5ff' },
  { id: '4', name: 'SOS', icon: AlertTriangle, color: '#ef4444', bg: '#fef2f2' },
];

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>Ahsan</Text>
        </View>

        <TouchableOpacity style={styles.searchBar}>
          <Search color="#9ca3af" size={20} style={{ marginRight: 12 }} />
          <Text style={styles.searchPlaceholder}>What do you need today?</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Explore Doorli</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity key={cat.id} style={styles.categoryCard}>
              <View style={[styles.iconContainer, { backgroundColor: cat.bg }]}>
                <cat.icon color={cat.color} size={28} />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    marginBottom: 28,
  },
  greeting: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  username: {
    color: '#111827',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 16,
    marginBottom: 36,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 20,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f9fafb',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryName: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

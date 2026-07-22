import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Landmark, FileCheck, AlertCircle } from 'lucide-react-native';

export default function GovTechScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Government Services</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.heroCard}>
          <Landmark color="#10b981" size={48} />
          <Text style={styles.heroTitle}>E-Government Portal</Text>
          <Text style={styles.heroDesc}>
            Access city services, pay taxes, apply for permits, and file complaints easily.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>My Services</Text>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Landmark color="#10b981" size={28} />
            </View>
            <Text style={styles.itemTitle}>Tax Payments</Text>
            <Text style={styles.itemDesc}>Pay property & local taxes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <FileCheck color="#00B241" size={28} />
            </View>
            <Text style={styles.itemTitle}>Permits & Licenses</Text>
            <Text style={styles.itemDesc}>Apply and renew</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <AlertCircle color="#f59e0b" size={28} />
            </View>
            <Text style={styles.itemTitle}>File a Complaint</Text>
            <Text style={styles.itemDesc}>Report local issues</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem}>
            <View style={[styles.iconWrap, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
              <FileText color="#8b5cf6" size={28} />
            </View>
            <Text style={styles.itemTitle}>Document Vault</Text>
            <Text style={styles.itemDesc}>Secure digital IDs</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { padding: 16, gap: 24, paddingBottom: 40 },
  heroCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#10b981' },
  heroDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  itemDesc: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
});

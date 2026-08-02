import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, FileText, Landmark, FileCheck, AlertCircle } from 'lucide-react-native';
import { apiClient } from '../../../lib/axios';

interface GovService {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  isActive: boolean;
}

const ICON_MAP: Record<string, { color: string; Icon: typeof Landmark }> = {
  tax: { color: '#10b981', Icon: Landmark },
  permit: { color: '#00B241', Icon: FileCheck },
  complaint: { color: '#f59e0b', Icon: AlertCircle },
  document: { color: '#8b5cf6', Icon: FileText },
  default: { color: '#6b7280', Icon: FileText },
};

function getIcon(service: GovService) {
  const cat = (service.category ?? service.name ?? '').toLowerCase();
  if (cat.includes('tax')) return ICON_MAP.tax;
  if (cat.includes('permit') || cat.includes('license')) return ICON_MAP.permit;
  if (cat.includes('complaint') || cat.includes('report')) return ICON_MAP.complaint;
  if (cat.includes('document') || cat.includes('id')) return ICON_MAP.document;
  return ICON_MAP.default;
}

export default function GovTechScreen() {
  const router = useRouter();
  const [services, setServices] = useState<GovService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get('/gov/services');
      const items = (res.data?.data?.items ?? res.data?.data ?? []) as GovService[];
      setServices(items.filter((s) => s.isActive));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Government Services</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />}
      >
        <View style={styles.heroCard}>
          <Landmark color="#10b981" size={48} />
          <Text style={styles.heroTitle}>E-Government Portal</Text>
          <Text style={styles.heroDesc}>
            Access city services, pay taxes, apply for permits, and file complaints easily.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorCard}>
            <AlertCircle color="#ef4444" size={32} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchServices}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : services.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No government services available right now.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Available Services</Text>
            <View style={styles.grid}>
              {services.map((service) => {
                const { Icon, color } = getIcon(service);
                return (
                  <TouchableOpacity
                    key={service.id}
                    style={styles.gridItem}
                    onPress={() =>
                      router.push({
                        pathname: '/(customer)/gov/[id]',
                        params: { id: service.id },
                      } as any)
                    }
                  >
                    <View style={[styles.iconWrap, { backgroundColor: `${color}22` }]}>
                      <Icon color={color} size={28} />
                    </View>
                    <Text style={styles.itemTitle}>{service.name}</Text>
                    {service.description ? (
                      <Text style={styles.itemDesc} numberOfLines={2}>
                        {service.description}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
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
  errorCard: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  errorText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryBtnText: {
    color: '#10b981',
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});

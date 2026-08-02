import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AlertTriangle, Phone, ShieldAlert, ChevronLeft, Clock } from 'lucide-react-native';
import { apiClient } from '../../../lib/axios';

interface Incident {
  id: string;
  type: string;
  status: string;
  description?: string | null;
  address?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function EmergencyScreen() {
  const router = useRouter();
  const [sosActive, setSosActive] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchIncidents = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get('/incidents');
      const items = (res.data?.data?.items ?? res.data?.data ?? []) as Incident[];
      setIncidents(items);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load incidents');
    } finally {
      setLoadingIncidents(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchIncidents();
  };

  const triggerSOS = () => {
    Alert.alert(
      'Trigger SOS?',
      'This will alert nearby responders, community leaders, and emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'ACTIVATE',
          style: 'destructive',
          onPress: async () => {
            setSosLoading(true);
            try {
              await apiClient.post('/sos');
              setSosActive(true);
              Alert.alert('SOS Activated', 'Emergency responders have been notified.');
            } catch (e: unknown) {
              Alert.alert('SOS Failed', e instanceof Error ? e.message : 'Could not trigger SOS. Please try again.');
            } finally {
              setSosLoading(false);
            }
          },
        },
      ],
    );
  };

  const cancelSOS = () => {
    Alert.alert('Cancel SOS?', 'Are you safe now?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, cancel',
        style: 'default',
        onPress: async () => {
          try {
            await apiClient.post('/sos/cancel');
          } catch {
            // best-effort cancel
          }
          setSosActive(false);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ChevronLeft color="#fff" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Center</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ef4444" />}
      >
        <View style={styles.sosCard}>
          <Text style={styles.sosTitle}>Emergency SOS</Text>
          <Text style={styles.sosDesc}>
            Press to immediately share your location with nearby responders and trusted contacts.
          </Text>

          <TouchableOpacity
            style={[styles.sosButton, sosActive && styles.sosButtonActive]}
            onLongPress={sosActive ? cancelSOS : triggerSOS}
            delayLongPress={800}
            disabled={sosLoading}
          >
            {sosLoading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <ShieldAlert color="#fff" size={48} />
            )}
            <Text style={styles.sosButtonText}>
              {sosActive ? 'SOS ACTIVE\nLong press to cancel' : 'HOLD FOR SOS'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.actionRow} onPress={() => {}}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <AlertTriangle color="#ef4444" size={24} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Report an Incident</Text>
              <Text style={styles.actionDesc}>Fire, accident, or suspicious activity</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionRow} onPress={() => {}}>
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Phone color="#00B241" size={24} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Emergency Contacts</Text>
              <Text style={styles.actionDesc}>Manage your trusted contacts</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incidents</Text>

          {loadingIncidents ? (
            <ActivityIndicator size="large" color="#ef4444" style={{ marginTop: 20 }} />
          ) : error ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchIncidents}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : incidents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No active incidents. Stay safe!</Text>
            </View>
          ) : (
            incidents.map((incident) => (
              <View key={incident.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <AlertTriangle
                    color={incident.status === 'resolved' ? '#10b981' : '#f59e0b'}
                    size={16}
                  />
                  <Text style={styles.alertType}>
                    {incident.type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Text>
                  <View style={styles.alertMeta}>
                    <Clock color="rgba(255,255,255,0.5)" size={12} />
                    <Text style={styles.alertTime}>{formatTimeAgo(incident.createdAt)}</Text>
                  </View>
                </View>
                {incident.description ? (
                  <Text style={styles.alertBody}>{incident.description}</Text>
                ) : null}
                {incident.address ? (
                  <Text style={styles.alertAddress}>{incident.address}</Text>
                ) : null}
                <View style={[styles.statusBadge, incident.status === 'resolved' && styles.statusBadgeResolved]}>
                  <Text style={styles.statusBadgeText}>{incident.status}</Text>
                </View>
              </View>
            ))
          )}
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
  sosCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  sosTitle: { fontSize: 24, fontWeight: '800', color: '#ef4444', marginBottom: 8 },
  sosDesc: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  sosButtonActive: {
    backgroundColor: '#991b1b',
  },
  sosButtonText: {
    color: '#fff',
    fontWeight: '800',
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
  section: { gap: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 4 },
  actionDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  alertCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center' },
  alertType: { color: '#f59e0b', fontWeight: '700', marginLeft: 8, flex: 1 },
  alertMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  alertTime: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  alertBody: { color: 'rgba(255,255,255,0.8)', lineHeight: 20 },
  alertAddress: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  statusBadgeResolved: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusBadgeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
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
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  retryBtnText: {
    color: '#ef4444',
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

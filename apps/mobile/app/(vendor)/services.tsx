import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wrench, Clock, MapPin, User, X, CheckCircle, Play, Check } from 'lucide-react-native';
import { apiClient } from '../../lib/axios';
import { formatStatus } from '../../lib/api';

type Service = {
  id: string;
  title: string;
  serviceType: string;
  status: string;
  description?: string;
  addressLine?: string;
  offeredRate?: number;
  scheduledAt?: string;
  customer?: { fullName?: string; phone?: string };
};

type ServiceType = {
  id: string;
  name: string;
  description?: string;
  basePrice: number;
  isActive: boolean;
};

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'assigned', label: 'Assigned' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'completed', label: 'Completed' },
];

const STATUS_COLORS: Record<string, string> = {
  open: '#f59e0b',
  assigned: '#3b82f6',
  accepted: '#8b5cf6',
  in_progress: '#00B241',
  completed: '#10b981',
  cancelled: '#ef4444',
};

export default function VendorServiceJobs() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showServiceTypes, setShowServiceTypes] = useState(false);
  const [newServiceType, setNewServiceType] = useState({ name: '', basePrice: '', description: '' });
  const [saving, setSaving] = useState(false);

  const { data: jobs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['vendor-service-jobs'],
    queryFn: async () => {
      const res = await apiClient.get('/service-requests/my-jobs');
      return (res.data?.data ?? []) as Service[];
    },
  });

  const { data: serviceTypes } = useQuery({
    queryKey: ['vendor-service-types'],
    queryFn: async () => {
      const res = await apiClient.get('/service-types');
      return (res.data?.data ?? []) as ServiceType[];
    },
  });

  const filteredJobs = (jobs ?? []).filter((job) => {
    return activeTab === 'all' || job.status === activeTab;
  });

  const getStatusCounts = () => {
    const counts: Record<string, number> = { all: jobs?.length ?? 0 };
    jobs?.forEach((job) => {
      counts[job.status] = (counts[job.status] || 0) + 1;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  async function act(id: string, action: string) {
    try {
      await apiClient.patch(`/service-requests/${id}/${action}`);
      qc.invalidateQueries({ queryKey: ['vendor-service-jobs'] });
      setShowDetail(false);
      if (action === 'complete') {
        Alert.alert('Completed', 'Service job marked as completed');
      }
    } catch (e) {
      Alert.alert('Failed', e instanceof Error ? e.message : 'Try again');
    }
  }

  async function addServiceType() {
    if (!newServiceType.name || !newServiceType.basePrice) {
      Alert.alert('Missing fields', 'Name and price are required');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/service-types', {
        name: newServiceType.name,
        basePrice: parseFloat(newServiceType.basePrice),
        description: newServiceType.description || undefined,
      });
      qc.invalidateQueries({ queryKey: ['vendor-service-types'] });
      setShowServiceTypes(false);
      setNewServiceType({ name: '', basePrice: '', description: '' });
      Alert.alert('Success', 'Service type added');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to add service type');
    } finally {
      setSaving(false);
    }
  }

  function openServiceDetail(service: Service) {
    setSelectedService(service);
    setShowDetail(true);
  }

  function getActionButtons(status: string) {
    switch (status) {
      case 'open':
      case 'assigned':
        return [{ label: 'Accept', action: 'accept', icon: CheckCircle }];
      case 'assigned':
        return [{ label: 'Start', action: 'start', icon: Play }];
      case 'in_progress':
        return [{ label: 'Complete', action: 'complete', icon: Check }];
      default:
        return [];
    }
  }

  function renderJob({ item }: { item: Service }) {
    const actions = getActionButtons(item.status);

    return (
      <TouchableOpacity style={styles.jobCard} onPress={() => openServiceDetail(item)}>
        <View style={styles.jobHeader}>
          <View style={styles.jobTypeContainer}>
            <Wrench color="#0d9488" size={20} />
            <View>
              <Text style={styles.jobTitle}>{item.title}</Text>
              <Text style={styles.jobType}>{formatStatus(item.serviceType)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLORS[item.status] || '#64748b'}20` }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] || '#64748b' }]}>
              {formatStatus(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.jobDetails}>
          {item.customer?.fullName && (
            <View style={styles.detailRow}>
              <User color="#94a3b8" size={14} />
              <Text style={styles.detailText}>{item.customer.fullName}</Text>
            </View>
          )}
          {item.addressLine && (
            <View style={styles.detailRow}>
              <MapPin color="#94a3b8" size={14} />
              <Text style={styles.detailText} numberOfLines={1}>{item.addressLine}</Text>
            </View>
          )}
          {item.scheduledAt && (
            <View style={styles.detailRow}>
              <Clock color="#94a3b8" size={14} />
              <Text style={styles.detailText}>
                {new Date(item.scheduledAt).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {actions.length > 0 && (
          <View style={styles.jobActions}>
            {actions.map((action) => (
              <TouchableOpacity
                key={action.action}
                style={[styles.actionBtn, action.action === 'complete' && styles.completeBtn]}
                onPress={() => act(item.id, action.action)}
              >
                <action.icon color="#fff" size={16} />
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Service Jobs</Text>
        <TouchableOpacity style={styles.manageBtn} onPress={() => setShowServiceTypes(true)}>
          <Text style={styles.manageBtnText}>Manage Services</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={STATUS_TABS}
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeTab === item.key && styles.activeTab]}
            onPress={() => setActiveTab(item.key)}
          >
            <Text style={[styles.tabText, activeTab === item.key && styles.activeTabText]}>
              {item.label}
            </Text>
            {statusCounts[item.key] != null && statusCounts[item.key] > 0 && (
              <View style={[styles.tabBadge, activeTab === item.key && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, activeTab === item.key && styles.activeTabBadgeText]}>
                  {statusCounts[item.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Wrench color="#94a3b8" size={48} />
            <Text style={styles.emptyTitle}>No service jobs found</Text>
            <Text style={styles.emptyText}>Service requests will appear here</Text>
          </View>
        }
        renderItem={renderJob}
      />

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Job Details</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {selectedService && (
              <View style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Service Information</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Title</Text>
                    <Text style={styles.detailValue}>{selectedService.title}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Type</Text>
                    <Text style={styles.detailValue}>{formatStatus(selectedService.serviceType)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={styles.historyStatus}>
                      <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[selectedService.status] }]} />
                      <Text style={styles.detailValue}>{formatStatus(selectedService.status)}</Text>
                    </View>
                  </View>
                  {selectedService.offeredRate && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rate</Text>
                      <Text style={[styles.detailValue, styles.detailAmount]}>
                        LKR {selectedService.offeredRate}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailCard}>
                  <Text style={styles.detailCardTitle}>Customer</Text>
                  <Text style={styles.customerName}>{selectedService.customer?.fullName || 'Customer'}</Text>
                  {selectedService.customer?.phone && (
                    <Text style={styles.customerPhone}>{selectedService.customer.phone}</Text>
                  )}
                </View>

                {selectedService.addressLine && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Location</Text>
                    <Text style={styles.addressText}>{selectedService.addressLine}</Text>
                  </View>
                )}

                {selectedService.description && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Description</Text>
                    <Text style={styles.descriptionText}>{selectedService.description}</Text>
                  </View>
                )}

                {selectedService.scheduledAt && (
                  <View style={styles.detailCard}>
                    <Text style={styles.detailCardTitle}>Scheduled</Text>
                    <Text style={styles.detailValue}>
                      {new Date(selectedService.scheduledAt).toLocaleString()}
                    </Text>
                  </View>
                )}

                <View style={styles.modalActions}>
                  {getActionButtons(selectedService.status).map((action) => (
                    <TouchableOpacity
                      key={action.action}
                      style={[styles.modalActionBtn, action.action === 'complete' && styles.completeModalBtn]}
                      onPress={() => act(selectedService.id, action.action)}
                    >
                      <action.icon color="#fff" size={18} />
                      <Text style={styles.modalActionText}>{action.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showServiceTypes} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Service Types</Text>
              <TouchableOpacity onPress={() => setShowServiceTypes(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.sectionTitle}>Add New Service Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Service name *"
                value={newServiceType.name}
                onChangeText={(v) => setNewServiceType({ ...newServiceType, name: v })}
              />
              <TextInput
                style={styles.input}
                placeholder="Base price *"
                keyboardType="numeric"
                value={newServiceType.basePrice}
                onChangeText={(v) => setNewServiceType({ ...newServiceType, basePrice: v })}
              />
              <TextInput
                style={styles.input}
                placeholder="Description (optional)"
                value={newServiceType.description}
                onChangeText={(v) => setNewServiceType({ ...newServiceType, description: v })}
                multiline
              />
              <TouchableOpacity
                style={[styles.addServiceBtn, saving && { opacity: 0.5 }]}
                onPress={addServiceType}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.addServiceBtnText}>Add Service Type</Text>
                )}
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Your Service Types</Text>
              {serviceTypes?.length === 0 ? (
                <Text style={styles.emptyServiceTypes}>No service types configured</Text>
              ) : (
                serviceTypes?.map((st) => (
                  <View key={st.id} style={styles.serviceTypeCard}>
                    <View style={styles.serviceTypeInfo}>
                      <Text style={styles.serviceTypeName}>{st.name}</Text>
                      <Text style={styles.serviceTypePrice}>LKR {st.basePrice}</Text>
                    </View>
                    {st.description && (
                      <Text style={styles.serviceTypeDesc}>{st.description}</Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  manageBtn: { backgroundColor: '#0d9488', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  manageBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#e2e8f0',
    gap: 6,
  },
  activeTab: { backgroundColor: '#0f172a' },
  tabText: { fontWeight: '600', color: '#64748b', fontSize: 13 },
  activeTabText: { color: '#fff' },
  tabBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  activeTabBadge: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabBadgeText: { fontSize: 11, fontWeight: '700', color: '#0f172a' },
  activeTabBadgeText: { color: '#fff' },
  listContent: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 16 },
  emptyText: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  jobCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  jobTitle: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  jobType: { color: '#64748b', fontSize: 13 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '600' },
  jobDetails: { marginTop: 12 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: { color: '#475569', fontSize: 14, flex: 1 },
  jobActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0d9488',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  completeBtn: { backgroundColor: '#059669' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  modalBody: { padding: 16 },
  detailCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  detailCardTitle: { fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  detailLabel: { color: '#64748b' },
  detailValue: { fontWeight: '600', color: '#0f172a' },
  detailAmount: { fontSize: 18, color: '#059669' },
  historyStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  customerName: { fontWeight: '600', color: '#0f172a' },
  customerPhone: { color: '#64748b', marginTop: 4 },
  addressText: { color: '#475569', lineHeight: 20 },
  descriptionText: { color: '#475569', lineHeight: 20 },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#0d9488',
  },
  completeModalBtn: { backgroundColor: '#059669' },
  modalActionText: { color: '#fff', fontWeight: '600' },
  sectionTitle: { fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  addServiceBtn: {
    backgroundColor: '#0d9488',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addServiceBtnText: { color: '#fff', fontWeight: '600' },
  emptyServiceTypes: { color: '#94a3b8', textAlign: 'center', marginTop: 20 },
  serviceTypeCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  serviceTypeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  serviceTypeName: { fontWeight: '600', color: '#0f172a' },
  serviceTypePrice: { fontWeight: '600', color: '#059669' },
  serviceTypeDesc: { color: '#64748b', fontSize: 13, marginTop: 4 },
});

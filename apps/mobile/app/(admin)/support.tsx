import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../lib/axios';

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  user: { id: string; fullName: string; email: string };
  responses: Array<{
    id: string;
    message: string;
    isInternal: boolean;
    createdAt: string;
    sender: { id: string; fullName: string; role: string };
  }>;
}

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'all';

const CATEGORY_COLORS: Record<string, string> = {
  general: '#64748b',
  billing: '#f59e0b',
  technical: '#3b82f6',
  order: '#00B241',
  delivery: '#8b5cf6',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: '#64748b',
  medium: '#f59e0b',
  high: '#f97316',
  urgent: '#ef4444',
};

export default function AdminSupport() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TicketStatus>('open');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState('medium');
  const flatListRef = useRef<FlatList>(null);

  const { data: ticketsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-support-tickets', activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== 'all') params.set('status', activeTab);
      const res = await apiClient.get(`/support/tickets?${params.toString()}`);
      return res.data?.data?.items ?? [];
    },
  });

  const { data: ticketDetail, refetch: refetchDetail } = useQuery({
    queryKey: ['admin-ticket-detail', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket) return null;
      const res = await apiClient.get(`/support/tickets/${selectedTicket.id}`);
      return res.data?.data;
    },
    enabled: !!selectedTicket,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      await apiClient.post(`/support/tickets/${ticketId}/respond`, { message });
    },
    onSuccess: () => {
      setReplyText('');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      refetchDetail();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      await apiClient.patch(`/support/tickets/${ticketId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
      refetchDetail();
      if (selectedTicket) {
        setSelectedTicket({ ...selectedTicket, status: '' });
      }
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/support/tickets', {
        subject: newSubject,
        description: newDescription,
        category: newCategory,
        priority: newPriority,
      });
    },
    onSuccess: () => {
      setCreateModalVisible(false);
      setNewSubject('');
      setNewDescription('');
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
    },
  });

  const tickets = (ticketsData ?? []) as Ticket[];
  const detail = ticketDetail as Ticket | null;

  const tabs: { key: TicketStatus; label: string }[] = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'all', label: 'All' },
  ];

  if (selectedTicket && detail) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedTicket(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#f8fafc" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.detailTitle} numberOfLines={1}>{detail.subject}</Text>
            <View style={styles.detailMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[detail.priority] + '20' }]}>
                <View style={[styles.priorityDot, { backgroundColor: PRIORITY_COLORS[detail.priority] }]} />
                <Text style={[styles.priorityText, { color: PRIORITY_COLORS[detail.priority] }]}>
                  {detail.priority}
                </Text>
              </View>
              <View style={[styles.categoryBadge, { backgroundColor: CATEGORY_COLORS[detail.category] ?? '#64748b' }]}>
                <Text style={styles.categoryText}>{detail.category}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statusActions}>
          {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusBtn, detail.status === s && styles.statusBtnActive]}
              onPress={() => updateStatusMutation.mutate({ ticketId: detail.id, status: s })}
            >
              <Text style={[styles.statusBtnText, detail.status === s && styles.statusBtnTextActive]}>
                {s.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ticketDesc}>{detail.description}</Text>
        <Text style={styles.ticketUser}>From: {detail.user.fullName} ({detail.user.email})</Text>

        <FlatList
          ref={flatListRef}
          data={detail.responses}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.responsesList}
          renderItem={({ item: r }) => (
            <View style={[styles.responseCard, r.sender.role === 'admin' && styles.adminResponse]}>
              {r.isInternal && (
                <View style={styles.internalBadge}>
                  <Text style={styles.internalText}>Internal Note</Text>
                </View>
              )}
              <Text style={styles.responseSender}>{r.sender.fullName}</Text>
              <Text style={styles.responseMessage}>{r.message}</Text>
              <Text style={styles.responseTime}>
                {new Date(r.createdAt).toLocaleString('en-LK', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.replyRow}>
            <TextInput
              style={styles.replyInput}
              placeholder="Type your reply..."
              placeholderTextColor="#64748b"
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !replyText.trim() && styles.sendBtnDisabled]}
              disabled={!replyText.trim() || respondMutation.isPending}
              onPress={() => respondMutation.mutate({ ticketId: detail.id, message: replyText.trim() })}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Support Tickets</Text>
        <TouchableOpacity style={styles.fab} onPress={() => setCreateModalVisible(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}
            onPress={() => setActiveTab(t.key)}
          >
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator color="#3b82f6" style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          renderItem={({ item: ticket }) => (
            <TouchableOpacity
              style={styles.ticketCard}
              onPress={() => setSelectedTicket(ticket)}
            >
              <View style={styles.ticketRow}>
                <View style={[styles.priorityIndicator, { backgroundColor: PRIORITY_COLORS[ticket.priority] }]} />
                <View style={styles.ticketInfo}>
                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  <Text style={styles.ticketUserCompact}>{ticket.user.fullName}</Text>
                </View>
                <View style={styles.ticketRight}>
                  <View style={[styles.categoryBadgeSmall, { backgroundColor: CATEGORY_COLORS[ticket.category] ?? '#64748b' }]}>
                    <Text style={styles.categoryTextSmall}>{ticket.category}</Text>
                  </View>
                  <Text style={styles.ticketDate}>
                    {new Date(ticket.createdAt).toLocaleDateString('en-LK', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubble-ellipses-outline" size={48} color="#334155" />
              <Text style={styles.emptyText}>No tickets found</Text>
            </View>
          }
        />
      )}

      <Modal visible={createModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Ticket</Text>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Subject"
              placeholderTextColor="#64748b"
              value={newSubject}
              onChangeText={setNewSubject}
            />
            <TextInput
              style={[styles.modalInput, styles.modalTextarea]}
              placeholder="Description"
              placeholderTextColor="#64748b"
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={4}
            />
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Category</Text>
              <View style={styles.optionRow}>
                {['general', 'billing', 'technical', 'order', 'delivery'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.optionBtn, newCategory === c && styles.optionBtnActive]}
                    onPress={() => setNewCategory(c)}
                  >
                    <Text style={[styles.optionText, newCategory === c && styles.optionTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Priority</Text>
              <View style={styles.optionRow}>
                {['low', 'medium', 'high', 'urgent'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.optionBtn, newPriority === p && { backgroundColor: PRIORITY_COLORS[p] }]}
                    onPress={() => setNewPriority(p)}
                  >
                    <Text style={[styles.optionText, newPriority === p && styles.optionTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.modalSubmitBtn, (!newSubject.trim() || !newDescription.trim()) && styles.sendBtnDisabled]}
              disabled={!newSubject.trim() || !newDescription.trim() || createTicketMutation.isPending}
              onPress={() => createTicketMutation.mutate()}
            >
              <Text style={styles.modalSubmitText}>
                {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14 },
  title: { fontSize: 22, fontWeight: '700', color: '#f8fafc' },
  fab: { backgroundColor: '#3b82f6', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 6 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, backgroundColor: '#1e293b' },
  tabActive: { backgroundColor: '#3b82f6' },
  tabText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  list: { padding: 16, paddingBottom: 32 },
  ticketCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8 },
  ticketRow: { flexDirection: 'row', alignItems: 'center' },
  priorityIndicator: { width: 4, height: 36, borderRadius: 2, marginRight: 10 },
  ticketInfo: { flex: 1 },
  ticketSubject: { fontSize: 14, fontWeight: '700', color: '#f8fafc' },
  ticketUserCompact: { fontSize: 12, color: '#64748b', marginTop: 2 },
  ticketRight: { alignItems: 'flex-end', gap: 4 },
  categoryBadgeSmall: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  categoryTextSmall: { fontSize: 10, color: '#fff', fontWeight: '600', textTransform: 'capitalize' },
  ticketDate: { fontSize: 11, color: '#64748b' },
  empty: { alignItems: 'center', padding: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#64748b' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  backBtn: { padding: 4 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', flex: 1 },
  detailMeta: { flexDirection: 'row', gap: 6, marginTop: 4 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryText: { fontSize: 11, color: '#fff', fontWeight: '600', textTransform: 'capitalize' },
  statusActions: { flexDirection: 'row', paddingHorizontal: 16, marginTop: 12, gap: 6 },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#1e293b' },
  statusBtnActive: { backgroundColor: '#3b82f6' },
  statusBtnText: { fontSize: 11, color: '#94a3b8', fontWeight: '600', textTransform: 'capitalize' },
  statusBtnTextActive: { color: '#fff' },
  ticketDesc: { fontSize: 14, color: '#cbd5e1', paddingHorizontal: 16, marginTop: 12 },
  ticketUser: { fontSize: 12, color: '#64748b', paddingHorizontal: 16, marginTop: 4 },
  responsesList: { padding: 16, paddingBottom: 8 },
  responseCard: { backgroundColor: '#1e293b', borderRadius: 10, padding: 12, marginBottom: 8 },
  adminResponse: { backgroundColor: '#172554', borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  internalBadge: { backgroundColor: '#f59e0b20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 6 },
  internalText: { fontSize: 10, color: '#f59e0b', fontWeight: '600' },
  responseSender: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  responseMessage: { fontSize: 14, color: '#f8fafc', marginTop: 4 },
  responseTime: { fontSize: 11, color: '#64748b', marginTop: 4 },
  replyRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  replyInput: { flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, color: '#f8fafc', fontSize: 14, maxHeight: 80 },
  sendBtn: { backgroundColor: '#3b82f6', width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1e293b', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  modalInput: { backgroundColor: '#0f172a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#f8fafc', fontSize: 14, marginBottom: 12 },
  modalTextarea: { minHeight: 100, textAlignVertical: 'top' },
  modalRow: { marginBottom: 12 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginBottom: 6 },
  optionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  optionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0f172a' },
  optionBtnActive: { backgroundColor: '#3b82f6' },
  optionText: { fontSize: 12, color: '#94a3b8', fontWeight: '600', textTransform: 'capitalize' },
  optionTextActive: { color: '#fff' },
  modalSubmitBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  modalSubmitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { FileUp, PackagePlus, History, X, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import { apiClient, formatPrice } from '../../lib/axios';

type Item = {
  id: string;
  lineNo: number;
  invoiceName: string;
  quantity: number | string;
  action: string;
  productId: string | null;
  matchConfidence: number;
  matchMethod: string | null;
};

type PurchaseHistory = {
  id: string;
  invoiceNumber?: string;
  supplierName?: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  itemCount: number;
  importedAt?: string;
};

const STATUS_TABS = [
  { key: 'import', label: 'Import New' },
  { key: 'history', label: 'Purchase History' },
];

export default function VendorPurchasesScreen() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('import');
  const [busy, setBusy] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [needsReview, setNeedsReview] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseHistory | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const { data: purchaseHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['purchase-history'],
    queryFn: async () => {
      const res = await apiClient.get('/purchases/history');
      return (res.data?.data?.items ?? []) as PurchaseHistory[];
    },
    enabled: activeTab === 'history',
  });

  async function pickAndUpload() {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: [
          'text/csv',
          'text/plain',
          'application/pdf',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          '*/*',
        ],
        copyToCacheDirectory: true,
      });
      if (picked.canceled || !picked.assets?.[0]) return;

      const asset = picked.assets[0];
      setBusy(true);
      setMessage(null);

      const form = new FormData();
      form.append('file', {
        uri: asset.uri,
        name: asset.name || 'invoice.csv',
        type: asset.mimeType || 'application/octet-stream',
      } as unknown as Blob);

      const res = await apiClient.post('/purchases/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const purchase = res.data?.data?.purchase;
      const summary = res.data?.data?.summary;
      setPurchaseId(purchase.id);
      setItems(purchase.items || []);
      setNeedsReview(summary?.needsReview ?? 0);
      setMessage(
        `Extracted ${summary?.totalLines} lines · ${summary?.exactMatched} exact · ${summary?.needsReview} need review`,
      );
      if (summary?.warnings?.length) {
        Alert.alert('Review carefully', summary.warnings.join('\n'));
      }
    } catch (e: unknown) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Try Excel/CSV for best accuracy');
    } finally {
      setBusy(false);
    }
  }

  function setAction(id: string, action: string) {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, action };
      }),
    );
    setNeedsReview(() => {
      const next = items.map((it) => (it.id === id ? { ...it, action } : it));
      return next.filter((i) => i.action === 'needs_review').length;
    });
  }

  async function saveAndImport() {
    if (!purchaseId) return;
    setBusy(true);
    try {
      const patched = await apiClient.patch(`/purchases/${purchaseId}/items`, {
        items: items.map((it) => ({
          id: it.id,
          action: it.action,
          productId: it.productId,
          quantity: Number(it.quantity),
          invoiceName: it.invoiceName,
          confirmMatch: it.action === 'matched' && !!it.productId,
          saveAsAlias: true,
        })),
      });
      const still = patched.data?.summary?.needsReview ?? 0;
      setNeedsReview(still);
      setItems(patched.data?.data?.items || items);
      if (still > 0) {
        Alert.alert(
          'Still need review',
          `${still} line(s) left. Set Create new or Skip for unmatched lines.`,
        );
        return;
      }
      const conf = await apiClient.post(`/purchases/${purchaseId}/confirm`);
      setMessage(conf.data?.message || 'Stock updated');
      queryClient.invalidateQueries({ queryKey: ['purchase-history'] });
      Alert.alert('Imported', conf.data?.message || 'Stock updated from invoice');
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (e instanceof Error ? e.message : 'Import failed');
      Alert.alert('Cannot import', msg);
    } finally {
      setBusy(false);
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed': return <CheckCircle color="#00B241" size={16} />;
      case 'pending': return <Clock color="#f59e0b" size={16} />;
      case 'failed': return <AlertCircle color="#ef4444" size={16} />;
      default: return <Clock color="#94a3b8" size={16} />;
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.tabBar}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'import' ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Import Invoice</Text>
          <Text style={styles.sub}>
            Upload PDF/Excel/CSV invoices. Barcode, SKU, alias, or exact-name matches auto-link.
            You confirm the rest before stock updates.
          </Text>

          <TouchableOpacity style={styles.upload} onPress={pickAndUpload} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <FileUp color="#fff" size={28} />}
            <Text style={styles.uploadText}>{busy ? 'Working…' : 'Upload invoice'}</Text>
          </TouchableOpacity>

          {message ? <Text style={styles.msg}>{message}</Text> : null}

          {items.map((it) => (
            <View
              key={it.id}
              style={[styles.card, it.action === 'needs_review' && styles.cardWarn]}
            >
              <Text style={styles.lineName}>
                #{it.lineNo} {it.invoiceName}
              </Text>
              <Text style={styles.meta}>
                Qty {Number(it.quantity)} · {it.matchMethod || 'no match'} · {it.matchConfidence}%
              </Text>
              <View style={styles.actions}>
                {(['matched', 'create_new', 'skip', 'needs_review'] as const).map((a) => (
                  <TouchableOpacity
                    key={a}
                    style={[styles.chip, it.action === a && styles.chipOn]}
                    onPress={() => setAction(it.id, a)}
                  >
                    <Text style={[styles.chipText, it.action === a && styles.chipTextOn]}>
                      {a === 'create_new' ? 'New' : a === 'needs_review' ? 'Review' : a}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          {purchaseId ? (
            <TouchableOpacity
              style={[styles.importBtn, (busy || needsReview > 0) && { opacity: 0.5 }]}
              disabled={busy || needsReview > 0}
              onPress={saveAndImport}
            >
              <PackagePlus color="#07101f" size={20} />
              <Text style={styles.importText}>
                Import to stock{needsReview > 0 ? ` (${needsReview} left)` : ''}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      ) : (
        <View style={styles.historyContainer}>
          {historyLoading ? (
            <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
          ) : (
            <FlatList
              data={purchaseHistory ?? []}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <History color="#94a3b8" size={48} />
                  <Text style={styles.emptyTitle}>No purchase history</Text>
                  <Text style={styles.emptyText}>Imported invoices will appear here</Text>
                </View>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.historyCard}
                  onPress={() => {
                    setSelectedPurchase(item);
                    setShowDetail(true);
                  }}
                >
                  <View style={styles.historyHeader}>
                    <View>
                      <Text style={styles.historyNumber}>
                        {item.invoiceNumber || `Purchase #${item.id.slice(0, 8)}`}
                      </Text>
                      <Text style={styles.historySupplier}>{item.supplierName || 'Unknown supplier'}</Text>
                    </View>
                    <View style={styles.historyStatus}>
                      {getStatusIcon(item.status)}
                      <Text style={styles.historyStatusText}>{item.status}</Text>
                    </View>
                  </View>
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyAmount}>{formatPrice(item.totalAmount)}</Text>
                    <Text style={styles.historyItems}>{item.itemCount} items</Text>
                  </View>
                  <Text style={styles.historyDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      )}

      <Modal visible={showDetail} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Purchase Details</Text>
              <TouchableOpacity onPress={() => setShowDetail(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            {selectedPurchase && (
              <View style={styles.modalBody}>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Invoice</Text>
                  <Text style={styles.detailValue}>
                    {selectedPurchase.invoiceNumber || `#${selectedPurchase.id.slice(0, 8)}`}
                  </Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Supplier</Text>
                  <Text style={styles.detailValue}>{selectedPurchase.supplierName || 'Unknown'}</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Amount</Text>
                  <Text style={[styles.detailValue, styles.detailAmount]}>
                    {formatPrice(selectedPurchase.totalAmount)}
                  </Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Items</Text>
                  <Text style={styles.detailValue}>{selectedPurchase.itemCount} items</Text>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Status</Text>
                  <View style={styles.historyStatus}>
                    {getStatusIcon(selectedPurchase.status)}
                    <Text style={styles.historyStatusText}>{selectedPurchase.status}</Text>
                  </View>
                </View>
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedPurchase.createdAt).toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00B241',
  },
  tabText: { fontWeight: '600', color: '#64748b' },
  activeTabText: { color: '#00B241' },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  sub: { color: '#64748b', marginTop: 8, marginBottom: 16, lineHeight: 20 },
  upload: {
    backgroundColor: '#00B241',
    borderRadius: 16,
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  uploadText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  msg: { marginTop: 12, color: '#059669', fontWeight: '600' },
  card: {
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardWarn: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  lineName: { fontWeight: '700', color: '#0f172a' },
  meta: { color: '#64748b', fontSize: 12, marginTop: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    minHeight: 40,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: '#00B241' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#475569', textTransform: 'capitalize' },
  chipTextOn: { color: '#fff' },
  importBtn: {
    marginTop: 20,
    backgroundColor: '#5DCAA5',
    borderRadius: 14,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  importText: { fontWeight: '800', color: '#07101f', fontSize: 16 },
  historyContainer: { flex: 1 },
  emptyContainer: { alignItems: 'center', padding: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 16 },
  emptyText: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyNumber: { fontWeight: '700', color: '#0f172a', fontSize: 15 },
  historySupplier: { color: '#64748b', fontSize: 13, marginTop: 2 },
  historyStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  historyStatusText: { fontSize: 12, fontWeight: '600', color: '#475569' },
  historyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  historyAmount: { fontWeight: '700', color: '#059669', fontSize: 16 },
  historyItems: { color: '#64748b' },
  historyDate: { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    marginBottom: 10,
  },
  detailLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  detailValue: { fontWeight: '600', color: '#0f172a' },
  detailAmount: { fontSize: 18, color: '#059669' },
});
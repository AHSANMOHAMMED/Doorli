import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { FileUp, PackagePlus } from 'lucide-react-native';
import { apiClient } from '../../lib/axios';

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

export default function VendorPurchasesScreen() {
  const [busy, setBusy] = useState(false);
  const [purchaseId, setPurchaseId] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [needsReview, setNeedsReview] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

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
        const next = { ...it, action };
        return next;
      }),
    );
    setNeedsReview((_) => {
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
          `${still} line(s) left. On phone: set Create new or Skip for unmatched lines, or finish linking on the vendor web Purchases page.`,
        );
        return;
      }
      const conf = await apiClient.post(`/purchases/${purchaseId}/confirm`);
      setMessage(conf.data?.message || 'Stock updated');
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Supplier purchases</Text>
        <Text style={styles.sub}>
          Import PDF/Excel/CSV invoices. Only 100% barcode, SKU, alias, or exact-name matches auto-link.
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '800', color: '#0f172a' },
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
});

import { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScanBarcode, Trash2, Plus, Minus, Printer, X } from 'lucide-react-native';
import { apiClient } from '../../lib/axios';
import { printReceipt, type Receipt } from '../../lib/receipt';

type CartLine = {
  productId: string;
  name: string;
  barcode?: string | null;
  unitPrice: number;
  quantity: number;
  liveStock: number;
};

export default function CashierScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [manualCode, setManualCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<Receipt | null>(null);
  const lockRef = useRef(false);

  const total = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  const addProduct = useCallback((p: {
    id: string;
    name: string;
    barcode?: string | null;
    price: number;
    liveStock: number;
  }) => {
    setCart((prev) => {
      const existing = prev.find((l) => l.productId === p.id);
      if (existing) {
        if (existing.quantity + 1 > p.liveStock) {
          Alert.alert('Stock', `Only ${p.liveStock} left for ${p.name}`);
          return prev;
        }
        return prev.map((l) =>
          l.productId === p.id ? { ...l, quantity: l.quantity + 1, liveStock: p.liveStock } : l,
        );
      }
      if (p.liveStock < 1) {
        Alert.alert('Out of stock', p.name);
        return prev;
      }
      return [
        ...prev,
        {
          productId: p.id,
          name: p.name,
          barcode: p.barcode,
          unitPrice: Number(p.price),
          quantity: 1,
          liveStock: p.liveStock,
        },
      ];
    });
  }, []);

  async function lookupBarcode(code: string) {
    const trimmed = code.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const res = await apiClient.get(`/pos/barcode/${encodeURIComponent(trimmed)}`);
      if (!res.data?.success) {
        Alert.alert('Not found', res.data?.error || 'No product for this barcode');
        return;
      }
      const p = res.data.data;
      addProduct(p);
    } catch (e: any) {
      Alert.alert(
        'Scan failed',
        e?.response?.data?.error || e?.message || 'Could not look up barcode',
      );
    } finally {
      setBusy(false);
    }
  }

  function onBarcode(result: BarcodeScanningResult) {
    if (lockRef.current) return;
    const raw = result.data?.trim();
    if (!raw) return;
    lockRef.current = true;
    setScanning(false);
    void lookupBarcode(raw).finally(() => {
      setTimeout(() => {
        lockRef.current = false;
      }, 1200);
    });
  }

  async function completeSale() {
    if (!cart.length) {
      Alert.alert('Empty', 'Scan or add items first');
      return;
    }
    setBusy(true);
    try {
      const res = await apiClient.post('/pos/sale', {
        paymentMethod: 'cash',
        customerName: customerName.trim() || undefined,
        items: cart.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
      });
      const receipt = res.data?.data?.receipt as Receipt;
      setLastReceipt(receipt);
      setCart([]);
      setCustomerName('');
      Alert.alert('Sale complete', `Bill ${receipt.orderNumber} · LKR ${receipt.total}`, [
        { text: 'Print / Share', onPress: () => printReceipt(receipt) },
        { text: 'OK' },
      ]);
    } catch (e: any) {
      Alert.alert('Sale failed', e?.response?.data?.error || e?.message || 'Try again');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Hub</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Cashier</Text>
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={async () => {
            if (!permission?.granted) {
              const r = await requestPermission();
              if (!r.granted) {
                Alert.alert('Camera', 'Allow camera to scan barcodes');
                return;
              }
            }
            setScanning(true);
          }}
        >
          <ScanBarcode color="#fff" size={20} />
          <Text style={styles.scanBtnText}>Scan</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.manualRow}>
        <TextInput
          style={styles.input}
          placeholder="Type barcode / SKU"
          placeholderTextColor="#94a3b8"
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="none"
          keyboardType="number-pad"
          onSubmitEditing={() => {
            void lookupBarcode(manualCode);
            setManualCode('');
          }}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            void lookupBarcode(manualCode);
            setManualCode('');
          }}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.addBtnText}>Add</Text>}
        </TouchableOpacity>
      </View>

      <TextInput
        style={[styles.input, { marginHorizontal: 16, marginBottom: 8 }]}
        placeholder="Customer name (optional)"
        placeholderTextColor="#94a3b8"
        value={customerName}
        onChangeText={setCustomerName}
      />

      <FlatList
        data={cart}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
        ListEmptyComponent={
          <Text style={styles.empty}>Scan a product barcode to start the bill</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.line}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lineName}>{item.name}</Text>
              <Text style={styles.lineMeta}>
                LKR {item.unitPrice} · stock {item.liveStock}
                {item.barcode ? ` · ${item.barcode}` : ''}
              </Text>
            </View>
            <View style={styles.qty}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() =>
                  setCart((prev) =>
                    prev
                      .map((l) =>
                        l.productId === item.productId
                          ? { ...l, quantity: l.quantity - 1 }
                          : l,
                      )
                      .filter((l) => l.quantity > 0),
                  )
                }
              >
                {item.quantity === 1 ? (
                  <Trash2 size={16} color="#b91c1c" />
                ) : (
                  <Minus size={16} color="#0f172a" />
                )}
              </TouchableOpacity>
              <Text style={styles.qtyNum}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => {
                  if (item.quantity + 1 > item.liveStock) {
                    Alert.alert('Stock', `Only ${item.liveStock} available`);
                    return;
                  }
                  setCart((prev) =>
                    prev.map((l) =>
                      l.productId === item.productId
                        ? { ...l, quantity: l.quantity + 1 }
                        : l,
                    ),
                  );
                }}
              >
                <Plus size={16} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <Text style={styles.lineTotal}>LKR {item.unitPrice * item.quantity}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalVal}>LKR {total.toLocaleString()}</Text>
        </View>
        <View style={styles.footerActions}>
          {lastReceipt && (
            <TouchableOpacity style={styles.printBtn} onPress={() => printReceipt(lastReceipt)}>
              <Printer color="#00B241" size={20} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.payBtn, (!cart.length || busy) && { opacity: 0.5 }]}
            disabled={!cart.length || busy}
            onPress={completeSale}
          >
            <Text style={styles.payBtnText}>{busy ? '…' : 'Charge cash'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={scanning} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={styles.camHeader}>
            <Text style={styles.camTitle}>Point at barcode</Text>
            <TouchableOpacity onPress={() => setScanning(false)} style={styles.closeCam}>
              <X color="#fff" size={22} />
            </TouchableOpacity>
          </View>
          {Platform.OS === 'web' ? (
            <View style={styles.webCamFallback}>
              <Text style={{ color: '#fff', textAlign: 'center' }}>
                Camera scan works in Expo Go on a phone. On web, type the barcode above.
              </Text>
              <TouchableOpacity style={styles.payBtn} onPress={() => setScanning(false)}>
                <Text style={styles.payBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: [
                  'ean13',
                  'ean8',
                  'upc_a',
                  'upc_e',
                  'code128',
                  'code39',
                  'qr',
                ],
              }}
              onBarcodeScanned={onBarcode}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  back: { color: '#00B241', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B241',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    minHeight: 44,
  },
  scanBtnText: { color: '#fff', fontWeight: '700' },
  manualRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    color: '#0f172a',
  },
  addBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    minHeight: 48,
  },
  addBtnText: { color: '#fff', fontWeight: '700' },
  empty: { textAlign: 'center', color: '#94a3b8', marginTop: 48 },
  line: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lineName: { fontWeight: '700', color: '#0f172a' },
  lineMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  qty: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum: { minWidth: 22, textAlign: 'center', fontWeight: '700' },
  lineTotal: { fontWeight: '700', color: '#0f172a', minWidth: 64, textAlign: 'right' },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 16,
    paddingBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: { color: '#64748b', fontSize: 12 },
  totalVal: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  printBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
  },
  payBtnText: { color: '#fff', fontWeight: '800' },
  camHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  camTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  closeCam: { padding: 8 },
  webCamFallback: { flex: 1, justifyContent: 'center', padding: 24, gap: 16 },
});

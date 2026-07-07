import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/api';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  discount_price?: number | null;
  unit?: string | null;
  stock_quantity: number;
  image_url?: string | null;
  is_available: boolean;
  category?: string | null;
}

export default function VendorMenu() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', unit: '', stock: '', category: '' });
  const [saving, setSaving] = useState(false);

  async function getVendorId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase.from('vendors').select('id').eq('user_id', user.id).maybeSingle();
    return data?.id ?? null;
  }

  const { data: products, isLoading } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const vendorId = await getVendorId();
      if (!vendorId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Product[];
    },
  });

  async function toggleAvailability(product: Product) {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !product.is_available })
      .eq('id', product.id);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    }
  }

  async function deleteProduct(product: Product) {
    Alert.alert('Delete product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', product.id);
          if (error) {
            Alert.alert('Error', error.message);
          } else {
            queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
          }
        },
      },
    ]);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', unit: '', stock: '', category: '' });
    setModal(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      unit: product.unit ?? '',
      stock: String(product.stock_quantity),
      category: product.category ?? '',
    });
    setModal(true);
  }

  async function save() {
    if (!form.name || !form.price) {
      Alert.alert('Missing fields', 'Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const vendorId = await getVendorId();
      if (!vendorId) throw new Error('No vendor profile');

      const payload = {
        vendor_id: vendorId,
        name: form.name,
        description: form.description || null,
        price: parseFloat(form.price),
        unit: form.unit || null,
        stock_quantity: parseInt(form.stock, 10) || 0,
        category: form.category || null,
        is_available: true,
      };

      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
      setModal(false);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#2563eb" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={products ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No products yet. Tap + Add to create one.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.price}>{formatPrice(Number(item.price))}</Text>
            </View>
            {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
            <Text style={styles.stock}>Stock: {item.stock_quantity} {item.unit ?? ''}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.chip, item.is_available ? styles.chipOn : styles.chipOff]}
                onPress={() => toggleAvailability(item)}
              >
                <Text style={styles.chipText}>{item.is_available ? 'Available' : 'Hidden'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.chip} onPress={() => openEdit(item)}>
                <Text style={styles.chipText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.chip, styles.chipDanger]} onPress={() => deleteProduct(item)}>
                <Text style={styles.chipTextDanger}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Product' : 'Add Product'}</Text>
            <TextInput style={styles.input} placeholder="Name *" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
            <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} multiline />
            <TextInput style={styles.input} placeholder="Price *" keyboardType="numeric" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} />
            <View style={styles.modalRow}>
              <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="Unit" value={form.unit} onChangeText={(v) => setForm({ ...form, unit: v })} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Stock" keyboardType="numeric" value={form.stock} onChangeText={(v) => setForm({ ...form, stock: v })} />
            </View>
            <TextInput style={styles.input} placeholder="Category" value={form.category} onChangeText={(v) => setForm({ ...form, category: v })} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#0f172a' },
  addBtn: { backgroundColor: '#2563eb', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '600' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#64748b', textAlign: 'center' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  productName: { fontWeight: '600', fontSize: 16, color: '#0f172a' },
  price: { fontWeight: '600', color: '#2563eb' },
  desc: { color: '#64748b', fontSize: 14, marginTop: 4 },
  stock: { color: '#94a3b8', fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#f1f5f9' },
  chipOn: { backgroundColor: '#dcfce7' },
  chipOff: { backgroundColor: '#fee2e2' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#334155' },
  chipDanger: { backgroundColor: '#fee2e2' },
  chipTextDanger: { fontSize: 13, fontWeight: '500', color: '#ef4444' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, marginBottom: 12, fontSize: 15 },
  modalRow: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#2563eb', alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '600' },
});

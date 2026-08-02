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
  RefreshControl,
  Switch,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, X, Plus, Edit2, Trash2 } from 'lucide-react-native';
import { apiClient } from '../../lib/axios';
import { formatPrice } from '../../lib/api';

interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  unit?: string | null;
  stockQuantity: number;
  barcode?: string | null;
  sku?: string | null;
  imageUrl?: string | null;
  isAvailable: boolean;
  category?: string | null;
}

export default function VendorMenu() {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    unit: '',
    stock: '',
    category: '',
    barcode: '',
    sku: '',
  });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefetching, setIsRefetching] = useState(false);

  async function getVendorId() {
    const res = await apiClient.get('/vendors/me');
    if (!res.data?.success) return null;
    return res.data.data.id as string;
  }

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['vendor-products'],
    queryFn: async () => {
      const vendorId = await getVendorId();
      if (!vendorId) return [];
      const res = await apiClient.get(`/products/vendor/${vendorId}`);
      return (res.data?.data?.items ?? []) as Product[];
    },
  });

  const filteredProducts = (products ?? []).filter((product) => {
    if (searchQuery === '') return true;
    return (
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const onRefresh = async () => {
    setIsRefetching(true);
    await refetch();
    setIsRefetching(false);
  };

  async function toggleAvailability(product: Product) {
    try {
      await apiClient.patch(`/products/${product.id}`, {
        isAvailable: !product.isAvailable,
      });
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function deleteProduct(product: Product) {
    Alert.alert('Delete product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/products/${product.id}`);
            queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
          } catch (err) {
            Alert.alert('Error', err instanceof Error ? err.message : 'Delete failed');
          }
        },
      },
    ]);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      price: '',
      unit: '',
      stock: '',
      category: '',
      barcode: '',
      sku: '',
    });
    setModal(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? '',
      price: String(product.price),
      unit: product.unit ?? '',
      stock: String(product.stockQuantity),
      category: product.category ?? '',
      barcode: product.barcode ?? '',
      sku: product.sku ?? '',
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
        vendorId,
        name: form.name,
        description: form.description || undefined,
        price: parseFloat(form.price),
        unit: form.unit || undefined,
        stockQuantity: parseInt(form.stock, 10) || 0,
        category: form.category || undefined,
        barcode: form.barcode.trim() || null,
        sku: form.sku.trim() || null,
        isAvailable: true,
      };

      if (editing) {
        await apiClient.patch(`/products/${editing.id}`, payload);
      } else {
        await apiClient.post('/products', payload);
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
        <ActivityIndicator color="#00B241" style={{ marginTop: 48 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={styles.title}>Products</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Plus color="#fff" size={18} />
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search color="#94a3b8" size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94a3b8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X color="#94a3b8" size={18} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.stats}>
        <Text style={styles.statText}>{filteredProducts.length} products</Text>
        <Text style={styles.statText}>
          {products?.filter(p => p.isAvailable).length ?? 0} available
        </Text>
        <Text style={styles.statText}>
          {products?.filter(p => !p.isAvailable).length ?? 0} hidden
        </Text>
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search' : 'Tap + Add to create your first product'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.price}>{formatPrice(Number(item.price))}</Text>
              </View>
              <View style={styles.availabilityContainer}>
                <Text style={styles.availabilityLabel}>
                  {item.isAvailable ? 'Available' : 'Hidden'}
                </Text>
                <Switch
                  value={item.isAvailable}
                  onValueChange={() => toggleAvailability(item)}
                  trackColor={{ false: '#e2e8f0', true: '#dcfce7' }}
                  thumbColor={item.isAvailable ? '#00B241' : '#94a3b8'}
                />
              </View>
            </View>

            {item.description ? <Text style={styles.desc} numberOfLines={2}>{item.description}</Text> : null}

            <View style={styles.metaRow}>
              <Text style={styles.stock}>
                Stock: {item.stockQuantity} {item.unit ?? ''}
              </Text>
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>

            {(item.barcode || item.sku) && (
              <Text style={styles.codes}>
                {item.barcode ? `Barcode: ${item.barcode}` : ''}
                {item.barcode && item.sku ? ' · ' : ''}
                {item.sku ? `SKU: ${item.sku}` : ''}
              </Text>
            )}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                <Edit2 color="#0f172a" size={14} />
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteProduct(item)}>
                <Trash2 color="#ef4444" size={14} />
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={() => setModal(false)}>
                <X color="#64748b" size={24} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[{ key: 'form' }]}
              keyExtractor={(item) => item.key}
              renderItem={() => (
                <View style={styles.modalForm}>
                  <Text style={styles.inputLabel}>Product Name *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter product name"
                    value={form.name}
                    onChangeText={(v) => setForm({ ...form, name: v })}
                  />

                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Product description"
                    value={form.description}
                    onChangeText={(v) => setForm({ ...form, description: v })}
                    multiline
                    numberOfLines={3}
                  />

                  <Text style={styles.inputLabel}>Price *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={form.price}
                    onChangeText={(v) => setForm({ ...form, price: v })}
                  />

                  <View style={styles.formRow}>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Unit</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g., kg, pcs"
                        value={form.unit}
                        onChangeText={(v) => setForm({ ...form, unit: v })}
                      />
                    </View>
                    <View style={styles.formCol}>
                      <Text style={styles.inputLabel}>Stock</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        keyboardType="numeric"
                        value={form.stock}
                        onChangeText={(v) => setForm({ ...form, stock: v })}
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Category</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Beverages, Food"
                    value={form.category}
                    onChangeText={(v) => setForm({ ...form, category: v })}
                  />

                  <Text style={styles.inputLabel}>Barcode</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="For barcode scanning"
                    value={form.barcode}
                    onChangeText={(v) => setForm({ ...form, barcode: v })}
                    autoCapitalize="none"
                    keyboardType="number-pad"
                  />

                  <Text style={styles.inputLabel}>SKU</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Stock keeping unit"
                    value={form.sku}
                    onChangeText={(v) => setForm({ ...form, sku: v })}
                    autoCapitalize="characters"
                  />
                </View>
              )}
              ListFooterComponent={
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setModal(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                    onPress={save}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.saveText}>{editing ? 'Update' : 'Add Product'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              }
            />
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B241',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 15,
    color: '#0f172a',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  empty: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#0f172a' },
  emptyText: { color: '#64748b', marginTop: 8, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: { flex: 1 },
  productName: { fontWeight: '700', fontSize: 16, color: '#0f172a' },
  price: { fontWeight: '700', color: '#059669', marginTop: 4, fontSize: 16 },
  availabilityContainer: { alignItems: 'flex-end' },
  availabilityLabel: { fontSize: 11, color: '#64748b', marginBottom: 4 },
  desc: { color: '#64748b', fontSize: 14, marginTop: 8, lineHeight: 20 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  stock: { color: '#94a3b8', fontSize: 13 },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: { fontSize: 11, color: '#475569', fontWeight: '500' },
  codes: { color: '#94a3b8', fontSize: 12, marginTop: 6 },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  editBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: '#0f172a' },
  deleteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
  },
  deleteBtnText: { fontSize: 13, fontWeight: '600', color: '#ef4444' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
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
  modalForm: { padding: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
    backgroundColor: '#f8fafc',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 12 },
  formCol: { flex: 1 },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    paddingBottom: 32,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelText: { color: '#64748b', fontWeight: '600' },
  saveBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#00B241',
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600' },
});
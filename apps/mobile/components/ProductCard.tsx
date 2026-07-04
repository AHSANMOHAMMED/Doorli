import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Product } from '../lib/api';
import { formatPrice } from '../lib/api';

interface Props {
  product: Product;
  onAdd: () => void;
}

export function ProductCard({ product, onAdd }: Props) {
  const price = product.discountPrice ?? product.price;

  return (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{product.name.charAt(0)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{product.name}</Text>
        {product.unit && <Text style={styles.unit}>Per {product.unit}</Text>}
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Text style={styles.addText}>+ Add</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: '#64748b' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  unit: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  price: { fontSize: 14, fontWeight: '600', color: '#2563eb', marginTop: 4 },
  addBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

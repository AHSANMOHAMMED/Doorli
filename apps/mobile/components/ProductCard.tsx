import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { Product } from '../lib/api';
import { formatPrice } from '../lib/api';
import { Plus } from 'lucide-react-native';

interface Props {
  product: Product;
  onAdd: () => void;
}

export function ProductCard({ product, onAdd }: Props) {
  const price = product.discountPrice ?? product.price;

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <Text style={styles.avatarText}>{product.name.charAt(0)}</Text>
        )}
      </View>
      
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        {product.unit && <Text style={styles.unit}>Per {product.unit}</Text>}
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>
      
      <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
        <Plus color="#2563eb" size={20} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    shadowColor: '#94a3b8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#94a3b8' },
  info: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  unit: { fontSize: 13, color: '#64748b', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '800', color: '#2563eb' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
});

import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { Product } from '../lib/api';
import { formatPrice } from '../lib/api';
import { Plus } from 'lucide-react-native';
import { GlassCard } from './GlassCard';

interface Props {
  product: Product;
  onAdd: () => void;
}

export function ProductCard({ product, onAdd }: Props) {
  const price = product.discountPrice ?? product.price;

  return (
    <GlassCard style={styles.card}>
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
        <Plus color="#fff" size={20} />
      </TouchableOpacity>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  info: { flex: 1, marginLeft: 16, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  unit: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: '800', color: '#0ea5e9' }, // Teal/Blue hint
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.3)', // Glassy primary
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.5)',
  },
});

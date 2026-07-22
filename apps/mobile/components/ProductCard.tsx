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
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
        {product.description && (
          <Text style={styles.description} numberOfLines={2}>
            {product.description}
          </Text>
        )}
        {!product.description && product.unit && (
          <Text style={styles.description} numberOfLines={1}>
            Per {product.unit}
          </Text>
        )}
        <Text style={styles.price}>{formatPrice(price)}</Text>
      </View>
      
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: product.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300&auto=format&fit=crop' }} 
          style={styles.image} 
        />
        <TouchableOpacity style={styles.addBtn} onPress={onAdd}>
          <Plus color="#ffffff" size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 16,
  },
  info: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  name: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#191c1d', 
    marginBottom: 4 
  },
  description: { 
    fontSize: 14, 
    color: '#3d4a3c', 
    marginBottom: 12,
    lineHeight: 20
  },
  price: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#006e25' 
  }, 
  imageContainer: {
    width: 112,
    height: 112,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { 
    fontSize: 32, 
    fontWeight: '700', 
    color: '#006e25' 
  },
  addBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00b241', 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00b241',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});

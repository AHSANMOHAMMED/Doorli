import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import type { VendorCategory } from '@doorli/types';

const CATEGORIES: { key: VendorCategory | 'all'; label: string; image: string }[] = [
  { key: 'all', label: 'All', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=200&auto=format&fit=crop' },
  { key: 'restaurant', label: 'Food', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=200&auto=format&fit=crop' },
  { key: 'grocery', label: 'Grocery', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=200&auto=format&fit=crop' },
  { key: 'hotel', label: 'Hotels', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=200&auto=format&fit=crop' },
  { key: 'hall', label: 'Halls', image: 'https://images.unsplash.com/photo-1519167758481-83f54085356e?q=80&w=200&auto=format&fit=crop' },
  { key: 'service', label: 'Services', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=200&auto=format&fit=crop' },
  { key: 'beauty', label: 'Beauty', image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=200&auto=format&fit=crop' },
];

interface Props {
  selected: VendorCategory | 'all';
  onSelect: (category: VendorCategory | 'all') => void;
}

export function CategoryTabs({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={[styles.chipWrapper, selected === cat.key && styles.chipWrapperActive]}
          onPress={() => onSelect(cat.key)}
          activeOpacity={0.8}
        >
          <View style={[styles.chip, selected === cat.key && styles.chipActive]}>
            <Image source={{ uri: cat.image }} style={styles.image} />
            <Text style={[styles.label, selected === cat.key && styles.labelActive]}>
              {cat.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chipWrapper: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    backgroundColor: '#ffffff',
    marginVertical: 4,
  },
  chipWrapperActive: {
    backgroundColor: '#00B241',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    paddingRight: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  chipActive: { 
    // Additional styling for active state if needed 
  },
  image: { 
    width: 28, 
    height: 28, 
    borderRadius: 14 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#374151' 
  },
  labelActive: { 
    color: '#ffffff' 
  },
});

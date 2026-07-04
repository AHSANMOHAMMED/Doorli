import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { VendorCategory } from '@doorli/types';

const CATEGORIES: { key: VendorCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '🏪' },
  { key: 'grocery', label: 'Grocery', emoji: '🛒' },
  { key: 'restaurant', label: 'Food', emoji: '🍽️' },
  { key: 'beauty', label: 'Beauty', emoji: '💈' },
];

interface Props {
  selected: VendorCategory | 'all';
  onSelect: (category: VendorCategory | 'all') => void;
}

export function CategoryTabs({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={[styles.chip, selected === cat.key && styles.chipActive]}
          onPress={() => onSelect(cat.key)}
        >
          <Text style={styles.emoji}>{cat.emoji}</Text>
          <Text style={[styles.label, selected === cat.key && styles.labelActive]}>{cat.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  emoji: { fontSize: 14 },
  label: { fontSize: 13, fontWeight: '500', color: '#475569' },
  labelActive: { color: '#fff' },
});

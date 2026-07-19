import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import type { VendorCategory } from '@doorli/types';

const CATEGORIES: { key: VendorCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '🏪' },
  { key: 'grocery', label: 'Grocery', emoji: '🛒' },
  { key: 'restaurant', label: 'Food', emoji: '🍽️' },
  { key: 'hotel', label: 'Hotels', emoji: '🏨' },
  { key: 'hall', label: 'Halls', emoji: '🎉' },
  { key: 'beauty', label: 'Beauty', emoji: '💈' },
  { key: 'service', label: 'Services', emoji: '🔧' },
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
          activeOpacity={0.7}
        >
          <BlurView
            intensity={20}
            tint="dark"
            style={[styles.chip, selected === cat.key && styles.chipActive]}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={[styles.label, selected === cat.key && styles.labelActive]}>
              {cat.label}
            </Text>
          </BlurView>
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
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  chipWrapperActive: {
    borderColor: 'rgba(14, 165, 233, 0.8)',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipActive: { backgroundColor: 'rgba(14, 165, 233, 0.4)' },
  emoji: { fontSize: 14 },
  label: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  labelActive: { color: '#fff' },
});

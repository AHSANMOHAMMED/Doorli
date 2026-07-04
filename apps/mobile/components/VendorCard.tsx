import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Vendor } from '../lib/api';
import { formatPrice } from '../lib/api';

interface Props {
  vendor: Vendor;
  onPress: () => void;
}

export function VendorCard({ vendor, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{vendor.businessName.charAt(0)}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{vendor.businessName}</Text>
          <Text style={styles.meta}>
            {vendor.category} · ⭐ {Number(vendor.avgRating).toFixed(1)} ({vendor.totalReviews})
          </Text>
          {vendor.city && <Text style={styles.address}>{vendor.city}</Text>}
        </View>
        <View style={[styles.badge, vendor.isOpen ? styles.open : styles.closed]}>
          <Text style={styles.badgeText}>{vendor.isOpen ? 'Open' : 'Closed'}</Text>
        </View>
      </View>
      {vendor.distanceKm !== undefined && (
        <Text style={styles.distance}>{vendor.distanceKm.toFixed(1)} km away</Text>
      )}
      {vendor.minOrderAmount && (
        <Text style={styles.minOrder}>Min order: {formatPrice(vendor.minOrderAmount)}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#2563eb' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#0f172a' },
  meta: { fontSize: 13, color: '#64748b', marginTop: 2, textTransform: 'capitalize' },
  address: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  open: { backgroundColor: '#dcfce7' },
  closed: { backgroundColor: '#f1f5f9' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#334155' },
  distance: { fontSize: 12, color: '#2563eb', marginTop: 10 },
  minOrder: { fontSize: 12, color: '#64748b', marginTop: 4 },
});

import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Vendor } from '../lib/api';
import { formatPrice } from '../lib/api';
import { GlassCard } from './GlassCard';

interface Props {
  vendor: Vendor;
  onPress: () => void;
}

export function VendorCard({ vendor, onPress }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.container}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{vendor.business_name.charAt(0)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{vendor.business_name}</Text>
            <Text style={styles.meta}>
              {vendor.category} · ⭐ {Number(vendor.avg_rating).toFixed(1)} ({vendor.total_reviews})
            </Text>
            {vendor.city && <Text style={styles.address}>{vendor.city}</Text>}
          </View>
          <View style={[styles.badge, vendor.is_open ? styles.open : styles.closed]}>
            <Text style={styles.badgeText}>{vendor.is_open ? 'Open' : 'Closed'}</Text>
          </View>
        </View>
        {vendor.distance_km !== undefined && (
          <Text style={styles.distance}>{vendor.distance_km.toFixed(1)} km away</Text>
        )}
        {vendor.min_order_amount && (
          <Text style={styles.minOrder}>Min order: {formatPrice(vendor.min_order_amount)}</Text>
        )}
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  card: {
    padding: 16,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#fff' },
  meta: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, textTransform: 'capitalize' },
  address: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  open: { backgroundColor: 'rgba(13, 148, 136, 0.3)', borderColor: 'rgba(13, 148, 136, 0.6)' },
  closed: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  distance: { fontSize: 12, color: '#0ea5e9', marginTop: 10 },
  minOrder: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
});

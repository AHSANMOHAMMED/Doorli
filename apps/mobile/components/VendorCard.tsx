import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import type { Vendor } from '../lib/api';
import { formatPrice } from '../lib/api';
import { GlassCard } from './GlassCard';
import { Star, Clock } from 'lucide-react-native';

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
            {vendor.logoUrl ? (
              <Image source={{ uri: vendor.logoUrl }} style={styles.image} />
            ) : (
              <Text style={styles.avatarText}>{vendor.businessName.charAt(0)}</Text>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>{vendor.businessName}</Text>
            
            <View style={styles.metaRow}>
              <Star color="#f59e0b" fill="#f59e0b" size={14} />
              <Text style={styles.rating}>{Number(vendor.avgRating).toFixed(1)}</Text>
              <Text style={styles.reviews}>({vendor.totalReviews})</Text>
              <Text style={styles.dot}>·</Text>
              <Text style={styles.category}>{vendor.category}</Text>
            </View>

            <View style={styles.detailsRow}>
              <Clock color="rgba(255,255,255,0.7)" size={12} />
              <Text style={[styles.detailText, { color: vendor.isOpen ? '#10b981' : '#ef4444' }]}>
                {vendor.isOpen ? 'Open' : 'Closed'}
              </Text>
              
              {vendor.distanceKm !== undefined && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.detailText}>{vendor.distanceKm.toFixed(1)} km</Text>
                </>
              )}

              {vendor.minOrderAmount !== undefined && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.detailText}>Min {formatPrice(Number(vendor.minOrderAmount))}</Text>
                </>
              )}
            </View>
          </View>
        </View>
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
  image: { width: 48, height: 48, borderRadius: 12 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600', color: '#fff' },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  rating: { fontSize: 13, fontWeight: '600', color: '#fff' },
  reviews: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  dot: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  category: { fontSize: 13, color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' },
  detailsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  detailText: { fontSize: 12, color: 'rgba(255,255,255,0.7)' },
});

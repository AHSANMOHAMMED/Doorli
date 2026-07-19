import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { GlassCard } from '../../components/GlassCard';
import { GlassInput } from '../../components/GlassInput';
import { GlassButton } from '../../components/GlassButton';
import {
  estimateRide,
  createRide,
  fetchMyRides,
  formatPrice,
  DEFAULT_LOCATION,
  type RideEstimate,
} from '../../lib/api';
import { MapPin, Navigation, Car } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';

const DROPOFF = { lat: 6.8649, lng: 79.8997, label: 'Nugegoda junction' };

export default function RideScreen() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [pickupAddress, setPickupAddress] = useState('Current location');
  const [dropoffAddress, setDropoffAddress] = useState(DROPOFF.label);
  const [pickup, setPickup] = useState(DEFAULT_LOCATION);
  const [estimate, setEstimate] = useState<RideEstimate | null>(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [requesting, setRequesting] = useState(false);

  const { data: rides, refetch } = useQuery({
    queryKey: ['my-rides'],
    queryFn: fetchMyRides,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setPickup({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          setPickupAddress('GPS location');
        }
      } catch {
        // keep default Colombo
      }
    })();
  }, []);

  async function handleEstimate() {
    setLoadingEstimate(true);
    try {
      const data = await estimateRide({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: DROPOFF.lat,
        dropoffLng: DROPOFF.lng,
      });
      setEstimate(data);
    } catch (e: unknown) {
      Alert.alert('Estimate failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setLoadingEstimate(false);
    }
  }

  async function handleRequest() {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Please log in to request a ride.');
      router.push('/(auth)/login');
      return;
    }
    setRequesting(true);
    try {
      if (!estimate) await handleEstimate();
      const ride = await createRide({
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        dropoffLat: DROPOFF.lat,
        dropoffLng: DROPOFF.lng,
        pickupAddress,
        dropoffAddress,
      });
      refetch();
      router.push({
        pathname: '/(customer)/ride-booking',
        params: { rideId: ride.id },
      });
    } catch (e: unknown) {
      Alert.alert('Request failed', e instanceof Error ? e.message : 'Try again');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Ride</Text>
        <Text style={styles.subtitle}>Get a ride nearby — fair fare estimate first</Text>

        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <MapPin color="#5DCAA5" size={18} />
            <Text style={styles.label}>Pickup</Text>
          </View>
          <GlassInput
            value={pickupAddress}
            onChangeText={setPickupAddress}
            placeholder="Pickup address"
          />

          <View style={[styles.row, { marginTop: 16 }]}>
            <Navigation color="#0ea5e9" size={18} />
            <Text style={styles.label}>Drop-off</Text>
          </View>
          <GlassInput
            value={dropoffAddress}
            onChangeText={setDropoffAddress}
            placeholder="Where to?"
          />

          <View style={styles.actions}>
            <GlassButton
              title={loadingEstimate ? 'Estimating…' : 'Get estimate'}
              onPress={handleEstimate}
              disabled={loadingEstimate}
            />
          </View>

          {estimate && (
            <View style={styles.fareBox}>
              <Car color="#FAC775" size={22} />
              <View style={{ flex: 1 }}>
                <Text style={styles.fareTitle}>{formatPrice(estimate.totalFare)}</Text>
                <Text style={styles.fareMeta}>
                  {estimate.distanceKm} km · base {formatPrice(estimate.baseFare)}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.requestBtn, requesting && { opacity: 0.6 }]}
            onPress={handleRequest}
            disabled={requesting}
          >
            {requesting ? (
              <ActivityIndicator color="#07101f" />
            ) : (
              <Text style={styles.requestText}>Request ride</Text>
            )}
          </TouchableOpacity>
        </GlassCard>

        {!!rides?.length && (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>Recent rides</Text>
            {rides.slice(0, 5).map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.historyRow}
                onPress={() =>
                  router.push({
                    pathname: '/(customer)/ride-booking',
                    params: { rideId: r.id },
                  })
                }
              >
                <Text style={styles.historyStatus}>{r.status}</Text>
                <Text style={styles.historyFare}>
                  {r.totalFare != null ? formatPrice(Number(r.totalFare)) : '—'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 16, paddingBottom: 120 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.65)', marginTop: 6, marginBottom: 20 },
  card: { padding: 16, gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  label: { color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  actions: { marginTop: 12 },
  fareBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(250,199,117,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250,199,117,0.25)',
  },
  fareTitle: { fontSize: 20, fontWeight: '800', color: '#FAC775' },
  fareMeta: { color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 2 },
  requestBtn: {
    marginTop: 16,
    backgroundColor: '#5DCAA5',
    borderRadius: 14,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestText: { fontWeight: '800', fontSize: 16, color: '#07101f' },
  history: { marginTop: 28 },
  historyTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 10 },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  historyStatus: { color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize' },
  historyFare: { color: '#5DCAA5', fontWeight: '600' },
});

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScanBarcode,
  Package,
  ShoppingBag,
  CalendarDays,
  Wrench,
  LayoutGrid,
  ChartBar,
  LogOut,
  FileUp,
} from 'lucide-react-native';
import { useAuthStore } from '../../store/auth';

const TILES = [
  { href: '/(vendor)/cashier', label: 'Cashier / Scan', blurb: 'Scan barcode & bill', icon: ScanBarcode, color: '#2563eb' },
  { href: '/(vendor)/purchases', label: 'Purchases', blurb: 'Import supplier invoice', icon: FileUp, color: '#0ea5e9' },
  { href: '/(vendor)/stock', label: 'Live stock', blurb: 'Levels & low stock', icon: Package, color: '#059669' },
  { href: '/(vendor)/menu', label: 'Products', blurb: 'Menu & prices', icon: LayoutGrid, color: '#7c3aed' },
  { href: '/(vendor)/orders', label: 'Online orders', blurb: 'Delivery queue', icon: ShoppingBag, color: '#d97706' },
  { href: '/(vendor)/bookings', label: 'Bookings', blurb: 'Hotel / hall / beauty', icon: CalendarDays, color: '#db2777' },
  { href: '/(vendor)/services', label: 'Service jobs', blurb: 'Home services', icon: Wrench, color: '#0d9488' },
  { href: '/(vendor)/admin', label: 'Shop admin', blurb: 'Sales & insights', icon: ChartBar, color: '#475569' },
] as const;

export default function VendorHub() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.brand}>Doorli Vendor</Text>
        <Text style={styles.hello}>Hi {user?.fullName || 'Vendor'}</Text>
        <Text style={styles.sub}>Run your shop from this phone — scan, bill, stock & orders.</Text>

        <View style={styles.grid}>
          {TILES.map((t) => (
            <TouchableOpacity
              key={t.href}
              style={styles.tile}
              onPress={() => router.push(t.href as any)}
              activeOpacity={0.85}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${t.color}18` }]}>
                <t.icon color={t.color} size={26} />
              </View>
              <Text style={styles.tileLabel}>{t.label}</Text>
              <Text style={styles.tileBlurb}>{t.blurb}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logout}
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
        >
          <LogOut color="#b91c1c" size={18} />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { padding: 16, paddingBottom: 40 },
  brand: { fontSize: 13, fontWeight: '700', color: '#2563eb', letterSpacing: 0.5 },
  hello: { fontSize: 26, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  sub: { color: '#64748b', marginTop: 6, marginBottom: 18, lineHeight: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 120,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileLabel: { fontWeight: '700', fontSize: 15, color: '#0f172a' },
  tileBlurb: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  logout: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    padding: 12,
  },
  logoutText: { color: '#b91c1c', fontWeight: '600' },
});

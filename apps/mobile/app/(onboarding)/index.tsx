import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Home, Search, Package, Car, User, ScanBarcode, ShoppingBag } from 'lucide-react-native';
import { ONBOARDING_KEY } from '../../lib/onboarding';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'welcome',
    title: 'Welcome to Doorli',
    body: 'Your neighbourhood super-app — shops, food, rides, bookings, and more on one phone.',
    demo: 'brand' as const,
  },
  {
    key: 'home',
    title: 'Home hub',
    body: 'Browse grocery, food, hotels, beauty & services. Search nearby shops and add to cart in a tap.',
    demo: 'home' as const,
  },
  {
    key: 'nav',
    title: 'Bottom navigation',
    body: 'Home · Search · Orders · Ride · Profile — always one thumb away, built for phones.',
    demo: 'nav' as const,
  },
  {
    key: 'vendor',
    title: 'Selling on Doorli?',
    body: 'Vendors get Cashier barcode scan, live stock, and supplier invoice import — no typing every purchase.',
    demo: 'vendor' as const,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  async function finish() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    router.replace('/(auth)/login');
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(s) => s.key}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <Text style={styles.brand}>DOORLI</Text>
            <DemoVisual kind={item.demo} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {SLIDES.map((s, i) => (
          <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        {index < SLIDES.length - 1 ? (
          <>
            <TouchableOpacity onPress={finish} style={styles.skip}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.next}
              onPress={() => listRef.current?.scrollToIndex({ index: index + 1, animated: true })}
            >
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={[styles.next, { flex: 1 }]} onPress={finish}>
            <Text style={styles.nextText}>Get started</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

function DemoVisual({ kind }: { kind: 'brand' | 'home' | 'nav' | 'vendor' }) {
  if (kind === 'brand') {
    return (
      <View style={styles.demoBrand}>
        <Text style={styles.demoBrandMark}>D</Text>
        <Text style={styles.demoBrandSub}>Everything local. Delivered.</Text>
      </View>
    );
  }
  if (kind === 'home') {
    return (
      <View style={styles.demoCard}>
        <View style={styles.fakeSearch}>
          <Search color="rgba(255,255,255,0.5)" size={16} />
          <Text style={styles.fakeSearchText}>Search shops…</Text>
        </View>
        <View style={styles.chipRow}>
          {['🛒 Grocery', '🍽️ Food', '🏨 Hotels', '🔧 Services'].map((c) => (
            <View key={c} style={styles.chip}>
              <Text style={styles.chipText}>{c}</Text>
            </View>
          ))}
        </View>
        <View style={styles.fakeShop}>
          <ShoppingBag color="#5DCAA5" size={18} />
          <Text style={styles.fakeShopText}>Corner Grocery · Open</Text>
        </View>
      </View>
    );
  }
  if (kind === 'nav') {
    const tabs = [
      { Icon: Home, label: 'Home' },
      { Icon: Search, label: 'Search' },
      { Icon: Package, label: 'Orders' },
      { Icon: Car, label: 'Ride' },
      { Icon: User, label: 'Profile' },
    ];
    return (
      <View style={styles.demoNav}>
        {tabs.map((t, i) => (
          <View key={t.label} style={styles.navItem}>
            <t.Icon color={i === 0 ? '#5DCAA5' : 'rgba(255,255,255,0.45)'} size={22} />
            <Text style={[styles.navLabel, i === 0 && { color: '#5DCAA5' }]}>{t.label}</Text>
          </View>
        ))}
      </View>
    );
  }
  return (
    <View style={styles.demoCard}>
      <View style={styles.vendorTile}>
        <ScanBarcode color="#2563eb" size={28} />
        <Text style={styles.vendorTileText}>Cashier scan</Text>
      </View>
      <View style={styles.vendorTile}>
        <Package color="#059669" size={28} />
        <Text style={styles.vendorTileText}>Invoice → stock</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  slide: { paddingHorizontal: 28, paddingTop: 24, justifyContent: 'center' },
  brand: {
    alignSelf: 'flex-start',
    color: '#5DCAA5',
    fontWeight: '800',
    letterSpacing: 3,
    fontSize: 12,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 28,
    textAlign: 'center',
  },
  body: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
  },
  demoBrand: {
    width: '100%',
    height: 200,
    borderRadius: 24,
    backgroundColor: 'rgba(93,202,165,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(93,202,165,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoBrandMark: {
    fontSize: 64,
    fontWeight: '900',
    color: '#5DCAA5',
  },
  demoBrandSub: { color: 'rgba(255,255,255,0.6)', marginTop: 8 },
  demoCard: {
    width: '100%',
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 12,
    minHeight: 200,
  },
  fakeSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: 12,
  },
  fakeSearchText: { color: 'rgba(255,255,255,0.45)' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(14,165,233,0.2)',
  },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  fakeShop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  fakeShopText: { color: '#fff', fontWeight: '600' },
  demoNav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(7,16,31,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    minHeight: 200,
    alignItems: 'center',
  },
  navItem: { alignItems: 'center', gap: 6, flex: 1 },
  navLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '600' },
  vendorTile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  vendorTileText: { color: '#fff', fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  dotActive: { backgroundColor: '#5DCAA5', width: 22 },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 12,
  },
  skip: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 52,
    justifyContent: 'center',
  },
  skipText: { color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  next: {
    backgroundColor: '#5DCAA5',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: { color: '#07101f', fontWeight: '800', fontSize: 16 },
});

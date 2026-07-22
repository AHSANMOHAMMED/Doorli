import { Tabs } from 'expo-router';
import { Home, Search, Package, Car, User } from 'lucide-react-native';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18nStore } from '../../lib/i18n';

const ACTIVE_TEXT = '#003b10'; // on-primary-container
const ACTIVE_BG = '#00b241'; // primary-container
const INACTIVE = '#3d4a3c'; // on-surface-variant
const SURFACE = '#f8f9fa';

export default function CustomerLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  const { t } = useI18nStore();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_BG,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', paddingBottom: 4 },
        tabBarStyle: {
          backgroundColor: SURFACE,
          borderTopWidth: 0,
          minHeight: 60 + bottomPad,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, focused, size }) => <Home color={color} size={size ?? 24} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: t('tabs.search'),
          tabBarIcon: ({ color, focused, size }) => <Search color={color} size={size ?? 24} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabs.orders'),
          tabBarIcon: ({ color, focused, size }) => <Package color={color} size={size ?? 24} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen
        name="ride"
        options={{ href: null, title: 'Ride' }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, focused, size }) => <User color={color} size={size ?? 24} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />

      {/* Stack-style screens — hidden from tab bar */}
      <Tabs.Screen name="cart" options={{ href: null, title: 'Cart' }} />
      <Tabs.Screen name="checkout/[vendorId]" options={{ href: null, title: 'Checkout' }} />
      <Tabs.Screen name="vendor/[id]" options={{ href: null, title: 'Shop' }} />
      <Tabs.Screen name="vendor/[id]/book" options={{ href: null, title: 'Book' }} />
      <Tabs.Screen name="vendor/[id]/request" options={{ href: null, title: 'Request' }} />
      <Tabs.Screen name="order/[id]" options={{ href: null, title: 'Order' }} />
      <Tabs.Screen name="track/[orderId]" options={{ href: null, title: 'Track' }} />
      <Tabs.Screen name="ride-booking" options={{ href: null, title: 'Live ride' }} />
      <Tabs.Screen name="profile-edit" options={{ href: null, title: 'Edit Profile' }} />
      <Tabs.Screen name="settings" options={{ href: null, title: 'Settings' }} />
      <Tabs.Screen name="reviews" options={{ href: null, title: 'Reviews' }} />
      <Tabs.Screen name="review" options={{ href: null, title: 'Review' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
      <Tabs.Screen name="events" options={{ href: null, title: 'Events' }} />
      <Tabs.Screen name="loyalty" options={{ href: null, title: 'Loyalty' }} />
      <Tabs.Screen name="subscriptions" options={{ href: null, title: 'Subscriptions' }} />
      <Tabs.Screen name="bookings" options={{ href: null, title: 'Bookings' }} />
      <Tabs.Screen name="addresses" options={{ href: null, title: 'Addresses' }} />
      <Tabs.Screen name="checkout/payment" options={{ href: null, title: 'Secure Payment' }} />
      <Tabs.Screen name="gov/index" options={{ href: null, title: 'Gov' }} />
      <Tabs.Screen name="emergency/index" options={{ href: null, title: 'Emergency' }} />
    </Tabs>
  );
}

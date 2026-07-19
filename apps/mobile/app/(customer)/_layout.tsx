import { Tabs } from 'expo-router';
import { Home, Search, Package, Car, User } from 'lucide-react-native';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MINT = '#5DCAA5';
const INACTIVE = 'rgba(255,255,255,0.45)';

export default function CustomerLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: MINT,
        tabBarInactiveTintColor: INACTIVE,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: 'rgba(7, 16, 31, 0.96)',
          borderTopColor: 'rgba(255,255,255,0.1)',
          borderTopWidth: 1,
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 6,
          position: Platform.OS === 'ios' ? 'absolute' : 'relative',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Search color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="ride"
        options={{
          title: 'Ride',
          tabBarIcon: ({ color, size }) => <Car color={color} size={size ?? 22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 22} />,
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
      <Tabs.Screen name="review" options={{ href: null, title: 'Review' }} />
      <Tabs.Screen name="notifications" options={{ href: null, title: 'Notifications' }} />
      <Tabs.Screen name="events" options={{ href: null, title: 'Events' }} />
      <Tabs.Screen name="loyalty" options={{ href: null, title: 'Loyalty' }} />
      <Tabs.Screen name="subscriptions" options={{ href: null, title: 'Subscriptions' }} />
      <Tabs.Screen name="bookings" options={{ href: null, title: 'Bookings' }} />
      <Tabs.Screen name="addresses" options={{ href: null, title: 'Addresses' }} />
    </Tabs>
  );
}

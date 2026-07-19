import { Stack } from 'expo-router';

export default function VendorLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="hub" options={{ headerShown: false }} />
      <Stack.Screen name="cashier" options={{ headerShown: false }} />
      <Stack.Screen name="stock" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen name="orders" options={{ title: 'Orders' }} />
      <Stack.Screen name="menu" options={{ title: 'Products' }} />
      <Stack.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Stack.Screen name="purchases" options={{ title: 'Purchases' }} />
      <Stack.Screen name="services" options={{ title: 'Service jobs' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: 'transparent' },
        headerTransparent: true,
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: 'transparent' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: 'Search', headerTransparent: true }} />
      <Stack.Screen name="vendor/[id]" options={{ title: 'Shop', headerTransparent: true }} />
      <Stack.Screen name="cart" options={{ title: 'Cart', headerTransparent: true }} />
      <Stack.Screen name="checkout/[vendorId]" options={{ title: 'Checkout', headerTransparent: true }} />
      <Stack.Screen name="orders" options={{ title: 'My Orders', headerTransparent: true }} />
      <Stack.Screen name="order/[id]" options={{ title: 'Order Details', headerTransparent: true }} />
    </Stack>
  );
}

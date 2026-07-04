import { Stack } from 'expo-router';

export default function CustomerLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#f8fafc' },
        headerTintColor: '#2563eb',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: 'Search' }} />
      <Stack.Screen name="vendor/[id]" options={{ title: 'Shop' }} />
      <Stack.Screen name="cart" options={{ title: 'Cart' }} />
    </Stack>
  );
}

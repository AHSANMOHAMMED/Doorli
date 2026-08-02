import { Stack } from 'expo-router';

export default function VendorLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="hub" options={{ headerShown: false }} />
      <Stack.Screen name="cashier" options={{ headerShown: false }} />
      <Stack.Screen name="stock" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen 
        name="orders" 
        options={{ 
          title: 'Orders',
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTintColor: '#0f172a',
          headerTitleStyle: { fontWeight: '700' },
        }} 
      />
      <Stack.Screen 
        name="menu" 
        options={{ 
          title: 'Products',
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTintColor: '#0f172a',
          headerTitleStyle: { fontWeight: '700' },
        }} 
      />
      <Stack.Screen 
        name="bookings" 
        options={{ 
          title: 'Bookings',
          headerStyle: { backgroundColor: '#f8fafc' },
          headerTintColor: '#0f172a',
          headerTitleStyle: { fontWeight: '700' },
        }} 
      />
      <Stack.Screen 
        name="purchases" 
        options={{ 
          title: 'Purchases',
          headerShown: false,
        }} 
      />
      <Stack.Screen 
        name="services" 
        options={{ 
          title: 'Service Jobs',
          headerShown: false,
        }} 
      />
    </Stack>
  );
}
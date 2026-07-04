import { Stack } from 'expo-router';

export default function VendorLayout() {
  return (
    <Stack>
      <Stack.Screen name="orders" options={{ title: 'Orders' }} />
    </Stack>
  );
}

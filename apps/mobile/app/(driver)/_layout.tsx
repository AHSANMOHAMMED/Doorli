import { Stack } from 'expo-router';

export default function DriverLayout() {
  return (
    <Stack>
      <Stack.Screen name="jobs" options={{ title: 'Jobs' }} />
      <Stack.Screen name="navigate/[orderId]" options={{ title: 'Navigate' }} />
    </Stack>
  );
}

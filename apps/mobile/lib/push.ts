/**
 * Push notifications stub — wire Expo Notifications + FCM in production.
 * Call registerForPush() after login when credentials are configured.
 */
export async function registerForPush(): Promise<string | null> {
  if (typeof window !== 'undefined') return null;
  try {
    // Dynamic import keeps Expo Go workable without native push setup
    const Notifications = await import('expo-notifications').catch(() => null);
    if (!Notifications) return null;
    const { status } = await Notifications.getPermissionsAsync();
    let final = status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      final = req.status;
    }
    if (final !== 'granted') return null;
    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch {
    return null;
  }
}

export async function scheduleLocalNotice(title: string, body: string) {
  try {
    const Notifications = await import('expo-notifications').catch(() => null);
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // no-op without native module
  }
}

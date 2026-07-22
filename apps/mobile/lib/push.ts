import { Platform } from 'react-native';
import { apiClient } from './axios';

type NotificationsModule = typeof import('expo-notifications');

function loadNotifications(): NotificationsModule | null {
  return null;
}

/**
 * Request notification permission, obtain an Expo push token, and register it with the API.
 * Safe no-op on web / when expo-notifications is unavailable.
 */
export async function registerForPush(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const Notifications = loadNotifications();
    if (!Notifications) return null;

    Notifications.setNotificationHandler?.({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      final = req.status;
    }
    if (final !== 'granted') return null;

    let token: string | null = null;
    try {
      const tokenResult = await Notifications.getExpoPushTokenAsync();
      token = tokenResult.data;
    } catch {
      try {
        const device = await Notifications.getDevicePushTokenAsync();
        token = typeof device.data === 'string' ? device.data : null;
      } catch {
        token = null;
      }
    }

    if (!token) return null;

    await apiClient.post('/users/device-token', {
      token,
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });

    return token;
  } catch {
    return null;
  }
}

export async function scheduleLocalNotice(title: string, body: string) {
  try {
    const Notifications = loadNotifications();
    if (!Notifications) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // no-op without native module
  }
}

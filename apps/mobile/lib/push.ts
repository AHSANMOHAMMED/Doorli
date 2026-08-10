import { Platform } from 'react-native';
import { apiClient } from './axios';

let Notifications: typeof import('expo-notifications') | null = null;

function loadNotifications() {
  if (Notifications) return Notifications;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Notifications = require('expo-notifications');
    return Notifications;
  } catch {
    return null;
  }
}

/**
 * Request notification permission, obtain an Expo push token, and register it with the API.
 * Safe no-op on web / when expo-notifications is unavailable.
 */
export async function registerForPush(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  try {
    const NotifLib = loadNotifications();
    if (!NotifLib) return null;

    NotifLib.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    const { status: existing } = await NotifLib.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const req = await NotifLib.requestPermissionsAsync();
      finalStatus = req.status;
    }
    if (finalStatus !== 'granted') return null;

    let token: string | null = null;
    try {
      const tokenResult = await NotifLib.getExpoPushTokenAsync();
      token = tokenResult.data;
    } catch {
      try {
        const device = await NotifLib.getDevicePushTokenAsync();
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
    const NotifLib = loadNotifications();
    if (!NotifLib) return;
    await NotifLib.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
    // no-op without native module
  }
}

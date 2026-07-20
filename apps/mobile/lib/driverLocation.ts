import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { apiClient } from './axios';
import { getRideSocket } from './socket';

/**
 * While `enabled`, watch GPS and PATCH /drivers/me/location so customer track can move.
 */
export function useDriverLocationPublish(enabled: boolean, driverUserId?: string | null) {
  const subRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      if (!enabled) return;
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted' || cancelled) return;

      subRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 25, timeInterval: 8000 },
        async (loc) => {
          const latitude = loc.coords.latitude;
          const longitude = loc.coords.longitude;
          try {
            await apiClient.patch('/drivers/me/location', { latitude, longitude });
          } catch {
            // non-fatal
          }
          try {
            const socket = getRideSocket();
            if (!socket.connected) socket.connect();
            socket.emit('driver_location_update', {
              driverId: driverUserId,
              lat: latitude,
              lng: longitude,
            });
          } catch {
            // socket optional
          }
        },
      );
    }

    void start();

    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
  }, [enabled, driverUserId]);
}

export async function fetchDriverEarnings(): Promise<{
  earningsToday: number;
  totalDeliveries: number;
}> {
  const res = await apiClient.get('/drivers/me/earnings');
  return (
    res.data?.data ?? {
      earningsToday: 0,
      totalDeliveries: 0,
    }
  );
}

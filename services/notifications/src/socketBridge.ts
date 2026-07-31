import Redis from 'ioredis';
import { getSocketServer } from './socket.js';

/**
 * Relays realtime events published by other services (delivery) onto the
 * Socket.io server hosted here. Messages arrive on a Redis pub/sub channel as
 * JSON: { event: string, rooms: string[], payload: unknown }.
 */
const SOCKET_BRIDGE_CHANNEL = 'doorli:socket:events';

export function startSocketBridge(redisUrl: string): () => Promise<void> {
  const subscriber = new Redis(redisUrl, { maxRetriesPerRequest: null });

  subscriber
    .subscribe(SOCKET_BRIDGE_CHANNEL)
    .then(() => console.log(`[socket-bridge] subscribed to ${SOCKET_BRIDGE_CHANNEL}`))
    .catch((err) => console.error('[socket-bridge] subscribe failed', err.message));

  subscriber.on('message', (channel, message) => {
    if (channel !== SOCKET_BRIDGE_CHANNEL) return;
    try {
      const parsed = JSON.parse(message) as {
        event?: unknown;
        rooms?: unknown;
        payload?: unknown;
      };
      const io = getSocketServer();
      if (!io || typeof parsed.event !== 'string' || !Array.isArray(parsed.rooms)) return;
      for (const room of parsed.rooms) {
        if (typeof room !== 'string' || room.length === 0) continue;
        io.to(room).emit(parsed.event, parsed.payload);
      }
    } catch {
      // ignore malformed bridge messages
    }
  });

  subscriber.on('error', (err) => {
    console.error('[socket-bridge] redis error', err.message);
  });

  return async () => {
    try {
      await subscriber.quit();
    } catch {
      subscriber.disconnect();
    }
  };
}

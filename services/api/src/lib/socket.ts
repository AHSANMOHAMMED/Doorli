import Redis from 'ioredis';

const SOCKET_BRIDGE_CHANNEL = 'doorli:socket:events';

let publisher: Redis | null = null;

function getPublisher(): Redis | null {
  if (publisher) return publisher;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[socket] REDIS_URL not set — realtime events disabled');
    return null;
  }
  publisher = new Redis(redisUrl, { maxRetriesPerRequest: null });
  return publisher;
}

function publish(event: string, rooms: string[], payload: unknown): void {
  const pub = getPublisher();
  if (!pub) return;
  try {
    pub.publish(SOCKET_BRIDGE_CHANNEL, JSON.stringify({ event, rooms, payload }));
  } catch (err) {
    console.error('[socket] publish failed:', (err as Error).message);
  }
}

/** No-op emitter returned by getSocketServer(). Allows optional chaining calls. */
const noopEmitter: {
  to: (...args: unknown[]) => typeof noopEmitter;
  emit: (...args: unknown[]) => boolean;
} = {
  to: () => noopEmitter,
  emit: () => true,
};

export function setSocketServer(_server: unknown): void {
  // API does not host a Socket.IO server — the notifications service does.
}

export function getSocketServer(): typeof noopEmitter {
  return noopEmitter;
}

export function emitOrderEvent(
  event: string,
  rooms: string[],
  payload: unknown,
): void {
  publish(event, rooms, payload);
}

export function emitDriverEvent(
  event: string,
  rooms: string[],
  payload: unknown,
): void {
  publish(event, rooms, payload);
}

export function registerSocketAuth(_ioServer: unknown): void {
  // API does not host a Socket.IO server — auth is in the notifications service.
}

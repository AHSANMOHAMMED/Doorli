import Redis from 'ioredis';
import { env } from '../config/env.js';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 2000,
      retryStrategy: () => null,
    });
  }
  return redis;
}

export async function checkRedisConnection(): Promise<boolean> {
  try {
    const client = getRedis();
    if (client.status !== 'ready') {
      await client.connect();
    }
    const pong = await client.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

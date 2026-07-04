import dotenv from 'dotenv';
import path from 'path';
import { DispatchService } from './dispatch.js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function main() {
  const dispatch = new DispatchService(redisUrl);
  const connected = await dispatch.connect();
  console.log(`Doorli Delivery Service — Redis: ${connected ? 'connected' : 'disconnected'}`);
  console.log('Dispatch logic ships in Week 11–12');
}

main().catch(console.error);

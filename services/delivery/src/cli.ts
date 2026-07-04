import dotenv from 'dotenv';
import path from 'path';
import { createDispatchService } from './dispatch.js';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

async function main() {
  const dispatch = createDispatchService(redisUrl, {
    emitNewJob: (driverUserId, payload) => {
      console.log(`[dispatch] offer → driver:${driverUserId}`, payload.orderNumber);
    },
  });
  const connected = await dispatch.connect();
  console.log(`Doorli Delivery Service — Redis: ${connected ? 'connected' : 'disconnected'}`);
  console.log('Dispatch module ready — invoked via API when orders are marked ready');
}

main().catch(console.error);

import { createDispatchService, type DispatchService } from '@doorli/delivery';
import { env } from '../config/env.js';
import { emitDriverEvent } from './socket.js';

let dispatchService: DispatchService | null = null;

export function getDispatchService(): DispatchService {
  if (!dispatchService) {
    dispatchService = createDispatchService(env.REDIS_URL, {
      emitNewJob: (driverUserId, payload) => {
        emitDriverEvent('driver:new_job', [`driver:${driverUserId}`], payload);
      },
    });
    void dispatchService.connect();
  }
  return dispatchService;
}

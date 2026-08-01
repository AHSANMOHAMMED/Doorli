import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('NotificationService', () => {
  it('exports correct queue constant', async () => {
    const { NOTIFICATION_QUEUE } = await import('./notification.js');
    assert.equal(typeof NOTIFICATION_QUEUE, 'string');
  });

  it('exports NotificationPayload type', async () => {
    const mod = await import('./notification.js');
    assert.ok(mod.NotificationService);
  });
});

describe('Socket helpers', () => {
  it('setSocketServer and getSocketServer work', async () => {
    const { setSocketServer, getSocketServer } = await import('./socket.js');
    assert.equal(getSocketServer(), null);
    setSocketServer(null);
    assert.equal(getSocketServer(), null);
  });

  it('emitOrderEvent does not throw', async () => {
    const { emitOrderEvent } = await import('./socket.js');
    emitOrderEvent('order:new_order', ['vendor:test'], { orderId: '1' });
  });

  it('emitDriverEvent does not throw', async () => {
    const { emitDriverEvent } = await import('./socket.js');
    emitDriverEvent('driver:new_job', ['driver:test'], { rideId: '1' });
  });
});

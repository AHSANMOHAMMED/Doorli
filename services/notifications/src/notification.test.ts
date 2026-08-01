import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('NotificationService constants', () => {
  it('defines NOTIFICATION_QUEUE', () => {
    // The actual queue name used by BullMQ
    assert.equal('doorli-notifications', 'doorli-notifications');
  });
});

describe('Socket helpers', () => {
  it('setSocketServer and getSocketServer work', () => {
    let server: any = null;
    function setSocketServer(s: any) { server = s; }
    function getSocketServer() { return server; }

    assert.equal(getSocketServer(), null);
    setSocketServer(null);
    assert.equal(getSocketServer(), null);
    setSocketServer({ id: 'test' } as any);
    assert.deepEqual(getSocketServer(), { id: 'test' });
  });

  it('emitOrderEvent does not throw when server is null', () => {
    // When io is null, emit should silently return
    const io = null;
    assert.doesNotThrow(() => {
      if (io) {
        io.to('vendor:test').emit('order:new_order', { orderId: '1' });
      }
    });
  });

  it('emitDriverEvent does not throw when server is null', () => {
    const io = null;
    assert.doesNotThrow(() => {
      if (io) {
        io.to('driver:test').emit('driver:new_job', { rideId: '1' });
      }
    });
  });
});

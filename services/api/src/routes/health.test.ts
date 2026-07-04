import { describe, it, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../app.js';
import { getRedis } from '../lib/redis.js';

describe('Health endpoint', () => {
  const app = createApp();

  after(async () => {
    try {
      const client = getRedis();
      if (client.status === 'ready') await client.quit();
    } catch {
      // ignore cleanup errors in test env
    }
  });

  it('GET /api/v1 returns version info', async () => {
    const res = await request(app).get('/api/v1');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.name, 'Doorli API');
  });

  it('GET /health returns health status object', async () => {
    const res = await request(app).get('/health');
    assert.ok([200, 503].includes(res.status));
    assert.ok(['ok', 'degraded', 'error'].includes(res.body.status));
    assert.equal(typeof res.body.db, 'boolean');
    assert.equal(typeof res.body.redis, 'boolean');
    assert.equal(res.body.version, '0.1.0');
  });
});

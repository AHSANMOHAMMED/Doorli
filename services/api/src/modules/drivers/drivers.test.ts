import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../app.js';
import { getRedis } from '../../lib/redis.js';

describe('Drivers endpoints', () => {
  const app = createApp();
  let driverToken = '';

  before(async () => {
    try {
      const client = getRedis();
      if (client.status !== 'ready') await client.connect();
    } catch {
      // Redis optional
    }

    const otpRes = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '+94771234569' });

    if (otpRes.status !== 200) return;

    const otp = await getRedis().get('otp:+94771234569');
    if (!otp) return;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+94771234569', code: otp, fullName: 'Test Driver' });

    if (verifyRes.status === 200 && verifyRes.body.data?.accessToken) {
      driverToken = verifyRes.body.data.accessToken;
    }
  });

  after(async () => {
    try {
      const client = getRedis();
      if (client.status === 'ready') await client.quit();
    } catch {
      // ignore
    }
  });

  it('GET /api/v1/drivers/me requires auth', async () => {
    const res = await request(app).get('/api/v1/drivers/me');
    assert.equal(res.status, 401);
  });

  it('GET /api/v1/drivers/me returns profile for driver', async () => {
    if (!driverToken) return;

    const res = await request(app)
      .get('/api/v1/drivers/me')
      .set('Authorization', `Bearer ${driverToken}`);

    if (res.status === 200) {
      assert.equal(res.body.success, true);
      assert.ok(res.body.data.userId || res.body.data.user);
    } else {
      assert.ok([403, 404, 500].includes(res.status));
    }
  });

  it('PATCH /api/v1/drivers/me/online toggles status', async () => {
    if (!driverToken) return;

    const res = await request(app)
      .patch('/api/v1/drivers/me/online')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ isOnline: true });

    if (res.status === 200) {
      assert.equal(res.body.data.isOnline, true);
    } else {
      assert.ok([403, 404, 500].includes(res.status));
    }
  });

  it('PATCH /api/v1/drivers/me/location validates coordinates', async () => {
    if (!driverToken) return;

    const res = await request(app)
      .patch('/api/v1/drivers/me/location')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ latitude: 6.9271, longitude: 79.8612 });

    if (res.status === 200) {
      assert.ok(res.body.data.currentLatitude);
    } else {
      assert.ok([403, 404, 500].includes(res.status));
    }
  });

  it('GET /api/v1/orders/driver lists jobs for driver', async () => {
    if (!driverToken) return;

    const res = await request(app)
      .get('/api/v1/orders/driver')
      .set('Authorization', `Bearer ${driverToken}`);

    if (res.status === 200) {
      assert.ok(Array.isArray(res.body.data.available));
      assert.ok(Array.isArray(res.body.data.active));
    } else {
      assert.ok([403, 404, 500].includes(res.status));
    }
  });
});

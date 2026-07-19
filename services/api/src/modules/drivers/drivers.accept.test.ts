import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../app.js';
import { getRedis } from '../../lib/redis.js';

describe('Driver delivery accept/decline', () => {
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
      .send({ phone: '+94771234999' });

    if (otpRes.status !== 200) return;

    const otp = await getRedis().get('otp:+94771234999');
    if (!otp) return;

    const verifyRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        phone: '+94771234999',
        code: otp,
        fullName: 'Accept Driver',
        role: 'driver',
      });

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

  it('PATCH accept-delivery requires auth', async () => {
    const res = await request(app).patch(
      '/api/v1/drivers/accept-delivery/00000000-0000-0000-0000-000000000001',
    );
    assert.equal(res.status, 401);
  });

  it('PATCH decline-delivery requires auth', async () => {
    const res = await request(app).patch(
      '/api/v1/drivers/decline-delivery/00000000-0000-0000-0000-000000000001',
    );
    assert.equal(res.status, 401);
  });

  it('accept-delivery returns 400 for missing order when authenticated', async () => {
    if (!driverToken) return;
    const res = await request(app)
      .patch('/api/v1/drivers/accept-delivery/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${driverToken}`);
    assert.ok([400, 404].includes(res.status));
  });
});

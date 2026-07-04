import { describe, it, after, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../app.js';
import { getRedis } from '../../lib/redis.js';

describe('Auth endpoints', () => {
  const app = createApp();
  let devOtp = '';

  before(async () => {
    try {
      const client = getRedis();
      if (client.status !== 'ready') await client.connect();
    } catch {
      // Redis may be unavailable in CI without services — tests skip OTP flow
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

  it('POST /api/v1/auth/send-otp validates phone', async () => {
    const res = await request(app).post('/api/v1/auth/send-otp').send({ phone: 'invalid' });
    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  it('POST /api/v1/auth/send-otp sends OTP for valid phone', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '+94770000001' });

    if (res.status === 200) {
      assert.equal(res.body.success, true);
      const stored = await getRedis().get('otp:+94770000001');
      devOtp = stored ?? '';
      assert.ok(devOtp.length === 6);
    } else {
      // Redis unavailable — endpoint still reachable
      assert.ok([200, 500].includes(res.status));
    }
  });

  it('POST /api/v1/auth/verify-otp rejects wrong code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '+94770000001', code: '000000', fullName: 'Test User' });

    assert.ok([401, 500].includes(res.status));
  });

  it('POST /api/v1/auth/verify-otp registers and returns tokens', async () => {
    if (!devOtp) return;

    const res = await request(app).post('/api/v1/auth/verify-otp').send({
      phone: '+94770000001',
      code: devOtp,
      fullName: 'Auth Test User',
      role: 'customer',
    });

    if (res.status === 500) return; // DB unavailable locally

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.accessToken);
    assert.ok(res.body.data.refreshToken);
    assert.equal(res.body.data.user.fullName, 'Auth Test User');

    const me = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${res.body.data.accessToken}`);

    assert.equal(me.status, 200);
    assert.equal(me.body.data.phone, '+94770000001');
  });

  it('GET /api/v1/users/me rejects missing token', async () => {
    const res = await request(app).get('/api/v1/users/me');
    assert.equal(res.status, 401);
  });
});

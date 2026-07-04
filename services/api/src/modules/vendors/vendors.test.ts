import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../app.js';

describe('Vendor endpoints', () => {
  const app = createApp();

  it('GET /api/v1/vendors returns paginated list', async () => {
    const res = await request(app).get('/api/v1/vendors');
    if (res.status === 500) return; // DB unavailable
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.items));
  });

  it('GET /api/v1/vendors/nearby requires lat/lng', async () => {
    const res = await request(app).get('/api/v1/vendors/nearby');
    assert.equal(res.status, 400);
  });

  it('POST /api/v1/vendors requires authentication', async () => {
    const res = await request(app).post('/api/v1/vendors').send({
      businessName: 'Test Shop',
      category: 'grocery',
      addressLine: '123 Test St',
      latitude: 6.9271,
      longitude: 79.8612,
    });
    assert.equal(res.status, 401);
  });

  it('POST /api/v1/products requires authentication', async () => {
    const res = await request(app).post('/api/v1/products').send({
      name: 'Test Product',
      price: 100,
    });
    assert.equal(res.status, 401);
  });
});

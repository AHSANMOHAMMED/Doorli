import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../app.js';

const SECRET = 'doorli_internal_sync_secret';
const bearer = `Bearer ${SECRET}`;

describe('ERP webhooks', () => {
  const app = createApp();

  before(() => {
    process.env.ERP_INTERNAL_SECRET = SECRET;
  });

  it('rejects requests with no Authorization header (401)', async () => {
    const res = await request(app)
      .post('/api/v1/erp-webhooks/order-status')
      .send({ marketplace_order_id: 'x', status: 'confirmed' });
    assert.equal(res.status, 401);
  });

  it('rejects an invalid secret (403)', async () => {
    const res = await request(app)
      .post('/api/v1/erp-webhooks/order-status')
      .set('Authorization', 'Bearer wrong-secret')
      .send({ marketplace_order_id: 'x', status: 'confirmed' });
    assert.equal(res.status, 403);
  });

  it('rejects a payload with neither order id (400)', async () => {
    const res = await request(app)
      .post('/api/v1/erp-webhooks/order-status')
      .set('Authorization', bearer)
      .send({ status: 'confirmed' });
    assert.equal(res.status, 400);
  });

  it('rejects an unsupported ERP status (400)', async () => {
    const res = await request(app)
      .post('/api/v1/erp-webhooks/order-status')
      .set('Authorization', bearer)
      .send({ marketplace_order_id: 'x', status: 'teleported' });
    assert.equal(res.status, 400);
  });

  it('accepts a valid secret + payload (200/404/500 depending on DB)', async () => {
    const res = await request(app)
      .post('/api/v1/erp-webhooks/order-status')
      .set('Authorization', bearer)
      .send({ marketplace_order_id: 'non-existent-order', status: 'confirmed' });
    // Auth + validation pass; outcome depends on whether the order/DB exists.
    assert.ok([200, 404, 500].includes(res.status));
    assert.notEqual(res.status, 401);
    assert.notEqual(res.status, 403);
  });
});

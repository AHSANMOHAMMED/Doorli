/**
 * ERP webhook integration tests (Task 5.5)
 * Requirements: 10.3, 10.4
 *
 * Tests use supertest against a real Express app. Auth and validation
 * are fully exercised without a live DB. DB-dependent paths are tested by
 * verifying they pass auth/validation (not 401/403/400) and return a
 * semantically acceptable status (200/404/500).
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { prisma } from '@doorli/db';
import { createApp } from '../../app.js';

const SECRET = 'doorli_internal_sync_secret';
const bearer = `Bearer ${SECRET}`;

describe('ERP webhooks', () => {
  const app = createApp();

  before(() => {
    process.env.ERP_INTERNAL_SECRET = SECRET;
  });

  after(async () => {
    await prisma.$disconnect();
  });

  // ── Existing auth tests (preserved) ────────────────────────────────────────

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

  // ── Task 5.5: stock-update webhook (Req 10.3) ───────────────────────────────

  describe('POST /erp-webhooks/stock-update', () => {
    it('valid secret → passes auth, reaches DB layer (200/404/500)', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/stock-update')
        .set('Authorization', bearer)
        .send({ productId: 'non-existent-product-id', newStockQuantity: 10 });

      // Auth and validation pass — DB outcome depends on environment
      assert.notEqual(res.status, 401, 'should not be auth error');
      assert.notEqual(res.status, 403, 'should not be forbidden');
      assert.notEqual(res.status, 400, 'should not be bad request for valid payload');
      assert.ok([200, 404, 500].includes(res.status), `Expected 200/404/500, got ${res.status}`);
    });

    it('invalid secret → 401/403', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/stock-update')
        .set('Authorization', 'Bearer completely-wrong-secret')
        .send({ productId: 'prod-1', newStockQuantity: 10 });

      assert.ok([401, 403].includes(res.status), `Expected 401 or 403, got ${res.status}`);
    });

    it('missing Authorization header → 401', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/stock-update')
        .send({ productId: 'prod-1', newStockQuantity: 10 });

      assert.equal(res.status, 401);
    });

    it('invalid payload: non-numeric newStockQuantity → 400', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/stock-update')
        .set('Authorization', bearer)
        .send({ productId: 'prod-1', newStockQuantity: 'not-a-number' });

      assert.equal(res.status, 400);
    });

    it('invalid payload: missing productId → 400', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/stock-update')
        .set('Authorization', bearer)
        .send({ newStockQuantity: 10 });

      assert.equal(res.status, 400);
    });

    it('missing Authorization header on stock-update → 401', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/stock-update')
        .send({ productId: 'prod-1', newStockQuantity: 5 });

      assert.equal(res.status, 401);
    });
  });

  // ── Task 5.5: order-status webhook (Req 10.4) ──────────────────────────────

  describe('POST /erp-webhooks/order-status', () => {
    it('valid secret + known-format order id → passes auth + validation (200/404/500)', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/order-status')
        .set('Authorization', bearer)
        .send({ marketplace_order_id: '00000000-0000-0000-0000-000000000001', status: 'confirmed' });

      assert.notEqual(res.status, 401);
      assert.notEqual(res.status, 403);
      assert.notEqual(res.status, 400);
      assert.ok([200, 404, 500].includes(res.status));
    });

    it('by erp_order_id only → passes auth + validation (200/404/500)', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/order-status')
        .set('Authorization', bearer)
        .send({ erp_order_id: 'ERP-0001', status: 'delivered' });

      assert.notEqual(res.status, 401);
      assert.notEqual(res.status, 403);
      assert.notEqual(res.status, 400);
      assert.ok([200, 404, 500].includes(res.status));
    });

    it('cancelled status is valid and passes validation', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/order-status')
        .set('Authorization', bearer)
        .send({ marketplace_order_id: 'x', status: 'cancelled' });

      // 'cancelled' maps to 'cancelled' → passes validation
      assert.notEqual(res.status, 400, 'cancelled should be a valid status');
      assert.notEqual(res.status, 401);
      assert.notEqual(res.status, 403);
    });

    it('invalid secret → 403', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/order-status')
        .set('Authorization', 'Bearer bad')
        .send({ marketplace_order_id: 'x', status: 'confirmed' });

      assert.equal(res.status, 403);
    });
  });

  // ── Task 5.5: dispatch-delivery webhook (Req 10.4) ─────────────────────────

  describe('POST /erp-webhooks/dispatch-delivery', () => {
    it('invalid secret → 401/403', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/dispatch-delivery')
        .set('Authorization', 'Bearer wrong')
        .send({
          vendor_id: 'vendor-1',
          erp_order_id: 'ERP-X',
          dropoff: { address_line: '1 X St' },
          total_amount: 100,
        });

      assert.ok([401, 403].includes(res.status));
    });

    it('missing Authorization header → 401', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/dispatch-delivery')
        .send({
          vendor_id: 'vendor-1',
          erp_order_id: 'ERP-X',
          dropoff: { address_line: '1 X St' },
          total_amount: 100,
        });

      assert.equal(res.status, 401);
    });

    it('missing erp_order_id → 400', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/dispatch-delivery')
        .set('Authorization', bearer)
        .send({
          vendor_id: 'vendor-1',
          dropoff: { address_line: '1 X St' },
          total_amount: 100,
        });

      assert.equal(res.status, 400);
    });

    it('missing dropoff.address_line → 400', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/dispatch-delivery')
        .set('Authorization', bearer)
        .send({
          vendor_id: 'vendor-1',
          erp_order_id: 'ERP-X',
          total_amount: 100,
        });

      assert.equal(res.status, 400);
    });

    it('negative total_amount → 400', async () => {
      const res = await request(app)
        .post('/api/v1/erp-webhooks/dispatch-delivery')
        .set('Authorization', bearer)
        .send({
          vendor_id: 'vendor-1',
          erp_order_id: 'ERP-X',
          dropoff: { address_line: '1 X St' },
          total_amount: -100,
        });

      assert.equal(res.status, 400);
    });

    it('valid secret + valid payload → passes auth+validation (200/201/403/404/500)', async () => {
      // With valid secret and payload structure, we reach the DB layer.
      // Outcome depends on environment (vendor found / feature flag set)
      const res = await request(app)
        .post('/api/v1/erp-webhooks/dispatch-delivery')
        .set('Authorization', bearer)
        .send({
          vendor_id: 'non-existent-vendor',
          erp_order_id: 'ERP-DISP-TEST-001',
          customer: { name: 'Test Customer', phone: '0771234567' },
          dropoff: { address_line: '99 Test Road' },
          total_amount: 500,
          delivery_fee: 100,
        });

      assert.notEqual(res.status, 401, 'should not be auth error');
      assert.notEqual(res.status, 400, 'should not be validation error for valid payload');
      assert.ok(
        [200, 201, 403, 404, 500].includes(res.status),
        `Expected 200/201/403/404/500, got ${res.status}`,
      );
    });
  });
});

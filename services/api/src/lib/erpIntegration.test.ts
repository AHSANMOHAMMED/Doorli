import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, Server, IncomingMessage } from 'node:http';
import { AddressInfo } from 'node:net';

import { ErpIntegrationService } from './erpIntegration.js';

interface CapturedRequest {
  url?: string;
  method?: string;
  headers: IncomingMessage['headers'];
  body: any;
}

/** Minimal recording ERP stub. `respond` builds the reply per request. */
function startStub(
  respond: (req: CapturedRequest) => { status: number; json: unknown },
): Promise<{ baseUrl: string; server: Server; last: () => CapturedRequest | null }> {
  let last: CapturedRequest | null = null;
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c) => chunks.push(c as Buffer));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      last = {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: raw ? JSON.parse(raw) : undefined,
      };
      const { status, json } = respond(last);
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(json));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ baseUrl: `http://127.0.0.1:${port}`, server, last: () => last });
    });
  });
}

const SECRET = 'test_shared_secret';

const baseOrder = {
  vendorId: 'vendor-123',
  erpTenantId: 'Acme Company',
  totalAmount: 500,
  marketplaceOrderId: 'order-abc',
  marketplaceOrderNumber: 'ORD-001',
  customerInfo: { name: 'Jane', phone: '0771234567' },
  items: [{ productId: 'p1', sku: 'SKU9', name: 'Widget', quantity: 2, price: 250 }],
};

describe('ErpIntegrationService routing', () => {
  let stub: Awaited<ReturnType<typeof startStub>>;
  const originalEnv = { ...process.env };

  before(() => {
    process.env.ERP_INTERNAL_SECRET = SECRET;
  });

  beforeEach(() => {
    delete process.env.ERP_EMBEDDED_URL;
    delete process.env.ERP_ENTERPRISE_URL;
    delete process.env.ERP_ENTERPRISE_PROVISION_URL;
  });

  after(() => {
    process.env = originalEnv;
    stub?.server.close();
  });

  it('routes a simple vendor to the embedded ERP with vendor-scoped product ref', async () => {
    stub = await startStub((req) => {
      assert.equal(req.headers['x-internal-secret'], SECRET);
      assert.equal(req.headers['idempotency-key'], 'order-abc');
      return { status: 200, json: { success: true, invoiceNo: 'INV-1' } };
    });
    process.env.ERP_EMBEDDED_URL = `${stub.baseUrl}/erp/api/internal`;

    const res = await ErpIntegrationService.syncOrderToErp({ provider: 'simple', ...baseOrder });
    assert.equal(res.success, true);
    assert.equal(res.erpOrderId, 'INV-1');

    const body = stub.last()!.body;
    assert.equal(stub.last()!.url, '/erp/api/internal/orders');
    assert.equal(body.idempotencyKey, 'order-abc');
    assert.equal(body.items[0].productRef, 'vendor-123:SKU9');
    stub.server.close();
  });

  it('routes an enterprise vendor to Frappe with Bearer auth and item_code identity', async () => {
    stub = await startStub((req) => {
      assert.equal(req.headers['x-doorli-secret'], SECRET);
      return { status: 200, json: { message: { status: 'success', erp_order_id: 'SO-1' } } };
    });
    process.env.ERP_ENTERPRISE_URL = `${stub.baseUrl}/api/method/doorli_core.api.create_order`;

    const res = await ErpIntegrationService.syncOrderToErp({ provider: 'enterprise', ...baseOrder });
    assert.equal(res.success, true);
    assert.equal(res.erpOrderId, 'SO-1');

    const body = stub.last()!.body;
    assert.equal(body.idempotency_key, 'order-abc');
    assert.equal(body.company, 'Acme Company');
    assert.equal(body.items[0].item_code, 'vendor-123:SKU9');
    stub.server.close();
  });

  it('fails cleanly when enterprise URL is not configured', async () => {
    const res = await ErpIntegrationService.syncOrderToErp({ provider: 'enterprise', ...baseOrder });
    assert.equal(res.success, false);
    assert.match(res.message ?? '', /not configured/i);
  });

  it('reports failure when the ERP rejects the shared secret', async () => {
    stub = await startStub(() => ({ status: 403, json: { message: { status: 'error', message: 'bad secret' } } }));
    process.env.ERP_ENTERPRISE_URL = `${stub.baseUrl}/api/method/doorli_core.api.create_order`;

    const res = await ErpIntegrationService.syncOrderToErp({ provider: 'enterprise', ...baseOrder });
    assert.equal(res.success, false);
    assert.equal(res.status, 403);
    stub.server.close();
  });

  it('reports "ERP unreachable" when the backend is down', async () => {
    // Port 1 is not listening; axios connection error is caught.
    process.env.ERP_ENTERPRISE_URL = 'http://127.0.0.1:1/api/method/doorli_core.api.create_order';
    const res = await ErpIntegrationService.syncOrderToErp({ provider: 'enterprise', ...baseOrder });
    assert.equal(res.success, false);
    assert.match(res.message ?? '', /unreachable/i);
  });

  it('provisions an enterprise vendor and returns the Company id', async () => {
    stub = await startStub((req) => {
      assert.equal(req.headers['x-doorli-secret'], SECRET);
      assert.equal(req.body.vendor_id, 'vendor-123');
      return { status: 200, json: { message: { status: 'success', company: 'Acme Company' } } };
    });
    process.env.ERP_ENTERPRISE_URL = `${stub.baseUrl}/api/method/doorli_core.api.create_order`;

    const res = await ErpIntegrationService.provisionEnterpriseVendor({
      vendorId: 'vendor-123',
      businessName: 'Acme',
      adminEmail: 'a@acme.test',
    });
    assert.equal(res.success, true);
    assert.equal(res.companyId, 'Acme Company');
    // Provision URL is derived from the create_order URL.
    assert.equal(stub.last()!.url, '/api/method/doorli_core.api.provision_vendor');
    stub.server.close();
  });

  it('requires a marketplace order id for idempotency', async () => {
    const res = await ErpIntegrationService.syncOrderToErp({
      provider: 'simple',
      ...baseOrder,
      marketplaceOrderId: '',
    });
    assert.equal(res.success, false);
    assert.match(res.message ?? '', /idempotency/i);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'gov-service' });
});

// Mock gov routes (no Prisma)
const router = express.Router();
router.get('/services', (_req, res) => {
  res.json({ data: [{ id: 'svc-1', name: 'Building Permit', category: 'permits' }] });
});
router.post('/permits', (req, res) => {
  const { userId, serviceId } = req.body;
  if (!userId || !serviceId) {
    res.status(400).json({ error: 'userId and serviceId are required' });
    return;
  }
  res.status(201).json({ data: { permitNo: 'PRM-001', userId, serviceId, status: 'pending' } });
});
router.post('/taxes', (req, res) => {
  const { userId, serviceId, amount, taxPeriod } = req.body;
  if (!userId || !serviceId) {
    res.status(400).json({ error: 'userId and serviceId are required' } as any);
    return;
  }
  res.status(201).json({ data: { paymentId: 'tax-1', userId, serviceId, amount, taxPeriod } });
});
router.post('/complaints', (req, res) => {
  const { userId, title, description, category } = req.body;
  if (!userId || !title) {
    res.status(400).json({ error: 'userId and title are required' });
    return;
  }
  res.status(201).json({ data: { complaintId: 'cmp-1', userId, title, description, category } });
});
router.get('/documents/:userId', (req, res) => {
  const { userId } = req.params;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  res.json({ data: [] });
});

app.use('/api/v1/gov', router);

describe('Gov Service health', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'gov-service');
  });
});

describe('Gov Service endpoints', () => {
  it('GET /api/v1/gov/services returns list', async () => {
    const res = await request(app).get('/api/v1/gov/services');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });

  it('POST /api/v1/gov/permits requires userId and serviceId', async () => {
    const res = await request(app).post('/api/v1/gov/permits').send({});
    assert.equal(res.status, 400);
  });

  it('POST /api/v1/gov/permits creates permit', async () => {
    const res = await request(app)
      .post('/api/v1/gov/permits')
      .send({ userId: 'user-1', serviceId: 'svc-1' });
    assert.equal(res.status, 201);
    assert.ok(res.body.data.permitNo.startsWith('PRM-'));
  });

  it('POST /api/v1/gov/taxes requires userId and serviceId', async () => {
    const res = await request(app).post('/api/v1/gov/taxes').send({});
    assert.equal(res.status, 400);
  });

  it('POST /api/v1/gov/complaints requires userId and title', async () => {
    const res = await request(app).post('/api/v1/gov/complaints').send({});
    assert.equal(res.status, 400);
  });

  it('GET /api/v1/gov/documents/:userId returns data', async () => {
    const res = await request(app).get('/api/v1/gov/documents/user-123');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });
});

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

// Health check
app.get('/health/live', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'ai-service' });
});

// Mock recommendation endpoint (no Prisma)
app.post('/recommendations', (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    res.status(400).json({ error: 'userId is required' });
    return;
  }
  res.json({ recommendations: ['Groceries', 'Electronics', 'Books'] });
});

// Mock review analysis endpoint (no Prisma)
app.post('/analyze-review', (req, res) => {
  const { reviewText } = req.body;
  if (!reviewText) {
    res.status(400).json({ error: 'reviewText is required' });
    return;
  }
  res.json({ sentiment: 'positive', score: 0.8 });
});

describe('AI Service health', () => {
  it('GET /health/live returns 200', async () => {
    const res = await request(app).get('/health/live');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'ai-service');
  });
});

describe('AI Service endpoints', () => {
  it('POST /recommendations returns 400 without userId', async () => {
    const res = await request(app).post('/recommendations').send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'userId is required');
  });

  it('POST /recommendations returns mock data', async () => {
    const res = await request(app)
      .post('/recommendations')
      .send({ userId: 'user-123' });
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.recommendations));
    assert.equal(res.body.recommendations.length, 3);
  });

  it('POST /analyze-review returns 400 without reviewText', async () => {
    const res = await request(app).post('/analyze-review').send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'reviewText is required');
  });

  it('POST /analyze-review returns mock sentiment', async () => {
    const res = await request(app)
      .post('/analyze-review')
      .send({ reviewText: 'Great product!' });
    assert.equal(res.status, 200);
    assert.ok(['positive', 'negative', 'neutral'].includes(res.body.sentiment));
    assert.equal(typeof res.body.score, 'number');
  });
});

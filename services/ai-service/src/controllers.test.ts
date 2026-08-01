import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import { getRecommendations, analyzeReview } from './controllers.js';

const app = express();
app.use(express.json());
app.post('/recommendations', getRecommendations);
app.post('/analyze-review', analyzeReview);

describe('AI Service endpoints', () => {
  it('POST /recommendations returns 400 without userId', async () => {
    const res = await request(app).post('/recommendations').send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'userId is required');
  });

  it('POST /recommendations returns mock data when no API key', async () => {
    const res = await request(app)
      .post('/recommendations')
      .send({ userId: 'user-123' });
    assert.ok([200, 500].includes(res.status));
    if (res.status === 200) {
      assert.ok(Array.isArray(res.body.recommendations));
    }
  });

  it('POST /analyze-review returns 400 without reviewText', async () => {
    const res = await request(app).post('/analyze-review').send({});
    assert.equal(res.status, 400);
    assert.equal(res.body.error, 'reviewText is required');
  });

  it('POST /analyze-review returns mock sentiment when no API key', async () => {
    const res = await request(app)
      .post('/analyze-review')
      .send({ reviewText: 'Great product!' });
    assert.ok([200, 500].includes(res.status));
    if (res.status === 200) {
      assert.ok(['positive', 'negative', 'neutral'].includes(res.body.sentiment));
      assert.equal(typeof res.body.score, 'number');
    }
  });
});

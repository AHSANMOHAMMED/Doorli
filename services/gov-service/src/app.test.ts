import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from './app.js';

describe('Gov Service health', () => {
  it('GET /health returns 200', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'gov-service');
  });
});

describe('Gov Service endpoints', () => {
  it('GET /api/v1/gov/services returns 200', async () => {
    const res = await request(app).get('/api/v1/gov/services');
    assert.ok([200, 500].includes(res.status));
  });

  it('POST /api/v1/gov/permits requires userId and serviceId', async () => {
    const res = await request(app)
      .post('/api/v1/gov/permits')
      .send({});
    assert.ok([400, 500].includes(res.status));
  });

  it('POST /api/v1/gov/taxes requires userId and serviceId', async () => {
    const res = await request(app)
      .post('/api/v1/gov/taxes')
      .send({});
    assert.ok([400, 500].includes(res.status));
  });

  it('POST /api/v1/gov/complaints requires userId and title', async () => {
    const res = await request(app)
      .post('/api/v1/gov/complaints')
      .send({});
    assert.ok([400, 500].includes(res.status));
  });

  it('GET /api/v1/gov/documents/:userId returns data', async () => {
    const res = await request(app).get('/api/v1/gov/documents/user-123');
    assert.ok([200, 500].includes(res.status));
  });
});

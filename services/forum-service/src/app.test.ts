import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from './app.js';

const app = createApp();

describe('Forum Service health', () => {
  it('GET /health/live returns 200', async () => {
    const res = await request(app).get('/health/live');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
    assert.equal(res.body.service, 'forum-service');
  });
});

describe('Forum routes require auth', () => {
  it('POST /forums returns 401 without token', async () => {
    const res = await request(app)
      .post('/forums')
      .send({ name: 'Test', description: 'desc', category: 'general' });
    assert.equal(res.status, 401);
  });

  it('POST /forums returns 403 with non-admin token', async () => {
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { userId: 'user-1', role: 'customer' },
      process.env.JWT_SECRET || 'super_secret_jwt_key_doorli_2026',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .post('/forums')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test', description: 'desc', category: 'general' });
    assert.equal(res.status, 403);
  });

  it('POST /forums/:forumId/threads returns 401 without token', async () => {
    const res = await request(app)
      .post('/forums/forum-1/threads')
      .send({ title: 'Test', content: 'body' });
    assert.equal(res.status, 401);
  });

  it('POST /threads/:threadId/posts returns 401 without token', async () => {
    const res = await request(app)
      .post('/threads/thread-1/posts')
      .send({ content: 'reply' });
    assert.equal(res.status, 401);
  });

  it('DELETE /posts/:postId returns 401 without token', async () => {
    const res = await request(app).delete('/posts/post-1');
    assert.equal(res.status, 401);
  });
});

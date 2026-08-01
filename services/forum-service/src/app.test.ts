import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_doorli_2026';

const app = express();
app.use(express.json());

// Health check
app.get('/health/live', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'forum-service' });
});

// Mock forum routes (no Prisma)
const router = express.Router();
router.get('/forums', (_req, res) => {
  res.json({ data: [] });
});
router.post('/forums', authenticateToken, requireAdmin, (_req, res) => {
  res.status(201).json({ data: { id: 'forum-1', name: 'Test' } });
});
router.get('/forums/:forumId/threads', (_req, res) => {
  res.json({ data: [] });
});
router.post('/forums/:forumId/threads', authenticateToken, (_req, res) => {
  res.status(201).json({ data: { id: 'thread-1' } });
});
router.post('/threads/:threadId/lock', authenticateToken, requireAdmin, (_req, res) => {
  res.json({ data: { id: 'thread-1' }, message: 'Thread locked' });
});
router.get('/threads/:threadId/posts', (_req, res) => {
  res.json({ data: [] });
});
router.post('/threads/:threadId/posts', authenticateToken, (_req, res) => {
  res.status(201).json({ data: { id: 'post-1' } });
});
router.delete('/posts/:postId', authenticateToken, requireAdmin, (_req, res) => {
  res.json({ data: { id: 'post-1' }, message: 'Post soft deleted' });
});

function authenticateToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

app.use('/', router);

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
    const token = jwt.sign(
      { userId: 'user-1', role: 'customer' },
      JWT_SECRET,
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

  it('GET /forums returns data without auth', async () => {
    const res = await request(app).get('/forums');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data));
  });
});

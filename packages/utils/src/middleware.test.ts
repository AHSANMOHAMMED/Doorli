/**
 * Unit tests for requireAuth RBAC middleware.
 * Requirements: 1.9, 1.10
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { requireAuth, requireAnyAuth } from './middleware.js';
import type { AuthUser, UserRole } from './middleware.js';

// ── helpers ────────────────────────────────────────────────────────────────

const SECRET = 'super_secret_jwt_key_doorli_2026';

function makeToken(payload: Partial<AuthUser>, expiresIn: string | number = '1h'): string {
  const tokenPayload = { ...payload };
  return jwt.sign(tokenPayload, SECRET, { expiresIn } as jwt.SignOptions);
}

/** Build a minimal Express-like request with an optional Authorization header. */
function makeReq(token?: string): Partial<Request> {
  return {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    user: undefined,
  };
}

/** Capture status + json body from a mock response. */
function captureResponse(): {
  res: Partial<Response>;
  captured: { status: number | null; body: unknown };
} {
  const captured: { status: number | null; body: unknown } = { status: null, body: null };
  const res: Partial<Response> = {
    status(code: number) {
      captured.status = code;
      return res as Response;
    },
    json(data: unknown) {
      captured.body = data;
      return res as Response;
    },
  };
  return { res, captured };
}

/** Track whether next() was called. */
function makeNext(): { fn: NextFunction; called: () => boolean } {
  let wasCalled = false;
  const fn: NextFunction = () => { wasCalled = true; };
  return { fn, called: () => wasCalled };
}

// ── tests ──────────────────────────────────────────────────────────────────

describe('requireAuth middleware', () => {
  // Save/restore JWT_SECRET env var so tests are isolated
  let originalSecret: string | undefined;
  beforeEach(() => { originalSecret = process.env.JWT_SECRET; delete process.env.JWT_SECRET; });
  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  // ── 1. Valid token + matching role → next() called ─────────────────────

  it('passes when token has the required role (customer)', () => {
    const token = makeToken({ id: 'user-1', role: 'customer' });
    const req = makeReq(token);
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['customer'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), true, 'next() should be called');
    assert.equal(captured.status, null, 'no HTTP status should be set');
    assert.equal((req as Request).user?.role, 'customer');
  });

  it('passes when token role is one of multiple allowed roles (driver in [driver, admin])', () => {
    const token = makeToken({ id: 'drv-1', role: 'driver' });
    const req = makeReq(token);
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['driver', 'admin'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), true);
    assert.equal(captured.status, null);
  });

  it('passes for admin role accessing admin-only route', () => {
    const token = makeToken({ id: 'adm-1', role: 'admin' });
    const req = makeReq(token);
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['admin'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), true);
    assert.equal(captured.status, null);
    assert.equal((req as Request).user?.id, 'adm-1');
  });

  // ── 2. Valid token + wrong role → 403 ─────────────────────────────────

  it('returns 403 when role is not in allowedRoles', () => {
    const token = makeToken({ id: 'user-2', role: 'customer' });
    const req = makeReq(token);
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['admin'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), false, 'next() must NOT be called');
    assert.equal(captured.status, 403);
    assert.equal((captured.body as { code: string }).code, 'INSUFFICIENT_ROLE');
  });

  it('returns 403 when vendor tries to access driver-only route', () => {
    const token = makeToken({ id: 'ven-1', role: 'vendor' });
    const req = makeReq(token);
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['driver'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), false);
    assert.equal(captured.status, 403);
  });

  // ── 3. No token → 401 ─────────────────────────────────────────────────

  it('returns 401 when Authorization header is absent', () => {
    const req = makeReq(); // no token
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['customer'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), false);
    assert.equal(captured.status, 401);
    assert.equal((captured.body as { code: string }).code, 'MISSING_TOKEN');
  });

  it('returns 401 when Authorization header is missing Bearer prefix', () => {
    const req: Partial<Request> = { headers: { authorization: 'Basic sometoken' }, user: undefined };
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['customer'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), false);
    assert.equal(captured.status, 401);
    assert.equal((captured.body as { code: string }).code, 'MISSING_TOKEN');
  });

  // ── 4. Expired token → 401 ────────────────────────────────────────────

  it('returns 401 with TOKEN_EXPIRED code for an expired token', () => {
    // Sign with -1s to get an already-expired token
    const token = makeToken({ id: 'user-3', role: 'customer' }, -1);
    const req = makeReq(token);
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['customer'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), false);
    assert.equal(captured.status, 401);
    assert.equal((captured.body as { code: string }).code, 'TOKEN_EXPIRED');
  });

  // ── 5. Invalid / garbage token → 401 ─────────────────────────────────

  it('returns 401 with INVALID_TOKEN code for a garbage token', () => {
    const req = makeReq('this.is.not.a.valid.jwt');
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['customer'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), false);
    assert.equal(captured.status, 401);
    assert.equal((captured.body as { code: string }).code, 'INVALID_TOKEN');
  });

  it('returns 401 when token is signed with the wrong secret', () => {
    const token = jwt.sign({ id: 'user-x', role: 'customer' }, 'wrong_secret', { expiresIn: '1h' });
    const req = makeReq(token);
    const { res, captured } = captureResponse();
    const next = makeNext();

    requireAuth(['customer'])(req as Request, res as Response, next.fn);

    assert.equal(next.called(), false);
    assert.equal(captured.status, 401);
    assert.equal((captured.body as { code: string }).code, 'INVALID_TOKEN');
  });

  // ── 6. requireAnyAuth — any valid role passes ──────────────────────────

  it('requireAnyAuth allows any role through', () => {
    const roles: UserRole[] = ['customer', 'vendor', 'driver', 'admin'];
    for (const role of roles) {
      const token = makeToken({ id: `uid-${role}`, role });
      const req = makeReq(token);
      const { res, captured } = captureResponse();
      const next = makeNext();

      requireAnyAuth(req as Request, res as Response, next.fn);

      assert.equal(next.called(), true, `role ${role} should pass requireAnyAuth`);
      assert.equal(captured.status, null);
    }
  });

  // ── 7. req.user is populated on success ───────────────────────────────

  it('populates req.user with payload fields on success', () => {
    const token = makeToken({ id: 'usr-99', role: 'vendor', phone: '+94771234567' });
    const req = makeReq(token);
    const { res } = captureResponse();
    const next = makeNext();

    requireAuth(['vendor'])(req as Request, res as Response, next.fn);

    const user = (req as Request).user!;
    assert.equal(user.id, 'usr-99');
    assert.equal(user.role, 'vendor');
    assert.equal(user.phone, '+94771234567');
  });
});

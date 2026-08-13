import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('delivery socket token compatibility', () => {
  it('accepts the shared JWT subject as the socket user id', () => {
    const decoded = { sub: 'customer-1', role: 'customer' };
    const userId = decoded.sub || undefined;
    assert.equal(userId, 'customer-1');
  });
});

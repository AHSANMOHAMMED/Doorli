import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm } from '@doorli/utils';

describe('Dispatch distance helpers', () => {
  it('haversineKm returns zero for same point', () => {
    const d = haversineKm(6.9271, 79.8612, 6.9271, 79.8612);
    assert.equal(d, 0);
  });

  it('haversineKm returns positive distance for nearby points', () => {
    const d = haversineKm(6.9271, 79.8612, 6.935, 79.87);
    assert.ok(d > 0);
    assert.ok(d < 5);
  });
});

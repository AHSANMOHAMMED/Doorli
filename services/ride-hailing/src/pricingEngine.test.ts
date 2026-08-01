import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateFare } from './pricingEngine.js';

describe('calculateFare', () => {
  it('returns baseFare when pickup and dropoff demand are equal', () => {
    const result = calculateFare(200, 3, 3, 5);
    assert.equal(result.fare, 200);
    assert.equal(result.returnPremium, 0);
  });

  it('adds returnPremium when pickup demand > dropoff demand', () => {
    const result = calculateFare(200, 5, 1, 10);
    // returnPremium = (10 * 0.5) * (5 - 1) = 5 * 4 = 20
    assert.equal(result.returnPremium, 20);
    assert.equal(result.fare, 220);
  });

  it('returns no premium when dropoff demand >= pickup demand', () => {
    const result = calculateFare(200, 1, 5, 10);
    assert.equal(result.returnPremium, 0);
    assert.equal(result.fare, 200);
  });

  it('scales premium with distance', () => {
    const short = calculateFare(200, 5, 1, 2);
    const long = calculateFare(200, 5, 1, 10);
    assert.ok(long.returnPremium > short.returnPremium);
  });

  it('scales premium with demand delta', () => {
    const small = calculateFare(200, 3, 2, 5);
    const large = calculateFare(200, 5, 1, 5);
    assert.ok(large.returnPremium > small.returnPremium);
  });

  it('handles zero distance', () => {
    const result = calculateFare(200, 5, 1, 0);
    assert.equal(result.returnPremium, 0);
    assert.equal(result.fare, 200);
  });

  it('handles zero baseFare', () => {
    const result = calculateFare(0, 5, 1, 10);
    assert.equal(result.returnPremium, 20);
    assert.equal(result.fare, 20);
  });
});

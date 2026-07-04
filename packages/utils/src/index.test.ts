import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateDeliveryFee, formatCurrency, generateOrderNumber } from './index.js';

describe('calculateDeliveryFee', () => {
  it('calculates base + distance rate', () => {
    const fee = calculateDeliveryFee({ baseFee: 50, distanceKm: 3, perKmRate: 25 });
    assert.equal(fee, 125);
  });

  it('includes peak surcharge when provided', () => {
    const fee = calculateDeliveryFee({
      baseFee: 50,
      distanceKm: 3,
      perKmRate: 25,
      peakSurcharge: 20,
    });
    assert.equal(fee, 145);
  });
});

describe('formatCurrency', () => {
  it('formats LKR amounts', () => {
    const formatted = formatCurrency(125);
    assert.match(formatted, /125/);
  });
});

describe('generateOrderNumber', () => {
  it('generates unique order numbers with DL prefix', () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    assert.match(a, /^DL-/);
    assert.notEqual(a, b);
  });
});

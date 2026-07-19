import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDelimitedTable, normalizeKey } from './invoiceExtract.js';
import { matchInvoiceLine } from './matchProducts.js';

describe('invoice extract', () => {
  it('parses CSV with headers', () => {
    const csv = 'Item,Qty,Rate,Barcode\nFresh Milk 1L,24,180,8901001001001\nTomatoes,10,120,\n';
    const p = parseDelimitedTable(csv);
    assert.equal(p.lines.length, 2);
    assert.equal(p.lines[0].barcode, '8901001001001');
    assert.equal(p.lines[0].quantity, 24);
  });

  it('keeps local-script aliases intact', () => {
    assert.equal(normalizeKey('පාන්'), 'පාන්');
  });
});

describe('product match', () => {
  it('exact barcode is 100% matched', () => {
    const m = matchInvoiceLine(
      { invoiceName: 'Anything', barcode: '8901001001001' },
      [{ id: 'p1', name: 'Milk', barcode: '8901001001001', sku: null }],
      [],
    );
    assert.equal(m.confidence, 100);
    assert.equal(m.action, 'matched');
  });

  it('alias exact is 100% matched', () => {
    const m = matchInvoiceLine(
      { invoiceName: 'පාන්' },
      [{ id: 'p1', name: 'Bread', barcode: null, sku: null }],
      [{ productId: 'p1', aliasKey: normalizeKey('පාන්') }],
    );
    assert.equal(m.confidence, 100);
    assert.equal(m.method, 'alias');
  });

  it('fuzzy never auto-matches', () => {
    const m = matchInvoiceLine(
      { invoiceName: 'Fresh Milk Pack' },
      [{ id: 'p1', name: 'Milk 1L Fresh', barcode: null, sku: null }],
      [],
    );
    assert.equal(m.action, 'needs_review');
    assert.ok(m.confidence < 100);
  });
});

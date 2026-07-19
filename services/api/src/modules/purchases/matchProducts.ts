import { normalizeKey } from './invoiceExtract.js';

export type CatalogProduct = {
  id: string;
  name: string;
  barcode: string | null;
  sku: string | null;
};

export type AliasRow = {
  productId: string;
  aliasKey: string;
};

export type MatchResult = {
  productId: string | null;
  confidence: number;
  method: string | null;
  /** Only exact (100) may auto-set action=matched */
  action: 'matched' | 'needs_review';
};

function exact(a: string, b: string) {
  return normalizeKey(a) === normalizeKey(b);
}

/**
 * Matching is intentionally strict for auto-link.
 * Only barcode / sku / alias / exact name → confidence 100 + matched.
 * Anything fuzzy stays needs_review (vendor must confirm).
 */
export function matchInvoiceLine(
  line: { invoiceName: string; barcode?: string | null; sku?: string | null },
  products: CatalogProduct[],
  aliases: AliasRow[],
): MatchResult {
  if (line.barcode) {
    const code = line.barcode.trim();
    const hit = products.find((p) => p.barcode && exact(p.barcode, code));
    if (hit) return { productId: hit.id, confidence: 100, method: 'barcode', action: 'matched' };
  }

  if (line.sku) {
    const code = line.sku.trim();
    const hit = products.find((p) => p.sku && exact(p.sku, code));
    if (hit) return { productId: hit.id, confidence: 100, method: 'sku', action: 'matched' };
  }

  const nameKey = normalizeKey(line.invoiceName);
  if (nameKey) {
    const aliasHit = aliases.find((a) => a.aliasKey === nameKey);
    if (aliasHit) {
      return {
        productId: aliasHit.productId,
        confidence: 100,
        method: 'alias',
        action: 'matched',
      };
    }

    const nameHit = products.find((p) => normalizeKey(p.name) === nameKey);
    if (nameHit) {
      return { productId: nameHit.id, confidence: 100, method: 'name_exact', action: 'matched' };
    }

    // Soft suggestions only — never auto-match
    let best: { id: string; score: number } | null = null;
    for (const p of products) {
      const score = tokenOverlap(nameKey, normalizeKey(p.name));
      if (score >= 0.72 && (!best || score > best.score)) {
        best = { id: p.id, score };
      }
    }
    if (best) {
      return {
        productId: best.id,
        confidence: Math.round(best.score * 85),
        method: 'name_fuzzy_suggestion',
        action: 'needs_review',
      };
    }
  }

  return { productId: null, confidence: 0, method: null, action: 'needs_review' };
}

function tokenOverlap(a: string, b: string): number {
  const ta = new Set(a.split(' ').filter((t) => t.length > 1));
  const tb = new Set(b.split(' ').filter((t) => t.length > 1));
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  for (const t of ta) if (tb.has(t)) inter += 1;
  return inter / Math.max(ta.size, tb.size);
}

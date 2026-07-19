/**
 * Conservative invoice line extraction.
 * Exact structured formats (CSV/XLSX with headers) are preferred.
 * PDF/text uses heuristics and always surfaces lines for human review.
 */

export type RawInvoiceLine = {
  lineNo: number;
  invoiceName: string;
  barcode?: string;
  sku?: string;
  quantity: number;
  unit?: string;
  unitCost?: number;
  lineTotal?: number;
  raw?: string;
};

export type ParsedInvoice = {
  supplierName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  lines: RawInvoiceLine[];
  warnings: string[];
  sourceType: 'csv' | 'xlsx' | 'pdf' | 'text';
};

const HEADER_ALIASES: Record<string, string[]> = {
  name: ['name', 'item', 'item name', 'description', 'product', 'particulars', 'goods', 'item description'],
  qty: ['qty', 'quantity', 'qnty', 'qnt', 'pcs', 'units', 'qty.'],
  unitCost: ['unit cost', 'rate', 'price', 'unit price', 'cost', 'u/price', 'unitprice'],
  lineTotal: ['amount', 'total', 'line total', 'value', 'net amount', 'lineamount'],
  barcode: ['barcode', 'ean', 'upc', 'gtin', 'bar code'],
  sku: ['sku', 'code', 'item code', 'product code', 'part no', 'part number'],
  unit: ['unit', 'uom', 'measure'],
};

export function normalizeKey(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Keep letters, numbers, and combining marks (local scripts / vowel signs)
    .replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function headerIndex(headers: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  headers.forEach((h, i) => {
    const key = normalizeKey(h);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((a) => normalizeKey(a) === key) && map[field] == null) {
        map[field] = i;
      }
    }
  });
  return map;
}

function toNum(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(String(v).replace(/,/g, '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

export function parseDelimitedTable(text: string, sourceType: 'csv' | 'text' = 'csv'): ParsedInvoice {
  const warnings: string[] = [];
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.includes('\t')) return line.split('\t');
      // simple CSV split respecting quotes
      const cells: string[] = [];
      let cur = '';
      let q = false;
      for (const ch of line) {
        if (ch === '"') {
          q = !q;
          continue;
        }
        if (ch === ',' && !q) {
          cells.push(cur.trim());
          cur = '';
          continue;
        }
        cur += ch;
      }
      cells.push(cur.trim());
      return cells;
    });

  if (!rows.length) {
    return { lines: [], warnings: ['File is empty'], sourceType };
  }

  const map = headerIndex(rows[0]);
  const hasHeader = map.name != null && (map.qty != null || map.lineTotal != null);
  const dataRows = hasHeader ? rows.slice(1) : rows;
  if (!hasHeader) {
    warnings.push(
      'No clear header row detected. Treated first columns as: name, qty, unit cost. Review every line carefully.',
    );
  }

  const lines: RawInvoiceLine[] = [];
  let lineNo = 0;
  for (const row of dataRows) {
    if (!row.some((c) => c && c.trim())) continue;
    const name = hasHeader ? row[map.name] : row[0];
    if (!name || normalizeKey(name).length < 1) continue;
    // skip total/footer rows
    if (/^(total|subtotal|grand total|tax|vat|discount)$/i.test(name.trim())) continue;

    lineNo += 1;
    const quantity = hasHeader
      ? toNum(map.qty != null ? row[map.qty] : undefined) ?? 1
      : toNum(row[1]) ?? 1;
    const unitCost = hasHeader
      ? toNum(map.unitCost != null ? row[map.unitCost] : undefined)
      : toNum(row[2]);
    const lineTotal = hasHeader
      ? toNum(map.lineTotal != null ? row[map.lineTotal] : undefined)
      : toNum(row[3]);

    lines.push({
      lineNo,
      invoiceName: name.trim(),
      barcode: hasHeader && map.barcode != null ? String(row[map.barcode] || '').trim() || undefined : undefined,
      sku: hasHeader && map.sku != null ? String(row[map.sku] || '').trim() || undefined : undefined,
      quantity,
      unit: hasHeader && map.unit != null ? String(row[map.unit] || '').trim() || undefined : undefined,
      unitCost,
      lineTotal,
      raw: row.join(' | '),
    });
  }

  if (!lines.length) warnings.push('No line items could be extracted.');
  return { lines, warnings, sourceType };
}

export function parseSpreadsheetBuffer(buf: Buffer): ParsedInvoice {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const XLSX = require('xlsx') as typeof import('xlsx');
  const wb = XLSX.read(buf, { type: 'buffer', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  const warnings: string[] = [];

  if (!rows.length) {
    return { lines: [], warnings: ['Spreadsheet has no rows'], sourceType: 'xlsx' };
  }

  const headers = Object.keys(rows[0]);
  const map = headerIndex(headers);
  if (map.name == null) {
    warnings.push('Could not find an item/name column. Using first column as item name.');
  }
  const nameKey = map.name != null ? headers[map.name] : headers[0];
  const qtyKey = map.qty != null ? headers[map.qty] : undefined;
  const costKey = map.unitCost != null ? headers[map.unitCost] : undefined;
  const totalKey = map.lineTotal != null ? headers[map.lineTotal] : undefined;
  const barcodeKey = map.barcode != null ? headers[map.barcode] : undefined;
  const skuKey = map.sku != null ? headers[map.sku] : undefined;
  const unitKey = map.unit != null ? headers[map.unit] : undefined;

  const lines: RawInvoiceLine[] = [];
  let lineNo = 0;
  for (const row of rows) {
    const name = String(row[nameKey] ?? '').trim();
    if (!name) continue;
    if (/^(total|subtotal|grand total|tax|vat)$/i.test(name)) continue;
    lineNo += 1;
    lines.push({
      lineNo,
      invoiceName: name,
      barcode: barcodeKey ? String(row[barcodeKey] || '').trim() || undefined : undefined,
      sku: skuKey ? String(row[skuKey] || '').trim() || undefined : undefined,
      quantity: toNum(qtyKey ? row[qtyKey] : 1) ?? 1,
      unit: unitKey ? String(row[unitKey] || '').trim() || undefined : undefined,
      unitCost: costKey ? toNum(row[costKey]) : undefined,
      lineTotal: totalKey ? toNum(row[totalKey]) : undefined,
    });
  }

  // Try meta from sheet name / early cells
  const meta = extractMetaFromText(XLSX.utils.sheet_to_csv(sheet));
  return { ...meta, lines, warnings, sourceType: 'xlsx' };
}

export function extractMetaFromText(text: string): Pick<ParsedInvoice, 'supplierName' | 'invoiceNumber' | 'invoiceDate'> {
  const invoiceNumber =
    text.match(/invoice\s*(?:no|number|#)\s*[:.]?\s*([A-Za-z0-9\-\/]+)/i)?.[1] ??
    text.match(/inv\s*#?\s*[:.]?\s*([A-Za-z0-9\-\/]+)/i)?.[1];
  const supplierName =
    text.match(/supplier\s*[:.]?\s*(.+)/i)?.[1]?.split(/\n/)[0]?.trim().slice(0, 200) ??
    text.match(/from\s*[:.]?\s*(.+)/i)?.[1]?.split(/\n/)[0]?.trim().slice(0, 200);
  const invoiceDate =
    text.match(/date\s*[:.]?\s*(\d{1,4}[\/\-.]\d{1,2}[\/\-.]\d{1,4})/i)?.[1];
  return { invoiceNumber, supplierName, invoiceDate };
}

/**
 * PDF / free-text line parser — conservative.
 * Accepts lines that look like: Name .... qty .... price
 */
export function parseInvoiceText(text: string, sourceType: 'pdf' | 'text' = 'text'): ParsedInvoice {
  const warnings: string[] = [
    'PDF/text extraction is best-effort. Confirm every line before importing stock.',
  ];
  const meta = extractMetaFromText(text);
  const lines: RawInvoiceLine[] = [];
  let lineNo = 0;

  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  for (const raw of rawLines) {
    if (/^(invoice|supplier|date|bill to|ship to|page\s+\d)/i.test(raw)) continue;
    if (/^(total|subtotal|grand total|tax|vat|amount due)/i.test(raw)) continue;

    // Pattern: name  qty  unitCost [total]
    const m = raw.match(
      /^(.+?)\s+(\d+(?:\.\d+)?)\s+(?:x\s*)?(\d+(?:\.\d+)?)\s*(\d+(?:\.\d+)?)?$/i,
    );
    if (m) {
      lineNo += 1;
      lines.push({
        lineNo,
        invoiceName: m[1].trim(),
        quantity: Number(m[2]),
        unitCost: Number(m[3]),
        lineTotal: m[4] ? Number(m[4]) : undefined,
        raw,
      });
      continue;
    }

    // Pattern with barcode at start
    const m2 = raw.match(/^(\d{8,14})\s+(.+?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)/);
    if (m2) {
      lineNo += 1;
      lines.push({
        lineNo,
        barcode: m2[1],
        invoiceName: m2[2].trim(),
        quantity: Number(m2[3]),
        unitCost: Number(m2[4]),
        raw,
      });
    }
  }

  if (!lines.length) {
    warnings.push(
      'No structured lines found in PDF/text. Prefer exporting the invoice as Excel/CSV for 100% accurate columns.',
    );
  }

  return { ...meta, lines, warnings, sourceType };
}

export async function parseInvoiceFile(
  filename: string,
  buffer: Buffer,
  mime?: string,
): Promise<ParsedInvoice> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.csv') || mime === 'text/csv') {
    return parseDelimitedTable(buffer.toString('utf8'), 'csv');
  }
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || mime?.includes('spreadsheet')) {
    return parseSpreadsheetBuffer(buffer);
  }
  if (lower.endsWith('.pdf') || mime === 'application/pdf') {
    const text = await extractPdfText(buffer);
    return parseInvoiceText(text, 'pdf');
  }
  // plain text / unknown
  return parseInvoiceText(buffer.toString('utf8'), 'text');
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('pdf-parse');
  // v1: default export is a function(buffer) => { text }
  if (typeof mod === 'function') {
    const parsed = await mod(buffer);
    return String(parsed?.text || '');
  }
  // v2: PDFParse class
  if (mod?.PDFParse) {
    const parser = new mod.PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy?.();
    return String(result?.text || '');
  }
  throw new Error('Unsupported pdf-parse module shape');
}

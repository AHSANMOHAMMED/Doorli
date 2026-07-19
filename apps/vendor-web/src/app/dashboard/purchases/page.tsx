'use client';

import { useCallback, useState } from 'react';
import { FileUp, AlertTriangle, CheckCircle2, PackagePlus } from 'lucide-react';

type PurchaseItem = {
  id: string;
  lineNo: number;
  invoiceName: string;
  barcode: string | null;
  sku: string | null;
  quantity: number | string;
  unitCost: number | string | null;
  action: 'matched' | 'create_new' | 'skip' | 'needs_review';
  productId: string | null;
  matchConfidence: number;
  matchMethod: string | null;
  saveAsAlias: boolean;
};

type ProductOpt = { id: string; name: string; barcode: string | null; sku: string | null; stockQuantity: number };

type Purchase = {
  id: string;
  status: string;
  supplierName: string | null;
  invoiceNumber: string | null;
  sourceFilename: string | null;
  sourceType: string;
  items: PurchaseItem[];
};

const API =
  typeof window !== 'undefined'
    ? ''
    : process.env.NEXT_PUBLIC_API_URL || process.env.API_INTERNAL_URL || 'http://127.0.0.1:4000';

function authHeaders(): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('doorli_vendor_token') || localStorage.getItem('doorli_token') || ''
      : '';
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PurchasesPage() {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [summary, setSummary] = useState<{
    needsReview?: number;
    exactMatched?: number;
    warnings?: string[];
    canConfirm?: boolean;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async (id: string) => {
    const res = await fetch(`${API}/api/v1/purchases/${id}`, { headers: authHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load');
    setPurchase(json.data.purchase);
    setProducts(json.data.products || []);
    const needsReview = (json.data.purchase.items as PurchaseItem[]).filter(
      (i) => i.action === 'needs_review',
    ).length;
    setSummary((s) => ({ ...s, needsReview, canConfirm: needsReview === 0 }));
  }, []);

  async function onFile(file: File) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`${API}/api/v1/purchases/import`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Import parse failed');
      setPurchase(json.data.purchase);
      setSummary(json.data.summary);
      await reload(json.data.purchase.id);
      setMessage(
        `Extracted ${json.data.summary.totalLines} lines · ${json.data.summary.exactMatched} exact matches · ${json.data.summary.needsReview} need your review`,
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  function updateItem(id: string, patch: Partial<PurchaseItem> & { confirmMatch?: boolean }) {
    setPurchase((p) => {
      if (!p) return p;
      return {
        ...p,
        items: p.items.map((it) => (it.id === id ? { ...it, ...patch } : it)),
      };
    });
  }

  async function saveReview() {
    if (!purchase) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/purchases/${purchase.id}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          items: purchase.items.map((it) => ({
            id: it.id,
            action: it.action,
            productId: it.productId,
            quantity: Number(it.quantity),
            unitCost: it.unitCost != null ? Number(it.unitCost) : null,
            invoiceName: it.invoiceName,
            barcode: it.barcode,
            sku: it.sku,
            saveAsAlias: it.saveAsAlias,
            confirmMatch: it.action === 'matched' && !!it.productId,
          })),
          supplierName: purchase.supplierName,
          invoiceNumber: purchase.invoiceNumber,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Save failed');
      setPurchase(json.data);
      setSummary(json.summary);
      setMessage('Review saved. Resolve any remaining lines, then Import to stock.');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!purchase) return;
    if (!window.confirm('Import will update live stock. Only continue if every line is correct.')) return;
    setBusy(true);
    setError(null);
    try {
      await saveReview();
      const res = await fetch(`${API}/api/v1/purchases/${purchase.id}/confirm`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Confirm failed');
      setPurchase(json.data.purchase);
      setMessage(json.message || 'Stock updated from supplier invoice.');
      setSummary({ needsReview: 0, canConfirm: false });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Confirm failed');
    } finally {
      setBusy(false);
    }
  }

  const needsReview = purchase?.items.filter((i) => i.action === 'needs_review').length ?? 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-900">Supplier purchases</h1>
      <p className="mt-1 text-slate-600 text-sm max-w-2xl">
        Upload a supplier invoice (Excel / CSV preferred, PDF supported). We extract every line, match
        by barcode, SKU, or your saved local names — and you must review anything that is not a 100%
        match before stock updates.
      </p>

      <label className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 cursor-pointer hover:border-blue-400 min-h-[160px]">
        <FileUp className="w-10 h-10 text-blue-600" />
        <span className="font-semibold text-slate-800">
          {busy ? 'Processing…' : 'Tap to upload invoice'}
        </span>
        <span className="text-xs text-slate-500">.xlsx · .csv · .pdf · .txt</span>
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.pdf,.txt"
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
            e.target.value = '';
          }}
        />
      </label>

      {summary?.warnings?.length ? (
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 flex gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <ul className="list-disc pl-4 space-y-1">
            {summary.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {message && (
        <p className="mt-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {message}
        </p>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {purchase && (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <label className="text-sm">
              <span className="text-slate-500">Supplier</span>
              <input
                className="mt-1 block w-48 rounded-lg border border-slate-200 px-3 py-2 min-h-11"
                value={purchase.supplierName || ''}
                onChange={(e) => setPurchase({ ...purchase, supplierName: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="text-slate-500">Invoice #</span>
              <input
                className="mt-1 block w-40 rounded-lg border border-slate-200 px-3 py-2 min-h-11"
                value={purchase.invoiceNumber || ''}
                onChange={(e) => setPurchase({ ...purchase, invoiceNumber: e.target.value })}
              />
            </label>
            <p className="text-xs text-slate-500 pb-2">
              File: {purchase.sourceFilename} · {purchase.sourceType} · status {purchase.status}
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Invoice item</th>
                  <th className="p-3">Qty</th>
                  <th className="p-3">Match</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Link to product</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((it) => (
                  <tr
                    key={it.id}
                    className={
                      it.action === 'needs_review' ? 'bg-amber-50/80' : 'border-t border-slate-100'
                    }
                  >
                    <td className="p-3 text-slate-400">{it.lineNo}</td>
                    <td className="p-3">
                      <input
                        className="w-full min-w-[140px] rounded border border-slate-200 px-2 py-1.5 min-h-11"
                        value={it.invoiceName}
                        onChange={(e) => updateItem(it.id, { invoiceName: e.target.value })}
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        {it.matchMethod || '—'} · {it.matchConfidence}%
                        {it.barcode ? ` · barcode ${it.barcode}` : ''}
                      </p>
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        className="w-20 rounded border border-slate-200 px-2 py-1.5 min-h-11"
                        value={Number(it.quantity)}
                        onChange={(e) => updateItem(it.id, { quantity: Number(e.target.value) })}
                      />
                    </td>
                    <td className="p-3">
                      {it.matchConfidence === 100 && it.action === 'matched' ? (
                        <span className="text-emerald-600 font-semibold">100% exact</span>
                      ) : (
                        <span className="text-amber-700 font-semibold">Review</span>
                      )}
                    </td>
                    <td className="p-3">
                      <select
                        className="rounded border border-slate-200 px-2 py-2 min-h-11"
                        value={it.action}
                        onChange={(e) =>
                          updateItem(it.id, {
                            action: e.target.value as PurchaseItem['action'],
                          })
                        }
                      >
                        <option value="needs_review">Needs review</option>
                        <option value="matched">Link existing</option>
                        <option value="create_new">Create new product</option>
                        <option value="skip">Skip line</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        className="w-full max-w-[220px] rounded border border-slate-200 px-2 py-2 min-h-11"
                        value={it.productId || ''}
                        disabled={it.action === 'create_new' || it.action === 'skip'}
                        onChange={(e) =>
                          updateItem(it.id, {
                            productId: e.target.value || null,
                            action: e.target.value ? 'matched' : it.action,
                          })
                        }
                      >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (stock {p.stockQuantity})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {purchase.status === 'draft' && (
            <div className="flex flex-wrap gap-3 sticky bottom-4">
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveReview()}
                className="px-5 py-3 rounded-xl bg-slate-800 text-white font-semibold min-h-12"
              >
                Save review
              </button>
              <button
                type="button"
                disabled={busy || needsReview > 0}
                onClick={() => void confirmImport()}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold min-h-12 disabled:opacity-40 inline-flex items-center gap-2"
              >
                <PackagePlus className="w-5 h-5" />
                Import to stock
                {needsReview > 0 ? ` (${needsReview} left)` : ''}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

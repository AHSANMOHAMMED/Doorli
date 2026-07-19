'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, getToken } from '@/lib/api';

type CartLine = {
  productId: string;
  name: string;
  barcode?: string | null;
  unitPrice: number;
  quantity: number;
  liveStock: number;
};

type Receipt = {
  orderNumber: string;
  businessName: string;
  address?: string;
  customerName: string;
  paymentMethod: string;
  paidAt: string;
  items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number; barcode?: string | null }>;
  total: number;
};

export default function PosCashierPage() {
  const [code, setCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [stockLow, setStockLow] = useState(0);

  const total = cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  useEffect(() => {
    if (!getToken()) {
      window.location.assign('/login');
      return;
    }
    void apiFetch<{ lowStockCount: number }>('/pos/stock').then((res) => {
      if (res.success && res.data) setStockLow(res.data.lowStockCount || 0);
    });
  }, []);

  const addFromBarcode = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{
        id: string;
        name: string;
        barcode?: string | null;
        price: number;
        liveStock: number;
      }>(`/pos/barcode/${encodeURIComponent(trimmed)}`);
      if (!res.success || !res.data) {
        setError(res.error || 'Barcode not found');
        return;
      }
      const p = res.data;
      setCart((prev) => {
        const existing = prev.find((l) => l.productId === p.id);
        if (existing) {
          if (existing.quantity + 1 > p.liveStock) {
            setError(`Only ${p.liveStock} left for ${p.name}`);
            return prev;
          }
          return prev.map((l) =>
            l.productId === p.id ? { ...l, quantity: l.quantity + 1, liveStock: p.liveStock } : l,
          );
        }
        if (p.liveStock < 1) {
          setError(`${p.name} is out of stock`);
          return prev;
        }
        return [
          ...prev,
          {
            productId: p.id,
            name: p.name,
            barcode: p.barcode,
            unitPrice: Number(p.price),
            quantity: 1,
            liveStock: p.liveStock,
          },
        ];
      });
      setCode('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Barcode not found');
    } finally {
      setBusy(false);
    }
  }, []);

  async function charge() {
    if (!cart.length) return;
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ receipt: Receipt }>('/pos/sale', {
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'cash',
          customerName: customerName.trim() || undefined,
          items: cart.map((l) => ({
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        }),
      });
      if (!res.success || !res.data?.receipt) {
        setError(res.error || 'Sale failed');
        return;
      }
      setReceipt(res.data.receipt);
      setCart([]);
      setCustomerName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sale failed');
    } finally {
      setBusy(false);
    }
  }

  function printBill() {
    if (!receipt) return;
    const w = window.open('', '_blank', 'width=400,height=600');
    if (!w) return;
    const rows = receipt.items
      .map(
        (i) =>
          `<tr><td>${i.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${i.totalPrice}</td></tr>`,
      )
      .join('');
    w.document.write(`<!DOCTYPE html><html><body style="font-family:sans-serif;padding:16px">
      <h2>${receipt.businessName}</h2>
      <p>${receipt.orderNumber}<br/>${new Date(receipt.paidAt).toLocaleString()}</p>
      <table style="width:100%">${rows}</table>
      <h3 style="text-align:right">TOTAL LKR ${receipt.total}</h3>
      <script>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-28 -m-4 lg:-m-6">
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-blue-600 font-medium min-h-11 inline-flex items-center">
          Dashboard
        </Link>
        <h1 className="font-bold text-slate-900">Mobile cashier</h1>
        <Link href="/dashboard/products" className="text-sm text-slate-500 min-h-11 inline-flex items-center">
          Products
        </Link>
      </header>

      <div className="p-4 space-y-3 max-w-lg mx-auto">
        {stockLow > 0 && (
          <Link
            href="/dashboard/products"
            className="block text-sm bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-3 py-2"
          >
            {stockLow} product(s) low on stock — tap to review
          </Link>
        )}

        <p className="text-sm text-slate-500">
          Plug in a Bluetooth barcode scanner (types like a keyboard) or enter the code. For camera scan, use the Doorli Expo vendor app → Cashier.
        </p>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void addFromBarcode(code);
          }}
        >
          <input
            autoFocus
            className="flex-1 border border-slate-200 rounded-xl px-4 py-3 min-h-12 text-lg"
            placeholder="Scan / type barcode"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy}
            className="px-4 rounded-xl bg-slate-900 text-white font-semibold min-h-12"
          >
            Add
          </button>
        </form>

        <input
          className="w-full border border-slate-200 rounded-xl px-4 py-3 min-h-11"
          placeholder="Customer name (optional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="space-y-2">
          {cart.map((l) => (
            <div key={l.productId} className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate">{l.name}</p>
                <p className="text-xs text-slate-400">
                  LKR {l.unitPrice} · stock {l.liveStock}
                  {l.barcode ? ` · ${l.barcode}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="w-11 h-11 rounded-lg bg-slate-100"
                  onClick={() =>
                    setCart((prev) =>
                      prev
                        .map((x) =>
                          x.productId === l.productId ? { ...x, quantity: x.quantity - 1 } : x,
                        )
                        .filter((x) => x.quantity > 0),
                    )
                  }
                >
                  −
                </button>
                <span className="w-8 text-center font-bold">{l.quantity}</span>
                <button
                  type="button"
                  className="w-11 h-11 rounded-lg bg-slate-100"
                  onClick={() => {
                    if (l.quantity + 1 > l.liveStock) {
                      setError(`Only ${l.liveStock} available`);
                      return;
                    }
                    setCart((prev) =>
                      prev.map((x) =>
                        x.productId === l.productId ? { ...x, quantity: x.quantity + 1 } : x,
                      ),
                    );
                  }}
                >
                  +
                </button>
              </div>
              <p className="font-bold w-16 text-right">LKR {l.unitPrice * l.quantity}</p>
            </div>
          ))}
          {!cart.length && <p className="text-center text-slate-400 py-10">Scan items to build the bill</p>}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-2xl font-bold">LKR {total.toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            {receipt && (
              <button
                type="button"
                onClick={printBill}
                className="px-4 py-3 rounded-xl border border-blue-200 text-blue-700 font-semibold min-h-12"
              >
                Print bill
              </button>
            )}
            <button
              type="button"
              disabled={!cart.length || busy}
              onClick={charge}
              className="px-5 py-3 rounded-xl bg-emerald-600 text-white font-bold min-h-12 disabled:opacity-50"
            >
              {busy ? '…' : 'Charge cash'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

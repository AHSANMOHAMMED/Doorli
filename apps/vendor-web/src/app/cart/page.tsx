'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch, getToken } from '@/lib/api';
import {
  clearExploreCart,
  getExploreCart,
  updateExploreCartQty,
  type ExploreCartItem,
} from '@/lib/explore-cart';
import { Minus, Plus, Trash2, Loader as Loader2 } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const [items, setItems] = useState<ExploreCartItem[]>([]);
  const [address, setAddress] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setItems(getExploreCart());
  }, []);

  const byVendor = useMemo(() => {
    const map = new Map<string, ExploreCartItem[]>();
    for (const item of items) {
      const list = map.get(item.vendorId) || [];
      list.push(item);
      map.set(item.vendorId, list);
    }
    return [...map.entries()];
  }, [items]);

  function refresh() {
    setItems(getExploreCart());
  }

  async function checkoutVendor(vendorId: string, vendorItems: ExploreCartItem[]) {
    if (!getToken()) {
      router.push('/login');
      return;
    }
    if (!address.trim()) {
      setError('Enter a delivery address');
      return;
    }
    setPlacing(true);
    setError('');
    setSuccess('');
    try {
      const order = await apiFetch<{ id: string; orderNumber: string; totalAmount: number }>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          vendorId,
          paymentMethod: 'cod',
          deliveryAddress: address.trim(),
          items: vendorItems.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.price,
          })),
        }),
      });
      if (!order.success || !order.data) throw new Error(order.error || 'Order failed');
      try {
        await apiFetch('/payments/initiate', {
          method: 'POST',
          body: JSON.stringify({
            referenceId: order.data.id,
            referenceType: 'order',
            amount: Number(order.data.totalAmount),
            method: 'cod',
            gateway: 'manual',
          }),
        });
      } catch {
        // order still created
      }
      clearExploreCart(vendorId);
      refresh();
      setSuccess(`Order ${order.data.orderNumber} placed`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cart</h1>
        <Link href="/explore" className="text-sm text-blue-600">
          Continue shopping
        </Link>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm">{success}</div>}

      <label className="block text-sm">
        Delivery address
        <textarea
          className="mt-1 w-full border rounded-lg px-3 py-2"
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="House / street / city"
        />
      </label>

      {byVendor.length === 0 ? (
        <div className="text-center text-slate-500 py-12 border rounded-xl bg-white">Cart is empty.</div>
      ) : (
        byVendor.map(([vendorId, vendorItems]) => {
          const subtotal = vendorItems.reduce((s, i) => s + i.price * i.quantity, 0);
          return (
            <div key={vendorId} className="bg-white border rounded-xl p-5 space-y-4">
              <h2 className="font-semibold">{vendorItems[0]?.vendorName}</h2>
              {vendorItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-slate-500">LKR {item.price.toFixed(0)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-1 border rounded"
                      onClick={() => {
                        updateExploreCartQty(item.productId, item.quantity - 1);
                        refresh();
                      }}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      className="p-1 border rounded"
                      onClick={() => {
                        updateExploreCartQty(item.productId, item.quantity + 1);
                        refresh();
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-red-500"
                      onClick={() => {
                        updateExploreCartQty(item.productId, 0);
                        refresh();
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="font-semibold">Subtotal LKR {subtotal.toFixed(0)}</div>
                <button
                  type="button"
                  disabled={placing}
                  onClick={() => checkoutVendor(vendorId, vendorItems)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {placing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Checkout (COD)
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

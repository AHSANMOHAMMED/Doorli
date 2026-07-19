"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number | string;
  createdAt: string;
  vendor?: { id: string; businessName: string };
};

export default function MyOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getCustomerToken()) {
      router.replace("/login?next=/orders");
      return;
    }
    apiFetch<{ items: Order[] }>("/orders/my")
      .then((d) => setOrders(d.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="relative z-10 max-w-3xl mx-auto px-5 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-bold">My orders</h1>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            Home
          </Link>
        </div>
        {loading && <p className="text-white/50">Loading…</p>}
        {error && <p className="text-amber-200">{error}</p>}
        {!loading && orders.length === 0 && (
          <p className="text-white/45">No orders yet. Browse shops and checkout.</p>
        )}
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="doorli-glass rounded-2xl p-5">
              <div className="flex justify-between gap-4">
                <div>
                  <div className="font-semibold">#{o.orderNumber}</div>
                  <div className="text-sm text-white/55 mt-1">{o.vendor?.businessName ?? "Vendor"}</div>
                  <div className="text-xs text-white/40 mt-2 capitalize">
                    {o.status.replace(/_/g, " ")} · {new Date(o.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="font-bold">LKR {Number(o.totalAmount).toFixed(0)}</div>
                  <Link
                    href={`/orders/${o.id}/track`}
                    className="inline-block text-xs font-medium text-[var(--doorli-mint)] underline underline-offset-2"
                  >
                    Track live
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

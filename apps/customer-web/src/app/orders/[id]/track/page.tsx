"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, getCustomerToken } from "@/lib/api";

type TrackData = {
  orderId: string;
  orderNumber: string;
  status: string;
  estimatedDeliveryTime?: string | null;
  vendor?: { businessName?: string; phone?: string | null };
  deliveryAddress?: { addressLine?: string; city?: string | null };
  driver?: {
    user?: { fullName?: string; phone?: string | null };
    vehicleNumber?: string | null;
    currentLatitude?: number | null;
    currentLongitude?: number | null;
  } | null;
};

const STEPS = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered"];

export default function TrackOrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getCustomerToken()) {
      router.replace(`/login?next=/orders/${id}/track`);
      return;
    }
    let alive = true;
    const load = () =>
      apiFetch<TrackData>(`/orders/${id}/track`)
        .then((d) => {
          if (alive) setData(d);
        })
        .catch((e) => {
          if (alive) setError(e.message);
        });
    load();
    const t = setInterval(load, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [id, router]);

  const stepIdx = data
    ? Math.max(
        0,
        STEPS.findIndex((s) => s === data.status.replace(/cancelled|failed/, "pending")),
      )
    : 0;

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="relative z-10 max-w-lg mx-auto px-5 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/orders" className="text-sm text-white/70 hover:text-white">
            ← My orders
          </Link>
          <Link href="/" className="text-sm text-white/70 hover:text-white">
            Home
          </Link>
        </div>

        <h1 className="font-display text-3xl font-bold">Live tracking</h1>
        <p className="text-[#9bb4d0] text-sm">Delivery & transport — updates every few seconds</p>

        {error && <p className="text-amber-200 text-sm">{error}</p>}
        {!data && !error && <p className="text-white/50">Loading track…</p>}

        {data && (
          <div className="doorli-glass rounded-2xl p-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-[var(--doorli-mint)]">Order</p>
              <p className="font-display text-xl font-semibold mt-1">#{data.orderNumber}</p>
              <p className="text-sm text-white/60 mt-1">{data.vendor?.businessName}</p>
            </div>

            <div>
              <p className="text-sm capitalize text-white/90">
                Status: <strong>{data.status.replace(/_/g, " ")}</strong>
              </p>
              <div className="mt-3 flex gap-1">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full ${
                      i <= stepIdx ? "bg-[var(--doorli-mint)]" : "bg-white/15"
                    }`}
                    title={s}
                  />
                ))}
              </div>
            </div>

            {data.deliveryAddress && (
              <p className="text-sm text-white/70">
                Deliver to: {data.deliveryAddress.addressLine}
                {data.deliveryAddress.city ? `, ${data.deliveryAddress.city}` : ""}
              </p>
            )}

            {data.driver ? (
              <div className="rounded-xl bg-black/25 border border-white/10 p-4 text-sm space-y-1">
                <p className="font-medium text-[var(--doorli-mint)]">Driver assigned</p>
                <p>{data.driver.user?.fullName || "Driver"}</p>
                {data.driver.vehicleNumber && <p className="text-white/60">{data.driver.vehicleNumber}</p>}
                {data.driver.user?.phone && <p className="text-white/60">{data.driver.user.phone}</p>}
              </div>
            ) : (
              <p className="text-sm text-white/50">Waiting for a driver / kitchen prep…</p>
            )}

            {data.estimatedDeliveryTime && (
              <p className="text-xs text-white/45">
                ETA: {new Date(data.estimatedDeliveryTime).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

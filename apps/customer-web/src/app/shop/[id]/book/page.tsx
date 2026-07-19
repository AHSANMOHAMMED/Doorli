"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Vendor = {
  id: string;
  businessName: string;
  category: string;
};

export default function BookVendorPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [guestCount, setGuestCount] = useState("2");
  const [totalAmount, setTotalAmount] = useState("5000");
  const [requirements, setRequirements] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!getCustomerToken()) {
      router.replace(`/login?next=/shop/${id}/book`);
      return;
    }
    apiFetch<Vendor>(`/vendors/${id}`)
      .then(setVendor)
      .catch((e) => setError(e.message));
  }, [id, router]);

  const bookingType =
    vendor?.category === "hotel" ||
    vendor?.category === "hall" ||
    vendor?.category === "beauty" ||
    vendor?.category === "service"
      ? vendor.category
      : "hotel";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!vendor) return;
    setSaving(true);
    setError(null);
    try {
      await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          vendorId: vendor.id,
          bookingType,
          eventDate: eventDate || undefined,
          checkInDate: bookingType === "hotel" ? eventDate || undefined : undefined,
          checkOutDate: bookingType === "hotel" ? checkOutDate || undefined : undefined,
          startTime: eventDate ? `${eventDate}T${startTime}:00` : undefined,
          guestCount: parseInt(guestCount, 10) || 1,
          totalAmount: parseFloat(totalAmount) || 0,
          depositAmount: Math.round((parseFloat(totalAmount) || 0) * 0.2),
          requirements: requirements || undefined,
        }),
      });
      window.location.assign("/orders");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
      setSaving(false);
    }
  }

  const input =
    "mt-1.5 w-full rounded-xl bg-black/25 border border-white/15 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-[var(--doorli-sky)]";

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative">
      <div className="doorli-orb doorli-orb--b" aria-hidden />
      <div className="relative z-10 max-w-lg mx-auto px-5 py-10 space-y-6">
        <Link href={`/shop/${id}`} className="text-sm text-white/70 hover:text-white">
          ← Back to shop
        </Link>
        <h1 className="font-display text-3xl font-bold">Book {vendor?.businessName || "…"}</h1>
        <p className="text-sm text-[#9bb4d0] capitalize">
          {bookingType} booking · syncs toward ERP reservations when shop is linked
        </p>

        {error && <p className="text-amber-200 text-sm">{error}</p>}

        <form method="post" action="#" onSubmit={onSubmit} className="doorli-glass rounded-2xl p-6 space-y-4">
          <label className="block text-sm">
            {bookingType === "hotel" ? "Check-in date" : "Date"}
            <input type="date" className={input} value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          </label>
          {bookingType === "hotel" && (
            <label className="block text-sm">
              Check-out date
              <input
                type="date"
                className={input}
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
              />
            </label>
          )}
          {(bookingType === "beauty" || bookingType === "hall") && (
            <label className="block text-sm">
              Start time
              <input type="time" className={input} value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </label>
          )}
          <label className="block text-sm">
            Guests / party size
            <input className={input} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} />
          </label>
          <label className="block text-sm">
            Total (LKR)
            <input className={input} value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
          </label>
          <label className="block text-sm">
            Notes
            <textarea
              className={input}
              rows={3}
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Room type, décor, allergies…"
            />
          </label>
          <button type="submit" disabled={saving || !vendor} className="w-full doorli-cta-primary justify-center disabled:opacity-50">
            {saving ? "Booking…" : "Confirm booking"}
          </button>
        </form>
      </div>
    </main>
  );
}

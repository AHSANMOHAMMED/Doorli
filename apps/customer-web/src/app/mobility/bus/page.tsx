"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, BusFront, CheckCircle2 } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Seat = { number: string; state: "available" | "occupied" };
type Schedule = { time: string; fare: number; availableSeats: number };

function BusTicketContent() {
  const params = useSearchParams();
  const routeId = params.get("route") || "r2";
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    setLoading(true); setError(null); setSelected(null);
    apiFetch<Schedule[]>(`/transit/bus/${routeId}/schedule?date=${date}`)
      .then((items) => { setSchedule(items); setTime(items[0]?.time || ""); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Schedule unavailable."))
      .finally(() => setLoading(false));
  }, [routeId, date]);

  useEffect(() => {
    if (!time) { setSeats([]); return; }
    apiFetch<Seat[]>(`/transit/bus/${routeId}/seats?date=${date}&time=${time}`)
      .then(setSeats).catch(() => setSeats([]));
  }, [routeId, date, time]);

  async function reserve() {
    if (!getCustomerToken()) { window.location.assign("/login?next=/mobility/bus"); return; }
    if (!selected || !time) { setError("Choose an available departure and seat first."); return; }
    setReserving(true); setError(null);
    try {
      const reservation = await apiFetch<{ reservationToken: string }>("/transit/bus/seats/reserve", { method: "POST", body: JSON.stringify({ routeId, date, time, seatNumber: selected }) });
      const booking = await apiFetch<{ bookingRef: string; qrPayload: string }>("/transit/bus/bookings", { method: "POST", body: JSON.stringify({ reservationToken: reservation.reservationToken }) });
      localStorage.setItem(`doorli_ticket_${booking.bookingRef}`, JSON.stringify(booking));
      setResult(`Ticket ${booking.bookingRef} confirmed. Seat ${selected}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ticket booking failed."); }
    finally { setReserving(false); }
  }

  if (loading) return <main className="doorli-page-shell min-h-screen px-5 py-10 text-white"><div className="mx-auto max-w-2xl animate-pulse rounded-3xl border border-white/10 bg-white/[0.04] p-8">Loading departures and seats...</div></main>;

  return <main className="doorli-page-shell text-white"><div className="mx-auto max-w-2xl space-y-6 px-5 py-10 pb-28"><Link href="/mobility" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="h-4 w-4" /> Mobility hub</Link><header><BusFront className="h-7 w-7 text-[var(--doorli-mint)]" /><h1 className="mt-2 font-display text-3xl font-bold">Bus ticket</h1><p className="mt-1 text-sm text-white/55">Route {routeId}</p></header><section className="doorli-glass space-y-4 rounded-3xl p-6"><label className="block text-sm text-white/70">Travel date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#101c35] px-4 py-3 text-white" /></label><label className="block text-sm text-white/70">Departure<select value={time} onChange={(e) => setTime(e.target.value)} disabled={!schedule.length} className="mt-2 w-full rounded-xl border border-white/15 bg-[#101c35] px-4 py-3 text-white"><option value="">{schedule.length ? "Select departure" : "No departures available"}</option>{schedule.map((item) => <option key={item.time} value={item.time}>{item.time} · LKR {item.fare} · {item.availableSeats} seats</option>)}</select></label><div><p className="text-sm text-white/70">Select a seat</p><div className="mt-2 grid grid-cols-5 gap-2">{seats.map((seat) => <button type="button" disabled={seat.state === "occupied"} key={seat.number} onClick={() => setSelected(seat.number)} className={`rounded-lg border py-3 text-xs ${seat.state === "occupied" ? "border-white/5 bg-white/5 text-white/20" : selected === seat.number ? "border-[var(--doorli-mint)] bg-[var(--doorli-teal)]/30 text-white" : "border-white/15 text-white/70"}`}>{seat.number}</button>)}</div>{time && !seats.length && <p className="mt-2 text-sm text-white/50">No seats are available for this departure.</p>}</div>{error && <p className="text-sm text-amber-200">{error}</p>}{result && <p className="flex items-center gap-2 text-sm text-[var(--doorli-mint)]"><CheckCircle2 className="h-4 w-4" /> {result}</p>}<button type="button" onClick={() => void reserve()} disabled={!selected || reserving} className="doorli-cta-primary w-full justify-center disabled:opacity-50">{reserving ? "Reserving..." : "Reserve seat"}</button></section></div></main>;
}

export default function BusTicketPage() { return <Suspense fallback={<main className="doorli-page-shell min-h-screen" />}><BusTicketContent /></Suspense>; }

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

  useEffect(() => { apiFetch<Schedule[]>(`/transit/bus/${routeId}/schedule?date=${date}`).then((items) => { setSchedule(items); setTime(items[0]?.time || ""); }).catch((cause) => setError(cause instanceof Error ? cause.message : "Schedule unavailable.")); }, [routeId, date]);
  useEffect(() => { if (!time) return; apiFetch<Seat[]>(`/transit/bus/${routeId}/seats?date=${date}&time=${time}`).then(setSeats).catch(() => setSeats([])); }, [routeId, date, time]);

  async function reserve() {
    if (!getCustomerToken()) { window.location.assign("/login?next=/mobility/bus"); return; }
    if (!selected) return;
    setError(null);
    try {
      const reservation = await apiFetch<{ reservationToken: string }>("/transit/bus/seats/reserve", { method: "POST", body: JSON.stringify({ routeId, date, time, seatNumber: selected }) });
      const booking = await apiFetch<{ bookingRef: string; qrPayload: string }>("/transit/bus/bookings", { method: "POST", body: JSON.stringify({ reservationToken: reservation.reservationToken }) });
      localStorage.setItem(`doorli_ticket_${booking.bookingRef}`, JSON.stringify(booking));
      setResult(`Ticket ${booking.bookingRef} confirmed. Seat ${selected}.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Ticket booking failed."); }
  }

  return <main className="doorli-page-shell text-white"><div className="max-w-2xl mx-auto px-5 py-10 pb-28 space-y-6"><Link href="/mobility" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="w-4 h-4" /> Mobility hub</Link><header><BusFront className="w-7 h-7 text-[var(--doorli-mint)]" /><h1 className="font-display text-3xl font-bold mt-2">Bus ticket</h1><p className="text-sm text-white/55 mt-1">Route {routeId}</p></header><section className="doorli-glass rounded-3xl p-6 space-y-4"><label className="block text-sm text-white/70">Travel date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full bg-[#101c35] border border-white/15 rounded-xl px-4 py-3 text-white" /></label><label className="block text-sm text-white/70">Departure<select value={time} onChange={(e) => setTime(e.target.value)} className="mt-2 w-full bg-[#101c35] border border-white/15 rounded-xl px-4 py-3 text-white">{schedule.map((item) => <option key={item.time} value={item.time}>{item.time} · LKR {item.fare} · {item.availableSeats} seats</option>)}</select></label><div><p className="text-sm text-white/70">Select a seat</p><div className="grid grid-cols-5 gap-2 mt-2">{seats.map((seat) => <button type="button" disabled={seat.state === "occupied"} key={seat.number} onClick={() => setSelected(seat.number)} className={`rounded-lg py-3 text-xs border ${seat.state === "occupied" ? "border-white/5 bg-white/5 text-white/20" : selected === seat.number ? "border-[var(--doorli-mint)] bg-[var(--doorli-teal)]/30 text-white" : "border-white/15 text-white/70"}`}>{seat.number}</button>)}</div></div>{error && <p className="text-sm text-amber-200">{error}</p>}{result && <p className="text-sm text-[var(--doorli-mint)] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {result}</p>}<button type="button" onClick={() => void reserve()} disabled={!selected} className="doorli-cta-primary w-full justify-center disabled:opacity-50">Reserve and pay with Wallet</button></section></div></main>;
}

export default function BusTicketPage() {
  return <Suspense fallback={<main className="doorli-page-shell min-h-screen" />}><BusTicketContent /></Suspense>;
}

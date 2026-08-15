"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

type Room = { id: string; roomType: string; capacity: number; price: number; availableRooms: number; amenities?: string[] };
type Hotel = { id: string; businessName: string; description?: string; city?: string; addressLine?: string; avgRating?: number; phone?: string };

function nightsBetween(from: string, to: string) {
  if (!from || !to) return 0;
  return Math.max(0, Math.ceil((new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / 86400000));
}

export default function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [token, setToken] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("doorli_access_token");
    if (saved) setToken(saved);
    fetch(`${API}/vendors/${id}`).then((r) => r.json()).then((r) => setHotel(r.data || r)).catch(() => setMessage("Hotel could not be loaded."));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const query = checkIn && checkOut ? `?from=${checkIn}T00:00:00.000Z&to=${checkOut}T00:00:00.000Z` : "";
    fetch(`${API}/bookings/hotels/${id}/rooms${query}`).then((r) => r.json()).then((r) => { const next = r.data || []; setRooms(next); if (!roomId && next[0]) setRoomId(next[0].id); }).catch(() => setMessage("Room availability could not be loaded."));
  }, [id, checkIn, checkOut, roomId]);

  const selectedRoom = rooms.find((room) => room.id === roomId);
  const nights = nightsBetween(checkIn, checkOut);
  const total = selectedRoom ? Number(selectedRoom.price) * nights : 0;
  const today = new Date().toISOString().slice(0, 10);

  async function login() {
    setBusy(true);
    try {
      const response = await fetch(`${API}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ identifier, password, expectedRole: "customer" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Login failed");
      const next = data.data?.accessToken || data.accessToken;
      if (!next) throw new Error("Login did not return an access token");
      window.localStorage.setItem("doorli_access_token", next);
      setToken(next); setMessage("Signed in. You can now book your room.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Login failed"); }
    finally { setBusy(false); }
  }

  async function book() {
    if (!token) return setMessage("Sign in before booking.");
    if (!selectedRoom || !checkIn || !checkOut || nights < 1) return setMessage("Choose an available room and valid dates.");
    if (selectedRoom.availableRooms < 1 || guests > selectedRoom.capacity) return setMessage("This room is not available for that guest count.");
    setBusy(true);
    try {
      const response = await fetch(`${API}/bookings`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "Idempotency-Key": `hotel-${id}-${roomId}-${checkIn}-${checkOut}` }, body: JSON.stringify({ vendorId: id, bookingType: "hotel", roomId, checkInDate: `${checkIn}T00:00:00.000Z`, checkOutDate: `${checkOut}T00:00:00.000Z`, guestCount: guests, totalAmount: total }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Booking failed");
      setMessage(`Booking ${data.data?.bookingNumber || "created"} is pending hotel confirmation.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Booking failed"); }
    finally { setBusy(false); }
  }

  const roomList = useMemo(() => rooms.filter((room) => room.availableRooms > 0), [rooms]);
  return <main className="min-h-screen bg-[#0a0f2e] text-white px-4 py-8"><div className="max-w-4xl mx-auto"><Link href="/" className="text-[#5dcaa5]">← Hotels</Link><section className="mt-6 bg-[#121a36] rounded-2xl border border-white/10 p-6"><h1 className="text-3xl font-bold">{hotel?.businessName || "Loading hotel..."}</h1><p className="text-[#7b8ba3] mt-2">{hotel?.description || "Live rooms and availability"}</p><p className="text-[#7b8ba3] mt-2">{hotel?.city || ""} {hotel?.addressLine ? `· ${hotel.addressLine}` : ""}</p></section><section className="mt-6 bg-[#121a36] rounded-2xl border border-white/10 p-6"><h2 className="text-xl font-bold">Search rooms</h2><div className="grid md:grid-cols-3 gap-3 mt-4"><label className="text-sm text-[#7b8ba3]">Check-in<input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="block w-full mt-1 bg-[#0a0f2e] p-3 rounded-lg text-white" /></label><label className="text-sm text-[#7b8ba3]">Check-out<input type="date" min={checkIn || today} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="block w-full mt-1 bg-[#0a0f2e] p-3 rounded-lg text-white" /></label><label className="text-sm text-[#7b8ba3]">Guests<select value={guests} onChange={(e) => setGuests(Number(e.target.value))} className="block w-full mt-1 bg-[#0a0f2e] p-3 rounded-lg text-white">{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></label></div><div className="grid md:grid-cols-3 gap-3 mt-5">{roomList.map((room) => <button key={room.id} onClick={() => setRoomId(room.id)} className={`text-left p-4 rounded-xl border ${roomId === room.id ? "border-[#5dcaa5] bg-[#5dcaa5]/10" : "border-white/10"}`}><strong>{room.roomType}</strong><p className="text-sm text-[#7b8ba3] mt-1">LKR {Number(room.price).toLocaleString()} / night</p><p className="text-xs text-[#7b8ba3]">{room.availableRooms} available · up to {room.capacity} guests</p></button>)}</div>{nights > 0 && <p className="mt-4 text-[#5dcaa5]">{nights} nights · LKR {total.toLocaleString()}</p>}</section><section className="mt-6 bg-[#121a36] rounded-2xl border border-white/10 p-6">{!token ? <><h2 className="text-xl font-bold">Sign in to book</h2><div className="grid md:grid-cols-2 gap-3 mt-4"><input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="Email or username" className="bg-[#0a0f2e] p-3 rounded-lg" /><input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" className="bg-[#0a0f2e] p-3 rounded-lg" /></div><button disabled={busy} onClick={login} className="mt-4 bg-[#5dcaa5] text-[#0a0f2e] px-5 py-3 rounded-lg font-bold">{busy ? "Signing in..." : "Sign in"}</button></> : <button disabled={busy || !selectedRoom || nights < 1} onClick={book} className="bg-[#5dcaa5] text-[#0a0f2e] px-5 py-3 rounded-lg font-bold">{busy ? "Booking..." : `Book ${selectedRoom?.roomType || "room"}`}</button>}{message && <p className="mt-4 text-[#5dcaa5]">{message}</p>}</section></div></main>;
}

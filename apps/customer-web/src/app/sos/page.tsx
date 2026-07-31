"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, PhoneCall, AlertTriangle, Crosshair, MapPin, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function EmergencySOSPage() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const triggerSOS = async (type: string) => {
    setStatus("sending");
    setLoading(true);
    setErrorMsg("");

    try {
      let location = "Colombo, Sri Lanka";
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = `${pos.coords.latitude}, ${pos.coords.longitude}`;
      }

      const payload = {
        type,
        location,
        description: `Urgent ${type} assistance required!`,
      };

      await apiFetch("/emergency/sos", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setStatus("success");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Failed to trigger SOS.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative pb-20">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--c" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 60%)" }} aria-hidden />
      
      <div className="relative z-10 max-w-lg mx-auto px-5 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Doorli
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/20 border border-red-500/30 mb-6 animate-pulse-glow">
            <ShieldAlert className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-white drop-shadow-md">
            Emergency SOS
          </h1>
          <p className="text-[#9bb4d0] mt-3">
            Tap the button below to instantly alert nearby first responders, verified volunteers, and your emergency contacts.
          </p>
        </div>

        {status === "success" ? (
          <div className="doorli-glass-card border-red-500/40 p-8 rounded-3xl text-center animate-bounce-in">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-2">SOS Activated</h2>
            <p className="text-white/70 mb-6">
              Help is on the way. Keep your device close and stay on the line if contacted.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-red-300 font-mono mb-8 bg-red-500/10 py-2 px-4 rounded-xl">
              <MapPin className="w-4 h-4" /> Location Transmitted
            </div>
            <button 
              onClick={() => setStatus("idle")}
              className="px-6 py-3 rounded-xl border border-white/20 text-white hover:bg-white/10 transition-all font-semibold"
            >
              Cancel Alert (Admin Only)
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <button
              disabled={loading}
              onClick={() => triggerSOS("GENERAL")}
              className="w-full relative group overflow-hidden rounded-[2.5rem] shadow-[0_20px_50px_rgba(239,68,68,0.4)] transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-red-500 to-rose-700" />
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
              <div className="relative p-10 flex flex-col items-center justify-center border-4 border-red-400/30 rounded-[2.5rem]">
                {loading ? (
                  <Loader2 className="w-16 h-16 text-white animate-spin mb-4" />
                ) : (
                  <Crosshair className="w-16 h-16 text-white mb-4 group-hover:scale-110 transition-transform duration-500" />
                )}
                <span className="font-display text-4xl font-black tracking-widest text-white uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  {loading ? "Sending..." : "SOS"}
                </span>
                <span className="text-red-100 mt-2 font-medium">Hold for 3 seconds (Simulated)</span>
              </div>
            </button>

            {errorMsg && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-xl text-center text-sm">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button 
                onClick={() => triggerSOS("MEDICAL")}
                disabled={loading}
                className="doorli-glass-card p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors border border-white/10"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-blue-400" />
                </div>
                <span className="font-semibold text-sm">Medical</span>
              </button>
              <button 
                onClick={() => triggerSOS("FIRE")}
                disabled={loading}
                className="doorli-glass-card p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-colors border border-white/10"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-orange-400" />
                </div>
                <span className="font-semibold text-sm">Fire</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

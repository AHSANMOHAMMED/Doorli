"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, CheckCheck, Clock, AlertTriangle, Info, ShoppingCart, Star, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  sentAt: string;
  data?: Record<string, unknown>;
};

type NotificationsResponse = {
  items: Notification[];
  nextCursor: string | null;
  unreadCount: number;
};

function typeIcon(type: string) {
  switch (type) {
    case "order":
      return <ShoppingCart className="w-4 h-4" />;
    case "booking":
      return <Star className="w-4 h-4" />;
    case "sos":
      return <AlertTriangle className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");

  const loadNotifications = useCallback(async (cursor?: string) => {
    try {
      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");
      const res = await apiFetch<NotificationsResponse>(`/notifications?${params.toString()}`);
      setNotifications((prev) => (cursor ? [...prev, ...res.items] : res.items));
      setUnreadCount(res.unreadCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  return (
    <main className="min-h-screen doorli-hero-plane text-white relative pb-20">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="doorli-orb doorli-orb--b" aria-hidden />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-5">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-white" />
            <h1 className="font-display text-2xl font-extrabold text-white">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="doorli-cta-primary text-xs px-4 py-2">
              Mark all read
            </button>
          )}
        </div>

        {error && (
          <div className="doorli-glass-card rounded-xl p-4 mb-4 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
            {error}
            <button onClick={() => loadNotifications()} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="doorli-glass-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="doorli-glass-card rounded-2xl p-8 text-center text-white/60">
            <Bell className="w-10 h-10 mx-auto mb-3 text-white/30" />
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`doorli-glass-card rounded-xl p-4 border transition-colors cursor-pointer ${
                  notif.isRead ? "border-white/5" : "border-white/20"
                }`}
                onClick={() => markRead(notif.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 shrink-0 ${notif.isRead ? "text-white/40" : "text-teal-400"}`}>
                    {typeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold text-sm ${notif.isRead ? "text-white/70" : "text-white"}`}>
                        {notif.title}
                      </h3>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0 ml-2" />
                      )}
                    </div>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{notif.body}</p>
                    <p className="text-[10px] text-white/30 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.sentAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

import { useEffect, useState, useCallback } from "react";
import type { ComponentType } from "react";
import { useRouter } from "next/navigation";
import {
  Wrench,
  Power,
  Gauge,
  Megaphone,
  Building2,
  Loader2,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { adminFetch } from "@/lib/api";
import { PageHeader, Panel, Badge, Skeleton } from "@/components/ui";

const SafeRefreshCw = RefreshCw as unknown as ComponentType<{ size?: number }>;

type MaintenanceWindow = {
  active: boolean;
  message?: string;
  reason?: string;
  scope?: string;
  endsAt?: string;
  updatedAt?: string;
};

type ServiceStates = Record<string, "enabled" | "disabled">;

type RateLimitPolicy = {
  id?: string;
  path: string;
  windowMs: number;
  limit: number;
  notes?: string;
  isActive?: boolean;
};

type ErpTenant = {
  tenantId: string;
  name?: string;
  status?: string;
  plan?: string;
  maxUsers?: number | null;
  aiEnabled?: boolean;
  provider?: string;
};

type ControlOverview = {
  maintenance: MaintenanceWindow | null;
  services: ServiceStates;
  rateLimits: RateLimitPolicy[];
  erp: { tenants?: ErpTenant[]; provider?: string } | null;
};

const SERVICE_LABELS: Record<string, string> = {
  marketplace: "Marketplace",
  delivery: "Delivery",
  auth: "Auth & Login",
  notifications: "Notifications",
  search: "Search",
  ai: "AI Services",
  storage: "Storage",
  chat: "Chat",
  ride_hailing: "Ride Hailing",
  emergency: "Emergency",
  forum: "Forum",
  gov: "GovTech",
  erp: "ERP Backends",
};

export default function ControlCenter() {
  const router = useRouter();
  const [data, setData] = useState<ControlOverview>({
    maintenance: null,
    services: {},
    rateLimits: [],
    erp: null,
  });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [erpProvider, setErpProvider] = useState<"simple" | "enterprise">("simple");

  // Maintenance form state
  const [maintActive, setMaintActive] = useState(false);
  const [maintMessage, setMaintMessage] = useState("");
  const [maintScope, setMaintScope] = useState("all");
  const [maintEndsAt, setMaintEndsAt] = useState("");

  // Broadcast form state
  const [bcTitle, setBcTitle] = useState("");
  const [bcBody, setBcBody] = useState("");
  const [bcAudience, setBcAudience] = useState("all");
  const [bcType, setBcType] = useState("announcement");

  // Rate limit form state
  const [rlPath, setRlPath] = useState("");
  const [rlLimit, setRlLimit] = useState(100);
  const [rlWindowMs, setRlWindowMs] = useState(900000);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const overview = await adminFetch<ControlOverview>("/admin/control/overview");
      setData({
        maintenance: overview.maintenance || null,
        services: overview.services || {},
        rateLimits: Array.isArray(overview.rateLimits) ? overview.rateLimits : [],
        erp: overview.erp || null,
      });
      setMaintActive(Boolean(overview.maintenance?.active));
      setMaintMessage(overview.maintenance?.message || "");
      setMaintScope(overview.maintenance?.scope || "all");
      setMaintEndsAt(overview.maintenance?.endsAt || "");
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Failed to load control overview");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("doorli_admin_token")) {
      router.replace("/login");
      return;
    }
    load();
  }, [router, load]);

  useEffect(() => {
    if (erpProvider === "enterprise" || data.erp?.provider !== erpProvider) {
      adminFetch(`/admin/control/erp/status?provider=${erpProvider}`)
        .then((partial) => setData((prev) => ({ ...prev, erp: { ...(partial || {}), provider: erpProvider } })))
        .catch(() => setData((prev) => ({ ...prev, erp: { tenants: [], provider: erpProvider } })));
    }
  }, [erpProvider, data.erp?.provider]);

  async function run(label: string, fn: () => Promise<unknown>) {
    setBusy(label);
    setFlash(null);
    try {
      await fn();
      await load();
      setFlash("Applied");
    } catch (e) {
      setFlash(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }

  const toggleService = (key: string, current: "enabled" | "disabled") =>
    run(`svc:${key}`, () =>
      adminFetch(`/admin/control/services/${key}`, {
        method: "PUT",
        body: JSON.stringify({ enabled: current !== "enabled" }),
      }),
    );

  const saveMaintenance = (active: boolean) =>
    run("maint", () =>
      adminFetch("/admin/control/maintenance", {
        method: "PUT",
        body: JSON.stringify({
          active,
          message: active ? maintMessage : undefined,
          scope: active ? maintScope : undefined,
          endsAt: active && maintEndsAt ? maintEndsAt : null,
        }),
      }),
    );

  const sendBroadcast = () =>
    run("bc", () =>
      adminFetch("/admin/control/broadcasts", {
        method: "POST",
        body: JSON.stringify({ title: bcTitle, body: bcBody, audience: bcAudience, type: bcType }),
      }).then(() => {
        setBcTitle("");
        setBcBody("");
      }),
    );

  const addRateLimit = () =>
    run("rl", () =>
      adminFetch("/admin/control/rate-limits", {
        method: "POST",
        body: JSON.stringify({ path: rlPath, limit: Number(rlLimit), windowMs: Number(rlWindowMs) }),
      }).then(() => {
        setRlPath("");
        setRlLimit(100);
        setRlWindowMs(900000);
      }),
    );

  const removeRateLimit = (path: string) =>
    run(`rl:${path}`, () =>
      adminFetch(`/admin/control/rate-limits/${encodeURIComponent(path)}`, { method: "DELETE" }),
    );

  const setTenantStatus = (tenant: ErpTenant, status: "active" | "suspended" | "locked") =>
    run(`tn:${tenant.tenantId}`, () =>
      adminFetch("/admin/control/erp/tenant", {
        method: "POST",
        body: JSON.stringify({
          tenantId: tenant.tenantId,
          status,
          statusReason: `Control Center: ${status}`,
          provider: erpProvider,
        }),
      }),
    );

  const maintenance: MaintenanceWindow = data.maintenance || { active: false };
  const tenants: ErpTenant[] = data.erp?.tenants || [];
  const services = Object.entries(data.services).sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <PageHeader
        title="Control Center"
        subtitle="One-click platform controls — maintenance, services, rate limits, broadcasts and ERP tenant lifecycle."
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={maintenance.active ? "danger" : "success"}>
              {maintenance.active ? "MAINTENANCE ACTIVE" : "ALL SYSTEMS NORMAL"}
            </Badge>
            <button type="button" className="btn btn-ghost" onClick={() => load()}>
              <SafeRefreshCw size={15} />
              Refresh
            </button>
          </div>
        }
      />

      {flash && (
        <p
          className={`rounded-xl border px-4 py-3 text-sm ${
            flash === "Applied"
              ? "border-[rgba(93,202,165,0.3)] bg-[rgba(93,202,165,0.1)] text-doorli-mint"
              : "border-[rgba(250,199,117,0.3)] bg-[rgba(250,199,117,0.1)] text-doorli-gold"
          }`}
        >
          {flash === "Applied" ? "Control applied and audit-logged." : flash}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Maintenance Mode" icon={<Wrench size={17} />}>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div>
                <p className="text-sm font-semibold text-white">Maintenance window</p>
                <p className="text-xs text-doorli-dim">
                  {maintenance.active ? "Doors are closed to the marketplace." : "All traffic is flowing normally."}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={maintActive}
                  onChange={(e) => setMaintActive(e.target.checked)}
                />
                <div className="h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-[#f2668b] peer-checked:after:translate-x-full" />
              </label>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-doorli-dim">
                Message shown to users
              </label>
              <input
                value={maintMessage}
                onChange={(e) => setMaintMessage(e.target.value)}
                placeholder="We are performing scheduled maintenance…"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-doorli-mint focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-doorli-dim">
                  Scope
                </label>
                <select
                  value={maintScope}
                  onChange={(e) => setMaintScope(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-doorli-mint focus:outline-none"
                >
                  {["all", "marketplace", "delivery", "auth", "erp", "notifications", "search", "ai", "storage", "chat", "ride_hailing", "emergency", "forum", "gov"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-doorli-dim">
                  Ends at (optional)
                </label>
                <input
                  type="datetime-local"
                  value={maintEndsAt}
                  onChange={(e) => setMaintEndsAt(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-doorli-mint focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="flex-1 rounded-xl bg-[#f2668b] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                disabled={busy === "maint"}
                onClick={() => saveMaintenance(true)}
              >
                {busy === "maint" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Start maintenance"}
              </button>
              <button
                type="button"
                className="flex-1 rounded-xl bg-[#5dcaa5] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                disabled={busy === "maint"}
                onClick={() => saveMaintenance(false)}
              >
                Disable maintenance
              </button>
            </div>
          </div>
        </Panel>

        <Panel title="Platform Broadcasts" icon={<Megaphone size={17} />}>
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-doorli-dim">
                Title
              </label>
              <input
                value={bcTitle}
                onChange={(e) => setBcTitle(e.target.value)}
                placeholder="New delivery zones live"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-doorli-mint focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-doorli-dim">
                Body
              </label>
              <textarea
                value={bcBody}
                onChange={(e) => setBcBody(e.target.value)}
                placeholder="Delivery is now available in 5 more cities…"
                className="h-24 w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder-white/30 focus:border-doorli-mint focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-doorli-dim">
                  Audience
                </label>
                <select
                  value={bcAudience}
                  onChange={(e) => setBcAudience(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-doorli-mint focus:outline-none"
                >
                  {["all", "customers", "vendors", "drivers", "admins", "erp_tenants"].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-doorli-dim">
                  Type
                </label>
                <select
                  value={bcType}
                  onChange={(e) => setBcType(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white focus:border-doorli-mint focus:outline-none"
                >
                  {["announcement", "info", "warning", "maintenance"].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-xl bg-gradient-to-r from-[#185fa5] to-[#1d9e75] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              disabled={busy === "bc" || !bcTitle || !bcBody}
              onClick={sendBroadcast}
            >
              {busy === "bc" ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : "Send broadcast"}
            </button>
          </div>
        </Panel>
      </div>

      <Panel title="Service Toggles" icon={<Power size={17} />}>
        <div className="-mx-6 -mb-6 grid grid-cols-1 gap-px overflow-hidden sm:grid-cols-2 xl:grid-cols-3">
          {loading ? (
            <Skeleton className="col-span-3 h-24" />
          ) : (
            services.map(([key, state]) => (
              <button
                key={key}
                type="button"
                disabled={busy === `svc:${key}`}
                onClick={() => toggleService(key, state)}
                className={`flex items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03] disabled:opacity-50 ${
                  state === "disabled" ? "bg-[rgba(242,102,139,0.06)]" : "bg-white/[0.01]"
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-white">{SERVICE_LABELS[key] || key}</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-doorli-dim">{key}</p>
                </div>
                <span
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full ${
                    state === "enabled" ? "bg-[#5dcaa5]" : "bg-white/15"
                  } after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all ${
                    state === "enabled" ? "after:translate-x-5" : ""
                  }`}
                />
                <Badge tone={state === "enabled" ? "success" : "danger"}>{state}</Badge>
              </button>
            ))
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Rate Limit Policies" icon={<Gauge size={17} />}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <input
                value={rlPath}
                onChange={(e) => setRlPath(e.target.value)}
                placeholder="/api/v1/auth/send-otp"
                className="col-span-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white placeholder-white/25 focus:border-doorli-mint focus:outline-none"
              />
              <input
                type="number"
                value={rlLimit}
                onChange={(e) => setRlLimit(Number(e.target.value))}
                placeholder="limit"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white focus:border-doorli-mint focus:outline-none"
              />
              <input
                type="number"
                value={rlWindowMs}
                onChange={(e) => setRlWindowMs(Number(e.target.value))}
                placeholder="windowMs"
                className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white focus:border-doorli-mint focus:outline-none"
              />
              <button
                type="button"
                disabled={busy === "rl" || !rlPath}
                onClick={addRateLimit}
                className="rounded-lg bg-[#185fa5] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
              >
                Add
              </button>
            </div>

            {data.rateLimits.length === 0 ? (
              <p className="py-6 text-center text-xs text-doorli-dim">No custom rate-limit policies yet.</p>
            ) : (
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {data.rateLimits.map((rl) => (
                  <div
                    key={rl.id || rl.path}
                    className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-[11px] text-doorli-mint">{rl.path}</p>
                      <p className="text-[11px] text-doorli-dim">
                        {rl.limit} req / {rl.windowMs}ms
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRateLimit(rl.path)}
                      className="shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold text-doorli-rose transition hover:bg-white/10"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        <Panel title="ERP Tenants" icon={<Building2 size={17} />}>
          <div className="mb-3 flex items-center gap-2">
            {(["simple", "enterprise"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setErpProvider(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  erpProvider === p
                    ? "bg-white/[0.12] text-white"
                    : "border border-white/10 text-doorli-muted hover:bg-white/[0.06]"
                }`}
              >
                {p === "simple" ? "Retail Smart" : "Enterprise OS"}
              </button>
            ))}
          </div>
          {loading ? (
            <Skeleton className="h-40" />
          ) : tenants.length === 0 ? (
            <p className="flex items-center gap-2 py-8 text-center text-sm text-doorli-dim">
              <ShieldAlert size={16} /> No tenant status available — is the ERP control channel reachable?
            </p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {tenants.map((t) => (
                <div key={t.tenantId} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{t.name || t.tenantId}</p>
                      <p className="font-mono text-[10px] text-doorli-dim">{t.tenantId}</p>
                    </div>
                    <Badge
                      tone={
                        t.status === "active"
                          ? "success"
                          : t.status === "suspended" || t.status === "locked"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {t.status || "unknown"} · {t.plan || "—"}
                    </Badge>
                  </div>
                  {t.status !== "active" && (
                    <button
                      type="button"
                      disabled={busy === `tn:${t.tenantId}`}
                      onClick={() => setTenantStatus(t, "active")}
                      className="mt-2 w-full rounded-lg bg-[#5dcaa5] px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

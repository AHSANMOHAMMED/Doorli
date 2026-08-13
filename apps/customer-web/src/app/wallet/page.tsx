"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, RefreshCw, WalletCards } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

type WalletData = { balance: number; currency: string };
type WalletTransaction = { id: string; type: string; amount: number; balanceAfter: number; description?: string | null; createdAt: string };

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [amount, setAmount] = useState("1000");
  const [method, setMethod] = useState<"stripe" | "upi" | "bank">("upi");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  async function loadWallet() {
    setLoading(true);
    try {
      const [balance, history] = await Promise.all([
        apiFetch<WalletData>("/wallet/balance"),
        apiFetch<WalletTransaction[]>("/wallet/transactions"),
      ]);
      setWallet(balance);
      setTransactions(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load wallet.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getCustomerToken()) {
      window.location.assign("/login?next=/wallet");
      return;
    }
    void loadWallet();
  }, []);

  async function topUp(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch<WalletData & { topupAmount: number }>("/wallet/topup", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ amount: Number(amount), method }),
      });
      setWallet({ balance: data.balance, currency: "LKR" });
      setMessage(`LKR ${data.topupAmount.toLocaleString()} added to your wallet.`);
      await loadWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Top-up failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="doorli-page-shell text-white">
      <div className="max-w-xl mx-auto px-5 py-10 pb-28 space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Doorli
        </Link>
        <header>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--doorli-mint)]">Daily money layer</p>
          <h1 className="font-display text-4xl font-bold mt-2">Doorli Wallet</h1>
          <p className="text-white/60 mt-2">Top up once, then pay for rides, orders, and bills without switching apps.</p>
        </header>

        <section className="rounded-3xl p-6 bg-gradient-to-br from-[#185fa5] to-[#1d9e75] shadow-2xl">
          <div className="flex items-center justify-between text-white/75 text-sm">
            <span>Available balance</span>
            <WalletCards className="w-5 h-5" />
          </div>
          <div className="font-display text-4xl font-bold mt-5">
            {loading ? "..." : `${wallet?.currency ?? "LKR"} ${Number(wallet?.balance ?? 0).toLocaleString()}`}
          </div>
          <button type="button" onClick={() => void loadWallet()} className="mt-5 text-xs text-white/75 inline-flex items-center gap-2 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh balance
          </button>
        </section>

        <form onSubmit={topUp} className="doorli-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-[var(--doorli-gold)]" /><h2 className="font-semibold">Add funds</h2></div>
          <label className="block text-sm text-white/70">Amount (LKR)<input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white" required /></label>
          <label className="block text-sm text-white/70">Payment method<select value={method} onChange={(e) => setMethod(e.target.value as typeof method)} className="mt-2 w-full bg-[#101c35] border border-white/15 rounded-xl px-4 py-3 text-white"><option value="upi">UPI</option><option value="stripe">Card</option><option value="bank">Bank transfer</option></select></label>
          {message && <p className="text-sm text-[var(--doorli-mint)]">{message}</p>}
          {error && <p className="text-sm text-amber-200">{error}</p>}
          <button disabled={saving} className="doorli-cta-primary w-full justify-center disabled:opacity-50">{saving ? "Adding funds..." : "Add funds"}</button>
        </form>

        <Link href="/bills" className="doorli-glass-card block rounded-3xl p-5 hover:border-[var(--doorli-mint)]/50">
          <span className="text-xs uppercase tracking-wider text-[var(--doorli-gold)]">Next action</span>
          <p className="font-semibold mt-1">Pay a bill or recharge</p>
          <p className="text-sm text-white/55 mt-1">Use your Doorli Wallet for mobile, electricity, water, gas, and internet.</p>
        </Link>
        <section className="doorli-glass rounded-3xl p-6">
          <h2 className="font-display text-xl font-bold">Recent activity</h2>
          <div className="mt-4 divide-y divide-white/10">
            {transactions.length === 0 && <p className="text-sm text-white/45 py-4">No wallet activity yet.</p>}
            {transactions.map((transaction) => {
              const credit = transaction.amount > 0;
              return <div key={transaction.id} className="py-3 flex items-center justify-between gap-4">
                <div><p className="text-sm font-medium capitalize">{transaction.type.replace(/_/g, " ")}</p><p className="text-xs text-white/45 mt-1">{transaction.description || "Doorli Wallet"} · {new Date(transaction.createdAt).toLocaleString()}</p></div>
                <div className={`text-sm font-semibold whitespace-nowrap ${credit ? "text-[var(--doorli-mint)]" : "text-white"}`}>{credit ? "+" : "-"}LKR {Math.abs(transaction.amount).toLocaleString()}</div>
              </div>;
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

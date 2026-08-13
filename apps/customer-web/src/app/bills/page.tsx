"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ReceiptText } from "lucide-react";
import { apiFetch, getCustomerToken } from "@/lib/api";

type Biller = { id: string; name: string; type: string; logo: string };
const TYPES = ["mobile", "electricity", "water", "gas", "internet", "dth", "fastag"];

export default function BillsPage() {
  const [billers, setBillers] = useState<Biller[]>([]);
  const [type, setType] = useState("mobile");
  const [billerId, setBillerId] = useState("");
  const [accountRef, setAccountRef] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getCustomerToken()) {
      window.location.assign("/login?next=/bills");
      return;
    }
    setLoading(true);
    apiFetch<Biller[]>(`/billers/billers/search?type=${type}`)
      .then((items) => { setBillers(items); setBillerId(items[0]?.id ?? ""); })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load billers."))
      .finally(() => setLoading(false));
  }, [type]);

  async function pay(event: FormEvent) {
    event.preventDefault();
    setPaying(true);
    setResult(null);
    setError(null);
    const isRecharge = ["mobile", "dth", "fastag"].includes(type);
    try {
      const data = await apiFetch<{ txnRef: string; biller: string; amount: number }>(isRecharge ? "/billers/bills/recharge" : "/bills/bills/pay", {
        method: "POST",
        headers: { "Idempotency-Key": crypto.randomUUID() },
        body: JSON.stringify({ billerId, accountRef, amount: Number(amount) }),
      });
      setResult(`${data.biller} paid successfully. Ref ${data.txnRef}`);
      setAccountRef("");
      setAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <main className="doorli-page-shell text-white">
      <div className="max-w-xl mx-auto px-5 py-10 pb-28 space-y-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white"><ArrowLeft className="w-4 h-4" /> Back to Doorli</Link>
        <header><p className="text-xs uppercase tracking-[0.22em] text-[var(--doorli-mint)]">Bills and recharges</p><h1 className="font-display text-4xl font-bold mt-2">Pay in a few taps</h1><p className="text-white/60 mt-2">Choose a biller, enter the account reference, and pay from your Doorli Wallet.</p></header>
        <div className="flex gap-2 overflow-x-auto pb-1">{TYPES.map((item) => <button type="button" key={item} onClick={() => setType(item)} className={`capitalize whitespace-nowrap rounded-full px-4 py-2 text-sm border ${type === item ? "bg-[var(--doorli-blue)] border-[var(--doorli-sky)] text-white" : "border-white/15 text-white/55"}`}>{item}</button>)}</div>
        <form onSubmit={pay} className="doorli-glass rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2"><ReceiptText className="w-5 h-5 text-[var(--doorli-gold)]" /><h2 className="font-semibold capitalize">{type} payment</h2></div>
          <label className="block text-sm text-white/70">Biller<select value={billerId} onChange={(e) => setBillerId(e.target.value)} className="mt-2 w-full bg-[#101c35] border border-white/15 rounded-xl px-4 py-3 text-white" required><option value="">{loading ? "Loading billers..." : "Select a biller"}</option>{billers.map((biller) => <option key={biller.id} value={biller.id}>{biller.logo} {biller.name}</option>)}</select></label>
          <label className="block text-sm text-white/70">Account or phone number<input value={accountRef} onChange={(e) => setAccountRef(e.target.value)} minLength={type === "mobile" ? 5 : 3} className="mt-2 w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white" required /></label>
          <label className="block text-sm text-white/70">Amount (LKR)<input type="number" min="1" step="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-2 w-full bg-black/25 border border-white/15 rounded-xl px-4 py-3 text-white" required /></label>
          {result && <p className="text-sm text-[var(--doorli-mint)]">{result}</p>}{error && <p className="text-sm text-amber-200">{error}</p>}
          <button disabled={paying || !billerId} className="doorli-cta-primary w-full justify-center disabled:opacity-50">{paying ? "Processing..." : "Pay with Doorli Wallet"}</button>
        </form>
        <Link href="/wallet" className="text-sm text-[var(--doorli-mint)] hover:underline">Check or top up wallet balance</Link>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { apiFetch, getCustomerToken } from "@/lib/api";
import { ArrowLeft, CheckCircle2, Minus, Plus, Trash2 } from "lucide-react";

type PaymentInit = {
  id: string;
  clientSecret?: string | null;
  gateway?: string;
  payHere?: Record<string, string> | null;
};

function openPayHereCheckout(fields: Record<string, string>) {
  const action =
    process.env.NEXT_PUBLIC_PAYHERE_CHECKOUT_URL ||
    "https://sandbox.payhere.lk/pay/checkout";
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  form.target = "_blank";
  for (const [key, value] of Object.entries(fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, updateQuantity, totalPrice, clearCart } = useCart();
  const [address, setAddress] = useState("123 Main Street, Colombo 03");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
  const [cardGateway, setCardGateway] = useState<"stripe" | "payhere">("stripe");
  const [placing, setPlacing] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentNote, setPaymentNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deliveryFee = 300;
  const finalTotal = Math.max(0, totalPrice + deliveryFee - discount);

  async function handlePlaceOrder() {
    if (!getCustomerToken()) {
      router.push("/login?next=/checkout");
      return;
    }
    if (items.length === 0) return;
    const vendorId = items[0].vendorId;
    setPlacing(true);
    setError(null);
    setPaymentNote(null);
    try {
      const order = await apiFetch<{ id: string; orderNumber: string; totalAmount?: number }>(
        "/orders",
        {
          method: "POST",
          body: JSON.stringify({
            vendorId,
            paymentMethod,
            deliveryAddress: address,
            ...(appliedPromo ? { promoCode: appliedPromo } : {}),
            items: items.map((i) => ({
              productId: i.id,
              quantity: i.quantity,
              unitPrice: i.price,
            })),
          }),
        },
      );

      const payAmount = Number(order.totalAmount ?? finalTotal);
      const gateway = paymentMethod === "cod" ? "manual" : cardGateway;

      try {
        const payment = await apiFetch<PaymentInit>("/payments/initiate", {
          method: "POST",
          body: JSON.stringify({
            referenceId: order.id,
            referenceType: "order",
            amount: payAmount,
            method: paymentMethod,
            gateway,
          }),
        });

        if (paymentMethod === "card") {
          if (payment.clientSecret?.startsWith("pi_dev_")) {
            await apiFetch(`/payments/${payment.id}/confirm-dev`, { method: "POST" });
            setPaymentNote("Dev card payment confirmed.");
          } else if (payment.payHere && Object.keys(payment.payHere).length) {
            openPayHereCheckout(payment.payHere);
            setPaymentNote("PayHere checkout opened in a new tab.");
          } else if (payment.clientSecret && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
            const { loadStripe } = await import("@stripe/stripe-js");
            const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
            if (stripe) {
              const { error: stripeError } = await stripe.confirmPayment({
                clientSecret: payment.clientSecret,
                confirmParams: {
                  return_url: `${window.location.origin}/orders/${order.id}/track`,
                },
                redirect: "if_required",
              });
              if (stripeError) {
                setPaymentNote(stripeError.message || "Card confirmation needed — pay from order detail.");
              } else {
                setPaymentNote("Card payment submitted.");
              }
            }
          } else {
            setPaymentNote(
              "Card initiated. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY for live Stripe, or use COD.",
            );
          }
        }
      } catch {
        // order still created
      }

      setOrderNumber(order.orderNumber);
      setOrderId(order.id);
      clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order failed");
    } finally {
      setPlacing(false);
    }
  }

  if (orderNumber) {
    return (
      <main className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-6 pb-24">
        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-12 text-center max-w-md w-full">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Order placed</h1>
          <p className="text-neutral-400 mb-2">Order {orderNumber} is with the vendor.</p>
          {paymentNote && <p className="text-sm text-emerald-300/90 mb-6">{paymentNote}</p>}
          <div className="space-y-3">
            <Link
              href={orderId ? `/orders/${orderId}/track` : "/orders"}
              className="block w-full py-3.5 bg-white text-black rounded-xl font-semibold min-h-11"
            >
              Track order
            </Link>
            <Link href="/orders" className="block w-full py-3 text-neutral-400">
              View orders
            </Link>
            <Link href="/" className="block w-full py-3 text-neutral-400">
              Back home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white pt-20 pb-28 px-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-neutral-400 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        {error && <p className="text-amber-400 mb-4">{error}</p>}

        {items.length === 0 ? (
          <p className="text-neutral-400">Cart is empty.</p>
        ) : (
          <div className="space-y-6">
            <label className="block">
              <span className="text-sm text-neutral-400">Delivery address</span>
              <input
                className="mt-2 w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 min-h-11"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </label>

            <div className="flex gap-2">
              <input
                className="flex-1 bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 min-h-11 uppercase"
                placeholder="Promo code"
                value={promoCode}
                onChange={(e) => {
                  setPromoCode(e.target.value);
                  setAppliedPromo("");
                  setDiscount(0);
                }}
              />
              <button
                type="button"
                className="px-4 rounded-xl bg-white/10 min-h-11 font-medium"
                onClick={async () => {
                  try {
                    const d = await apiFetch<{ discount: number }>("/promos/validate", {
                      method: "POST",
                      body: JSON.stringify({ code: promoCode, orderAmount: totalPrice + deliveryFee }),
                    });
                    setDiscount(Number(d.discount) || 0);
                    setAppliedPromo(promoCode.trim().toUpperCase());
                    setError(null);
                  } catch (e) {
                    setDiscount(0);
                    setAppliedPromo("");
                    setError(e instanceof Error ? e.message : "Invalid promo");
                  }
                }}
              >
                Apply
              </button>
            </div>
            {appliedPromo && discount > 0 && (
              <p className="text-sm text-emerald-400">Promo {appliedPromo} applied (−LKR {discount})</p>
            )}

            <div className="flex gap-2">
              {(
                [
                  { key: "cod" as const, label: "Cash on delivery" },
                  { key: "card" as const, label: "Card" },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setPaymentMethod(m.key)}
                  className={`flex-1 py-3 min-h-11 rounded-xl border font-medium ${
                    paymentMethod === m.key
                      ? "bg-indigo-500/30 border-indigo-400"
                      : "bg-neutral-900 border-white/10 text-neutral-400"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {paymentMethod === "card" && (
              <div className="flex gap-2 text-sm">
                {(
                  [
                    { key: "stripe" as const, label: "Stripe" },
                    { key: "payhere" as const, label: "PayHere" },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setCardGateway(g.key)}
                    className={`px-3 py-2 rounded-lg border ${
                      cardGateway === g.key
                        ? "border-emerald-400 text-emerald-300"
                        : "border-white/10 text-neutral-500"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
                <p className="text-neutral-500 self-center text-xs">
                  Without gateway keys, Stripe uses confirm-dev.
                </p>
              </div>
            )}

            <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-neutral-400">LKR {item.price}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
                    <button
                      type="button"
                      aria-label={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-lg active:bg-white/10"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      {item.quantity === 1 ? <Trash2 className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    </button>
                    <span className="min-w-8 text-center font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded-lg active:bg-white/10"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="border-t border-white/10 pt-4 flex justify-between text-neutral-400">
                <span>Delivery</span>
                <span>LKR {deliveryFee}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promo</span>
                  <span>- LKR {discount}</span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>LKR {finalTotal.toLocaleString()}</span>
              </div>
              <button
                disabled={placing}
                onClick={handlePlaceOrder}
                className="w-full py-4 min-h-12 bg-indigo-500 rounded-xl font-bold disabled:opacity-50"
              >
                {placing
                  ? "Placing…"
                  : paymentMethod === "cod"
                    ? `Place order (COD) · LKR ${finalTotal.toLocaleString()}`
                    : `Pay by card · LKR ${finalTotal.toLocaleString()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

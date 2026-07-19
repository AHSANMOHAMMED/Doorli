"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, ShoppingBag, Check, MapPin, CalendarDays, Wrench } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  price: number | string;
  category?: string | null;
  description?: string | null;
};

type Vendor = {
  id: string;
  businessName: string;
  category: string;
  description?: string | null;
  addressLine?: string | null;
  city?: string | null;
  products?: Product[];
  erpLinked?: boolean;
};

const BOOKABLE = new Set(["hotel", "hall", "beauty"]);
const SERVICEABLE = new Set(["service"]);
const COMMERCE = new Set(["grocery", "restaurant"]);

export default function VendorStorefront() {
  const params = useParams();
  const id = String(params.id);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const { addItem, totalItems, totalPrice } = useCart();
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    apiFetch<Vendor>(`/vendors/${id}`)
      .then((v) => {
        setVendor(v);
        const cats = Array.from(new Set((v.products || []).map((p) => p.category || "Other")));
        setActiveCategory(cats[0] || "All");
      })
      .catch((e) => setError(e.message));
  }, [id]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set((vendor?.products || []).map((p) => p.category || "Other")));
    return cats.length ? cats : ["All"];
  }, [vendor]);

  const products = (vendor?.products || []).filter((p) =>
    activeCategory === "All" ? true : (p.category || "Other") === activeCategory,
  );

  const handleAdd = (item: Product) => {
    addItem({
      id: item.id,
      vendorId: vendor!.id,
      name: item.name,
      price: Number(item.price),
    });
    setAddedItems((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => setAddedItems((prev) => ({ ...prev, [item.id]: false })), 1200);
  };

  if (error) {
    return (
      <main className="min-h-screen doorli-hero-plane text-white p-10">
        <p className="text-amber-200">{error}</p>
        <Link href="/" className="underline mt-4 inline-block">
          Home
        </Link>
      </main>
    );
  }

  if (!vendor) {
    return <main className="min-h-screen doorli-hero-plane text-white p-10">Loading…</main>;
  }

  const isBookable = BOOKABLE.has(vendor.category);
  const isService = SERVICEABLE.has(vendor.category);
  const isCommerce = COMMERCE.has(vendor.category) || (products.length > 0 && !isBookable && !isService);

  return (
    <main className="min-h-screen doorli-hero-plane text-white pb-28 relative">
      <div className="doorli-orb doorli-orb--a" aria-hidden />
      <div className="relative z-10">
        <div className="h-40 w-full bg-gradient-to-br from-[#185FA5]/50 to-[#1D9E75]/30 relative">
          <Link
            href="/search"
            className="absolute top-6 left-6 px-4 py-2 doorli-glass rounded-full text-sm"
          >
            ← Back
          </Link>
        </div>

        <div className="max-w-5xl mx-auto px-5 -mt-14">
          <div className="doorli-glass rounded-3xl p-8">
            <p className="text-xs uppercase tracking-wide text-[var(--doorli-mint)] mb-2">{vendor.category}</p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">{vendor.businessName}</h1>
            <p className="text-[#9bb4d0] mb-4">{vendor.description}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {vendor.addressLine || vendor.city || "Local"}
              </span>
              {vendor.erpLinked && (
                <span className="text-[11px] px-2 py-1 rounded-md bg-[var(--doorli-mint)]/15 text-[var(--doorli-mint)]">
                  ERP linked
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {isBookable && (
                <Link href={`/shop/${vendor.id}/book`} className="doorli-cta-primary text-sm py-2.5 px-4">
                  <CalendarDays className="w-4 h-4" />
                  Book now
                </Link>
              )}
              {isService && (
                <Link href={`/shop/${vendor.id}/request`} className="doorli-cta-primary text-sm py-2.5 px-4">
                  <Wrench className="w-4 h-4" />
                  Request service
                </Link>
              )}
              {isCommerce && (
                <Link href="/checkout" className="doorli-cta-ghost text-sm py-2.5 px-4">
                  Go to cart
                </Link>
              )}
            </div>
          </div>

          {isCommerce && (
            <>
              <div className="mt-10 flex gap-2 overflow-x-auto pb-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={cn(
                      "px-5 py-2 rounded-full whitespace-nowrap text-sm",
                      activeCategory === cat ? "bg-white text-[#0a0f2e]" : "bg-white/5 text-white/60",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {products.map((item) => (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl doorli-glass flex justify-between items-center"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-white/50 text-sm">{item.description}</p>
                      <p className="text-[var(--doorli-mint)] mt-2">LKR {Number(item.price).toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(item)}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center",
                        addedItems[item.id] ? "bg-[var(--doorli-mint)]" : "bg-white/10 hover:bg-[#185FA5]",
                      )}
                    >
                      {addedItems[item.id] ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                  </div>
                ))}
                {products.length === 0 && (
                  <p className="text-white/45 col-span-full">No products listed yet.</p>
                )}
              </div>
            </>
          )}

          {(isBookable || isService) && !isCommerce && (
            <p className="mt-10 text-sm text-white/50">
              Use the button above to {isBookable ? "book a slot" : "post a job request"}.
            </p>
          )}
        </div>
      </div>

      {totalItems > 0 && (
        <div className="fixed safe-fixed-bottom left-1/2 -translate-x-1/2 w-full max-w-sm px-6 z-40">
          <Link
            href="/checkout"
            className="w-full px-6 py-4 doorli-cta-primary justify-between inline-flex"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Cart ({totalItems})
            </span>
            <span>LKR {totalPrice.toLocaleString()}</span>
          </Link>
        </div>
      )}
    </main>
  );
}

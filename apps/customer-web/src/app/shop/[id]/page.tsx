"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, ShoppingBag, Check, MapPin, CalendarDays, Wrench } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { AIReviewAnalyzer } from "@/components/AIReviewAnalyzer";

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
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const { addItem, totalItems, totalPrice } = useCart();
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  async function loadVendor() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<Vendor | { success: boolean; data: Vendor }>(`/vendors/${id}`);
        let v: Vendor;
        if ("success" in res && "data" in res) {
          if (!res.success || !res.data) throw new Error("Vendor not found");
          v = res.data;
        } else {
          v = res as Vendor;
        }
        
        setVendor(v);
        const cats = Array.from(new Set((v.products || []).map((p: Product) => p.category || "Other")));
        setActiveCategory(cats[0] || "All");

    } catch (e) {
      setError(e instanceof Error ? e.message : "We could not load this store.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadVendor();
  }, [id]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set((vendor?.products || []).map((p: Product) => p.category || "Other")));
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
        <main className="storefront-page min-h-screen p-6 sm:p-10">
        <div className="storefront-error"><p>{error}</p><div className="mt-5 flex flex-wrap gap-3"><button type="button" className="storefront-button" onClick={() => void loadVendor()}>Try again</button><Link href="/" className="storefront-button storefront-button-secondary">Home</Link></div></div>
      </main>
    );
  }

  if (loading || !vendor) {
    return <main className="storefront-page min-h-screen p-6 sm:p-10"><div className="storefront-skeleton-cover" /><div className="storefront-skeleton-panel"><div /><div /><div /></div></main>;
  }

  const isBookable = BOOKABLE.has(vendor.category);
  const isService = SERVICEABLE.has(vendor.category);
  const isCommerce = COMMERCE.has(vendor.category) || (products.length > 0 && !isBookable && !isService);

  return (
    <main className="storefront-page min-h-screen pb-28 relative">
      <div className="relative z-10">
        <div className={`storefront-cover storefront-cover-${vendor.category}`}>
          <div className="storefront-cover-noise" aria-hidden="true" />
          <Link
            href="/search"
            className="storefront-back"
          >
            ← Back to discovery
          </Link>
          <div className="storefront-cover-caption"><span>Doorli local partner</span><strong>{vendor.city || "Nearby"}</strong></div>
        </div>

        <div className="max-w-5xl mx-auto px-5 -mt-14">
          <div className="storefront-identity">
            <div className="storefront-avatar"><StoreIcon category={vendor.category} /></div>
            <p className="storefront-kicker">{vendor.category}</p>
            <h1>{vendor.businessName}</h1>
            <p className="storefront-description">{vendor.description || `A trusted ${vendor.category} partner on Doorli.`}</p>
            <div className="storefront-meta">
              <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                {vendor.addressLine || vendor.city || "Local"}
              </span>
              {vendor.erpLinked && (
                  <span className="storefront-badge">
                  ERP linked
                </span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {isBookable && (
                <Link href={`/shop/${vendor.id}/book`} className="storefront-button text-sm">
                  <CalendarDays className="w-4 h-4" />
                  Book now
                </Link>
              )}
              {isService && (
                <Link href={`/shop/${vendor.id}/request`} className="storefront-button text-sm">
                  <Wrench className="w-4 h-4" />
                  Request service
                </Link>
              )}
              {isCommerce && (
                <Link href="/checkout" className="storefront-button storefront-button-secondary text-sm">
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
                       "storefront-category",
                       activeCategory === cat ? "is-active" : "",
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {products.map((item) => (
                  <motion.div
                    key={item.id}
                    className="storefront-product"
                    whileHover={{ y: -4 }}
                    transition={{ duration: .2 }}
                  >
                    <div>
                      <h3>{item.name}</h3>
                      <p>{item.description || "Freshly listed by this local partner."}</p>
                      <strong>LKR {Number(item.price).toLocaleString()}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAdd(item)}
                      className={cn(
                        "storefront-add",
                        addedItems[item.id] ? "is-added" : "",
                      )}
                    >
                      {addedItems[item.id] ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                    </button>
                  </motion.div>
                ))}
                {products.length === 0 && (
                    <p className="storefront-empty">No products listed yet.</p>
                )}
              </div>
            </>
          )}

          {(isBookable || isService) && !isCommerce && (
            <p className="storefront-empty mt-10">
              Use the button above to {isBookable ? "book a slot" : "post a job request"}.
            </p>
          )}

          {/* AI Review Analyzer Section */}
          <div className="storefront-review mt-12">
            <h3>Write a Review</h3>
            <AIReviewAnalyzer vendorId={vendor.id} />
          </div>
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

function StoreIcon({ category }: { category: string }) {
  if (category === "service") return <Wrench />;
  if (category === "restaurant") return <CalendarDays />;
  return <ShoppingBag />;
}

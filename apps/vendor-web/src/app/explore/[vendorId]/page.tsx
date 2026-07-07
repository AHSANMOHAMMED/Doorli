'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { Vendor, Product, Review, Profile, Cart, CartItem } from '@/lib/types';
import {
  Star,
  MapPin,
  Phone,
  Clock,
  ShoppingCart,
  Plus,
  Loader2,
  ArrowLeft,
  Store,
  Calendar,
  Wrench,
  Package,
  MessageSquare,
} from 'lucide-react';

function StarRating({ rating, size = 'w-4 h-4' }: { rating: number; size?: string }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${
            i <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-slate-200 fill-slate-200'
          }`}
        />
      ))}
      <span className="ml-1 text-sm text-slate-500">
        {rating > 0 ? rating.toFixed(1) : 'No ratings yet'}
      </span>
    </div>
  );
}

export default function VendorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const vendorId = params.vendorId as string;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<(Review & { profiles?: Pick<Profile, 'full_name' | 'avatar_url'> | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [addingId, setAddingId] = useState<string | null>(null);

  const isBookableCategory =
    vendor?.category === 'hotel' ||
    vendor?.category === 'hall' ||
    vendor?.category === 'beauty';
  const isServiceCategory = vendor?.category === 'service';

  const loadCartCount = useCallback(async () => {
    if (!user) return;
    try {
      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (cart) {
        const { count } = await supabase
          .from('cart_items')
          .select('id', { count: 'exact', head: true })
          .eq('cart_id', (cart as Cart).id);
        setCartCount(count ?? 0);
      } else {
        setCartCount(0);
      }
    } catch {
      // ignore cart count errors
    }
  }, [user, vendorId, supabase]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        // Load vendor
        const { data: vendorData, error: vendorError } = await supabase
          .from('vendors')
          .select('*')
          .eq('id', vendorId)
          .maybeSingle();

        if (vendorError) throw vendorError;
        if (!vendorData) {
          setError('Vendor not found.');
          setLoading(false);
          return;
        }
        setVendor(vendorData as Vendor);

        // Load products
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        if (productError) throw productError;
        setProducts((productData ?? []) as Product[]);

        // Load reviews with profile info
        const { data: reviewData } = await supabase
          .from('reviews')
          .select('*, profiles!reviews_user_id_fkey(full_name, avatar_url)')
          .eq('vendor_id', vendorId)
          .order('created_at', { ascending: false });

        setReviews((reviewData ?? []) as (Review & { profiles?: Pick<Profile, 'full_name' | 'avatar_url'> | null })[]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load vendor';
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    loadCartCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, loadCartCount]);

  async function handleAddToCart(product: Product) {
    if (!user) {
      router.push('/login');
      return;
    }
    setAddingId(product.id);
    try {
      // Check for existing cart for this user + vendor
      const { data: existingCart, error: cartError } = await supabase
        .from('carts')
        .select('*')
        .eq('user_id', user.id)
        .eq('vendor_id', vendorId)
        .maybeSingle();

      if (cartError) throw cartError;

      let cartId: string;

      if (existingCart) {
        cartId = (existingCart as Cart).id;
        // Check if product already in cart
        const { data: existingItem } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('cart_id', cartId)
          .eq('product_id', product.id)
          .maybeSingle();

        if (existingItem) {
          // Increment quantity
          const { error: updateError } = await supabase
            .from('cart_items')
            .update({ quantity: (existingItem as CartItem).quantity + 1 })
            .eq('id', (existingItem as CartItem).id);
          if (updateError) throw updateError;
        } else {
          // Insert new cart item
          const { error: insertError } = await supabase
            .from('cart_items')
            .insert({
              cart_id: cartId,
              product_id: product.id,
              quantity: 1,
            });
          if (insertError) throw insertError;
        }
      } else {
        // Create new cart
        const { data: newCart, error: newCartError } = await supabase
          .from('carts')
          .insert({
            user_id: user.id,
            vendor_id: vendorId,
          })
          .select()
          .single();

        if (newCartError) throw newCartError;
        cartId = (newCart as Cart).id;

        // Insert cart item
        const { error: insertError } = await supabase
          .from('cart_items')
          .insert({
            cart_id: cartId,
            product_id: product.id,
            quantity: 1,
          });
        if (insertError) throw insertError;
      }

      await loadCartCount();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to add to cart';
      setError(msg);
    } finally {
      setAddingId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (error && !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 text-center max-w-md">
          <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900">{error}</h2>
          <Link href="/explore" className="btn-primary mt-4 inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/explore" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Explore</span>
            </Link>
            <Link
              href="/cart"
              className="relative inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Vendor header */}
      <div className="bg-white">
        {/* Banner */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-40 sm:h-56 rounded-b-xl bg-gradient-to-br from-slate-200 to-slate-300 overflow-hidden">
            {vendor.banner_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendor.banner_url}
                alt={vendor.business_name}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>

        {/* Vendor info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row gap-4 -mt-10">
            <div className="w-20 h-20 rounded-xl bg-white shadow-md border border-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {vendor.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={vendor.logo_url}
                  alt={vendor.business_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-10 h-10 text-slate-400" />
              )}
            </div>
            <div className="flex-1 pt-2 sm:pt-8">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">{vendor.business_name}</h1>
                <span className="badge badge-neutral capitalize">{vendor.category}</span>
                {vendor.is_verified && <span className="badge badge-info">Verified</span>}
                {vendor.is_open ? (
                  <span className="badge badge-success">Open Now</span>
                ) : (
                  <span className="badge badge-neutral">Closed</span>
                )}
              </div>
              {vendor.description && (
                <p className="mt-2 text-slate-600 max-w-2xl">{vendor.description}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                <StarRating rating={vendor.avg_rating} />
                <span className="inline-flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {vendor.total_reviews} review{vendor.total_reviews !== 1 ? 's' : ''}
                </span>
                {vendor.address_line && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {vendor.city ? `${vendor.address_line}, ${vendor.city}` : vendor.address_line}
                  </span>
                )}
                {vendor.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {vendor.phone}
                  </span>
                )}
                {vendor.opening_hours && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    See hours
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:pt-8">
              {isBookableCategory && (
                <Link
                  href={`/explore/${vendorId}/book`}
                  className="btn-primary inline-flex items-center gap-2 justify-center"
                >
                  <Calendar className="w-4 h-4" />
                  Book Now
                </Link>
              )}
              {isServiceCategory && (
                <Link
                  href={`/explore/${vendorId}/request`}
                  className="btn-primary inline-flex items-center gap-2 justify-center"
                >
                  <Wrench className="w-4 h-4" />
                  Request Service
                </Link>
              )}
              <Link
                href={`/explore/${vendorId}/review`}
                className="btn-secondary inline-flex items-center gap-2 justify-center"
              >
                <Star className="w-4 h-4" />
                Leave a Review
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {products.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-slate-700" />
              <h2 className="text-lg font-semibold text-slate-900">Products</h2>
              <span className="text-sm text-slate-500">({products.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((product) => {
                const effectivePrice = product.discount_price ?? product.price;
                const hasDiscount =
                  product.discount_price !== null &&
                  product.discount_price < product.price;
                const outOfStock = product.stock_quantity <= 0 || !product.is_available;
                return (
                  <div
                    key={product.id}
                    className="card overflow-hidden flex flex-col animate-fade-in"
                  >
                    <div className="h-36 bg-slate-100 overflow-hidden">
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-medium text-slate-900">{product.name}</h3>
                      {product.description && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        {product.category && <span className="badge badge-neutral">{product.category}</span>}
                        {product.unit && <span>per {product.unit}</span>}
                        <span className={outOfStock ? 'text-red-500' : 'text-slate-500'}>
                          {outOfStock ? 'Out of stock' : `${product.stock_quantity} in stock`}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-lg font-bold text-slate-900">
                            ${effectivePrice.toFixed(2)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-slate-400 line-through">
                              ${product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={outOfStock || addingId === product.id}
                          className="btn-primary inline-flex items-center gap-1 text-sm px-3 py-1.5"
                        >
                          {addingId === product.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">No products available</h3>
            <p className="mt-1 text-slate-500">
              {isBookableCategory || isServiceCategory
                ? 'This vendor offers bookings/services instead of products.'
                : 'Check back later for products from this vendor.'}
            </p>
          </div>
        )}

        {/* Reviews section */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-slate-700" />
            <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
            <span className="text-sm text-slate-500">({reviews.length})</span>
          </div>

          {reviews.length === 0 ? (
            <div className="card p-8 text-center">
              <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No reviews yet. Be the first to review!</p>
              <Link
                href={`/explore/${vendorId}/review`}
                className="btn-secondary mt-4 inline-flex items-center gap-2"
              >
                <Star className="w-4 h-4" />
                Write a Review
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="card p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {review.profiles?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.profiles.avatar_url}
                          alt={review.profiles.full_name ?? 'User'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-blue-700">
                          {(review.profiles?.full_name ?? 'U').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-slate-900">
                          {review.profiles?.full_name ?? 'Anonymous'}
                        </p>
                        <span className="text-xs text-slate-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size="w-3.5 h-3.5" />
                      {review.comment && (
                        <p className="mt-2 text-sm text-slate-600">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

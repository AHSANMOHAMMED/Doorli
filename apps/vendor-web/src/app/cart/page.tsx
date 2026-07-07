'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import type { CartItem, Product, Vendor } from '@/lib/types';
import {
  ShoppingCart,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Store,
  CheckCircle2,
  Truck,
  CreditCard,
  Wallet,
  Banknote,
} from 'lucide-react';

const DELIVERY_FEE = 30;

const PAYMENT_METHODS = [
  { key: 'cod', label: 'Cash on Delivery', icon: Banknote },
  { key: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { key: 'wallet', label: 'Digital Wallet', icon: Wallet },
];

interface CartWithDetails {
  id: string;
  user_id: string;
  vendor_id: string;
  created_at: string;
  updated_at: string;
  cart_items: (CartItem & { product: Product | null })[];
  vendor: Vendor | null;
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [carts, setCarts] = useState<CartWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [success, setSuccess] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Checkout form state
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [customerNotes, setCustomerNotes] = useState('');

  const loadCart = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: fetchError } = await supabase
        .from('carts')
        .select(
          '*, cart_items(*, product:products(*)), vendor:vendors(*)',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setCarts((data ?? []) as unknown as CartWithDetails[]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load cart';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    loadCart();
  }, [authLoading, user, router, loadCart]);

  // Aggregate all cart items across carts
  const allItems: { cart: CartWithDetails; item: CartItem & { product: Product | null } }[] = [];
  carts.forEach((cart) => {
    cart.cart_items?.forEach((item) => {
      allItems.push({ cart, item });
    });
  });

  const subtotal = allItems.reduce((sum, { item }) => {
    const price = item.product?.discount_price ?? item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);

  const total = subtotal + (allItems.length > 0 ? DELIVERY_FEE : 0);

  async function updateQuantity(cartId: string, itemId: string, productId: string, currentQty: number, delta: number) {
    const newQty = currentQty + delta;
    setUpdatingId(itemId);
    try {
      if (newQty <= 0) {
        // Remove item
        const { error: deleteError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId);
        if (deleteError) throw deleteError;
      } else {
        const { error: updateError } = await supabase
          .from('cart_items')
          .update({ quantity: newQty })
          .eq('id', itemId);
        if (updateError) throw updateError;
      }
      await loadCart();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update cart';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(itemId: string) {
    setUpdatingId(itemId);
    try {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);
      if (deleteError) throw deleteError;
      await loadCart();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to remove item';
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handlePlaceOrder() {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!deliveryAddress.trim()) {
      setError('Please enter a delivery address.');
      return;
    }
    if (allItems.length === 0) return;

    setPlacingOrder(true);
    setError('');
    try {
      // Group items by vendor (each cart = one vendor)
      for (const cart of carts) {
        const items = cart.cart_items ?? [];
        if (items.length === 0) continue;

        const cartSubtotal = items.reduce((sum, item) => {
          const price = item.product?.discount_price ?? item.product?.price ?? 0;
          return sum + price * item.quantity;
        }, 0);
        const cartTotal = cartSubtotal + DELIVERY_FEE;

        // Generate order number
        const orderNumber = `ORD-${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 100)}`;

        // Create order
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            user_id: user.id,
            vendor_id: cart.vendor_id,
            driver_id: null,
            status: 'pending',
            payment_status: 'pending',
            payment_method: paymentMethod,
            delivery_type: 'delivery',
            subtotal: cartSubtotal,
            delivery_fee: DELIVERY_FEE,
            discount_amount: 0,
            total_amount: cartTotal,
            delivery_address: deliveryAddress,
            delivery_latitude: null,
            delivery_longitude: null,
            customer_notes: customerNotes || null,
            cancelled_reason: null,
            estimated_delivery_time: null,
            delivered_at: null,
          })
          .select()
          .single();

        if (orderError) throw orderError;
        const orderId = (orderData as { id: string }).id;

        // Create order_items
        const orderItemsData = items.map((item) => ({
          order_id: orderId,
          product_id: item.product_id,
          name: item.product?.name ?? 'Unknown Product',
          price: item.product?.discount_price ?? item.product?.price ?? 0,
          quantity: item.quantity,
          image_url: item.product?.image_url ?? null,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItemsData);

        if (itemsError) throw itemsError;

        // Clear cart: delete cart_items then cart
        const { error: deleteItemsError } = await supabase
          .from('cart_items')
          .delete()
          .eq('cart_id', cart.id);
        if (deleteItemsError) throw deleteItemsError;

        const { error: deleteCartError } = await supabase
          .from('carts')
          .delete()
          .eq('id', cart.id);
        if (deleteCartError) throw deleteCartError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/orders');
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to place order';
      setError(msg);
      setPlacingOrder(false);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="card p-8 text-center max-w-md animate-fade-in">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Order Placed Successfully!</h2>
          <p className="mt-2 text-slate-500">
            Your order has been placed. Redirecting to your orders...
          </p>
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/explore" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Continue Shopping</span>
            </Link>
            <Link
              href="/orders"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              My Orders
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-2 mb-6">
          <ShoppingCart className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
          {allItems.length > 0 && (
            <span className="text-sm text-slate-500">({allItems.length} item{allItems.length !== 1 ? 's' : ''})</span>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200 mb-6">
            {error}
          </div>
        )}

        {allItems.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in">
            <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900">Your cart is empty</h3>
            <p className="mt-1 text-slate-500">
              Browse vendors and add products to your cart to get started.
            </p>
            <Link href="/explore" className="btn-primary mt-6 inline-flex items-center gap-2">
              <Store className="w-4 h-4" />
              Explore Vendors
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-6">
              {carts.map((cart) => {
                const items = cart.cart_items ?? [];
                if (items.length === 0) return null;
                return (
                  <div key={cart.id} className="card overflow-hidden animate-fade-in">
                    {/* Vendor header */}
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                      <Store className="w-4 h-4 text-slate-500" />
                      <Link
                        href={`/explore/${cart.vendor_id}`}
                        className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                      >
                        {cart.vendor?.business_name ?? 'Vendor'}
                      </Link>
                      <span className="badge badge-neutral capitalize ml-1">
                        {cart.vendor?.category ?? 'vendor'}
                      </span>
                    </div>

                    {/* Items */}
                    <div className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const product = item.product;
                        const price = product?.discount_price ?? product?.price ?? 0;
                        const hasDiscount =
                          product?.discount_price !== null &&
                          product?.discount_price !== undefined &&
                          product.discount_price < product.price;
                        return (
                          <div key={item.id} className="p-4 flex items-center gap-4">
                            {/* Image */}
                            <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                              {product?.image_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Store className="w-6 h-6 text-slate-300" />
                              )}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-slate-900 truncate">
                                {product?.name ?? 'Unknown Product'}
                              </h4>
                              {product?.unit && (
                                <p className="text-xs text-slate-500">per {product.unit}</p>
                              )}
                              <div className="flex items-baseline gap-2 mt-1">
                                <span className="font-medium text-slate-900">
                                  ${price.toFixed(2)}
                                </span>
                                {hasDiscount && product && (
                                  <span className="text-xs text-slate-400 line-through">
                                    ${product.price.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(cart.id, item.id, item.product_id, item.quantity, -1)
                                }
                                disabled={updatingId === item.id}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
                              >
                                <Minus className="w-4 h-4 text-slate-600" />
                              </button>
                              <span className="w-8 text-center font-medium text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(cart.id, item.id, item.product_id, item.quantity, 1)
                                }
                                disabled={updatingId === item.id}
                                className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-50"
                              >
                                <Plus className="w-4 h-4 text-slate-600" />
                              </button>
                            </div>

                            {/* Subtotal */}
                            <div className="text-right w-20">
                              <p className="font-semibold text-slate-900">
                                ${(price * item.quantity).toFixed(2)}
                              </p>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeItem(item.id)}
                              disabled={updatingId === item.id}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                            >
                              {updatingId === item.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Checkout sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20 animate-fade-in">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Checkout</h3>

                {/* Delivery address */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <span className="inline-flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        Delivery Address
                      </span>
                    </label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={3}
                      placeholder="Enter your full delivery address..."
                      className="input"
                    />
                  </div>

                  {/* Payment method */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Payment Method
                    </label>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((method) => {
                        const Icon = method.icon;
                        const active = paymentMethod === method.key;
                        return (
                          <button
                            key={method.key}
                            type="button"
                            onClick={() => setPaymentMethod(method.key)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left ${
                              active
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{method.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer notes */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Order Notes (optional)
                    </label>
                    <textarea
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      rows={2}
                      placeholder="Any special instructions..."
                      className="input"
                    />
                  </div>

                  {/* Summary */}
                  <div className="border-t border-slate-100 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Subtotal</span>
                      <span className="font-medium text-slate-900">
                        ${subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Delivery Fee</span>
                      <span className="font-medium text-slate-900">
                        ${DELIVERY_FEE.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <span className="font-semibold text-slate-900">Total</span>
                      <span className="text-xl font-bold text-slate-900">
                        ${total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Place order */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder || !deliveryAddress.trim()}
                    className="btn-primary w-full inline-flex items-center justify-center gap-2"
                  >
                    {placingOrder ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    {placingOrder ? 'Placing Order...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

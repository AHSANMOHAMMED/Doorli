import { supabase } from './supabase';
import { apiClient } from './axios';
import type { VendorCategory } from '@doorli/types';

export const DEFAULT_LOCATION = { lat: 6.9271, lng: 79.8612 };

export interface Vendor {
  id: string;
  businessName: string;
  category: VendorCategory;
  description?: string | null;
  addressLine?: string | null;
  city?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  isOpen: boolean;
  isVerified: boolean;
  avgRating: number;
  totalReviews: number;
  minOrderAmount?: number | null;
  deliveryRadiusKm?: number;
  distanceKm?: number;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description?: string | null;
  price: number;
  discountPrice?: number | null;
  unit?: string | null;
  stockQuantity: number;
  imageUrl?: string | null;
  category?: string | null;
  isAvailable: boolean;
}

export interface VendorDetail extends Vendor {
  products: Product[];
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryAddressId?: string | null;
  deliveryAddress?: { addressLine: string } | null;
  specialInstructions?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  vendor?: { id: string; businessName: string; phone?: string | null };
  items?: Array<{
    id: string;
    product: {
      name: string;
      imageUrl?: string | null;
    };
    unitPrice: number;
    quantity: number;
    totalPrice: number;
  }>;
}

export interface Booking {
  id: string;
  booking_number: string;
  booking_type: string;
  service_name: string;
  booking_date: string;
  start_time: string;
  end_time?: string | null;
  party_size: number;
  total_amount: number;
  status: string;
  special_requests?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
  created_at: string;
  vendor?: { id: string; business_name: string };
}

export interface ServiceRequest {
  id: string;
  request_number: string;
  service_type: string;
  title: string;
  description: string;
  address: string;
  city?: string | null;
  preferred_date?: string | null;
  preferred_time?: string | null;
  urgency: string;
  estimated_cost?: number | null;
  final_cost?: number | null;
  status: string;
  created_at: string;
  vendor?: { id: string; business_name: string };
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  vendor_id?: string | null;
}

export interface Profile {
  id: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  avatar_url?: string | null;
  is_verified: boolean;
}

export function formatPrice(amount: number): string {
  return `LKR ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- Vendor queries ---

export async function fetchVendors(category?: VendorCategory | 'all') {
  let url = '/vendors';
  if (category && category !== 'all') {
    url += `?category=${category}`;
  }
  const res = await apiClient.get(url);
  return res.data?.data?.items ?? [];
}

export async function fetchVendor(id: string): Promise<VendorDetail> {
  const res = await apiClient.get(`/vendors/${id}`);
  if (!res.data?.success) {
    throw new Error('Vendor not found');
  }
  const vendor = res.data.data;
  return vendor as VendorDetail;
}

export async function fetchVendorReviews(vendorId: string) {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, vendor_id, user_id')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Review[];
}

// --- Cart operations ---

export async function getOrCreateCart(vendorId: string): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: existing } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .eq('vendor_id', vendorId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: newCart, error } = await supabase
    .from('carts')
    .insert({ user_id: user.id, vendor_id: vendorId })
    .select('id')
    .single();
  if (error) throw error;
  return newCart.id;
}

export async function addToCart(vendorId: string, productId: string, quantity: number = 1) {
  const cartId = await getOrCreateCart(vendorId);

  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + quantity })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, product_id: productId, quantity });
    if (error) throw error;
  }
}

export async function fetchCart() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('carts')
    .select('id, vendor_id, vendor:vendors(id, business_name, delivery_radius_km), cart_items(id, product_id, quantity, product:products(*))')
    .eq('user_id', user.id);
  if (error) throw error;
  return data ?? [];
}

export async function updateCartItemQuantity(itemId: string, quantity: number) {
  if (quantity <= 0) {
    const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
    if (error) throw error;
  }
}

export async function clearCart(cartId: string) {
  const { error: itemsError } = await supabase.from('cart_items').delete().eq('cart_id', cartId);
  if (itemsError) throw itemsError;
  const { error } = await supabase.from('carts').delete().eq('id', cartId);
  if (error) throw error;
}

// --- Order operations ---

export async function createOrder(params: {
  vendorId: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number; image_url?: string | null }>;
  deliveryAddress: string;
  paymentMethod?: string;
  notes?: string;
  deliveryFee?: number;
}) {
  const { vendorId, items, deliveryAddress, paymentMethod, notes } = params;

  // Clear local cart for this vendor immediately, even before the network request
  // (Assuming caller does it or we rely on the state here, but `useCartStore.getState().clearVendor` is better done in UI)
  
  const res = await apiClient.post('/orders', {
    vendorId,
    deliveryAddress,
    paymentMethod: paymentMethod ?? 'cod',
    specialInstructions: notes,
    items: items.map(i => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.price,
    })),
  });

  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to create order');
  }

  const order = res.data.data as Order & { totalAmount: number };

  // Initiate payment (COD stays pending; card returns Stripe clientSecret / PayHere checkout)
  const method = (paymentMethod ?? 'cod') as 'cod' | 'card' | 'wallet';
  const gateway = method === 'cod' ? 'manual' : method === 'card' ? 'stripe' : 'manual';
  try {
    const payRes = await apiClient.post('/payments/initiate', {
      referenceId: order.id,
      referenceType: 'order',
      amount: Number(order.totalAmount),
      method,
      gateway,
    });
    if (payRes.data?.success) {
      return { ...order, payment: payRes.data.data };
    }
  } catch {
    // Order created; payment can be retried from order screen
  }

  return order;
}

export async function initiatePayment(params: {
  referenceId: string;
  referenceType: 'order' | 'booking';
  amount: number;
  method: 'cod' | 'card' | 'wallet';
  gateway: 'stripe' | 'payhere' | 'manual';
}) {
  const res = await apiClient.post('/payments/initiate', params);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to initiate payment');
  }
  return res.data.data;
}

export async function confirmPaymentDev(paymentId: string) {
  const res = await apiClient.post(`/payments/${paymentId}/confirm-dev`);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to confirm payment');
  }
  return res.data.data;
}

export async function collectCodPayment(paymentId: string) {
  const res = await apiClient.post(`/payments/${paymentId}/collect-cod`);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to collect COD');
  }
  return res.data.data;
}

export async function fetchMyOrders() {
  const res = await apiClient.get('/orders/my');
  if (!res.data?.success) {
    throw new Error('Failed to fetch orders');
  }
  return res.data.data.items;
}

export async function fetchOrder(id: string) {
  const res = await apiClient.get(`/orders/${id}`);
  if (!res.data?.success) {
    throw new Error('Failed to fetch order');
  }
  return res.data.data;
}

export async function cancelOrder(id: string) {
  const res = await apiClient.patch(`/orders/${id}/status`, { status: 'cancelled' });
  if (!res.data?.success) {
    throw new Error('Failed to cancel order');
  }
  return res.data.data;
}

// --- Booking operations ---

export async function createBooking(params: {
  vendorId: string;
  bookingType: string;
  serviceName: string;
  bookingDate: string;
  startTime: string;
  endTime?: string | null;
  partySize: number;
  totalAmount: number;
  specialRequests?: string;
  contactName: string;
  contactPhone: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.from('bookings').insert({
    user_id: user.id,
    vendor_id: params.vendorId,
    booking_type: params.bookingType,
    service_name: params.serviceName,
    booking_date: params.bookingDate,
    start_time: params.startTime,
    end_time: params.endTime ?? null,
    party_size: params.partySize,
    total_amount: params.totalAmount,
    status: 'pending',
    special_requests: params.specialRequests ?? null,
    contact_name: params.contactName,
    contact_phone: params.contactPhone,
    payment_status: 'pending',
  }).select('id, booking_number').single();
  if (error) throw error;
  return data;
}

export async function fetchMyBookings() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select('*, vendor:vendors(id, business_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

// --- Service request operations ---

export async function createServiceRequest(params: {
  vendorId: string;
  serviceType: string;
  title: string;
  description: string;
  address: string;
  city?: string;
  preferredDate?: string;
  preferredTime?: string;
  urgency: string;
  contactName: string;
  contactPhone: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.from('service_requests').insert({
    user_id: user.id,
    vendor_id: params.vendorId,
    service_type: params.serviceType,
    title: params.title,
    description: params.description,
    address: params.address,
    city: params.city ?? null,
    preferred_date: params.preferredDate ?? null,
    preferred_time: params.preferredTime ?? null,
    urgency: params.urgency,
    status: 'pending',
    contact_name: params.contactName,
    contact_phone: params.contactPhone,
    payment_status: 'pending',
  }).select('id, request_number').single();
  if (error) throw error;
  return data;
}

export async function fetchMyServiceRequests() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('service_requests')
    .select('*, vendor:vendors(id, business_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ServiceRequest[];
}

// --- Review operations ---

export async function createReview(params: {
  vendorId: string;
  rating: number;
  comment?: string;
  orderId?: string;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.from('reviews').insert({
    user_id: user.id,
    vendor_id: params.vendorId,
    order_id: params.orderId ?? null,
    rating: params.rating,
    comment: params.comment ?? null,
  }).select('id').single();
  if (error) throw error;
  return data;
}

// --- Profile operations ---

export async function fetchProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(updates: { full_name?: string; phone?: string; avatar_url?: string }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- Vendor order management ---

export async function fetchVendorOrders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!vendor) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(id, name, price, quantity, image_url)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- Vendor bookings management ---

export async function fetchVendorBookings() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!vendor) return [];

  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Booking[];
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- Vendor service requests management ---

export async function fetchVendorServiceRequests() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!vendor) return [];

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as ServiceRequest[];
}

export async function updateServiceRequestStatus(requestId: string, status: string) {
  const { data, error } = await supabase
    .from('service_requests')
    .update({ status })
    .eq('id', requestId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// --- Driver operations ---

export async function fetchDriverDeliveries() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('deliveries')
    .select('*, orders(id, order_number, total_amount, delivery_address, vendor:vendors(business_name))')
    .eq('driver_id', user.id)
    .order('assigned_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateDeliveryStatus(deliveryId: string, status: string) {
  const { data, error } = await supabase
    .from('deliveries')
    .update({ status })
    .eq('id', deliveryId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

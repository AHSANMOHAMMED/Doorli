import { supabase } from './supabase';
import type { VendorCategory } from '@doorli/types';

export const DEFAULT_LOCATION = { lat: 6.9271, lng: 79.8612 };

export interface Vendor {
  id: string;
  business_name: string;
  category: VendorCategory;
  description?: string | null;
  address_line?: string | null;
  city?: string | null;
  logo_url?: string | null;
  banner_url?: string | null;
  is_open: boolean;
  is_verified: boolean;
  avg_rating: number;
  total_reviews: number;
  min_order_amount?: number | null;
  delivery_radius_km?: number;
  distance_km?: number;
}

export interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description?: string | null;
  price: number;
  discount_price?: number | null;
  unit?: string | null;
  stock_quantity: number;
  image_url?: string | null;
  category?: string | null;
  is_available: boolean;
}

export interface VendorDetail extends Vendor {
  products: Product[];
}

export interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  delivery_fee: number;
  total_amount: number;
  delivery_address?: string | null;
  customer_notes?: string | null;
  created_at: string;
  delivered_at?: string | null;
  vendor?: { id: string; business_name: string; phone?: string | null };
  order_items?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string | null;
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
  let query = supabase.from('vendors').select('*').order('avg_rating', { ascending: false });
  if (category && category !== 'all') {
    query = query.eq('category', category);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Vendor[];
}

export async function fetchVendor(id: string): Promise<VendorDetail> {
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (vendorError) throw vendorError;
  if (!vendor) throw new Error('Vendor not found');

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('*')
    .eq('vendor_id', id)
    .eq('is_available', true)
    .order('name');
  if (productsError) throw productsError;

  return { ...(vendor as Vendor), products: products as Product[] };
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const subtotal = params.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const deliveryFee = params.deliveryFee ?? 30;
  const totalAmount = subtotal + deliveryFee;

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      vendor_id: params.vendorId,
      status: 'pending',
      payment_method: params.paymentMethod ?? 'cod',
      payment_status: 'pending',
      delivery_type: 'delivery',
      subtotal,
      delivery_fee: deliveryFee,
      total_amount: totalAmount,
      delivery_address: params.deliveryAddress,
      customer_notes: params.notes ?? null,
    })
    .select('id, order_number')
    .single();
  if (orderError) throw orderError;

  const orderItems = params.items.map((item) => ({
    order_id: order.id,
    product_id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image_url: item.image_url ?? null,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  // Clear the cart for this vendor
  const { data: cart } = await supabase
    .from('carts')
    .select('id')
    .eq('user_id', user.id)
    .eq('vendor_id', params.vendorId)
    .maybeSingle();
  if (cart) await clearCart(cart.id);

  return order;
}

export async function fetchMyOrders() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*, vendor:vendors(id, business_name, phone), order_items(id, name, price, quantity, image_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as Order[];
}

export async function fetchOrder(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, vendor:vendors(id, business_name, phone), order_items(id, name, price, quantity, image_url)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as Order | null;
}

export async function cancelOrder(id: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
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

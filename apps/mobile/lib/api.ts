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
  customerId?: string;
  deliveryAddressId?: string | null;
  deliveryAddress?: { addressLine: string; latitude?: number | null; longitude?: number | null } | null;
  specialInstructions?: string | null;
  createdAt: string;
  updatedAt?: string | null;
  vendor?: {
    id: string;
    businessName: string;
    phone?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
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
  bookingNumber: string;
  bookingType: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  vendor?: { id: string; businessName: string };
}

export interface ServiceRequest {
  id: string;
  serviceType: string;
  title: string;
  description?: string | null;
  addressLine?: string | null;
  status: string;
  createdAt: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  vendorId?: string | null;
}

export interface Profile {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  role: string;
  profilePhotoUrl?: string | null;
  isVerified: boolean;
}

export function formatPrice(amount: number): string {
  return `LKR ${Number(amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function fetchVendors(category?: VendorCategory | 'all') {
  let url = '/vendors';
  if (category && category !== 'all') {
    url += `?category=${category}`;
  }
  const res = await apiClient.get(url);
  return (res.data?.data?.items ?? []) as Vendor[];
}

export async function fetchNearbyVendors(opts?: {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: VendorCategory | 'all';
}) {
  const lat = opts?.lat ?? DEFAULT_LOCATION.lat;
  const lng = opts?.lng ?? DEFAULT_LOCATION.lng;
  const radius = opts?.radius ?? 10;
  const params = new URLSearchParams({
    lat: String(lat),
    lng: String(lng),
    radius: String(radius),
  });
  if (opts?.category && opts.category !== 'all') {
    params.set('category', opts.category);
  }
  const res = await apiClient.get(`/vendors/nearby?${params.toString()}`);
  return (res.data?.data?.items ?? []) as Vendor[];
}

export async function fetchVendor(id: string): Promise<VendorDetail> {
  const res = await apiClient.get(`/vendors/${id}`);
  if (!res.data?.success) {
    throw new Error('Vendor not found');
  }
  return res.data.data as VendorDetail;
}

export async function fetchVendorReviews(vendorId: string) {
  const res = await apiClient.get(`/reviews/vendor/${vendorId}`);
  return (res.data?.data?.items ?? res.data?.data ?? []) as Review[];
}

export async function createOrder(params: {
  vendorId: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number; image_url?: string | null }>;
  deliveryAddress: string;
  paymentMethod?: string;
  notes?: string;
  deliveryFee?: number;
  deliveryAddressId?: string;
}) {
  const { vendorId, items, deliveryAddress, paymentMethod, notes, deliveryAddressId } = params;

  const res = await apiClient.post('/orders', {
    vendorId,
    deliveryAddress,
    deliveryAddressId,
    paymentMethod: paymentMethod ?? 'cod',
    specialInstructions: notes,
    items: items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: i.price,
    })),
  });

  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to create order');
  }

  const order = res.data.data as Order & { totalAmount: number };

  const method = (paymentMethod ?? 'cod') as 'cod' | 'card';
  const gateway = method === 'cod' ? 'manual' : 'stripe';
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
    // Order created; payment can be retried
  }

  return order;
}

export async function initiatePayment(params: {
  referenceId: string;
  referenceType: 'order' | 'booking';
  amount: number;
  method: 'cod' | 'card';
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
  return res.data.data.items as Order[];
}

export async function fetchOrder(id: string) {
  const res = await apiClient.get(`/orders/${id}`);
  if (!res.data?.success) {
    throw new Error('Failed to fetch order');
  }
  return res.data.data as Order;
}

export async function cancelOrder(id: string) {
  const res = await apiClient.post(`/orders/${id}/cancel`);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to cancel order');
  }
  return res.data.data;
}

export async function createBooking(params: {
  vendorId: string;
  bookingType: 'hotel' | 'hall' | 'beauty' | 'service' | string;
  checkInDate?: string;
  checkOutDate?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  guestCount?: number;
  totalAmount: number;
  depositAmount?: number;
  requirements?: string;
  /** @deprecated mapped to requirements */
  specialRequests?: string;
  /** @deprecated mapped into requirements */
  serviceName?: string;
  /** @deprecated use eventDate / checkInDate */
  bookingDate?: string;
  /** @deprecated use guestCount */
  partySize?: number;
}) {
  const bookingTypeMap: Record<string, 'hotel' | 'hall' | 'beauty' | 'service'> = {
    hotel: 'hotel',
    hotel_room: 'hotel',
    hall: 'hall',
    hall_booking: 'hall',
    beauty: 'beauty',
    beauty_appointment: 'beauty',
    service: 'service',
    restaurant_table: 'service',
  };
  const bookingType = bookingTypeMap[params.bookingType] ?? 'service';
  const eventDate = params.eventDate ?? params.bookingDate;
  const requirements = [params.requirements, params.specialRequests, params.serviceName]
    .filter(Boolean)
    .join(' | ') || undefined;

  const body = {
    vendorId: params.vendorId,
    bookingType,
    checkInDate: params.checkInDate ?? (bookingType === 'hotel' ? eventDate : undefined),
    checkOutDate: params.checkOutDate,
    eventDate: bookingType !== 'hotel' ? eventDate : undefined,
    startTime: params.startTime,
    endTime: params.endTime,
    guestCount: params.guestCount ?? params.partySize,
    totalAmount: params.totalAmount,
    depositAmount: params.depositAmount,
    requirements,
  };

  const res = await apiClient.post('/bookings', body);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to create booking');
  }
  return res.data.data;
}

export async function fetchMyBookings() {
  const res = await apiClient.get('/bookings/my-bookings');
  if (!res.data?.success) return [];
  return (res.data.data ?? []) as Booking[];
}

export async function createServiceRequest(params: {
  serviceType: string;
  title: string;
  description?: string;
  addressLine?: string;
  /** @deprecated use addressLine */
  address?: string;
  latitude?: number;
  longitude?: number;
  isUrgent?: boolean;
  /** @deprecated mapped to isUrgent */
  urgency?: 'low' | 'medium' | 'high' | string;
  offeredRate?: number;
  scheduledAt?: string;
  preferredDate?: string;
  preferredTime?: string;
  vendorId?: string;
  city?: string;
  contactName?: string;
  contactPhone?: string;
}) {
  const addressLine = params.addressLine ?? params.address;
  if (!addressLine) throw new Error('Address is required');

  const isUrgent =
    params.isUrgent ?? (params.urgency === 'high' || params.urgency === 'urgent');

  const scheduledAt =
    params.scheduledAt ??
    (params.preferredDate
      ? `${params.preferredDate}${params.preferredTime ? `T${params.preferredTime}` : 'T09:00:00'}`
      : undefined);

  const descriptionParts = [
    params.description,
    params.city ? `City: ${params.city}` : null,
    params.contactName ? `Contact: ${params.contactName}` : null,
    params.contactPhone ? `Phone: ${params.contactPhone}` : null,
    params.vendorId ? `Preferred vendor: ${params.vendorId}` : null,
  ].filter(Boolean);

  const res = await apiClient.post('/service-requests', {
    serviceType: params.serviceType,
    title: params.title,
    description: descriptionParts.join('\n') || undefined,
    addressLine,
    latitude: params.latitude,
    longitude: params.longitude,
    isUrgent: Boolean(isUrgent),
    offeredRate: params.offeredRate,
    scheduledAt,
  });
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to create service request');
  }
  return res.data.data;
}

export async function fetchMyServiceRequests() {
  const res = await apiClient.get('/service-requests/my-jobs');
  if (!res.data?.success) return [];
  return (res.data.data ?? []) as ServiceRequest[];
}

export async function createReview(params: {
  vendorId: string;
  rating: number;
  comment?: string;
  orderId?: string;
}) {
  const res = await apiClient.post('/reviews', params);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to create review');
  }
  return res.data.data;
}

export async function fetchProfile(): Promise<Profile | null> {
  const res = await apiClient.get('/users/me');
  if (!res.data?.success) return null;
  return res.data.data as Profile;
}

export async function updateProfile(updates: {
  fullName?: string;
  email?: string;
  profilePhotoUrl?: string;
}) {
  const res = await apiClient.patch('/users/me', updates);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to update profile');
  }
  return res.data.data;
}

export async function fetchVendorOrders() {
  const res = await apiClient.get('/orders/vendor/mine');
  if (!res.data?.success) return [];
  return (res.data.data?.items ?? []) as Order[];
}

export async function updateOrderStatus(orderId: string, status: string) {
  const res = await apiClient.patch(`/orders/${orderId}/status`, { status });
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to update order status');
  }
  return res.data.data;
}

export async function fetchVendorBookings(vendorId: string) {
  const res = await apiClient.get(`/bookings/vendor/${vendorId}`);
  if (!res.data?.success) return [];
  return (res.data.data ?? []) as Booking[];
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const res = await apiClient.patch(`/bookings/${bookingId}/status`, { status });
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to update booking');
  }
  return res.data.data;
}

export async function fetchVendorServiceRequests(lat: number, lng: number) {
  const res = await apiClient.get(`/service-requests/nearby?lat=${lat}&lng=${lng}`);
  if (!res.data?.success) return [];
  return (res.data.data ?? []) as ServiceRequest[];
}

export async function updateServiceRequestStatus(
  requestId: string,
  action: 'accept' | 'start' | 'complete' | 'cancel',
) {
  const res = await apiClient.patch(`/service-requests/${requestId}/${action}`);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to update service request');
  }
  return res.data.data;
}

export async function fetchDriverJobs() {
  const res = await apiClient.get('/orders/driver');
  if (!res.data?.success) {
    return { available: [] as Order[], active: [] as Order[] };
  }
  return res.data.data as { available: Order[]; active: Order[] };
}

export async function acceptDelivery(orderId: string) {
  const res = await apiClient.patch(`/drivers/accept-delivery/${orderId}`);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to accept delivery');
  }
  return res.data.data;
}

export async function declineDelivery(orderId: string) {
  const res = await apiClient.patch(`/drivers/decline-delivery/${orderId}`);
  if (!res.data?.success) {
    throw new Error(res.data?.error || 'Failed to decline delivery');
  }
  return res.data.data;
}

/** @deprecated use fetchDriverJobs */
export async function fetchDriverDeliveries() {
  const jobs = await fetchDriverJobs();
  return [...jobs.active, ...jobs.available].map((order) => ({
    id: order.id,
    order_id: order.id,
    status: order.status === 'ready' && !('driverId' in order) ? 'assigned' : order.status,
    orders: {
      order_number: order.orderNumber,
      total_amount: order.totalAmount,
      delivery_address: order.deliveryAddress?.addressLine,
      vendor: { business_name: order.vendor?.businessName },
    },
  }));
}

/** @deprecated use updateOrderStatus */
export async function updateDeliveryStatus(orderId: string, status: string) {
  const mapped =
    status === 'in_transit' || status === 'picked_up'
      ? 'picked_up'
      : status === 'delivered'
        ? 'delivered'
        : status;
  return updateOrderStatus(orderId, mapped);
}

/* ─── Customer lifestyle APIs ─── */

export interface LoyaltyPoints {
  points: number;
  earned: number;
  redeemed: number;
}

export interface EventPackage {
  id: string;
  title: string;
  eventDate: string;
  guestCount?: number | null;
  totalEstimate?: number | null;
  status: string;
  items?: Array<{ role: string; label: string; estimatedCost?: number }>;
}

export interface DeliverySubscription {
  id: string;
  vendorId: string;
  frequency: string;
  deliveryAddress: string;
  nextDeliveryAt: string;
  isActive: boolean;
  items?: Array<{ productId: string; quantity: number; unitPrice: number }>;
}

export interface CityZone {
  id: string;
  name: string;
  city?: string | null;
  demandLevel?: number;
}

export interface RideEstimate {
  baseFare: number;
  distanceKm: number;
  totalFare: number;
}

export interface RideRequest {
  id: string;
  status: string;
  totalFare?: number;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  createdAt?: string;
  message?: string;
}

export interface SavedAddress {
  id: string;
  label: string;
  addressLine: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isDefault?: boolean;
}

export async function fetchLoyalty(): Promise<LoyaltyPoints> {
  const res = await apiClient.get('/loyalty/me');
  return (res.data?.data ?? { points: 0, earned: 0, redeemed: 0 }) as LoyaltyPoints;
}

export async function redeemLoyalty(points: number) {
  const res = await apiClient.post('/loyalty/redeem', { points });
  if (!res.data?.success) throw new Error(res.data?.error || 'Redeem failed');
  return res.data.data as { loyalty: LoyaltyPoints; promoCode: string };
}

export async function fetchMyEvents() {
  const res = await apiClient.get('/events/my');
  return (res.data?.data ?? []) as EventPackage[];
}

export async function createEvent(params: {
  title: string;
  eventDate: string;
  guestCount?: number;
  items?: Array<{ role: string; label: string; estimatedCost?: number }>;
}) {
  const res = await apiClient.post('/events', params);
  if (!res.data?.success) throw new Error(res.data?.error || 'Failed to create event');
  return res.data.data as EventPackage;
}

export async function fetchMySubscriptions() {
  const res = await apiClient.get('/subscriptions/my');
  return (res.data?.data ?? []) as DeliverySubscription[];
}

export async function createSubscription(params: {
  vendorId: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  deliveryAddress: string;
}) {
  const res = await apiClient.post('/subscriptions', params);
  if (!res.data?.success) throw new Error(res.data?.error || 'Failed to create subscription');
  return res.data.data as DeliverySubscription;
}

export async function cancelSubscription(id: string) {
  const res = await apiClient.patch(`/subscriptions/${id}/cancel`);
  if (!res.data?.success) throw new Error(res.data?.error || 'Cancel failed');
  return res.data.data;
}

export async function fetchCities() {
  const res = await apiClient.get('/cities');
  return (res.data?.data ?? []) as CityZone[];
}

export async function fetchCityVendors(city: string) {
  const res = await apiClient.get(`/cities/${encodeURIComponent(city)}/vendors`);
  return (res.data?.data ?? []) as Vendor[];
}

export async function estimateRide(params: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}) {
  const res = await apiClient.post('/rides/estimate', params);
  return (res.data?.data ?? { baseFare: 0, distanceKm: 0, totalFare: 0 }) as RideEstimate;
}

export async function createRide(params: {
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  pickupAddress?: string;
  dropoffAddress?: string;
}) {
  const res = await apiClient.post('/rides', params);
  if (!res.data?.success) throw new Error(res.data?.error || 'Failed to request ride');
  return res.data.data as RideRequest;
}

export async function fetchMyRides() {
  const res = await apiClient.get('/rides/my');
  return (res.data?.data ?? []) as RideRequest[];
}

export async function fetchAddresses() {
  const res = await apiClient.get('/users/addresses');
  return (res.data?.data ?? []) as SavedAddress[];
}

export async function createAddress(params: {
  label: string;
  addressLine: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}) {
  const res = await apiClient.post('/users/addresses', params);
  if (!res.data?.success) throw new Error(res.data?.error || 'Failed to save address');
  return res.data.data as SavedAddress;
}

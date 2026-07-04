import type { VendorCategory } from '@doorli/types';
import { useAuthStore } from '../store/auth';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export const DEFAULT_LOCATION = { lat: 6.9271, lng: 79.8612 };

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface Vendor {
  id: string;
  businessName: string;
  category: VendorCategory;
  description?: string | null;
  addressLine?: string | null;
  city?: string | null;
  isOpen: boolean;
  isVerified: boolean;
  avgRating: string | number;
  totalReviews: number;
  minOrderAmount?: string | number | null;
  deliveryRadiusKm?: number;
  distanceKm?: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: string | number;
  discountPrice?: string | number | null;
  unit?: string | null;
  stockQuantity?: number;
  imageUrl?: string | null;
  category?: string | null;
  isAvailable?: boolean;
}

export interface VendorDetail extends Vendor {
  products: Product[];
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = useAuthStore.getState().accessToken;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  return res.json();
}

export async function fetchNearbyVendors(category?: VendorCategory) {
  const params = new URLSearchParams({
    lat: String(DEFAULT_LOCATION.lat),
    lng: String(DEFAULT_LOCATION.lng),
    radius: '10',
  });
  if (category) params.set('category', category);
  return apiFetch<Vendor[]>(`/api/v1/vendors/nearby?${params}`);
}

export async function fetchVendors(category?: VendorCategory, page = 1) {
  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (category) params.set('category', category);
  return apiFetch<{ items: Vendor[]; total: number }>(`/api/v1/vendors?${params}`);
}

export async function fetchVendor(id: string) {
  return apiFetch<VendorDetail>(`/api/v1/vendors/${id}`);
}

export async function fetchHealth() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export function formatPrice(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `LKR ${num.toLocaleString('en-LK')}`;
}

export interface Address {
  id: string;
  label?: string | null;
  addressLine: string;
  city?: string | null;
  latitude?: string | number | null;
  longitude?: string | number | null;
  isDefault: boolean;
}

export interface OrderPreview {
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  totalAmount: number;
  orderType: 'delivery' | 'pickup';
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  orderType: string;
  subtotal: string | number;
  deliveryFee: string | number;
  totalAmount: string | number;
  estimatedDeliveryTime?: number | null;
  createdAt: string;
  vendor: { id: string; businessName: string; phone?: string | null };
  deliveryAddress?: {
    addressLine: string;
    city?: string | null;
    latitude?: string | number | null;
    longitude?: string | number | null;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: string | number;
    totalPrice: string | number;
    product: { id: string; name: string; imageUrl?: string | null; unit?: string | null };
  }>;
}

export async function fetchAddresses() {
  return apiFetch<Address[]>('/api/v1/users/addresses');
}

export async function previewOrder(body: {
  vendorId: string;
  items: { productId: string; quantity: number }[];
  orderType: 'delivery' | 'pickup';
  latitude?: number;
  longitude?: number;
}) {
  return apiFetch<OrderPreview>('/api/v1/orders/preview', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function createOrder(body: {
  vendorId: string;
  items: { productId: string; quantity: number }[];
  orderType: 'delivery' | 'pickup';
  paymentMethod?: 'cod';
  deliveryAddressId?: string;
  newAddress?: {
    addressLine: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    label?: string;
    isDefault?: boolean;
  };
  specialInstructions?: string;
}) {
  return apiFetch<Order>('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchMyOrders() {
  return apiFetch<Order[]>('/api/v1/orders/my');
}

export async function fetchOrder(id: string) {
  return apiFetch<Order>(`/api/v1/orders/${id}`);
}

export async function cancelOrder(id: string) {
  return apiFetch<Order>(`/api/v1/orders/${id}/cancel`, { method: 'POST' });
}

export async function fetchVendorOrders() {
  return apiFetch<Order[]>('/api/v1/orders/vendor');
}

export async function updateOrderStatus(id: string, status: string) {
  return apiFetch<Order>(`/api/v1/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export interface DriverProfile {
  id: string;
  userId: string;
  vehicleType: string;
  isOnline: boolean;
  currentLatitude?: string | number | null;
  currentLongitude?: string | number | null;
  earningsToday: string | number;
  totalDeliveries: number;
  user: { id: string; fullName: string; phone: string };
}

export interface JobOffer {
  orderId: string;
  orderNumber: string;
  vendorName: string;
  pickupLat: number | null;
  pickupLng: number | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  dropoffAddress: string | null;
  deliveryFee: number;
  expiresInSec: number;
}

export interface DriverOrdersResponse {
  available: Order[];
  active: Order[];
}

export interface OrderTrack {
  id: string;
  orderNumber: string;
  status: string;
  estimatedDeliveryTime?: number | null;
  driver?: {
    id: string;
    fullName: string;
    latitude: number | null;
    longitude: number | null;
    lastLocationUpdate?: string | null;
  } | null;
}

export interface DriverLocationUpdate {
  driverId: string;
  orderId: string;
  lat: number;
  lng: number;
}

export async function fetchDriverProfile() {
  return apiFetch<DriverProfile>('/api/v1/drivers/me');
}

export async function toggleDriverOnline(isOnline: boolean) {
  return apiFetch<DriverProfile>('/api/v1/drivers/me/online', {
    method: 'PATCH',
    body: JSON.stringify({ isOnline }),
  });
}

export async function updateDriverLocation(latitude: number, longitude: number) {
  return apiFetch<DriverProfile>('/api/v1/drivers/me/location', {
    method: 'PATCH',
    body: JSON.stringify({ latitude, longitude }),
  });
}

export async function fetchDriverEarnings() {
  return apiFetch<{ earningsToday: number; totalDeliveries: number; avgRating: number }>(
    '/api/v1/drivers/me/earnings',
  );
}

export async function fetchDriverOrders() {
  return apiFetch<DriverOrdersResponse>('/api/v1/orders/driver');
}

export async function acceptOrderJob(orderId: string) {
  return apiFetch<Order>(`/api/v1/orders/${orderId}/accept`, { method: 'POST' });
}

export async function declineOrderJob(orderId: string) {
  return apiFetch<{ message: string }>(`/api/v1/orders/${orderId}/decline`, { method: 'POST' });
}

export async function fetchOrderTrack(id: string) {
  return apiFetch<OrderTrack>(`/api/v1/orders/${id}/track`);
}

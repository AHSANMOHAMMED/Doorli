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

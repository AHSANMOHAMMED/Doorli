function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:4000'
  );
}

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('doorli_token') || localStorage.getItem('doorli_vendor_token');
}

export function setToken(token: string) {
  localStorage.setItem('doorli_token', token);
  localStorage.setItem('doorli_vendor_token', token);
}

export function clearToken() {
  localStorage.removeItem('doorli_token');
  localStorage.removeItem('doorli_vendor_token');
  localStorage.removeItem('doorli_refresh');
  localStorage.removeItem('doorli_user');
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = path.startsWith('/api') ? `${getApiBase()}${path}` : `${getApiBase()}/api/v1${path}`;
  const res = await fetch(url, { ...options, headers });
  return res.json();
}

export async function sendOtp(phone: string) {
  return apiFetch<{ message: string; code?: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, code: string) {
  return apiFetch<{
    accessToken: string;
    refreshToken?: string;
    user: { id: string; phone: string | null; role: string; fullName: string };
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code, role: 'vendor', fullName: 'Vendor' }),
  });
}

export async function loginVendorPassword(input: {
  identifier: string;
  password: string;
  businessKey: string;
}) {
  return apiFetch<{
    accessToken: string;
    refreshToken?: string;
    user: {
      id: string;
      phone: string | null;
      email?: string | null;
      username?: string | null;
      role: string;
      fullName: string;
    };
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      identifier: input.identifier,
      password: input.password,
      businessKey: input.businessKey,
      expectedRole: 'vendor',
    }),
  });
}

export async function registerVendorAccount(input: {
  fullName: string;
  email: string;
  username?: string;
  password: string;
  businessName: string;
  category?: string;
  phone?: string;
}) {
  return apiFetch<{
    accessToken: string;
    refreshToken?: string;
    user: {
      id: string;
      phone: string | null;
      email?: string | null;
      username?: string | null;
      role: string;
      fullName: string;
    };
    vendor?: { id: string; businessName: string; category: string };
  }>('/auth/register-vendor', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getApiHealth() {
  try {
    const res = await fetch(`${getApiBase()}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

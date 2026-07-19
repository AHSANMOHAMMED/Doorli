const TOKEN_KEY = 'doorli_customer_token';

/** Browser: same-origin via nginx. Server: hit API directly. */
export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    return '';
  }
  return (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://127.0.0.1:4000'
  );
}

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearCustomerToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getCustomerToken();
  const res = await fetch(`${getApiBase()}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || `Request failed (${res.status})`);
  }
  return json.data as T;
}

export async function sendOtp(phone: string) {
  return apiFetch<{ message: string; code?: string }>('/auth/send-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function verifyOtp(phone: string, code: string) {
  const data = await apiFetch<{
    accessToken: string;
    user: {
      id: string;
      phone: string | null;
      email?: string | null;
      username?: string | null;
      role: string;
      fullName: string;
    };
  }>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
  setCustomerToken(data.accessToken);
  return data;
}

export async function loginWithPassword(identifier: string, password: string) {
  const data = await apiFetch<{
    accessToken: string;
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
      identifier,
      password,
      expectedRole: 'customer',
    }),
  });
  setCustomerToken(data.accessToken);
  return data;
}

export async function registerCustomer(input: {
  fullName: string;
  email: string;
  username?: string;
  password: string;
  phone?: string;
}) {
  const data = await apiFetch<{
    accessToken: string;
    user: {
      id: string;
      phone: string | null;
      email?: string | null;
      username?: string | null;
      role: string;
      fullName: string;
    };
  }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  setCustomerToken(data.accessToken);
  return data;
}

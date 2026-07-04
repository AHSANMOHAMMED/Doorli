const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export { API_URL };

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('doorli_token');
}

export function setToken(token: string) {
  localStorage.setItem('doorli_token', token);
}

export function clearToken() {
  localStorage.removeItem('doorli_token');
  localStorage.removeItem('doorli_refresh');
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

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  return res.json();
}

export async function getApiHealth() {
  try {
    const res = await fetch(`${API_URL}/health`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

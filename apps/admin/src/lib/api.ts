const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('doorli_admin_token') : null;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || json.message || 'Request failed');
  }
  return json.data;
}

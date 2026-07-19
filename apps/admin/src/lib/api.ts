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

export async function adminFetch(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('doorli_admin_token') : null;
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
  return json.data;
}

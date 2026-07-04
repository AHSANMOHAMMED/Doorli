const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function fetchHealth() {
  const res = await fetch(`${API_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export { API_URL };

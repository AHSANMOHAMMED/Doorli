import axios from 'axios';
import { Platform } from 'react-native';
import { useAuthStore } from '../store/auth';

/**
 * Prefer EXPO_PUBLIC_API_URL (e.g. http://140.245.207.93 for OCI).
 * Falls back to emulator/localhost for local API.
 */
function resolveApiRoot(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (Platform.OS === 'android') return 'http://10.0.2.2:4000';
  return 'http://localhost:4000';
}

export const API_ROOT = resolveApiRoot();
export const API_URL = `${API_ROOT}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 20000,
});

apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { refreshToken } = useAuthStore.getState();
        if (refreshToken) {
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data?.data) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            useAuthStore.getState().setTokens(accessToken, newRefreshToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return axios(originalRequest);
          }
        }
      } catch {
        useAuthStore.getState().signOut();
      }
    }
    return Promise.reject(error);
  },
);

import axios from 'axios';
import { Platform } from 'react-native';

let getAuthStore: any = null;
function getStore() {
  if (!getAuthStore) {
    getAuthStore = require('../store/auth').useAuthStore;
  }
  return getAuthStore;
}

/**
 * Prefer EXPO_PUBLIC_API_URL (e.g. http://140.245.207.93 for OCI).
 * Falls back to emulator/localhost for local API.
 */
function resolveApiRoot(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  
  if (fromEnv) {
    console.log(`[API] Using EXPO_PUBLIC_API_URL: ${fromEnv}`);
    return fromEnv;
  }
  
  const defaultUrl = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
  console.log(`[API] No EXPO_PUBLIC_API_URL set, defaulting to: ${defaultUrl}`);
  return defaultUrl;
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
    const store = getStore();
    const { accessToken } = store.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    console.log(`[API Req] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API Req Error]', error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Res] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      console.log(`[API] 401 Unauthorized for ${originalRequest?.url}. Attempting to refresh token...`);
    } else {
      console.error(`[API Res Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} - ${error.response?.status} : ${error.message}`);
    }
    
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const store = getStore();
        const { refreshToken } = store.getState();
        if (refreshToken) {
          console.log('[API] Attempting token refresh...');
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data?.data) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            store.getState().setTokens(accessToken, newRefreshToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            console.log('[API] Token refreshed successfully. Retrying original request.');
            return axios(originalRequest);
          }
        }
      } catch (refreshErr) {
        console.error('[API] Token refresh failed. Signing out.', refreshErr);
        getStore().getState().signOut();
      }
    }
    return Promise.reject(error);
  },
);

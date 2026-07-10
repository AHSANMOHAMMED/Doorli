import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { Platform } from 'react-native';

// For local testing, use your machine's IP or localhost
// Android emulator uses 10.0.2.2 to access localhost
export const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000/api/v1' : 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the access token
apiClient.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s and token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (refreshToken) {
          // Attempt to refresh the token
          const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          if (res.data?.success && res.data?.data) {
            const { accessToken, refreshToken: newRefreshToken } = res.data.data;
            useAuthStore.getState().setTokens(accessToken, newRefreshToken);

            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }
            return axios(originalRequest);
          }
        }
      } catch (refreshError) {
        // If refresh fails, log the user out
        useAuthStore.getState().signOut();
      }
    }

    return Promise.reject(error);
  }
);

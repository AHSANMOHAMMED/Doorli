import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/axios';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  role: 'customer' | 'vendor' | 'driver' | 'admin';
  isVerified: boolean;
  avatar?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  sendOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtpAndLogin: (phone: string, code: string, fullName?: string, role?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      loading: true,

      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      setUser: (user) => {
        set({ user });
      },

      sendOtp: async (phone: string) => {
        try {
          const res = await apiClient.post('/auth/send-otp', { phone });
          if (res.data.success) {
            return { error: null };
          }
          return { error: res.data.error || 'Failed to send OTP' };
        } catch (err: any) {
          return { error: err.response?.data?.message || err.message };
        }
      },

      verifyOtpAndLogin: async (phone: string, code: string, fullName?: string, role?: string) => {
        try {
          const payload: any = { phone, code };
          if (fullName) payload.fullName = fullName;
          if (role) payload.role = role;

          const res = await apiClient.post('/auth/verify-otp', payload);
          if (res.data.success && res.data.data) {
            const { user, accessToken, refreshToken } = res.data.data;
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
            });
            return { error: null };
          }
          return { error: res.data.error || 'Invalid OTP' };
        } catch (err: any) {
          return { error: err.response?.data?.message || err.message };
        }
      },

      signOut: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await apiClient.post('/auth/logout', { refreshToken });
          } catch (e) {
            // ignore logout error if server is unreachable
          }
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      loadSession: async () => {
        set({ loading: true });
        const { accessToken } = get();
        if (accessToken) {
          try {
            const res = await apiClient.get('/users/me');
            if (res.data.success) {
              set({ user: res.data.data, isAuthenticated: true, loading: false });
              return;
            }
          } catch (e) {
            // Token might be expired, interceptor will try to refresh it
            // If it fails, interceptor logs out
            console.warn('Failed to load session profile', e);
          }
        }
        set({ loading: false });
      },
    }),
    {
      name: 'doorli-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/axios';
import { registerForPush } from '../lib/push';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string | null;
  email?: string | null;
  username?: string | null;
  role: 'customer' | 'vendor' | 'driver' | 'admin' | 'super_admin';
  isVerified: boolean;
  avatar?: string | null;
}

export function homeForRole(role?: string | null): string {
  if (role === 'vendor') return '/(vendor)/hub';
  if (role === 'driver') return '/(driver)/jobs';
  if (role === 'admin') return '/(admin)';
  if (role === 'super_admin') return '/(super-admin)';
  return '/(customer)';
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: AuthUser) => void;
  loginWithGoogle: (
    accessToken: string,
    refreshToken: string,
  ) => Promise<{ error: string | null }>;
  sendOtp: (phone: string) => Promise<{ error: string | null }>;
  verifyOtpAndLogin: (
    phone: string,
    code: string,
    fullName?: string,
    role?: string,
  ) => Promise<{ error: string | null }>;
  loginWithPassword: (
    identifier: string,
    password: string,
    expectedRole?: 'customer' | 'vendor' | 'driver' | 'admin' | 'super_admin',
    businessKey?: string,
  ) => Promise<{ error: string | null }>;
  registerCustomer: (input: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<{ error: string | null }>;
  registerVendor: (input: {
    fullName: string;
    email: string;
    password: string;
    businessName: string;
    category: string;
  }) => Promise<{ error: string | null }>;
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

      loginWithGoogle: async (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
        try {
          const res = await apiClient.get('/users/me');
          if (!res.data.success || !res.data.data) return { error: 'Unable to load Google profile' };
          set({ user: res.data.data, accessToken, refreshToken, isAuthenticated: true });
          void registerForPush().catch(() => undefined);
          return { error: null };
        } catch (err: any) {
          set({ accessToken: null, refreshToken: null, isAuthenticated: false });
          return { error: err.response?.data?.message || err.message };
        }
      },

      sendOtp: async (phone: string) => {
        try {
          const res = await apiClient.post('/auth/send-otp', { phone });
          if (res.data.success) return { error: null };
          return { error: res.data.error || 'Failed to send OTP' };
        } catch (err: any) {
          return { error: err.response?.data?.message || err.message };
        }
      },

      verifyOtpAndLogin: async (phone, code, fullName, role) => {
        try {
          const payload: Record<string, string> = { phone, code };
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
            void registerForPush().catch(() => undefined);
            return { error: null };
          }
          return { error: res.data.error || 'Invalid OTP' };
        } catch (err: any) {
          return { error: err.response?.data?.message || err.message };
        }
      },

      loginWithPassword: async (identifier, password, expectedRole, businessKey) => {
        try {
          const res = await apiClient.post('/auth/login', {
            identifier,
            email: identifier,
            password,
            ...(expectedRole ? { expectedRole } : {}),
            ...(expectedRole === 'vendor' && businessKey ? { businessKey } : {}),
          });
          const data = res.data.data ?? res.data;
          if (res.data.success && data?.user && data?.accessToken) {
            const { user, accessToken, refreshToken } = data;
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
            });
            void registerForPush().catch(() => undefined);
            return { error: null };
          }
          return { error: res.data.error || 'Login failed' };
        } catch (err: any) {
          return { error: err.response?.data?.error || err.response?.data?.message || err.message };
        }
      },

      registerCustomer: async (input) => {
        try {
          const res = await apiClient.post('/auth/register', input);
          const data = res.data.data ?? res.data;
          if ((res.data.success ?? true) && data?.user && data?.accessToken) {
            set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
            return { error: null };
          }
          return { error: res.data.error || 'Customer registration failed' };
        } catch (err: any) {
          return { error: err.response?.data?.error || err.response?.data?.message || err.message };
        }
      },

      registerVendor: async (input) => {
        try {
          const res = await apiClient.post('/auth/register-vendor', input);
          const data = res.data.data ?? res.data;
          if ((res.data.success ?? true) && data?.user && data?.accessToken) {
            set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, isAuthenticated: true });
            return { error: null };
          }
          return { error: res.data.error || 'Vendor registration failed' };
        } catch (err: any) {
          return { error: err.response?.data?.error || err.response?.data?.message || err.message };
        }
      },

      signOut: async () => {
        const { refreshToken } = get();
        if (refreshToken) {
          try {
            await apiClient.post('/auth/logout', { refreshToken });
          } catch {
            // ignore
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
              void registerForPush().catch(() => undefined);
              return;
            }
          } catch (e) {
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
    },
  ),
);

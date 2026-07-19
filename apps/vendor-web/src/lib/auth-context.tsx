'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  clearToken,
  getToken,
  loginVendorPassword,
  registerVendorAccount,
  sendOtp,
  setToken,
  verifyOtp,
} from '@/lib/api';
import type { Profile, UserRole } from '@/lib/types';

interface DoorliUser {
  id: string;
  phone: string | null;
  email?: string | null;
  username?: string | null;
  role: string;
  fullName: string;
}

interface AuthContextValue {
  user: DoorliUser | null;
  session: { accessToken: string } | null;
  profile: Profile | null;
  loading: boolean;
  signInWithOtp: (phone: string, code: string) => Promise<{ error: string | null }>;
  requestOtp: (phone: string) => Promise<{ error: string | null; code?: string }>;
  signIn: (
    identifier: string,
    password: string,
    businessKey: string,
  ) => Promise<{ error: string | null }>;
  signUp: (input: {
    fullName: string;
    email: string;
    username?: string;
    password: string;
    businessName: string;
    category?: string;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function applySession(
  u: DoorliUser,
  accessToken: string,
  setUser: (u: DoorliUser | null) => void,
  setSession: (s: { accessToken: string } | null) => void,
  setProfile: (p: Profile | null) => void,
) {
  setToken(accessToken);
  localStorage.setItem('doorli_user', JSON.stringify(u));
  setUser(u);
  setSession({ accessToken });
  setProfile({
    id: u.id,
    email: u.email || u.username || u.phone || '',
    full_name: u.fullName,
    role: u.role as UserRole,
  } as Profile);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DoorliUser | null>(null);
  const [session, setSession] = useState<{ accessToken: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    const raw = typeof window !== 'undefined' ? localStorage.getItem('doorli_user') : null;
    if (token && raw) {
      try {
        const u = JSON.parse(raw) as DoorliUser;
        setUser(u);
        setSession({ accessToken: token });
        setProfile({
          id: u.id,
          email: u.email || u.username || u.phone || '',
          full_name: u.fullName,
          role: u.role as UserRole,
        } as Profile);
      } catch {
        clearToken();
      }
    }
    setLoading(false);
  }, []);

  async function requestOtp(phone: string) {
    const res = await sendOtp(phone);
    if (!res.success) return { error: res.error || 'Failed to send OTP' };
    return { error: null, code: res.data?.code };
  }

  async function signInWithOtp(phone: string, code: string) {
    const res = await verifyOtp(phone, code);
    if (!res.success || !res.data?.accessToken) {
      return { error: res.error || 'Invalid OTP' };
    }
    const u = res.data.user;
    if (u.role !== 'vendor' && u.role !== 'admin') {
      return { error: 'Vendor account required' };
    }
    applySession(u, res.data.accessToken, setUser, setSession, setProfile);
    return { error: null };
  }

  async function signIn(identifier: string, password: string, businessKey: string) {
    const res = await loginVendorPassword({ identifier, password, businessKey });
    if (!res.success || !res.data?.accessToken) {
      return { error: res.error || 'Invalid credentials' };
    }
    const u = res.data.user;
    if (u.role !== 'vendor' && u.role !== 'admin') {
      return { error: 'Vendor account required' };
    }
    applySession(u, res.data.accessToken, setUser, setSession, setProfile);
    return { error: null };
  }

  async function signUp(input: {
    fullName: string;
    email: string;
    username?: string;
    password: string;
    businessName: string;
    category?: string;
  }) {
    const res = await registerVendorAccount(input);
    if (!res.success || !res.data?.accessToken) {
      return { error: res.error || 'Could not create vendor account' };
    }
    applySession(res.data.user, res.data.accessToken, setUser, setSession, setProfile);
    return { error: null };
  }

  async function signOut() {
    clearToken();
    localStorage.removeItem('doorli_user');
    setUser(null);
    setSession(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, session, profile, loading, signInWithOtp, requestOtp, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

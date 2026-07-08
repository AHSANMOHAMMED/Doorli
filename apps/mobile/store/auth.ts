import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  role: 'customer' | 'vendor' | 'driver' | 'admin';
  avatarUrl?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, role: AuthUser['role']) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  loadSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      loading: true,
      signIn: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return { error: error.message };

        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            set({
              user: {
                id: profile.id,
                fullName: profile.full_name,
                phone: profile.phone ?? '',
                email: profile.email ?? email,
                role: profile.role,
                avatarUrl: profile.avatar_url,
              },
              isAuthenticated: true,
              loading: false,
            });
          } else {
            console.warn('Profile fetch failed during sign in, using session metadata:', profileError);
            set({
              user: {
                id: data.user.id,
                fullName: data.user.user_metadata?.full_name || 'Test User',
                phone: '',
                email: data.user.email ?? email,
                role: data.user.user_metadata?.role || 'customer',
                avatarUrl: null,
              },
              isAuthenticated: true,
              loading: false,
            });
          }
        }
        return { error: null };
      },
      signUp: async (email, password, fullName, role) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role } },
        });
        if (error) return { error: error.message };

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email,
            full_name: fullName,
            role,
          });

          set({
            user: { id: data.user.id, fullName, phone: '', email, role, avatarUrl: null },
            isAuthenticated: true,
            loading: false,
          });
        }
        return { error: null };
      },
      signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null, isAuthenticated: false });
      },
      loadSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            set({
              user: {
                id: profile.id,
                fullName: profile.full_name,
                phone: profile.phone ?? '',
                email: profile.email ?? session.user.email ?? '',
                role: profile.role,
                avatarUrl: profile.avatar_url,
              },
              isAuthenticated: true,
              loading: false,
            });
            return;
          } else if (error) {
            // Fallback for development if 'profiles' table isn't created yet
            console.warn('Profile fetch failed, using session metadata:', error);
            set({
              user: {
                id: session.user.id,
                fullName: session.user.user_metadata?.full_name || 'Test User',
                phone: '',
                email: session.user.email ?? '',
                role: session.user.user_metadata?.role || 'customer',
                avatarUrl: null,
              },
              isAuthenticated: true,
              loading: false,
            });
            return;
          }
        }
        set({ user: null, isAuthenticated: false, loading: false });
      },
    }),
    {
      name: 'doorli-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
);

import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  role: 'customer' | 'vendor' | 'driver' | null;
  setRole: (role: 'customer' | 'vendor' | 'driver' | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  role: null,
  setRole: (role) => set({ role, isAuthenticated: role !== null }),
}));

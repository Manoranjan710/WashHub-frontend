'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
}

// The auth token is no longer kept here — it lives in an httpOnly cookie that
// JS can't read. We persist only the (non-secret) user profile so the UI can
// render immediately on reload; the cookie is the real source of auth.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'washhub-auth',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

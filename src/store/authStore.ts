import { create } from 'zustand';
import type { User } from '../types/user';
import { setAuthToken } from '../lib/axio';
import { decodeJwt, isExpired } from '../lib/authToken';

export type AuthState = {
  user: User | null;
  token: string | null;
  initializing?: boolean;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  init?: () => Promise<void>;
  logout: () => void;
};

// Read initial values synchronously to avoid a render/hydration race
let initialToken: string | null = null;
let initialUser: User | null = null;
try {
  const stored = localStorage.getItem('auth.token');
  const raw = localStorage.getItem('auth.user');
  if (raw) initialUser = JSON.parse(raw) as User;

  // Validate persisted token: must decode and not be expired. If invalid, remove it.
  if (stored) {
    // Accept tokens without exp (treat as non-expiring). Only remove if explicitly expired.
    if (isExpired(stored)) {
      try { localStorage.removeItem('auth.token'); localStorage.removeItem('auth.user'); } catch (_) {}
    } else {
      initialToken = stored;
    }
  }
} catch (_) { /* ignore */ }

// ensure axios has token header if available
try { if (initialToken) setAuthToken(initialToken); } catch (_) { /* ignore */ }

export const useAuthStore = create<AuthState>((set: (v: Partial<AuthState>) => void) => ({
  user: initialUser,
  token: initialToken,
  initializing: false,
  setUser: (u: User | null) => set({ user: u }),
  setToken: (t: string | null) => set({ token: t }),
  init: async () => {
    // If we already have a token, nothing to do
    if (useAuthStore.getState().token) return;
    set({ initializing: true });
    try {
      const { attemptRefresh } = await import('../lib/axio');
      const newTok = await attemptRefresh();
      if (newTok) {
        set({ token: newTok });
        try { localStorage.setItem('auth.token', newTok); } catch (_) {}
      }
    } catch (_) {
      // ignore
    } finally {
      set({ initializing: false });
    }
  },
  logout: () => {
    try { localStorage.removeItem('auth.token'); localStorage.removeItem('auth.user'); } catch (_) {}
    try { setAuthToken(null); } catch (_) {}
    set({ token: null, user: null });
  }
}));

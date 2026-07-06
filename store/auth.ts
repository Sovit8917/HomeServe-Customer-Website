import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

// Also mirror the token into a plain cookie (not httpOnly — we set it from
// client JS) so that middleware.ts (which runs on the edge and cannot read
// localStorage) can check for it on every request and gate the whole app.
function setAuthCookie(token: string) {
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}
function clearAuthCookie() {
  document.cookie = 'token=; path=/; max-age=0';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        setAuthCookie(token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        clearAuthCookie();
        set({ user: null, token: null });
      },
      updateUser: (updates) => set((s) => ({ user: s.user ? { ...s.user, ...updates } : null })),
    }),
    {
      name: 'auth-store',
      partialize: (s) => ({ user: s.user, token: s.token }),
      // Sessions created before the cookie mirror existed only have a token
      // in localStorage. Without this, the middleware (which only reads the
      // cookie) would keep bouncing an already-logged-in user back to
      // /login forever. Re-sync the cookie the moment persisted state loads.
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthCookie(state.token);
      },
    }
  )
);

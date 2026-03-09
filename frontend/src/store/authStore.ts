import { create } from 'zustand';
import { authService } from '../services/auth.service';
import type { StoredUser } from '../services/api';
import type { LoginRequest } from '../services/auth.service';

// ── Store shape ───────────────────────────────────────────────────────────────
interface AuthState {
  user: StoredUser | null;

  isAuthenticated: () => boolean;
  isAdmin: () => boolean;

  login: (req: LoginRequest) => Promise<StoredUser>;
  logout: () => void;
  syncFromStorage: () => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────
// No persist middleware — authService already writes token + user to localStorage.
// The store is initialised from localStorage on every page load via getStoredUser().
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: authService.getStoredUser(),

  isAuthenticated: () => get().user !== null,
  isAdmin: () => get().user?.role === 'admin',

  login: async (req: LoginRequest): Promise<StoredUser> => {
    const stored = await authService.login(req);
    set({ user: stored });
    return stored;
  },

  logout: () => {
    authService.logout();
    set({ user: null });
  },

  syncFromStorage: () => {
    set({ user: authService.getStoredUser() });
  },
}));

// Cross-tab sync: when another tab logs in/out, update this tab's store
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'bookstop_token' || e.key === 'bookstop_user') {
      useAuthStore.getState().syncFromStorage();
    }
  });
}

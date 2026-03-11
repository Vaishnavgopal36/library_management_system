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
}

// ── Store ─────────────────────────────────────────────────────────────────────
// No persist middleware — authService writes the non-sensitive user profile to
// localStorage (USER_KEY). The JWT lives exclusively in an HttpOnly cookie; it
// is never touched from JS. The store is hydrated from localStorage on every
// page load via getStoredUser().
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
}));


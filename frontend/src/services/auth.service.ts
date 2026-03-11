import { api, StoredUser, USER_KEY } from './api';

// ── Request/Response shapes ───────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
}

interface RawAuthResponse {
  /** Normalised role: "ADMIN" | "MEMBER" — uppercase from backend */
  role: string;
  /** UUID of the authenticated user — safe to store client-side */
  userId: string;
}

// ── Auth service ──────────────────────────────────────────────────────────────
export const authService = {
  /**
   * POST /auth/login
   * Returns the normalized StoredUser and persists token + user to localStorage.
   */
  async login(req: LoginRequest): Promise<StoredUser> {
    const raw = await api.post<RawAuthResponse>('/auth/login', req, false);

    // JWT is delivered as an HttpOnly cookie — it is never present in the response
    // body, so there is nothing to store in localStorage.
    const normalizedRole = raw.role.toLowerCase() as 'admin' | 'member';
    const user: StoredUser = { id: raw.userId, email: req.email, fullName: '', role: normalizedRole };

    // Fetch fullName from the user profile endpoint right after login
    if (raw.userId) {
      try {
        const profilePage = await api.get<{ content: Array<{ fullName: string }> }>(`/user?userId=${raw.userId}`);
        user.fullName = profilePage.content[0]?.fullName ?? '';
      } catch { /* ignore — profile fetch is best-effort */ }
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  /**
   * POST /auth/register
   * Registration is public (no JWT required).
   */
  async register(req: RegisterRequest): Promise<void> {
    await api.post<{ message: string }>('/auth/register', req, false);
  },

  logout(): void {
    // Tell the server to expire the HttpOnly jwt cookie (maxAge=0).
    // Fire-and-forget: local state is cleared regardless of network outcome.
    api.post('/auth/logout', {}, false).catch(() => { /* ignore */ });
    localStorage.removeItem(USER_KEY);
  },

  getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredUser; } catch { return null; }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(USER_KEY);
  },
};

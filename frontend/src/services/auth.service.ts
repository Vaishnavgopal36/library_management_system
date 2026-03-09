import { api, StoredUser, TOKEN_KEY, USER_KEY } from './api';

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
  token: string;
  type: string;
  role: string; // "ADMIN" | "MEMBER" — uppercase from backend
}

// ── Auth service ──────────────────────────────────────────────────────────────
export const authService = {
  /**
   * POST /auth/login
   * Returns the normalized StoredUser and persists token + user to localStorage.
   */
  async login(req: LoginRequest): Promise<StoredUser> {
    const raw = await api.post<RawAuthResponse>('/auth/login', req, false);

    localStorage.setItem(TOKEN_KEY, raw.token);

    // Decode userId from JWT payload (middle segment, base64)
    let userId = '';
    try {
      const payload = JSON.parse(atob(raw.token.split('.')[1]));
      userId = payload.userId ?? '';
    } catch { /* ignore decode failures */ }

    const normalizedRole = raw.role.toLowerCase() as 'admin' | 'member';

    const user: StoredUser = { id: userId, email: req.email, fullName: '', role: normalizedRole };

    // Fetch fullName from the user profile endpoint right after login
    if (userId) {
      try {
        const profilePage = await api.get<{ content: Array<{ fullName: string }> }>(`/user?userId=${userId}`);
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
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getStoredUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw) as StoredUser; } catch { return null; }
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};

/**
 * AuthContext — thin compatibility shim over the Zustand auth store.
 *
 * All components continue to call `useAuth()` from this file and get the same
 * {user, isAuthenticated, isAdmin, login, logout} shape. The actual state now
 * lives in Zustand (src/store/authStore.ts) so no React provider is required.
 */
import React from 'react';
import type { StoredUser } from '../services/api';
import type { LoginRequest } from '../services/auth.service';
import { useAuthStore } from '../store/authStore';

// ── Public type (unchanged) ───────────────────────────────────────────────────
export interface AuthContextValue {
  user: StoredUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (req: LoginRequest) => Promise<StoredUser>;
  logout: () => void;
}

/**
 * Drop-in replacement for the old context hook.
 * Reads from the Zustand store — no Provider needed.
 */
export function useAuth(): AuthContextValue {
  const store = useAuthStore();
  return {
    user:            store.user,
    isAuthenticated: store.isAuthenticated(),
    isAdmin:         store.isAdmin(),
    login:           store.login,
    logout:          store.logout,
  };
}

/**
 * @deprecated No longer needed — Zustand requires no Provider.
 * Kept for backward compatibility; renders children directly.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);

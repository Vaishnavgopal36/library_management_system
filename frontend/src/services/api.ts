/**
 * Base API client.
 * - Reads VITE_API_URL from environment.
 * - Sends the HttpOnly JWT cookie automatically via credentials:'include' on every request.
 * - Throws ApiError on non-2xx responses so callers can .catch() cleanly.
 * - Redirects to /login on 401 (expired / missing cookie session).
 */

export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1';

// User profile key — only non-sensitive metadata (name, role, userId), never the token.
export const USER_KEY  = 'bookstop_user';

// ── Stored auth user shape ────────────────────────────────────────────────────
export interface StoredUser {
  /** Backend UUID — never shown to the user directly */
  id: string;
  email: string;
  fullName: string;
  /** lowercase role as used by routing: 'admin' | 'member' */
  role: 'admin' | 'member';
}

// ── Typed error class ─────────────────────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ── Spring Page<T> wrapper (for paginated endpoints) ─────────────────────────
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;       // current page (0-indexed)
  size: number;
  first: boolean;
  last: boolean;
}

// ── Core request helper ──────────────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // credentials:'include' tells the browser to attach the HttpOnly JWT cookie
  // automatically on every request — no manual Bearer header needed.
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Only treat 401 as "session expired" on authenticated requests.
  // Public endpoints (auth = false, e.g. login) should surface the error normally.
  if (res.status === 401 && auth) {
    localStorage.removeItem(USER_KEY);
    window.location.href = '/login';
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  if (!res.ok) {
    let body: unknown;
    try { body = await res.json(); } catch { body = await res.text(); }
    // RFC 7807 ProblemDetail uses 'detail' (human sentence) and 'title' (short label).
    // Fall back to legacy 'error' / 'message' keys so non-ProblemDetail responses
    // are still handled gracefully during any transition period.
    const pd = body as Record<string, unknown>;
    const msg =
      (typeof pd?.detail  === 'string' && pd.detail)  ||
      (typeof pd?.title   === 'string' && pd.title)   ||
      (typeof pd?.error   === 'string' && pd.error)   ||
      (typeof pd?.message === 'string' && pd.message) ||
      `HTTP ${res.status}`;
    throw new ApiError(res.status, msg, body);
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return res.json() as Promise<T>;
}

// ── Public helpers ────────────────────────────────────────────────────────────
export const api = {
  get:    <T>(path: string, auth = true) =>
    request<T>(path, { method: 'GET' }, auth),

  post:   <T>(path: string, body: unknown, auth = true) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }, auth),

  put:    <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  patch:  <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined }),

  delete: <T = void>(path: string) =>
    request<T>(path, { method: 'DELETE' }),
};

// ── Query-string builder (skips undefined/null values) ───────────────────────
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') p.append(k, String(v));
  }
  const s = p.toString();
  return s ? `?${s}` : '';
}

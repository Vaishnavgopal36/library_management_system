package com.backend.backend.dto.response;

import lombok.Builder;
import lombok.Data;

/**
 * Login response — the JWT is now delivered exclusively via an HttpOnly cookie.
 * This body only carries non-sensitive session metadata the frontend needs to
 * bootstrap the UI (role for routing, userId for profile fetching).
 */
@Data
@Builder
public class AuthResponse {
    /** Normalised role string: "ADMIN" or "MEMBER" */
    private String role;
    /** UUID of the authenticated user (safe to expose — not a secret) */
    private String userId;
}

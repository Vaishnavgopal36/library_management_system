package com.backend.backend.controller;
import com.backend.backend.security.JwtUtil;
import com.backend.backend.dto.request.LoginRequest;
import com.backend.backend.dto.request.RegisterRequest;
import com.backend.backend.dto.response.AuthResponse;
import com.backend.backend.entity.User;
import com.backend.backend.service.AuthService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.security.authentication.event.AuthenticationFailureDisabledEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final JwtUtil jwtUtil;
    private final ApplicationEventPublisher eventPublisher;

    /** Matches jwt.expiration in application.yml (milliseconds). Used to sync cookie maxAge. */
    @Value("${jwt.expiration}")
    private long jwtExpirationMs;

    /**
     * Set to {@code true} in production (HTTPS). Keep {@code false} for localhost HTTP dev.
     * Override via env var: APP_COOKIE_SECURE=true
     */
    @Value("${app.cookie.secure:false}")
    private boolean cookieSecure;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.registerUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "User registered successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse httpResponse) {
        // Build a token stub used only as the event carrier — never passed to the security context
        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(request.getEmail(), null);
        try {
            User user = authService.authenticateUser(request);
            String normalizedRole = user.getRole().name().toUpperCase();
            String token = jwtUtil.generateToken(user.getEmail(), normalizedRole, user.getId().toString());

            // ── Deliver JWT as an HttpOnly cookie ───────────────────────────
            // The token is never exposed in the response body. The browser stores
            // it automatically and attaches it to every subsequent request.
            ResponseCookie jwtCookie = ResponseCookie.from("jwt", token)
                    .httpOnly(true)          // JS cannot read this cookie — XSS safe
                    .secure(cookieSecure)    // HTTPS only in production; false for localhost
                    .sameSite("Strict")      // Never sent on cross-site requests — CSRF safe
                    .path("/")
                    .maxAge(Duration.ofMillis(jwtExpirationMs))
                    .build();
            httpResponse.addHeader("Set-Cookie", jwtCookie.toString());

            // Publish success event so AuthenticationAuditListener can record it
            eventPublisher.publishEvent(new AuthenticationSuccessEvent(authToken));

            // Return only non-sensitive metadata — the token is in the cookie
            AuthResponse response = AuthResponse.builder()
                    .role(normalizedRole)
                    .userId(user.getId().toString())
                    .build();
            return ResponseEntity.ok(response);

        } catch (IllegalStateException e) {
            // Account deactivated
            eventPublisher.publishEvent(
                    new AuthenticationFailureDisabledEvent(authToken, new DisabledException(e.getMessage())));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            // Bad credentials or other input error
            eventPublisher.publishEvent(
                    new AuthenticationFailureBadCredentialsEvent(authToken, new BadCredentialsException(e.getMessage())));
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
        // Expire the jwt cookie immediately — the only way to clear an HttpOnly cookie.
        ResponseCookie clearCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Strict")
                .path("/")
                .maxAge(Duration.ZERO)
                .build();
        httpResponse.addHeader("Set-Cookie", clearCookie.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}

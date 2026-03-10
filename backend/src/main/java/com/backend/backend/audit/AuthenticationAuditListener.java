package com.backend.backend.audit;

import com.backend.backend.repository.AuthAuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.authentication.event.AbstractAuthenticationFailureEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Listens for Spring Security authentication events and persists an
 * {@link AuthAuditLog} record for every success and failure.
 *
 * <h3>Why a separate table?</h3>
 * Hibernate Envers only audits changes to JPA-managed data. Authentication
 * events happen before any entity is written, so they are invisible to Envers.
 * This component fills that gap.
 *
 * <h3>Transaction isolation</h3>
 * The event listener runs {@code @Async} so that a failure to persist the
 * audit log never rolls back or delays the actual authentication response.
 * The trade-off is that audit writes are best-effort; if the application
 * crashes between authentication and the async save, the record is lost.
 * For stricter guarantees, remove {@code @Async} and accept the latency cost.
 *
 * <h3>IP extraction</h3>
 * Spring Security publishes its events on the same thread as the incoming
 * HTTP request, so {@code RequestContextHolder} is still populated.  This
 * is always handled with a defensive try/catch so a missing request context
 * (e.g. programmatic in-memory authentication in tests) never breaks the flow.
 */
@Component
@RequiredArgsConstructor
public class AuthenticationAuditListener {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationAuditListener.class);
    private static final String NO_REQUEST = "[no-request]";
    private static final String UNKNOWN    = "[unknown]";

    private final AuthAuditLogRepository authAuditLogRepository;

    // ── Success ───────────────────────────────────────────────────────────────

    @Async
    @EventListener
    public void onAuthenticationSuccess(AuthenticationSuccessEvent event) {
        try {
            String email     = extractEmail(event.getAuthentication());
            String ipAddress = resolveIpAddress();

            AuthAuditLog record = AuthAuditLog.builder()
                    .attemptedEmail(email)
                    .ipAddress(ipAddress)
                    .status(AuthAuditLog.AuthStatus.SUCCESS)
                    .failureReason(null)
                    .build();

            authAuditLogRepository.save(record);
            log.debug("Auth audit – SUCCESS: email={} ip={}", email, ipAddress);
        } catch (Exception e) {
            // Never let audit logging propagate and disrupt the request
            log.warn("Failed to persist auth success audit record: {}", e.getMessage());
        }
    }

    // ── Failure ───────────────────────────────────────────────────────────────

    @Async
    @EventListener
    public void onAuthenticationFailure(AbstractAuthenticationFailureEvent event) {
        try {
            String email     = extractEmail(event.getAuthentication());
            String ipAddress = resolveIpAddress();
            String reason    = friendlyReason(event.getException());

            AuthAuditLog record = AuthAuditLog.builder()
                    .attemptedEmail(email)
                    .ipAddress(ipAddress)
                    .status(AuthAuditLog.AuthStatus.FAILED)
                    .failureReason(reason)
                    .build();

            authAuditLogRepository.save(record);
            log.debug("Auth audit – FAILED: email={} ip={} reason={}", email, ipAddress, reason);
        } catch (Exception e) {
            log.warn("Failed to persist auth failure audit record: {}", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Extracts the attempted e-mail / username from the authentication token.
     * Works for both successful logins (principal is {@link UserDetails}) and
     * failed ones (principal is often the raw String submitted by the client).
     */
    private String extractEmail(Authentication authentication) {
        if (authentication == null) {
            return UNKNOWN;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails ud) {
            return ud.getUsername();
        }
        if (principal != null) {
            return principal.toString();
        }
        // Fallback: try the name field that Spring sets from credentials
        String name = authentication.getName();
        return (name != null && !name.isBlank()) ? name : UNKNOWN;
    }

    /**
     * Resolves the client IP from the current {@link HttpServletRequest},
     * honouring standard reverse-proxy headers.
     * Returns a sentinel string when called outside of an HTTP request context.
     */
    private String resolveIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            return extractClientIp(attrs.getRequest());
        } catch (IllegalStateException e) {
            return NO_REQUEST;
        } catch (Exception e) {
            log.debug("Could not resolve IP for auth audit: {}", e.getMessage());
            return UNKNOWN;
        }
    }

    private String extractClientIp(HttpServletRequest request) {
        String[] headers = {
            "X-Forwarded-For",
            "Proxy-Client-IP",
            "WL-Proxy-Client-IP",
            "HTTP_CLIENT_IP",
            "HTTP_X_FORWARDED_FOR"
        };
        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isBlank() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }

    /**
     * Converts a Spring Security exception into a short, readable reason string.
     * Strips the "Exception" suffix to keep stored values concise.
     */
    private String friendlyReason(Exception exception) {
        if (exception == null) {
            return "Unknown failure";
        }
        String simpleName = exception.getClass().getSimpleName();
        // e.g. "BadCredentialsException" -> "BadCredentials"
        String stripped = simpleName.endsWith("Exception")
                ? simpleName.substring(0, simpleName.length() - "Exception".length())
                : simpleName;
        String message = exception.getMessage();
        if (message != null && !message.isBlank() && message.length() <= 200) {
            return stripped + ": " + message;
        }
        return stripped;
    }
}

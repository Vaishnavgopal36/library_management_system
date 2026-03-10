package com.backend.backend.audit;

import jakarta.servlet.http.HttpServletRequest;
import org.hibernate.envers.RevisionListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Envers {@link RevisionListener} that enriches every revision record with the
 * current principal's security context and the originating HTTP request's IP.
 *
 * <h3>Thread-safety</h3>
 * {@code newRevision()} is called once per transaction by Envers, always on
 * the thread that owns the Hibernate session.  Both {@code SecurityContextHolder}
 * and {@code RequestContextHolder} use {@code ThreadLocal} storage, so reads
 * here are inherently safe.
 *
 * <h3>Background / scheduled tasks</h3>
 * When there is no active {@link HttpServletRequest} (e.g. scheduled jobs,
 * async tasks) {@code RequestContextHolder} returns {@code null}.  Likewise the
 * {@code SecurityContext} may be empty.  All three fields fall back to
 * human-readable sentinel values so the audit trail is never silently blank.
 */
public class CustomRevisionListener implements RevisionListener {

    private static final Logger log = LoggerFactory.getLogger(CustomRevisionListener.class);

    private static final String SYSTEM_USER  = "[system]";
    private static final String NO_REQUEST   = "[no-request]";
    private static final String UNKNOWN      = "[unknown]";

    @Override
    public void newRevision(Object revisionEntity) {
        CustomRevisionEntity revision = (CustomRevisionEntity) revisionEntity;
        revision.setUsername(resolveUsername());
        revision.setEmail(resolveEmail());
        revision.setIpAddress(resolveIpAddress());
    }

    // ── Principal resolution ─────────────────────────────────────────────────

    private String resolveUsername() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return SYSTEM_USER;
            }
            Object principal = auth.getPrincipal();
            if (principal instanceof UserDetails ud) {
                return ud.getUsername();
            }
            // For OAuth2 or custom tokens the principal may just be a String
            return principal.toString();
        } catch (Exception e) {
            log.debug("Could not resolve username for revision: {}", e.getMessage());
            return UNKNOWN;
        }
    }

    private String resolveEmail() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return SYSTEM_USER;
            }
            Object principal = auth.getPrincipal();
            // Our CustomUserDetailsService returns a UserDetails whose username IS the email
            if (principal instanceof UserDetails ud) {
                return ud.getUsername();
            }
            return UNKNOWN;
        } catch (Exception e) {
            log.debug("Could not resolve email for revision: {}", e.getMessage());
            return UNKNOWN;
        }
    }

    // ── IP address resolution ────────────────────────────────────────────────

    private String resolveIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attrs.getRequest();
            return extractClientIp(request);
        } catch (IllegalStateException e) {
            // No request bound to this thread (scheduled task, async, etc.)
            return NO_REQUEST;
        } catch (Exception e) {
            log.debug("Could not resolve IP for revision: {}", e.getMessage());
            return UNKNOWN;
        }
    }

    /**
     * Checks standard proxy / load-balancer headers before falling back to the
     * raw remote address.  The first non-blank, non-{@code unknown} value wins.
     */
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
                // X-Forwarded-For may contain a comma-separated list; take the first entry
                return ip.split(",")[0].trim();
            }
        }
        return request.getRemoteAddr();
    }
}

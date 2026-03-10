package com.backend.backend.repository;

import com.backend.backend.audit.AuthAuditLog;
import com.backend.backend.audit.AuthAuditLog.AuthStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Read-side repository for {@link AuthAuditLog}.
 *
 * Writes always go through {@code AuthenticationAuditListener} which calls
 * {@link #save} directly; the query methods here are for admin reporting.
 */
@Repository
public interface AuthAuditLogRepository extends JpaRepository<AuthAuditLog, UUID> {

    /** All attempts (any status) for a given e-mail, newest first. */
    List<AuthAuditLog> findByAttemptedEmailOrderByTimestampDesc(String attemptedEmail);

    /** All attempts from a given IP address, newest first. */
    List<AuthAuditLog> findByIpAddressOrderByTimestampDesc(String ipAddress);

    /** Attempts by status within a time window – useful for rate-limit dashboards. */
    List<AuthAuditLog> findByStatusAndTimestampBetween(
            AuthStatus status,
            LocalDateTime from,
            LocalDateTime to
    );

    /** Recent failed attempts for a specific e-mail – supports account lockout logic. */
    List<AuthAuditLog> findByAttemptedEmailAndStatusAndTimestampAfter(
            String attemptedEmail,
            AuthStatus status,
            LocalDateTime after
    );

    /** Count of failed attempts from an IP since a given point – supports IP blocking. */
    long countByIpAddressAndStatusAndTimestampAfter(
            String ipAddress,
            AuthStatus status,
            LocalDateTime after
    );
}

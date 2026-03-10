package com.backend.backend.audit;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Immutable audit record for every authentication attempt.
 *
 * Envers only tracks changes to business data; it does <em>not</em> observe
 * Spring Security's authentication pipeline.  This entity fills that gap by
 * recording every login success and failure in a dedicated table, enabling
 * security investigations, rate-limit analysis, and compliance reporting.
 *
 * <h3>Design choices</h3>
 * <ul>
 *   <li>The record is intentionally <strong>insert-only</strong> – rows must
 *       never be updated or deleted externally (use a DB-level policy for
 *       retention).</li>
 *   <li>{@code attemptedEmail} stores the raw value the client submitted; it
 *       is <em>not</em> a foreign key because failed attempts may reference
 *       non-existent addresses.</li>
 *   <li>{@code timestamp} is set by the database via {@code @CreationTimestamp}
 *       so clock skew in the JVM does not affect the audit trail.</li>
 * </ul>
 */
@Entity
@Table(
    name = "auth_audit_log",
    indexes = {
        @Index(name = "idx_auth_audit_email",     columnList = "attempted_email"),
        @Index(name = "idx_auth_audit_ip",        columnList = "ip_address"),
        @Index(name = "idx_auth_audit_timestamp", columnList = "timestamp"),
        @Index(name = "idx_auth_audit_status",    columnList = "status")
    }
)
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthAuditLog {

    /** Enumeration of possible authentication outcomes. */
    public enum AuthStatus {
        SUCCESS, FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    /** The e-mail (or username) value submitted in the login request. */
    @Column(name = "attempted_email", nullable = false, length = 255)
    private String attemptedEmail;

    /** Client IP resolved from proxy headers or the raw socket address. */
    @Column(name = "ip_address", nullable = false, length = 64)
    private String ipAddress;

    /** Whether the attempt succeeded or failed. */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 16)
    private AuthStatus status;

    /**
     * Human-readable reason for a failed attempt (Spring Security exception
     * class name without the "Exception" suffix, or a short description).
     * {@code null} for successful logins.
     */
    @Column(name = "failure_reason", length = 512)
    private String failureReason;

    /** Set by the DB on INSERT – never supplied by the application. */
    @CreationTimestamp
    @Column(name = "timestamp", nullable = false, updatable = false)
    private LocalDateTime timestamp;
}

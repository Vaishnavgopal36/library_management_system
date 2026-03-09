package com.backend.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal; 
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;

@Entity
@Table(name = "fines")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "fine_id") 
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transaction_id", nullable = false)
    private Transaction transaction;

    // User is not audited — store the FK only, no lookup against a users_aud table.
    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "reason")
    private String reason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false) 
    private LocalDateTime createdAt;

    @Column(name = "is_paid", nullable = false)
    private Boolean isPaid;
}
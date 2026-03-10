package com.backend.backend.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.envers.RevisionEntity;
import org.hibernate.envers.RevisionNumber;
import org.hibernate.envers.RevisionTimestamp;

/**
 * Extends Envers' default revision record with security context.
 *
 * Every time Envers creates a new revision (INSERT/UPDATE/DELETE on any
 * {@code @Audited} entity), it writes one row into the {@code revinfo} table.
 * This entity annotates that table with three extra columns so each revision
 * carries the identity of the acting principal:
 *
 * <ul>
 *   <li>{@code username}   – Spring Security principal name (login name)</li>
 *   <li>{@code email}      – user e-mail from the loaded UserDetails</li>
 *   <li>{@code ip_address} – remote IP of the originating HTTP request</li>
 * </ul>
 *
 * For background / scheduled tasks none of those are available, so all three
 * columns are nullable and will be populated with {@code [system]} /
 * {@code [no-request]} as appropriate by {@link CustomRevisionListener}.
 */
@Entity
@Table(name = "revinfo")
@RevisionEntity(CustomRevisionListener.class)
@Getter
@Setter
public class CustomRevisionEntity {

    @Id
    @GeneratedValue
    @RevisionNumber
    @Column(name = "rev")
    private int id;

    @RevisionTimestamp
    @Column(name = "revtstmp")
    private long timestamp;

    @Column(name = "username", length = 255)
    private String username;

    @Column(name = "email", length = 255)
    private String email;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;
}

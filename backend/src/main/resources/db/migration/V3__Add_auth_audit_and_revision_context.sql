-- V3: Adds security audit tables for authentication tracking and revision context.
--
-- 1. Enriches the Envers revision table with principal identity fields so every
--    data-change revision records who made the change and from where.
--
-- 2. Creates the auth_audit_log table that tracks every login attempt
--    (both successes and failures), independently of Envers.

-- ── Envers revision context columns ─────────────────────────────────────────
ALTER TABLE revinfo
    ADD COLUMN IF NOT EXISTS username   VARCHAR(255),
    ADD COLUMN IF NOT EXISTS email      VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ip_address VARCHAR(64);

-- ── Authentication audit log ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    attempted_email VARCHAR(255)  NOT NULL,
    ip_address      VARCHAR(64)   NOT NULL,
    status          VARCHAR(16)   NOT NULL,   -- 'SUCCESS' or 'FAILED'
    failure_reason  VARCHAR(512),             -- NULL for successful logins
    timestamp       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_email     ON auth_audit_log(attempted_email);
CREATE INDEX IF NOT EXISTS idx_auth_audit_ip        ON auth_audit_log(ip_address);
CREATE INDEX IF NOT EXISTS idx_auth_audit_timestamp ON auth_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_auth_audit_status    ON auth_audit_log(status);

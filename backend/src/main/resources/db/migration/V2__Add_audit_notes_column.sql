-- V2: First Flyway-managed migration (V1 = baseline of the existing schema)
-- Adds an audit_notes column to the Envers revision-info table so reviewers
-- can annotate individual revision records.

ALTER TABLE revinfo
    ADD COLUMN IF NOT EXISTS audit_notes VARCHAR(255);

-- 1. Enable UUID extension (Required for generating random UUIDs)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS (Custom Data Types)
-- We drop types first to avoid errors if you re-run this script
DROP TYPE IF EXISTS user_role;
CREATE TYPE user_role AS ENUM ('admin', 'member', 'blacklisted');

-- 3. USERS TABLE
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- The Magic Change
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    role user_role DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. PUBLISHERS (Lookup Table)
CREATE TABLE publishers (
    publisher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- 5. AUTHORS (Lookup Table)
CREATE TABLE authors (
    author_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL
);

-- 6. CATEGORIES (Lookup Table)
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL
);

-- 7. BOOKS (The Core Entity)
CREATE TABLE books (
    book_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    publisher_id UUID REFERENCES publishers(publisher_id) ON DELETE SET NULL,
    publish_date DATE,
    stock_quantity INT DEFAULT 1,
    isbn VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. BOOK_AUTHORS (Junction Table)
CREATE TABLE book_authors (
    book_id UUID REFERENCES books(book_id) ON DELETE CASCADE,
    author_id UUID REFERENCES authors(author_id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, author_id)
);

-- 9. BOOK_CATEGORIES (Junction Table)
CREATE TABLE book_categories (
    book_id UUID REFERENCES books(book_id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(category_id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, category_id)
);

-- 10. TRANSACTIONS
CREATE TABLE transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id),
    book_id UUID REFERENCES books(book_id),
    checkout_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP NOT NULL,
    return_date TIMESTAMP,
    fine_amount DECIMAL(10, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'issued'
);

-- 11. RESERVATIONS
CREATE TABLE reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    book_id UUID REFERENCES books(book_id) ON DELETE CASCADE,
    reserved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'active'
);

-- 12. RESERVATION LIMIT TRIGGER (max 3 active reservations per user — must match MAX_ACTIVE_RESERVATIONS in ReservationService.java)
CREATE OR REPLACE FUNCTION check_reservation_limit()
RETURNS TRIGGER AS $$
BEGIN
    IF (SELECT COUNT(*) FROM reservations WHERE user_id = NEW.user_id AND status = 'active') >= 3 THEN
        RAISE EXCEPTION 'Limit reached: Max 3 active reservations allowed.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_reservations
    BEFORE INSERT ON reservations
    FOR EACH ROW EXECUTE FUNCTION check_reservation_limit();

-- 13. INDEXES (Optimization for Search)
CREATE INDEX idx_books_title ON books(title);

-- 14. ENVERS REVISION TABLE with principal identity columns
CREATE TABLE IF NOT EXISTS revinfo (
    rev         INTEGER      PRIMARY KEY,
    revtstmp    BIGINT,
    audit_notes VARCHAR(255),
    username    VARCHAR(255),
    email       VARCHAR(255),
    ip_address  VARCHAR(64)
);

-- 15. AUTHENTICATION AUDIT LOG (tracks every login attempt independently of Envers)
CREATE TABLE IF NOT EXISTS auth_audit_log (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    attempted_email VARCHAR(255) NOT NULL,
    ip_address      VARCHAR(64)  NOT NULL,
    status          VARCHAR(16)  NOT NULL,   -- 'SUCCESS' or 'FAILED'
    failure_reason  VARCHAR(512),
    timestamp       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auth_audit_email     ON auth_audit_log(attempted_email);
CREATE INDEX idx_auth_audit_ip        ON auth_audit_log(ip_address);
CREATE INDEX idx_auth_audit_timestamp ON auth_audit_log(timestamp);
CREATE INDEX idx_auth_audit_status    ON auth_audit_log(status);
CREATE INDEX idx_authors_name ON authors(name);
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

-- 11. INDEXES (Optimization for Search)
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_authors_name ON authors(name);
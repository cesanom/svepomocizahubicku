-- SQL schema pro Cloudflare D1 databázi
-- Vytvoření tabulky pro kontaktní formuláře

CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    location TEXT NOT NULL,
    phase TEXT NOT NULL,
    message TEXT,
    consent INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    status TEXT DEFAULT 'new' -- new, contacted, in_progress, completed, cancelled
);

-- Index pro rychlejší vyhledávání
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);

-- Volitelně: tabulka pro sledování interakcí
CREATE TABLE IF NOT EXISTS contact_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contact_id INTEGER NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT NOT NULL,
    created_by TEXT,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);
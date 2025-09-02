CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    budget_limit REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category_id INTEGER,
    transaction_type TEXT CHECK(transaction_type IN ('income', 'expense')) NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

INSERT OR IGNORE INTO categories (name, budget_limit) VALUES 
    ('Food', 500),
    ('Transportation', 200),
    ('Entertainment', 150),
    ('Utilities', 300),
    ('Income', 0);
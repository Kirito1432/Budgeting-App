const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db_path = path.resolve(__dirname, 'budget.db');
const db = new sqlite3.Database(db_path, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
    }
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        budget_limit REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category_id INTEGER,
        transaction_type TEXT CHECK(transaction_type IN ('income', 'expense')) NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories (id)
    )`);

    db.run(`INSERT OR IGNORE INTO categories (name, budget_limit) VALUES 
            ('Food', 500),
            ('Transportation', 200),
            ('Entertainment', 150),
            ('Utilities', 300),
            ('Income', 0)`);
});

module.exports = db;
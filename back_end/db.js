const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'budget.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

function initializeDatabase() {
    // Check if tables exist, if not, create them
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'", (err, row) => {
        if (err) {
            console.error('Error checking for tables:', err.message);
            return;
        }
        
        if (!row) {
            // Tables don't exist, create them from schema
            const schema = fs.readFileSync(schemaPath, 'utf8');
            db.exec(schema, (err) => {
                if (err) {
                    console.error('Error creating tables:', err.message);
                } else {
                    console.log('Database tables created successfully.');
                }
            });
        }
    });
}

module.exports = db;
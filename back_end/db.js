import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, 'budget.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// Create database connection
const sqlite3Verbose = sqlite3.verbose();
const db = new sqlite3Verbose.Database(dbPath, (err) => {
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

export default db;

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const db_path = path.resolve(__dirname, 'budget.db');
const db = new sqlite3.Database(db_path);

//Initialize schema
db.serialize(() =>{
    db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT,
    date TEXT NOT NULL,
    time TIMESTAMP NOT NULL
  )`);
})

module.exports = db;
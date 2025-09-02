
const express = require('express');
const cors = require('cors');
const db = require('./db');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../front_end')));

app.get('/api/transactions', (req, res) => {
    const query = `
        SELECT t.*, c.name as category_name 
        FROM transactions t 
        LEFT JOIN categories c ON t.category_id = c.id 
        ORDER BY t.date DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.post('/api/transactions', (req, res) => {
    const { description, amount, category_id, transaction_type } = req.body;
    
    if (!description || !amount || !transaction_type) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `INSERT INTO transactions (description, amount, category_id, transaction_type)
                   VALUES (?, ?, ?, ?)`;
    
    db.run(query, [description, amount, category_id, transaction_type], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            id: this.lastID,
            description,
            amount,
            category_id,
            transaction_type
        });
    });
});

app.delete('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM transactions WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ deletedRows: this.changes });
    });
});

app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/budget-summary', (req, res) => {
    const query = `
        SELECT 
            c.name,
            c.budget_limit,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) as spent,
            COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) as income
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id
        WHERE c.name != 'Income'
        GROUP BY c.id, c.name, c.budget_limit
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const summary = rows.map(row => ({
            ...row,
            remaining: row.budget_limit - row.spent,
            percentage: row.budget_limit > 0 ? (row.spent / row.budget_limit) * 100 : 0
        }));
        
        res.json(summary);
    });
});

app.get('/api/charts/expense-breakdown', (req, res) => {
    const query = `
        SELECT c.name, SUM(t.amount) as total
        FROM categories c
        INNER JOIN transactions t ON c.id = t.category_id
        WHERE t.transaction_type = 'expense'
        GROUP BY c.id, c.name
        ORDER BY total DESC
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.get('/api/charts/monthly-trend', (req, res) => {
    const query = `
        SELECT 
            strftime('%Y-%m', date) as month,
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expenses
        FROM transactions
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month DESC
        LIMIT 12
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows.reverse());
    });
});

app.get('/api/charts/income-expense', (req, res) => {
    const query = `
        SELECT 
            transaction_type,
            SUM(amount) as total
        FROM transactions
        GROUP BY transaction_type
    `;
    
    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

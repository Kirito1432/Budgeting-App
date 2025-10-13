/**
 * Budgeting App - Express Server
 *
 * This is the main backend server for the budgeting application.
 * It handles all API requests for transactions, categories, budget summaries, and data export.
 * The server also serves the built React frontend as static files.
 */

// Import required modules
import express from 'express';
import cors from 'cors';
import db from './db.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Parse JSON request bodies
app.use(express.static(path.join(__dirname, '../front_end'))); // Serve React frontend

// ==================== TRANSACTION ENDPOINTS ====================

/**
 * GET /api/transactions
 * Retrieves all transactions with their associated category names
 * Returns: Array of transaction objects sorted by date (newest first)
 */
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

/**
 * POST /api/transactions
 * Creates a new transaction
 * Body: { description, amount, category_id, transaction_type }
 * Returns: The newly created transaction with its ID
 */
app.post('/api/transactions', (req, res) => {
    const { description, amount, category_id, transaction_type } = req.body;

    // Validate required fields
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
        // Return the created transaction with its new ID
        res.json({
            id: this.lastID,
            description,
            amount,
            category_id,
            transaction_type
        });
    });
});

/**
 * DELETE /api/transactions/:id
 * Deletes a specific transaction by ID
 * Params: id - The transaction ID to delete
 * Returns: Number of rows deleted
 */
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

/**
 * DELETE /api/clear-database
 * Deletes ALL transactions from the database
 * WARNING: This action cannot be undone!
 * Returns: Success message and number of deleted rows
 */
app.delete('/api/clear-database', (req, res) => {
    db.run('DELETE FROM transactions', [], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({
            message: 'All transactions deleted successfully',
            deletedRows: this.changes
        });
    });
});

// ==================== CATEGORY ENDPOINTS ====================

/**
 * GET /api/categories
 * Retrieves all budget categories
 * Returns: Array of category objects sorted alphabetically
 */
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories ORDER BY name', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// ==================== BUDGET SUMMARY ENDPOINTS ====================

/**
 * GET /api/budget-summary
 * Calculates budget summary for all categories
 * Returns: Array of budget objects with:
 *   - name: Category name
 *   - budget_limit: The budget limit for this category
 *   - spent: Total amount spent in this category
 *   - income: Total income in this category
 *   - remaining: Budget limit minus spent amount
 *   - percentage: Percentage of budget used
 */
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

        // Calculate remaining budget and percentage for each category
        const summary = rows.map(row => ({
            ...row,
            remaining: row.budget_limit - row.spent,
            percentage: row.budget_limit > 0 ? (row.spent / row.budget_limit) * 100 : 0
        }));

        res.json(summary);
    });
});

// ==================== CHART DATA ENDPOINTS ====================

/**
 * GET /api/charts/expense-breakdown
 * Gets total expenses grouped by category for pie/doughnut charts
 * Returns: Array of { name, total } objects sorted by total descending
 */
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

/**
 * GET /api/charts/monthly-trend
 * Gets income and expenses grouped by month for trend charts
 * Returns: Array of { month, income, expenses } for the last 12 months
 */
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
        // Reverse to show oldest to newest
        res.json(rows.reverse());
    });
});

/**
 * GET /api/charts/income-expense
 * Gets total income vs total expenses for comparison charts
 * Returns: Array with two objects: { transaction_type, total }
 */
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

// ==================== EXPORT ENDPOINTS ====================

/**
 * GET /api/export/csv
 * Exports all transactions to a CSV file
 * Returns: CSV file download with all transaction data
 */
app.get('/api/export/csv', (req, res) => {
    const query = `
        SELECT
            t.id,
            t.description,
            t.amount,
            t.transaction_type,
            t.date,
            c.name as category_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.date DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        // Convert database rows to CSV format
        const csvHeader = 'ID,Description,Amount,Type,Date,Category\n';
        const csvRows = rows.map(row =>
            `${row.id},"${row.description}",${row.amount},${row.transaction_type},${row.date},"${row.category_name || ''}"`
        ).join('\n');

        const csvContent = csvHeader + csvRows;

        // Set response headers to trigger file download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="budget_transactions.csv"');
        res.send(csvContent);
    });
});

// ==================== SERVER STARTUP ====================

/**
 * Start the Express server
 */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

/**
 * Handle graceful shutdown
 * Closes database connection when the server is terminated
 */
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Database connection closed.');
        process.exit(0);
    });
});

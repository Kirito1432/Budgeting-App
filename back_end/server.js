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
 * Query params: start_date, end_date for date range filtering
 * Returns: Array of transaction objects sorted by date (newest first)
 */
app.get('/api/transactions', (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT t.*, c.name as category_name
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
    `;

    const params = [];
    const conditions = [];

    // Add date range filtering if provided
    if (start_date) {
        conditions.push('DATE(t.date) >= DATE(?)');
        params.push(start_date);
    }

    if (end_date) {
        conditions.push('DATE(t.date) <= DATE(?)');
        params.push(end_date);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY t.date DESC';

    db.all(query, params, (err, rows) => {
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
 * PUT /api/transactions/:id
 * Updates an existing transaction
 * Body: { description?, amount?, category_id?, transaction_type?, date? }
 * Returns: The updated transaction
 */
app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { description, amount, category_id, transaction_type, date } = req.body;

    // Validate that at least one field is provided
    if (!description && !amount && !category_id && !transaction_type && !date) {
        return res.status(400).json({ error: 'At least one field must be provided to update' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (description !== undefined) {
        if (!description || description.trim().length === 0) {
            return res.status(400).json({ error: 'Description cannot be empty' });
        }
        updates.push('description = ?');
        values.push(description.trim());
    }

    if (amount !== undefined) {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Amount must be a positive number' });
        }
        updates.push('amount = ?');
        values.push(parsedAmount);
    }

    if (category_id !== undefined) {
        updates.push('category_id = ?');
        values.push(category_id);
    }

    if (transaction_type !== undefined) {
        if (transaction_type !== 'income' && transaction_type !== 'expense') {
            return res.status(400).json({ error: 'Transaction type must be "income" or "expense"' });
        }
        updates.push('transaction_type = ?');
        values.push(transaction_type);
    }

    if (date !== undefined) {
        updates.push('date = ?');
        values.push(date);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    // Check if transaction exists
    db.get('SELECT * FROM transactions WHERE id = ?', [id], (err, transaction) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Perform update
        const query = `UPDATE transactions SET ${updates.join(', ')} WHERE id = ?`;

        db.run(query, values, function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Fetch and return updated transaction with category name
            db.get(`
                SELECT t.*, c.name as category_name
                FROM transactions t
                LEFT JOIN categories c ON t.category_id = c.id
                WHERE t.id = ?
            `, [id], (err, updatedTransaction) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json(updatedTransaction);
            });
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
 * Retrieves all budget categories (only active ones by default)
 * Query params: include_inactive=true to include inactive categories
 * Returns: Array of category objects sorted alphabetically
 */
app.get('/api/categories', (req, res) => {
    const includeInactive = req.query.include_inactive === 'true';
    const query = includeInactive
        ? 'SELECT * FROM categories ORDER BY name'
        : 'SELECT * FROM categories WHERE is_active = 1 ORDER BY name';

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

/**
 * POST /api/categories
 * Creates a new category
 * Body: { name, budget_limit }
 * Returns: The newly created category with its ID
 */
app.post('/api/categories', (req, res) => {
    const { name, budget_limit } = req.body;

    // Validate required fields
    if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required' });
    }

    // Validate name length
    if (name.length > 50) {
        return res.status(400).json({ error: 'Category name must be 50 characters or less' });
    }

    // Validate budget limit
    const limit = budget_limit !== undefined ? parseFloat(budget_limit) : 0;
    if (isNaN(limit) || limit < 0) {
        return res.status(400).json({ error: 'Budget limit must be a positive number' });
    }

    // Check for duplicate name (case-insensitive)
    db.get('SELECT id FROM categories WHERE LOWER(name) = LOWER(?)', [name.trim()], (err, existing) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (existing) {
            return res.status(400).json({ error: 'Category name already exists' });
        }

        // Insert new category
        const query = `INSERT INTO categories (name, budget_limit, is_active, created_at, updated_at)
                       VALUES (?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;

        db.run(query, [name.trim(), limit], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Return the created category
            res.status(201).json({
                id: this.lastID,
                name: name.trim(),
                budget_limit: limit,
                is_active: 1,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
        });
    });
});

/**
 * PUT /api/categories/:id
 * Updates an existing category
 * Body: { name?, budget_limit? }
 * Returns: The updated category
 */
app.put('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const { name, budget_limit } = req.body;

    // Validate that at least one field is provided
    if (name === undefined && budget_limit === undefined) {
        return res.status(400).json({ error: 'At least one field (name or budget_limit) must be provided' });
    }

    // Build update query dynamically
    const updates = [];
    const values = [];

    if (name !== undefined) {
        if (name.trim().length === 0) {
            return res.status(400).json({ error: 'Category name cannot be empty' });
        }
        if (name.length > 50) {
            return res.status(400).json({ error: 'Category name must be 50 characters or less' });
        }
        updates.push('name = ?');
        values.push(name.trim());
    }

    if (budget_limit !== undefined) {
        const limit = parseFloat(budget_limit);
        if (isNaN(limit) || limit < 0) {
            return res.status(400).json({ error: 'Budget limit must be a positive number' });
        }
        updates.push('budget_limit = ?');
        values.push(limit);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    // Check if category exists
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // If name is being updated, check for duplicates
        if (name !== undefined && name.trim().toLowerCase() !== category.name.toLowerCase()) {
            db.get('SELECT id FROM categories WHERE LOWER(name) = LOWER(?) AND id != ?',
                [name.trim(), id], (err, existing) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                if (existing) {
                    return res.status(400).json({ error: 'Category name already exists' });
                }

                // Perform update
                performUpdate();
            });
        } else {
            // Perform update without duplicate check
            performUpdate();
        }

        function performUpdate() {
            const query = `UPDATE categories SET ${updates.join(', ')} WHERE id = ?`;

            db.run(query, values, function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Fetch and return updated category
                db.get('SELECT * FROM categories WHERE id = ?', [id], (err, updatedCategory) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json(updatedCategory);
                });
            });
        }
    });
});

/**
 * DELETE /api/categories/:id
 * Deletes a category (soft delete by default)
 * Query params: hard_delete=true to permanently delete (only if no transactions)
 * Returns: Success message
 */
app.delete('/api/categories/:id', (req, res) => {
    const { id } = req.params;
    const hardDelete = req.query.hard_delete === 'true';

    // Check if category exists
    db.get('SELECT * FROM categories WHERE id = ?', [id], (err, category) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category has transactions
        db.get('SELECT COUNT(*) as count FROM transactions WHERE category_id = ?', [id], (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const hasTransactions = result.count > 0;

            if (hasTransactions && hardDelete) {
                return res.status(400).json({
                    error: 'Cannot delete category with existing transactions',
                    transaction_count: result.count
                });
            }

            if (hardDelete && !hasTransactions) {
                // Perform hard delete
                db.run('DELETE FROM categories WHERE id = ?', [id], function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({
                        success: true,
                        message: 'Category permanently deleted',
                        deleted: true
                    });
                });
            } else {
                // Perform soft delete
                db.run('UPDATE categories SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [id], function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({
                        success: true,
                        message: hasTransactions
                            ? 'Category deactivated (has existing transactions)'
                            : 'Category deactivated',
                        deleted: false,
                        deactivated: true
                    });
                });
            }
        });
    });
});

// ==================== BUDGET PERIOD ENDPOINTS ====================

/**
 * GET /api/periods
 * Retrieves all budget periods
 * Returns: Array of period objects sorted by start_date descending
 */
app.get('/api/periods', (req, res) => {
    const query = 'SELECT * FROM budget_periods ORDER BY start_date DESC';

    db.all(query, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

/**
 * GET /api/periods/current
 * Gets the current active budget period based on today's date
 * Returns: Current period object or null if none exists
 */
app.get('/api/periods/current', (req, res) => {
    const query = `
        SELECT * FROM budget_periods
        WHERE DATE('now') BETWEEN DATE(start_date) AND DATE(end_date)
        AND is_active = 1
        ORDER BY start_date DESC
        LIMIT 1
    `;

    db.get(query, [], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(row || null);
    });
});

/**
 * GET /api/periods/:id
 * Gets a specific budget period by ID
 * Returns: Period object with associated category budgets
 */
app.get('/api/periods/:id', (req, res) => {
    const { id } = req.params;

    db.get('SELECT * FROM budget_periods WHERE id = ?', [id], (err, period) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }
        res.json(period);
    });
});

/**
 * POST /api/periods
 * Creates a new budget period
 * Body: { period_type, start_date, end_date }
 * Automatically copies budget limits from categories or previous period
 */
app.post('/api/periods', (req, res) => {
    const { period_type, start_date, end_date } = req.body;

    // Validation
    if (!period_type || !start_date || !end_date) {
        return res.status(400).json({ error: 'period_type, start_date, and end_date are required' });
    }

    if (!['weekly', 'monthly', 'yearly'].includes(period_type)) {
        return res.status(400).json({ error: 'period_type must be weekly, monthly, or yearly' });
    }

    if (new Date(end_date) < new Date(start_date)) {
        return res.status(400).json({ error: 'end_date must be after start_date' });
    }

    // Check for overlapping periods
    const overlapQuery = `
        SELECT id FROM budget_periods
        WHERE (
            (DATE(?) BETWEEN DATE(start_date) AND DATE(end_date))
            OR (DATE(?) BETWEEN DATE(start_date) AND DATE(end_date))
            OR (DATE(start_date) BETWEEN DATE(?) AND DATE(?))
        )
        AND is_active = 1
    `;

    db.get(overlapQuery, [start_date, end_date, start_date, end_date], (err, overlap) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (overlap) {
            return res.status(400).json({ error: 'Period dates overlap with existing active period' });
        }

        // Create the period
        const insertPeriod = `
            INSERT INTO budget_periods (period_type, start_date, end_date, is_active, created_at)
            VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
        `;

        db.run(insertPeriod, [period_type, start_date, end_date], function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            const periodId = this.lastID;

            // Copy budget limits from categories table
            const copyBudgets = `
                INSERT INTO period_category_budgets (period_id, category_id, budget_limit)
                SELECT ?, id, budget_limit
                FROM categories
                WHERE is_active = 1
            `;

            db.run(copyBudgets, [periodId], function(err) {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }

                // Return the created period
                db.get('SELECT * FROM budget_periods WHERE id = ?', [periodId], (err, period) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(201).json(period);
                });
            });
        });
    });
});

/**
 * PUT /api/periods/:id
 * Updates a budget period
 * Body: { period_type?, start_date?, end_date?, is_active? }
 */
app.put('/api/periods/:id', (req, res) => {
    const { id } = req.params;
    const { period_type, start_date, end_date, is_active } = req.body;

    // Check if period exists
    db.get('SELECT * FROM budget_periods WHERE id = ?', [id], (err, period) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }

        // Build update query dynamically
        const updates = [];
        const values = [];

        if (period_type !== undefined) {
            if (!['weekly', 'monthly', 'yearly'].includes(period_type)) {
                return res.status(400).json({ error: 'period_type must be weekly, monthly, or yearly' });
            }
            updates.push('period_type = ?');
            values.push(period_type);
        }

        if (start_date !== undefined) {
            updates.push('start_date = ?');
            values.push(start_date);
        }

        if (end_date !== undefined) {
            updates.push('end_date = ?');
            values.push(end_date);
        }

        if (is_active !== undefined) {
            updates.push('is_active = ?');
            values.push(is_active ? 1 : 0);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE budget_periods SET ${updates.join(', ')} WHERE id = ?`;

        db.run(query, values, function(err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            // Return updated period
            db.get('SELECT * FROM budget_periods WHERE id = ?', [id], (err, updatedPeriod) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
                res.json(updatedPeriod);
            });
        });
    });
});

/**
 * DELETE /api/periods/:id
 * Deletes a budget period (and associated category budgets via CASCADE)
 */
app.delete('/api/periods/:id', (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM budget_periods WHERE id = ?', [id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }

        if (this.changes === 0) {
            return res.status(404).json({ error: 'Period not found' });
        }

        res.json({ success: true, message: 'Period deleted successfully' });
    });
});

/**
 * GET /api/periods/:id/budgets
 * Gets category budget limits for a specific period
 * Returns: Array of { category_id, category_name, budget_limit }
 */
app.get('/api/periods/:id/budgets', (req, res) => {
    const { id } = req.params;

    const query = `
        SELECT
            pcb.id,
            pcb.category_id,
            c.name as category_name,
            pcb.budget_limit
        FROM period_category_budgets pcb
        JOIN categories c ON pcb.category_id = c.id
        WHERE pcb.period_id = ?
        ORDER BY c.name
    `;

    db.all(query, [id], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

/**
 * PUT /api/periods/:id/budgets
 * Updates category budget limits for a specific period
 * Body: [{ category_id, budget_limit }, ...]
 */
app.put('/api/periods/:id/budgets', (req, res) => {
    const { id } = req.params;
    const budgets = req.body;

    if (!Array.isArray(budgets) || budgets.length === 0) {
        return res.status(400).json({ error: 'Request body must be an array of budget objects' });
    }

    // Verify period exists
    db.get('SELECT id FROM budget_periods WHERE id = ?', [id], (err, period) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!period) {
            return res.status(404).json({ error: 'Period not found' });
        }

        // Update each budget
        const updatePromises = budgets.map(budget => {
            return new Promise((resolve, reject) => {
                const query = `
                    UPDATE period_category_budgets
                    SET budget_limit = ?
                    WHERE period_id = ? AND category_id = ?
                `;

                db.run(query, [budget.budget_limit, id, budget.category_id], function(err) {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });

        Promise.all(updatePromises)
            .then(() => {
                res.json({ success: true, message: 'Budgets updated successfully' });
            })
            .catch(err => {
                res.status(500).json({ error: err.message });
            });
    });
});

// ==================== BUDGET SUMMARY ENDPOINTS ====================

/**
 * GET /api/budget-summary
 * Calculates budget summary for all categories
 * Query params:
 *   - start_date, end_date for date range filtering
 *   - period_id for period-specific budget limits
 * Returns: Array of budget objects with:
 *   - name: Category name
 *   - budget_limit: The budget limit for this category (from period or default)
 *   - spent: Total amount spent in this category
 *   - income: Total income in this category
 *   - remaining: Budget limit minus spent amount
 *   - percentage: Percentage of budget used
 */
app.get('/api/budget-summary', (req, res) => {
    const { start_date, end_date, period_id } = req.query;

    // If period_id is provided, use period-specific budget limits
    if (period_id) {
        const query = `
            SELECT
                c.name,
                COALESCE(pcb.budget_limit, c.budget_limit) as budget_limit,
                COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) as spent,
                COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) as income
            FROM categories c
            LEFT JOIN period_category_budgets pcb ON c.id = pcb.category_id AND pcb.period_id = ?
            LEFT JOIN transactions t ON c.id = t.category_id
                AND (? IS NULL OR DATE(t.date) >= DATE(?))
                AND (? IS NULL OR DATE(t.date) <= DATE(?))
            WHERE c.name != 'Income' AND c.is_active = 1
            GROUP BY c.id, c.name, pcb.budget_limit, c.budget_limit
        `;

        const params = [period_id, start_date, start_date, end_date, end_date];

        db.all(query, params, (err, rows) => {
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
    } else {
        // Use default category budget limits
        let query = `
            SELECT
                c.name,
                c.budget_limit,
                COALESCE(SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END), 0) as spent,
                COALESCE(SUM(CASE WHEN t.transaction_type = 'income' THEN t.amount ELSE 0 END), 0) as income
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id
        `;

        const params = [];
        const conditions = ['c.name != ?', 'c.is_active = 1'];
        params.push('Income');

        // Add date range filtering if provided
        if (start_date) {
            conditions.push('(t.id IS NULL OR DATE(t.date) >= DATE(?))');
            params.push(start_date);
        }

        if (end_date) {
            conditions.push('(t.id IS NULL OR DATE(t.date) <= DATE(?))');
            params.push(end_date);
        }

        query += ' WHERE ' + conditions.join(' AND ');
        query += ' GROUP BY c.id, c.name, c.budget_limit';

        db.all(query, params, (err, rows) => {
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
    }
});

// ==================== CHART DATA ENDPOINTS ====================

/**
 * GET /api/charts/expense-breakdown
 * Gets total expenses grouped by category for pie/doughnut charts
 * Query params: start_date, end_date for date range filtering
 * Returns: Array of { name, total } objects sorted by total descending
 */
app.get('/api/charts/expense-breakdown', (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT c.name, SUM(t.amount) as total
        FROM categories c
        INNER JOIN transactions t ON c.id = t.category_id
        WHERE t.transaction_type = 'expense'
    `;

    const params = [];

    // Add date range filtering if provided
    if (start_date) {
        query += ' AND DATE(t.date) >= DATE(?)';
        params.push(start_date);
    }

    if (end_date) {
        query += ' AND DATE(t.date) <= DATE(?)';
        params.push(end_date);
    }

    query += ' GROUP BY c.id, c.name ORDER BY total DESC';

    db.all(query, params, (err, rows) => {
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
 * Query params: start_date, end_date for date range filtering
 * Returns: Array of { month, income, expenses } for the filtered period or last 12 months
 */
app.get('/api/charts/monthly-trend', (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT
            strftime('%Y-%m', date) as month,
            SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as expenses
        FROM transactions
    `;

    const params = [];
    const conditions = [];

    // Add date range filtering if provided
    if (start_date) {
        conditions.push('DATE(date) >= DATE(?)');
        params.push(start_date);
    }

    if (end_date) {
        conditions.push('DATE(date) <= DATE(?)');
        params.push(end_date);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY strftime(\'%Y-%m\', date) ORDER BY month DESC';

    // Only apply LIMIT if no date filter is specified
    if (!start_date && !end_date) {
        query += ' LIMIT 12';
    }

    db.all(query, params, (err, rows) => {
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
 * Query params: start_date, end_date for date range filtering
 * Returns: Array with two objects: { transaction_type, total }
 */
app.get('/api/charts/income-expense', (req, res) => {
    const { start_date, end_date } = req.query;

    let query = `
        SELECT
            transaction_type,
            SUM(amount) as total
        FROM transactions
    `;

    const params = [];
    const conditions = [];

    // Add date range filtering if provided
    if (start_date) {
        conditions.push('DATE(date) >= DATE(?)');
        params.push(start_date);
    }

    if (end_date) {
        conditions.push('DATE(date) <= DATE(?)');
        params.push(end_date);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY transaction_type';

    db.all(query, params, (err, rows) => {
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

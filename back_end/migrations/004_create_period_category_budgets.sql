-- Migration: Create period_category_budgets table
-- Date: 2025-10-27
-- Description: Creates table for storing category budget limits per period

-- Create period_category_budgets table
CREATE TABLE IF NOT EXISTS period_category_budgets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    budget_limit REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (period_id) REFERENCES budget_periods(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE(period_id, category_id)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_period_category_budgets_period ON period_category_budgets(period_id);
CREATE INDEX IF NOT EXISTS idx_period_category_budgets_category ON period_category_budgets(category_id);

-- Migration: Create budget_periods table
-- Date: 2025-10-27
-- Description: Creates table for managing budget periods (weekly, monthly, yearly)

-- Create budget_periods table
CREATE TABLE IF NOT EXISTS budget_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period_type TEXT NOT NULL CHECK(period_type IN ('weekly', 'monthly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK(end_date >= start_date)
);

-- Create index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_budget_periods_dates ON budget_periods(start_date, end_date);

-- Create index for active periods
CREATE INDEX IF NOT EXISTS idx_budget_periods_active ON budget_periods(is_active);

-- Create index for period type
CREATE INDEX IF NOT EXISTS idx_budget_periods_type ON budget_periods(period_type);

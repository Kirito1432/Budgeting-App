-- Migration: Add soft delete support to categories table
-- Date: 2025-10-27
-- Description: Adds is_active and updated_at columns to categories table

-- Add is_active column (default 1 = active)
ALTER TABLE categories ADD COLUMN is_active INTEGER DEFAULT 1;

-- Add updated_at column for tracking changes
-- SQLite doesn't support DEFAULT CURRENT_TIMESTAMP in ALTER TABLE, so we add it as NULL then update
ALTER TABLE categories ADD COLUMN updated_at DATETIME;

-- Update existing rows with current timestamp
UPDATE categories SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

-- Create index for filtering active categories
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);

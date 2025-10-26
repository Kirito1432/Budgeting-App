-- Migration: Add updated_at column to transactions table
-- Date: 2025-10-27
-- Description: Tracks when transactions are last modified

-- Add updated_at column
ALTER TABLE transactions ADD COLUMN updated_at DATETIME;

-- Update existing rows with current timestamp
UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;

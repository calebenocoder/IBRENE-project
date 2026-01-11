-- Add passing_percentage column to tests table
-- This allows admins to set a minimum passing score for each quiz

ALTER TABLE tests ADD COLUMN IF NOT EXISTS passing_percentage INTEGER DEFAULT 70;

COMMENT ON COLUMN tests.passing_percentage IS 'Minimum percentage (0-100) required to pass the quiz';

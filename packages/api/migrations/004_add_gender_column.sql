-- ============================================
-- Add Gender Column to Users Table
-- ============================================
-- This migration adds a gender field to track user's selected gender
-- Safe to run multiple times (idempotent)
-- ============================================

-- Add gender column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'gender'
  ) THEN
    ALTER TABLE users ADD COLUMN gender TEXT;
    COMMENT ON COLUMN users.gender IS 'User selected gender: male, female, or other';
  END IF;
END $$;

-- Create index for gender filtering (optional but useful for analytics)
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Gender column added to users table';
END $$;

-- Migration 004: Add body_type column for avatar generation
-- Simple, safe, single-column addition
-- Date: 2025-11-13

BEGIN;

-- Add body_type column (nullable, safe for existing users)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS body_type TEXT;

-- Add constraint (bro or bae)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_body_type'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT check_body_type 
    CHECK (body_type IS NULL OR body_type IN ('bro', 'bae'));
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_body_type 
ON users(body_type) 
WHERE body_type IS NOT NULL;

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'body_type'
  ) THEN
    RAISE NOTICE '✅ body_type column added successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to add body_type column';
  END IF;
END $$;

COMMIT;


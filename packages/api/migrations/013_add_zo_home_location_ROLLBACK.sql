-- Rollback Migration 013: Remove zo_home_location column
-- Description: Remove the zo_home_location column added in migration 013
-- Date: 2025-11-22

-- Drop index first
DROP INDEX IF EXISTS idx_users_zo_home_location;

-- Drop column
ALTER TABLE users
DROP COLUMN IF EXISTS zo_home_location;

-- Verification
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'zo_home_location'
  ) THEN
    RAISE NOTICE '✅ Column zo_home_location removed successfully';
  ELSE
    RAISE EXCEPTION '❌ Column zo_home_location still exists';
  END IF;
END $$;


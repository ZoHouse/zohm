-- Rollback Migration 004: Avatar Integration with ZO API
-- Description: Remove avatar-related columns from users table
-- Author: Phase 2 Implementation
-- Date: 2025-11-13

-- ============================================================================
-- STEP 1: Drop Helper Function
-- ============================================================================

DROP FUNCTION IF EXISTS update_profile_from_zo_api(TEXT, JSONB);

-- ============================================================================
-- STEP 2: Drop Indexes
-- ============================================================================

DROP INDEX IF EXISTS idx_users_avatar_image;
DROP INDEX IF EXISTS idx_users_body_type;

-- ============================================================================
-- STEP 3: Drop Constraints
-- ============================================================================

ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_body_type;

-- ============================================================================
-- STEP 4: Drop Columns
-- ============================================================================

ALTER TABLE users
DROP COLUMN IF EXISTS profile_synced_at,
DROP COLUMN IF EXISTS zo_profile_cache,
DROP COLUMN IF EXISTS body_type,
DROP COLUMN IF EXISTS avatar_ref_id,
DROP COLUMN IF EXISTS avatar_metadata,
DROP COLUMN IF EXISTS avatar_image;

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================

-- Check columns are removed
DO $$
DECLARE
  remaining_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(column_name)
  INTO remaining_columns
  FROM information_schema.columns
  WHERE table_name = 'users'
    AND column_name IN ('avatar_image', 'avatar_metadata', 'avatar_ref_id', 'body_type', 'zo_profile_cache', 'profile_synced_at');
  
  IF remaining_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Failed to drop columns: %', array_to_string(remaining_columns, ', ');
  ELSE
    RAISE NOTICE 'All avatar columns removed successfully';
  END IF;
END $$;

-- Rollback completed successfully


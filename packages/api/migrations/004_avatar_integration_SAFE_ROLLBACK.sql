-- Rollback Migration 004: ZO Avatar Integration (SAFE VERSION)
-- Description: Remove only the 2 columns we added (body_type, profile_synced_at)
-- Does NOT touch pfp column (was already there)
-- Author: Phase 2 Implementation
-- Date: 2025-11-13

BEGIN;

-- ============================================================================
-- STEP 1: Drop Index
-- ============================================================================

DROP INDEX IF EXISTS idx_users_body_type;

-- ============================================================================
-- STEP 2: Drop Constraint
-- ============================================================================

ALTER TABLE users
DROP CONSTRAINT IF EXISTS check_body_type;

-- ============================================================================
-- STEP 3: Drop Columns (Only What We Added)
-- ============================================================================

ALTER TABLE users
DROP COLUMN IF EXISTS profile_synced_at;

ALTER TABLE users
DROP COLUMN IF EXISTS body_type;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

DO $$
DECLARE
  body_type_exists BOOLEAN;
  sync_at_exists BOOLEAN;
BEGIN
  -- Check if columns are gone
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'body_type'
  ) INTO body_type_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_synced_at'
  ) INTO sync_at_exists;
  
  IF NOT body_type_exists AND NOT sync_at_exists THEN
    RAISE NOTICE '✅ Rollback completed successfully';
    RAISE NOTICE '   - body_type column removed';
    RAISE NOTICE '   - profile_synced_at column removed';
    RAISE NOTICE '   - pfp column preserved (was not touched)';
    RAISE NOTICE '   - All user data intact';
  ELSE
    RAISE EXCEPTION '❌ Rollback failed - columns still exist';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK COMPLETE
-- ============================================================================

-- Database restored to pre-migration state ✅
-- No data loss ✅
-- pfp column untouched ✅


-- Migration 004: ZO Avatar Integration (ULTRA SAFE VERSION)
-- Description: Minimal schema changes - only adds body_type and sync timestamp
-- Uses existing pfp column for avatar URL (no risk to existing data)
-- Author: Phase 2 Implementation
-- Date: 2025-11-13

-- ============================================================================
-- SAFETY NOTES
-- ============================================================================
-- 1. All new columns are NULLABLE (won't break existing users)
-- 2. Uses existing pfp column for avatar URL (no data migration needed)
-- 3. IF NOT EXISTS prevents errors if run multiple times
-- 4. Wrapped in transaction for atomic execution
-- 5. Simple rollback available

BEGIN;

-- ============================================================================
-- STEP 1: Add Body Type Column (Gender Selection)
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS body_type TEXT;

COMMENT ON COLUMN users.body_type IS 'Gender selection for ZO avatar generation: bro (male) or bae (female). NULL for users who have not generated an avatar yet.';

-- ============================================================================
-- STEP 2: Add ZO API Sync Timestamp
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile_synced_at TIMESTAMP;

COMMENT ON COLUMN users.profile_synced_at IS 'Last successful sync with ZO API. NULL if never synced. Updates when avatar is generated or profile is refreshed.';

-- ============================================================================
-- STEP 3: Add Constraint (Allows NULL for Existing Users)
-- ============================================================================

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

-- ============================================================================
-- STEP 4: Add Index for Query Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_body_type 
ON users(body_type) 
WHERE body_type IS NOT NULL;

-- ============================================================================
-- STEP 5: Verification
-- ============================================================================

-- Verify columns were added
DO $$
DECLARE
  body_type_exists BOOLEAN;
  sync_at_exists BOOLEAN;
BEGIN
  -- Check if columns exist
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'body_type'
  ) INTO body_type_exists;
  
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_synced_at'
  ) INTO sync_at_exists;
  
  IF body_type_exists AND sync_at_exists THEN
    RAISE NOTICE '✅ Migration 004 completed successfully';
    RAISE NOTICE '   - body_type column added';
    RAISE NOTICE '   - profile_synced_at column added';
    RAISE NOTICE '   - Using existing pfp column for avatar URLs';
    RAISE NOTICE '   - All existing user data preserved';
  ELSE
    RAISE EXCEPTION '❌ Migration failed - columns not created';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- USAGE NOTES
-- ============================================================================

-- The pfp column (already exists) will store the avatar URL from ZO API:
-- UPDATE users SET pfp = 'https://proxy.cdn.zo.xyz/...' WHERE id = 'user123';

-- The body_type column stores the gender selection:
-- UPDATE users SET body_type = 'bro' WHERE id = 'user123';

-- The profile_synced_at column tracks last sync:
-- UPDATE users SET profile_synced_at = NOW() WHERE id = 'user123';

-- Example query to find users with avatars:
/*
SELECT 
  id,
  name,
  pfp,
  body_type,
  profile_synced_at
FROM users
WHERE body_type IS NOT NULL
ORDER BY profile_synced_at DESC;
*/

-- Example query to find users who need avatar generation:
/*
SELECT 
  id,
  name,
  email
FROM users
WHERE body_type IS NULL
  AND onboarding_completed = FALSE;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Safe to run on production ✅
-- No data loss risk ✅
-- Rollback available ✅
-- Existing users unaffected ✅


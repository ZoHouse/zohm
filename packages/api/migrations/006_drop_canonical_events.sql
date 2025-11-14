-- Migration 006 Rollback: Drop Canonical Events Store
-- Reverses 006_create_canonical_events.sql
-- Date: 2025-11-14
-- WARNING: This will delete all canonical event data

BEGIN;

-- ============================================================================
-- Safety check: Confirm this is intentional
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '⚠️  WARNING: About to drop canonical_events tables';
  RAISE NOTICE '⚠️  This will delete all event data and audit trail';
  RAISE NOTICE '⚠️  Press Ctrl+C within 5 seconds to abort...';
  
  -- Optional: Require manual confirmation
  -- PERFORM pg_sleep(5);
END $$;

-- ============================================================================
-- Drop trigger and function
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_update_canonical_events_updated_at ON canonical_events;
DROP FUNCTION IF EXISTS update_canonical_events_updated_at();

-- ============================================================================
-- Drop indexes (cascade handled by table drops, but explicit for clarity)
-- ============================================================================
DROP INDEX IF EXISTS idx_event_changes_event_id;
DROP INDEX IF EXISTS idx_event_changes_created;
DROP INDEX IF EXISTS idx_event_changes_type;
DROP INDEX IF EXISTS idx_canonical_events_geocode_status;
DROP INDEX IF EXISTS idx_canonical_events_uid;
DROP INDEX IF EXISTS idx_canonical_events_location;
DROP INDEX IF EXISTS idx_canonical_events_starts_at;

-- ============================================================================
-- Drop tables (child table first to avoid FK constraint issues)
-- ============================================================================
DROP TABLE IF EXISTS canonical_event_changes CASCADE;
DROP TABLE IF EXISTS canonical_events CASCADE;

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'canonical_events'
  ) THEN
    RAISE NOTICE '✅ canonical_events table dropped successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to drop canonical_events table';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'canonical_event_changes'
  ) THEN
    RAISE NOTICE '✅ canonical_event_changes table dropped successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to drop canonical_event_changes table';
  END IF;
  
  RAISE NOTICE '📋 Rollback complete - Canonical event store removed';
END $$;

COMMIT;


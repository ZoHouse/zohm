-- Migration 006: Create Canonical Events Store
-- Creates tables for canonical event storage with timezone support and audit trail
-- Date: 2025-11-14
-- Rollback: See 006_drop_canonical_events.sql

BEGIN;

-- ============================================================================
-- Main canonical events table
-- ============================================================================
CREATE TABLE IF NOT EXISTS canonical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Deduplication key (SHA256 hash of normalized event data)
  canonical_uid TEXT NOT NULL UNIQUE,
  
  -- Event metadata
  title TEXT NOT NULL,
  description TEXT,
  location_raw TEXT,
  
  -- Geocoded coordinates (cached to reduce API costs)
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geocode_status TEXT DEFAULT 'pending' CHECK (geocode_status IN ('pending', 'success', 'failed', 'cached')),
  geocode_attempted_at TIMESTAMPTZ,
  
  -- Timezone-aware timestamps
  starts_at TIMESTAMPTZ NOT NULL,
  tz TEXT DEFAULT 'UTC',  -- Original timezone from iCal (e.g., 'America/Los_Angeles')
  ends_at TIMESTAMPTZ,
  
  -- Source tracking (array of {calendar_id, event_url, fetched_at})
  source_refs JSONB NOT NULL DEFAULT '[]',
  
  -- Raw iCal data for debugging/re-processing
  raw_payload JSONB,
  
  -- Versioning for audit trail
  event_version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Audit trail table for all event changes
-- ============================================================================
CREATE TABLE IF NOT EXISTS canonical_event_changes (
  id BIGSERIAL PRIMARY KEY,
  
  -- Reference to canonical event (nullable for dry-run logs)
  canonical_event_id UUID REFERENCES canonical_events(id) ON DELETE CASCADE,
  
  -- Change type: 'dry-run', 'insert', 'update', 'delete', 'merge'
  change_type TEXT NOT NULL CHECK (change_type IN ('dry-run', 'insert', 'update', 'delete', 'merge')),
  
  -- Full payload of the change (for audit and rollback)
  payload JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- Performance indexes
-- ============================================================================

-- For chronological queries (upcoming events)
CREATE INDEX IF NOT EXISTS idx_canonical_events_starts_at 
  ON canonical_events (starts_at);

-- For location-based queries (local events within radius)
CREATE INDEX IF NOT EXISTS idx_canonical_events_location 
  ON canonical_events (lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL;

-- For deduplication lookups
CREATE INDEX IF NOT EXISTS idx_canonical_events_uid 
  ON canonical_events (canonical_uid);

-- For geocoding status filtering
CREATE INDEX IF NOT EXISTS idx_canonical_events_geocode_status 
  ON canonical_events (geocode_status);

-- For audit trail queries
CREATE INDEX IF NOT EXISTS idx_event_changes_type 
  ON canonical_event_changes (change_type);

CREATE INDEX IF NOT EXISTS idx_event_changes_created 
  ON canonical_event_changes (created_at);

CREATE INDEX IF NOT EXISTS idx_event_changes_event_id 
  ON canonical_event_changes (canonical_event_id);

-- ============================================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_canonical_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_canonical_events_updated_at
  BEFORE UPDATE ON canonical_events
  FOR EACH ROW
  EXECUTE FUNCTION update_canonical_events_updated_at();

-- ============================================================================
-- Verification
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'canonical_events'
  ) THEN
    RAISE NOTICE '✅ canonical_events table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create canonical_events table';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'canonical_event_changes'
  ) THEN
    RAISE NOTICE '✅ canonical_event_changes table created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create canonical_event_changes table';
  END IF;
  
  RAISE NOTICE '✅ Tables, indexes, and triggers created successfully';
  RAISE NOTICE '📋 Migration 006 complete - Canonical event store ready';
END $$;

COMMIT;


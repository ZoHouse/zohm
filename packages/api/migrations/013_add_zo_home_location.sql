-- Migration 013: Add zo_home_location column to users table
-- Description: Store ZO API home_location (lat/lng) as JSONB for reference
-- Author: Avatar sync enhancement
-- Date: 2025-11-22

-- ============================================================================
-- STEP 1: Add zo_home_location column
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS zo_home_location JSONB;

-- ============================================================================
-- STEP 2: Add Comment Documentation
-- ============================================================================

COMMENT ON COLUMN users.zo_home_location IS 'ZO API home_location object stored as JSONB: { lat: number, lng: number } | null. This is the location from ZO API, stored separately from browser geolocation (lat/lng columns).';

-- ============================================================================
-- STEP 3: Add Index for JSONB queries (optional, for future use)
-- ============================================================================

-- Index for querying by lat/lng within the JSONB object
-- This allows queries like: WHERE zo_home_location->>'lat' IS NOT NULL
CREATE INDEX IF NOT EXISTS idx_users_zo_home_location ON users USING GIN (zo_home_location) WHERE zo_home_location IS NOT NULL;

-- ============================================================================
-- STEP 4: Verification
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' 
    AND column_name = 'zo_home_location'
  ) THEN
    RAISE NOTICE '✅ Column zo_home_location added successfully';
  ELSE
    RAISE EXCEPTION '❌ Column zo_home_location was not added';
  END IF;
END $$;


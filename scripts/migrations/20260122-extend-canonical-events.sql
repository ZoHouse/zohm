-- ============================================
-- Migration: Extend canonical_events table
-- Date: 2026-01-22
-- Purpose: Add columns for community events, hosts, RSVP, and workflow
-- Depends on: 20260122-event-cultures.sql (must run first)
-- ============================================

-- ============================================
-- 1. EVENT CATEGORIZATION
-- ============================================

-- Category: community (user-created), sponsored (partner), ticketed (paid)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'community';

-- Culture reference (links to event_cultures table)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS culture TEXT DEFAULT 'default';

-- Source type: how the event was created
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'ical';

-- ============================================
-- 2. HOST INFORMATION
-- ============================================

-- Host user ID (references users table)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS host_id TEXT;

-- Host type: citizen, founder_member, admin, sponsor, vibe_curator
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS host_type TEXT DEFAULT 'citizen';

-- ============================================
-- 3. CAPACITY & RSVP
-- ============================================

-- Maximum attendees (NULL = unlimited)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

-- Current RSVP count (auto-updated by trigger on event_rsvps)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS current_rsvp_count INTEGER DEFAULT 0;

-- ============================================
-- 4. WORKFLOW STATUS
-- ============================================

-- Submission status: draft, pending, approved, rejected, cancelled
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS submission_status TEXT DEFAULT 'approved';

-- ============================================
-- 5. LOCATION ENHANCEMENTS
-- ============================================

-- Human-readable location name (e.g., "Zo House Bangalore")
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS location_name TEXT;

-- Meeting point details (e.g., "Main entrance, reception desk")
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS meeting_point TEXT;

-- Location type: zo_property, custom, online
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS location_type TEXT DEFAULT 'custom';

-- Reference to Zo property (if location_type = 'zo_property')
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS zo_property_id TEXT;

-- ============================================
-- 6. TICKETED EVENTS
-- ============================================

-- Is this a paid event?
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS is_ticketed BOOLEAN DEFAULT false;

-- Ticket price (if ticketed)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS ticket_price NUMERIC;

-- Ticket currency (default INR)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS ticket_currency TEXT DEFAULT 'INR';

-- ============================================
-- 7. EXTERNAL INTEGRATIONS
-- ============================================

-- External RSVP URL (for sponsored events redirecting to Luma)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS external_rsvp_url TEXT;

-- Luma event ID (for synced Luma events)
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS luma_event_id TEXT;

-- Cover image URL
ALTER TABLE canonical_events ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- ============================================
-- 8. ADD CONSTRAINTS
-- ============================================

-- Category constraint
DO $$ BEGIN
  ALTER TABLE canonical_events ADD CONSTRAINT chk_ce_category 
    CHECK (category IN ('community', 'sponsored', 'ticketed'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Submission status constraint
DO $$ BEGIN
  ALTER TABLE canonical_events ADD CONSTRAINT chk_ce_submission_status 
    CHECK (submission_status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Host type constraint
DO $$ BEGIN
  ALTER TABLE canonical_events ADD CONSTRAINT chk_ce_host_type 
    CHECK (host_type IN ('citizen', 'founder_member', 'admin', 'sponsor', 'vibe_curator'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Location type constraint
DO $$ BEGIN
  ALTER TABLE canonical_events ADD CONSTRAINT chk_ce_location_type 
    CHECK (location_type IN ('zo_property', 'custom', 'online'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Source type constraint
DO $$ BEGIN
  ALTER TABLE canonical_events ADD CONSTRAINT chk_ce_source_type 
    CHECK (source_type IN ('ical', 'luma', 'community', 'activity_manager', 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 9. ADD FOREIGN KEYS
-- ============================================

-- Foreign key to users table for host
DO $$ BEGIN
  ALTER TABLE canonical_events ADD CONSTRAINT fk_ce_host 
    FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign key to event_cultures table
-- Note: Run this AFTER event_cultures table exists and is populated
DO $$ BEGIN
  ALTER TABLE canonical_events ADD CONSTRAINT fk_ce_culture 
    FOREIGN KEY (culture) REFERENCES event_cultures(slug) ON DELETE SET DEFAULT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 10. ADD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_ce_category ON canonical_events(category);
CREATE INDEX IF NOT EXISTS idx_ce_culture ON canonical_events(culture);
CREATE INDEX IF NOT EXISTS idx_ce_host ON canonical_events(host_id);
CREATE INDEX IF NOT EXISTS idx_ce_status ON canonical_events(submission_status);
CREATE INDEX IF NOT EXISTS idx_ce_source_type ON canonical_events(source_type);
CREATE INDEX IF NOT EXISTS idx_ce_ticketed ON canonical_events(is_ticketed) WHERE is_ticketed = true;

-- Composite index for approved events (most common query)
-- Note: Cannot use NOW() in partial index - use query-time filtering instead
CREATE INDEX IF NOT EXISTS idx_ce_approved_starts ON canonical_events(starts_at, submission_status) 
  WHERE submission_status = 'approved';

-- ============================================
-- 11. UPDATE EXISTING EVENTS
-- ============================================

-- Set default values for existing iCal-imported events
UPDATE canonical_events 
SET 
  category = 'sponsored',
  source_type = 'ical',
  submission_status = 'approved'
WHERE source_type IS NULL OR source_type = 'ical';

-- ============================================
-- Verify changes
-- ============================================
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'canonical_events' 
-- ORDER BY ordinal_position;

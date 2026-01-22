-- ============================================
-- Migration: Create event_rsvps table
-- Date: 2026-01-22
-- Purpose: Track event RSVPs with auto-updating count
-- Depends on: canonical_events table must exist
-- ============================================

-- ============================================
-- 1. CREATE RSVP TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS event_rsvps (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event reference
  event_id UUID NOT NULL,
  
  -- User reference
  user_id TEXT NOT NULL,
  
  -- RSVP status: going, interested, not_going, waitlist
  status TEXT NOT NULL DEFAULT 'going',
  
  -- RSVP type: standard, vip, speaker, organizer, host
  rsvp_type TEXT DEFAULT 'standard',
  
  -- Check-in tracking
  checked_in BOOLEAN DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,  -- Admin/organizer who checked them in
  
  -- Notes (for organizers)
  notes TEXT,
  
  -- Metadata (ticket info, etc.)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ADD CONSTRAINTS
-- ============================================

-- Unique constraint: one RSVP per user per event
DO $$ BEGIN
  ALTER TABLE event_rsvps ADD CONSTRAINT unique_user_event 
    UNIQUE (event_id, user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RSVP status constraint
DO $$ BEGIN
  ALTER TABLE event_rsvps ADD CONSTRAINT chk_rsvp_status 
    CHECK (status IN ('going', 'interested', 'not_going', 'waitlist', 'cancelled'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RSVP type constraint
DO $$ BEGIN
  ALTER TABLE event_rsvps ADD CONSTRAINT chk_rsvp_type 
    CHECK (rsvp_type IN ('standard', 'vip', 'speaker', 'organizer', 'host'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign key to canonical_events
DO $$ BEGIN
  ALTER TABLE event_rsvps ADD CONSTRAINT fk_rsvp_event 
    FOREIGN KEY (event_id) REFERENCES canonical_events(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Foreign key to users
DO $$ BEGIN
  ALTER TABLE event_rsvps ADD CONSTRAINT fk_rsvp_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. ADD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_user ON event_rsvps(user_id);
CREATE INDEX IF NOT EXISTS idx_rsvps_status ON event_rsvps(status);
CREATE INDEX IF NOT EXISTS idx_rsvps_checked_in ON event_rsvps(event_id, checked_in) WHERE checked_in = true;

-- Composite index for user's upcoming RSVPs
CREATE INDEX IF NOT EXISTS idx_rsvps_user_status ON event_rsvps(user_id, status);

-- ============================================
-- 4. AUTO-UPDATE TRIGGER
-- Purpose: Automatically update current_rsvp_count on canonical_events
-- ============================================

-- Create or replace the function
CREATE OR REPLACE FUNCTION update_event_rsvp_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update count for INSERT or UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE canonical_events 
    SET 
      current_rsvp_count = (
        SELECT COUNT(*) 
        FROM event_rsvps 
        WHERE event_id = NEW.event_id 
          AND status IN ('going', 'waitlist')
      ),
      updated_at = NOW()
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  
  -- Update count for DELETE
  IF TG_OP = 'DELETE' THEN
    UPDATE canonical_events 
    SET 
      current_rsvp_count = (
        SELECT COUNT(*) 
        FROM event_rsvps 
        WHERE event_id = OLD.event_id 
          AND status IN ('going', 'waitlist')
      ),
      updated_at = NOW()
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS trigger_update_rsvp_count ON event_rsvps;

CREATE TRIGGER trigger_update_rsvp_count
AFTER INSERT OR UPDATE OR DELETE ON event_rsvps
FOR EACH ROW EXECUTE FUNCTION update_event_rsvp_count();

-- ============================================
-- 5. AUTO-UPDATE updated_at TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_rsvp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_rsvp_updated_at ON event_rsvps;

CREATE TRIGGER trigger_rsvp_updated_at
BEFORE UPDATE ON event_rsvps
FOR EACH ROW EXECUTE FUNCTION update_rsvp_updated_at();

-- ============================================
-- 6. RLS POLICIES (Enable Row Level Security)
-- ============================================

-- Enable RLS
ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Users can create own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Users can update own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Users can delete own RSVPs" ON event_rsvps;
DROP POLICY IF EXISTS "Public can view RSVPs for approved events" ON event_rsvps;

-- Policy: Users can view their own RSVPs
CREATE POLICY "Users can view own RSVPs"
  ON event_rsvps FOR SELECT
  USING (user_id = current_user OR user_id = (current_setting('app.current_user_id', true)));

-- Policy: Users can create their own RSVPs
CREATE POLICY "Users can create own RSVPs"
  ON event_rsvps FOR INSERT
  WITH CHECK (user_id = current_user OR user_id = (current_setting('app.current_user_id', true)));

-- Policy: Users can update their own RSVPs
CREATE POLICY "Users can update own RSVPs"
  ON event_rsvps FOR UPDATE
  USING (user_id = current_user OR user_id = (current_setting('app.current_user_id', true)));

-- Policy: Users can delete their own RSVPs
CREATE POLICY "Users can delete own RSVPs"
  ON event_rsvps FOR DELETE
  USING (user_id = current_user OR user_id = (current_setting('app.current_user_id', true)));

-- Policy: Anyone can view RSVPs for approved events (for attendee counts)
CREATE POLICY "Public can view RSVPs for approved events"
  ON event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM canonical_events 
      WHERE canonical_events.id = event_rsvps.event_id 
        AND canonical_events.submission_status = 'approved'
    )
  );

-- ============================================
-- Verify creation
-- ============================================
-- SELECT * FROM event_rsvps LIMIT 1;
-- SELECT tgname FROM pg_trigger WHERE tgrelid = 'event_rsvps'::regclass;

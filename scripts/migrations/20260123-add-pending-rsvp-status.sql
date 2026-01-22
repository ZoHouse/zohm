-- ============================================
-- Migration: Add 'pending', 'approved', 'rejected' to RSVP status
-- Date: 2026-01-23
-- Purpose: Support RSVP approval workflow where users start as 'pending'
--          and hosts can approve/reject RSVPs
-- ============================================

-- Drop the old constraint
ALTER TABLE event_rsvps DROP CONSTRAINT IF EXISTS chk_rsvp_status;

-- Add new constraint with additional statuses
ALTER TABLE event_rsvps ADD CONSTRAINT chk_rsvp_status
  CHECK (status IN ('pending', 'going', 'interested', 'not_going', 'waitlist', 'cancelled', 'approved', 'rejected'));

-- Update the default status from 'going' to 'interested' for new RSVPs
-- 'interested' means waiting for host approval
ALTER TABLE event_rsvps ALTER COLUMN status SET DEFAULT 'interested';

-- ============================================
-- Update the trigger to count 'approved' as 'going'
-- (Since 'approved' and 'going' should both count toward capacity)
-- ============================================

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
          AND status IN ('going', 'approved')
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
          AND status IN ('going', 'approved')
      ),
      updated_at = NOW()
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verify the changes
-- ============================================
-- SELECT conname, pg_get_constraintdef(oid)
-- FROM pg_constraint
-- WHERE conrelid = 'event_rsvps'::regclass AND conname = 'chk_rsvp_status';

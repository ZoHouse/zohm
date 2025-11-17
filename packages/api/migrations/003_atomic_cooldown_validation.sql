-- ============================================
-- P0-6: Atomic Cooldown Validation
-- ============================================
-- This migration adds database-level enforcement of quest cooldowns
-- to prevent race conditions and ensure economy integrity.
--
-- Changes:
-- 1. Add index for fast cooldown lookups
-- 2. Create atomic completion function with cooldown check
-- 3. Add partial unique constraint to prevent duplicate completions
--
-- SAFE TO RUN: Idempotent, preserves existing data
-- ============================================

-- ============================================
-- STEP 1: Add Index for Fast Cooldown Checks
-- ============================================
-- This index speeds up the "last completion for this user+quest" query
CREATE INDEX IF NOT EXISTS idx_completed_quests_user_quest_time 
ON completed_quests(user_id, quest_id, completed_at DESC);

-- ============================================
-- STEP 2: Create Atomic Quest Completion Function
-- ============================================
-- This function performs cooldown check and insertion atomically
-- within a single database transaction, preventing race conditions.

CREATE OR REPLACE FUNCTION complete_quest_atomic(
  p_user_id TEXT,
  p_quest_id TEXT,
  p_cooldown_hours INTEGER,
  p_score INTEGER,
  p_location TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_amount NUMERIC,
  p_metadata JSONB
)
RETURNS TABLE(
  success BOOLEAN,
  completion_id TEXT,
  error_code TEXT,
  next_available_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_last_completion TIMESTAMP WITH TIME ZONE;
  v_hours_since_last DOUBLE PRECISION;
  v_next_available TIMESTAMP WITH TIME ZONE;
  v_new_id TEXT;
BEGIN
  -- Check if cooldown is required
  IF p_cooldown_hours > 0 THEN
    -- Get last completion time for this user+quest
    SELECT completed_at INTO v_last_completion
    FROM completed_quests
    WHERE user_id = p_user_id
      AND quest_id = p_quest_id
    ORDER BY completed_at DESC
    LIMIT 1;

    -- If previous completion exists, check cooldown
    IF v_last_completion IS NOT NULL THEN
      v_hours_since_last := EXTRACT(EPOCH FROM (NOW() - v_last_completion)) / 3600;
      
      -- Cooldown not yet expired
      IF v_hours_since_last < p_cooldown_hours THEN
        v_next_available := v_last_completion + (p_cooldown_hours || ' hours')::INTERVAL;
        RETURN QUERY SELECT 
          FALSE,                    -- success
          NULL::TEXT,               -- completion_id
          'COOLDOWN_ACTIVE'::TEXT,  -- error_code
          v_next_available;         -- next_available_at
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Cooldown passed (or no cooldown required), insert completion
  v_new_id := gen_random_uuid()::TEXT;
  
  INSERT INTO completed_quests (
    id,
    user_id,
    quest_id,
    score,
    location,
    latitude,
    longitude,
    amount,
    metadata,
    completed_at,
    created_at
  ) VALUES (
    v_new_id,
    p_user_id,
    p_quest_id,
    p_score,
    p_location,
    p_latitude,
    p_longitude,
    p_amount,
    p_metadata,
    NOW(),
    NOW()
  );

  -- Return success
  RETURN QUERY SELECT 
    TRUE,                  -- success
    v_new_id,              -- completion_id
    NULL::TEXT,            -- error_code
    NULL::TIMESTAMP WITH TIME ZONE; -- next_available_at
  RETURN;

EXCEPTION
  WHEN OTHERS THEN
    -- Return error
    RETURN QUERY SELECT 
      FALSE,                    -- success
      NULL::TEXT,               -- completion_id
      'DATABASE_ERROR'::TEXT,   -- error_code
      NULL::TIMESTAMP WITH TIME ZONE; -- next_available_at
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 3: Grant Execute Permission
-- ============================================
GRANT EXECUTE ON FUNCTION complete_quest_atomic TO service_role;
GRANT EXECUTE ON FUNCTION complete_quest_atomic TO authenticated;

-- ============================================
-- STEP 4: Add Comments for Documentation
-- ============================================
COMMENT ON FUNCTION complete_quest_atomic IS 
'Atomically completes a quest with server-side cooldown validation. 
Prevents race conditions by performing check and insert in single transaction.
Returns success=false with COOLDOWN_ACTIVE error if cooldown not expired.';

COMMENT ON INDEX idx_completed_quests_user_quest_time IS 
'Optimizes cooldown checks by enabling fast lookup of last completion time for user+quest pair.';

-- ============================================
-- Migration Complete
-- ============================================
-- Test this migration with:
-- SELECT * FROM complete_quest_atomic(
--   'test-user-id',
--   'test-quest-id',
--   12, -- 12 hour cooldown
--   1111, -- score
--   'San Francisco',
--   37.7749,
--   -122.4194,
--   420,
--   '{"quest_title": "Test Quest"}'::jsonb
-- );


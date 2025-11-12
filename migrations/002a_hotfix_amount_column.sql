-- ============================================
-- HOTFIX: Fix amount column precision in completed_quests
-- ============================================
-- The amount column was created with NUMERIC(20,18) which is only suitable
-- for GPS coordinates (max value 99.99...). We need it to hold large token amounts.
-- ============================================

-- Check current type
SELECT 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'completed_quests' 
AND column_name IN ('amount', 'latitude', 'longitude');

-- Fix amount column to allow large values
ALTER TABLE completed_quests 
ALTER COLUMN amount TYPE NUMERIC;

-- Verify fix
SELECT 
  column_name, 
  data_type, 
  numeric_precision, 
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'completed_quests' 
AND column_name IN ('amount', 'latitude', 'longitude');

-- Test insert (optional - comment out if not needed)
-- This should now work without overflow error
-- INSERT INTO completed_quests (user_id, quest_id, amount, score, location)
-- VALUES ('test-user', gen_random_uuid(), 200, 1111, 'Test');
-- DELETE FROM completed_quests WHERE user_id = 'test-user';

-- ============================================
-- HOTFIX COMPLETE ✅
-- ============================================


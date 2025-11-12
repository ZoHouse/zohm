-- ============================================
-- HOTFIX: Add unique constraint on user_id in leaderboards
-- ============================================
-- The trigger uses ON CONFLICT (user_id) but there's no unique constraint.
-- We need to add it so the trigger can upsert leaderboard entries by user_id.
-- ============================================

-- Check existing constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'leaderboards'::regclass;

-- Check if unique constraint already exists on user_id
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'leaderboards'
AND indexdef LIKE '%user_id%';

-- Add unique constraint on user_id
ALTER TABLE leaderboards
ADD CONSTRAINT leaderboards_user_id_unique UNIQUE (user_id);

-- Verify the constraint was added
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'leaderboards'::regclass
AND conname = 'leaderboards_user_id_unique';

-- ============================================
-- HOTFIX COMPLETE ✅
-- ============================================
-- Now the trigger can use ON CONFLICT (user_id) DO UPDATE


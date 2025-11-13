-- ============================================
-- HOTFIX: Make wallet column nullable in leaderboards
-- ============================================
-- We're moving to user-based identity (user_id) instead of wallet-based.
-- The wallet column should be nullable since not all users have wallets,
-- and user_id is now the primary identifier.
-- ============================================

-- Check current constraint
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'leaderboards' 
AND column_name IN ('user_id', 'wallet', 'username');

-- Make wallet column nullable (it's no longer the primary identifier)
ALTER TABLE leaderboards 
ALTER COLUMN wallet DROP NOT NULL;

-- Verify fix
SELECT 
  column_name, 
  is_nullable, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'leaderboards' 
AND column_name IN ('user_id', 'wallet', 'username');

-- ============================================
-- HOTFIX COMPLETE ✅
-- ============================================
-- Now the trigger can insert records with NULL wallet if user has no wallet



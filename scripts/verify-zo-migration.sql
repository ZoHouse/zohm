-- Verify ZO Migration 010 was applied successfully
-- Run this in Supabase SQL Editor

-- Check 1: ZO Identity columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name LIKE 'zo_%'
ORDER BY column_name;

-- Check 2: Indexes were created
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'users'
  AND indexname LIKE '%zo%'
ORDER BY indexname;

-- Check 3: Migration tracking table exists
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'privy_to_zo_migration'
ORDER BY column_name;

-- Check 4: Phone auth method added to user_auth_methods
SELECT 
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%auth_type%';

-- Expected Results:
-- ✅ Should see: zo_user_id, zo_pid, zo_token, zo_refresh_token, etc.
-- ✅ Should see: idx_users_zo_user_id, idx_users_zo_pid, etc.
-- ✅ Should see: privy_to_zo_migration table
-- ✅ Should see: 'phone' in auth_type check constraint


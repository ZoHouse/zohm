-- Check if zo_device_id and zo_device_secret columns exist
-- Run this in Supabase SQL Editor

-- Check 1: Verify device credential columns exist
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('zo_device_id', 'zo_device_secret')
ORDER BY column_name;

-- Check 2: Verify ALL ZO columns exist (full list)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name LIKE 'zo_%'
ORDER BY column_name;

-- Check 3: Test if you can query device columns (will fail if columns don't exist)
SELECT 
  id,
  zo_user_id,
  zo_device_id,
  zo_device_secret,
  zo_sync_status
FROM users
LIMIT 1;

-- Expected Results:
-- ✅ Should see: zo_device_id (text, nullable)
-- ✅ Should see: zo_device_secret (text, nullable)
-- ✅ Should see: All other zo_* columns
-- ✅ Query should succeed (even if all values are NULL)


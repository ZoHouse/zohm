-- Script to verify all ZO API verify-otp response fields are stored in database
-- Run this in Supabase SQL Editor to check column coverage

-- Check if all required columns exist (public schema only)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN (
    -- From verify-otp response root level
    'zo_legacy_token',              -- token
    'zo_legacy_token_valid_till',   -- valid_till
    'zo_token',                     -- access_token
    'zo_token_expiry',              -- access_token_expiry
    'zo_refresh_token',             -- refresh_token
    'zo_refresh_token_expiry',      -- refresh_token_expiry
    'zo_client_key',                -- client_key
    'zo_device_id',                 -- device_id
    'zo_device_secret',             -- device_secret
    'zo_device_info',               -- device_info
    
    -- From verify-otp response user object
    'zo_user_id',                   -- user.id
    'zo_pid',                       -- user.pid
    'name',                         -- user.first_name + user.last_name (combined)
    'primary_wallet_address',       -- user.wallet_address
    'phone',                        -- user.mobile_number
    'email',                        -- user.email_address
    'zo_roles',                     -- user.roles (array)
    'zo_membership'                 -- user.membership
  )
ORDER BY column_name;

-- Summary: Count how many columns exist vs expected
WITH expected_list AS (
  SELECT unnest(ARRAY[
    'zo_legacy_token',
    'zo_legacy_token_valid_till',
    'zo_token',
    'zo_token_expiry',
    'zo_refresh_token',
    'zo_refresh_token_expiry',
    'zo_client_key',
    'zo_device_id',
    'zo_device_secret',
    'zo_device_info',
    'zo_user_id',
    'zo_pid',
    'name',
    'primary_wallet_address',
    'phone',
    'email',
    'zo_roles',
    'zo_membership'
  ]) as col_name
),
existing_list AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name IN (SELECT col_name FROM expected_list)
)
SELECT 
  (SELECT COUNT(*) FROM existing_list) as existing_columns,
  (SELECT COUNT(*) FROM expected_list) as expected_columns,
  CASE 
    WHEN (SELECT COUNT(*) FROM existing_list) = (SELECT COUNT(*) FROM expected_list) 
    THEN '✅ All columns exist'
    WHEN (SELECT COUNT(*) FROM existing_list) > (SELECT COUNT(*) FROM expected_list)
    THEN '⚠️ Found ' || ((SELECT COUNT(*) FROM existing_list) - (SELECT COUNT(*) FROM expected_list))::text || ' extra columns'
    ELSE '❌ Missing ' || ((SELECT COUNT(*) FROM expected_list) - (SELECT COUNT(*) FROM existing_list))::text || ' columns'
  END as status;

-- Show which columns are MISSING (expected but not found)
WITH expected_list AS (
  SELECT unnest(ARRAY[
    'zo_legacy_token',
    'zo_legacy_token_valid_till',
    'zo_token',
    'zo_token_expiry',
    'zo_refresh_token',
    'zo_refresh_token_expiry',
    'zo_client_key',
    'zo_device_id',
    'zo_device_secret',
    'zo_device_info',
    'zo_user_id',
    'zo_pid',
    'name',
    'primary_wallet_address',
    'phone',
    'email',
    'zo_roles',
    'zo_membership'
  ]) as col_name
),
existing_list AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'users'
    AND column_name IN (SELECT col_name FROM expected_list)
)
SELECT 
  '❌ MISSING' as status,
  el.col_name as column_name
FROM expected_list el
LEFT JOIN existing_list ex ON el.col_name = ex.column_name
WHERE ex.column_name IS NULL
ORDER BY el.col_name;

-- Show which columns EXIST (for verification) - with schema info
WITH expected_list AS (
  SELECT unnest(ARRAY[
    'zo_legacy_token',
    'zo_legacy_token_valid_till',
    'zo_token',
    'zo_token_expiry',
    'zo_refresh_token',
    'zo_refresh_token_expiry',
    'zo_client_key',
    'zo_device_id',
    'zo_device_secret',
    'zo_device_info',
    'zo_user_id',
    'zo_pid',
    'name',
    'primary_wallet_address',
    'phone',
    'email',
    'zo_roles',
    'zo_membership'
  ]) as col_name
)
SELECT 
  '✅ EXISTS' as status,
  ic.table_schema,
  ic.column_name,
  ic.data_type,
  ic.is_nullable
FROM information_schema.columns ic
WHERE ic.table_schema = 'public'
  AND ic.table_name = 'users'
  AND ic.column_name IN (SELECT col_name FROM expected_list)
ORDER BY ic.column_name;

-- Note: This query shows columns in public schema only
-- Supabase has separate users tables in 'auth' and 'public' schemas
-- We only care about the 'public' schema for application data
SELECT 
  'ℹ️ INFO' as status,
  'All columns checked in public.users table only' as message,
  'auth.users table is separate (Supabase auth system)' as note;

-- Script to verify all ZO API data was stored for a specific user
-- Replace '5fe9695677ff484aa1ad6bbba9828a91' with the actual zo_user_id

-- Check all ZO fields for the user
SELECT 
  -- Identity
  zo_user_id,
  zo_pid,
  
  -- Auth tokens
  zo_token IS NOT NULL as has_access_token,
  zo_token_expiry,
  zo_refresh_token IS NOT NULL as has_refresh_token,
  zo_refresh_token_expiry,
  zo_legacy_token IS NOT NULL as has_legacy_token,
  zo_legacy_token_valid_till,
  
  -- Device credentials
  zo_device_id,
  zo_device_secret IS NOT NULL as has_device_secret,
  zo_client_key,
  zo_device_info,
  
  -- User data
  name,
  email,
  phone,
  primary_wallet_address,
  zo_roles,
  zo_membership,
  
  -- Sync status
  zo_synced_at,
  zo_sync_status
  
FROM users
WHERE zo_user_id = '5fe9695677ff484aa1ad6bbba9828a91'
   OR id = '5fe9695677ff484aa1ad6bbba9828a91';

-- Check if all expected fields have values
SELECT 
  COUNT(*) FILTER (WHERE zo_user_id IS NOT NULL) as has_zo_user_id,
  COUNT(*) FILTER (WHERE zo_pid IS NOT NULL) as has_zo_pid,
  COUNT(*) FILTER (WHERE zo_token IS NOT NULL) as has_zo_token,
  COUNT(*) FILTER (WHERE zo_refresh_token IS NOT NULL) as has_refresh_token,
  COUNT(*) FILTER (WHERE zo_device_id IS NOT NULL) as has_device_id,
  COUNT(*) FILTER (WHERE zo_device_secret IS NOT NULL) as has_device_secret,
  COUNT(*) FILTER (WHERE zo_legacy_token IS NOT NULL) as has_legacy_token,
  COUNT(*) FILTER (WHERE zo_client_key IS NOT NULL) as has_client_key,
  COUNT(*) FILTER (WHERE zo_device_info IS NOT NULL) as has_device_info,
  COUNT(*) FILTER (WHERE zo_roles IS NOT NULL) as has_roles,
  COUNT(*) FILTER (WHERE zo_membership IS NOT NULL) as has_membership,
  COUNT(*) FILTER (WHERE name IS NOT NULL) as has_name,
  COUNT(*) FILTER (WHERE email IS NOT NULL) as has_email,
  COUNT(*) FILTER (WHERE phone IS NOT NULL) as has_phone,
  COUNT(*) FILTER (WHERE primary_wallet_address IS NOT NULL) as has_wallet
FROM users
WHERE zo_user_id = '5fe9695677ff484aa1ad6bbba9828a91'
   OR id = '5fe9695677ff484aa1ad6bbba9828a91';


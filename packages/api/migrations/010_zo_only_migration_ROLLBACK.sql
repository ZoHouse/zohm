-- 010_zo_only_migration_ROLLBACK.sql
-- Rollback script for migration 010

BEGIN;

-- Drop ZO columns
ALTER TABLE users
  DROP COLUMN IF EXISTS zo_user_id,
  DROP COLUMN IF EXISTS zo_pid,
  DROP COLUMN IF EXISTS zo_token,
  DROP COLUMN IF EXISTS zo_token_expiry,
  DROP COLUMN IF EXISTS zo_refresh_token,
  DROP COLUMN IF EXISTS zo_refresh_token_expiry,
  DROP COLUMN IF EXISTS zo_device_id,
  DROP COLUMN IF EXISTS zo_device_secret,
  DROP COLUMN IF EXISTS primary_wallet_address,
  DROP COLUMN IF EXISTS wallet_chain_id,
  DROP COLUMN IF EXISTS balance_last_synced_at,
  DROP COLUMN IF EXISTS cultures,
  DROP COLUMN IF EXISTS zo_synced_at,
  DROP COLUMN IF EXISTS zo_sync_status;

-- Drop migration table
DROP TABLE IF EXISTS privy_to_zo_migration;

-- Revert auth method constraint
ALTER TABLE user_auth_methods
  DROP CONSTRAINT IF EXISTS user_auth_methods_auth_type_check;

ALTER TABLE user_auth_methods
  ADD CONSTRAINT user_auth_methods_auth_type_check 
  CHECK (auth_type IN ('email', 'google', 'twitter', 'discord', 'farcaster', 'wallet'));

COMMIT;


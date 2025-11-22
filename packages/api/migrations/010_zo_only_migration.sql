-- 010_zo_only_migration.sql
-- ZO-Only Identity Migration (Clean Cut from Privy)
-- Phase 1: Add ZO Identity columns while keeping Privy temporarily for migration

BEGIN;

-- STEP 1: Add ZO Identity columns (will replace Privy ID)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS zo_user_id TEXT UNIQUE,        -- Will become PRIMARY KEY
  ADD COLUMN IF NOT EXISTS zo_pid TEXT UNIQUE,            -- Secondary identifier
  
  -- Add ZO Auth tokens
  ADD COLUMN IF NOT EXISTS zo_token TEXT,                 -- JWT access token
  ADD COLUMN IF NOT EXISTS zo_token_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zo_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS zo_refresh_token_expiry TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zo_device_id TEXT,
  ADD COLUMN IF NOT EXISTS zo_device_secret TEXT,
  
  -- Add wallet tracking for token balance
  ADD COLUMN IF NOT EXISTS primary_wallet_address TEXT,
  ADD COLUMN IF NOT EXISTS wallet_chain_id INTEGER DEFAULT 8453,  -- Base mainnet
  ADD COLUMN IF NOT EXISTS balance_last_synced_at TIMESTAMPTZ,
  
  -- Add cultures (JSONB array, replaces TEXT column)
  ADD COLUMN IF NOT EXISTS cultures JSONB DEFAULT '[]',
  
  -- Add sync metadata
  ADD COLUMN IF NOT EXISTS zo_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zo_sync_status TEXT DEFAULT 'never' 
    CHECK (zo_sync_status IN ('never', 'synced', 'stale', 'error'));

-- STEP 2: Create temporary migration tracking table
CREATE TABLE IF NOT EXISTS privy_to_zo_migration (
  privy_id TEXT PRIMARY KEY,
  zo_user_id TEXT NOT NULL,
  migrated_at TIMESTAMPTZ DEFAULT NOW(),
  migration_method TEXT CHECK (migration_method IN ('linked_phone', 'manual', 'support')),
  old_data JSONB  -- Backup of old user data
);

-- STEP 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_users_zo_user_id ON users(zo_user_id);
CREATE INDEX IF NOT EXISTS idx_users_zo_pid ON users(zo_pid);
CREATE INDEX IF NOT EXISTS idx_users_zo_synced_at ON users(zo_synced_at);
CREATE INDEX IF NOT EXISTS idx_users_zo_sync_status ON users(zo_sync_status);
CREATE INDEX IF NOT EXISTS idx_users_wallet_address ON users(primary_wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_balance_synced ON users(balance_last_synced_at);
CREATE INDEX IF NOT EXISTS idx_migration_zo_user_id ON privy_to_zo_migration(zo_user_id);

-- STEP 4: Add phone auth method type
ALTER TABLE user_auth_methods
  DROP CONSTRAINT IF EXISTS user_auth_methods_auth_type_check;

ALTER TABLE user_auth_methods
  ADD CONSTRAINT user_auth_methods_auth_type_check 
  CHECK (auth_type IN ('email', 'google', 'twitter', 'discord', 'farcaster', 'wallet', 'phone'));

-- STEP 5: Migrate existing culture data (TEXT → JSONB)
UPDATE users
SET cultures = jsonb_build_array(
  jsonb_build_object(
    'key', lower(replace(culture, ' ', '-')),
    'name', culture
  )
)
WHERE culture IS NOT NULL AND culture != '' AND cultures = '[]';

-- STEP 6: Mark all existing users as needing migration
UPDATE users
SET zo_sync_status = 'never'
WHERE zo_user_id IS NULL;

COMMIT;

-- NOTE: After all users migrated (Week 4), run:
-- packages/api/migrations/011_drop_privy_columns.sql


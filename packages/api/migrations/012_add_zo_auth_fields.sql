-- Migration 012: Add additional ZO auth fields for complete profile upsert
-- Description: Store all fields from ZO API verify-otp response for easier profile management
-- Date: 2025-11-20

BEGIN;

-- Add missing ZO auth fields
ALTER TABLE users
  -- Legacy token fields (from ZO API response)
  ADD COLUMN IF NOT EXISTS zo_legacy_token TEXT,              -- Legacy token field
  ADD COLUMN IF NOT EXISTS zo_legacy_token_valid_till TIMESTAMPTZ,  -- Legacy token expiry
  
  -- Client key (for API calls)
  ADD COLUMN IF NOT EXISTS zo_client_key TEXT,                 -- Client key used for auth
  
  -- Device info (JSONB from ZO API)
  ADD COLUMN IF NOT EXISTS zo_device_info JSONB DEFAULT '{}',   -- Device info from ZO API
  
  -- User roles (JSONB array from ZO API user.roles)
  ADD COLUMN IF NOT EXISTS zo_roles JSONB DEFAULT '[]',         -- Array of user roles from ZO API
  -- Membership (from ZO API user.membership)
  ADD COLUMN IF NOT EXISTS zo_membership TEXT;                  -- ZO API membership: 'founder' | 'citizen' | 'none'

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_users_zo_client_key ON users(zo_client_key);
CREATE INDEX IF NOT EXISTS idx_users_zo_roles ON users USING GIN(zo_roles);

-- Add comments
COMMENT ON COLUMN users.zo_legacy_token IS 'Legacy token from ZO API (deprecated, use zo_token)';
COMMENT ON COLUMN users.zo_legacy_token_valid_till IS 'Legacy token expiry timestamp';
COMMENT ON COLUMN users.zo_client_key IS 'Client key used for ZO API authentication';
COMMENT ON COLUMN users.zo_device_info IS 'Device info JSON from ZO API response';
COMMENT ON COLUMN users.zo_roles IS 'Array of user roles from ZO API (e.g., ["property-manager", "housekeeping-admin"])';
COMMENT ON COLUMN users.zo_membership IS 'ZO API membership value: founder, citizen, or none (stored as-is, separate from role column)';

COMMIT;


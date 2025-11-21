-- Rollback script for Migration 012: Add additional ZO auth fields
-- Description: Remove additional ZO auth fields added for complete profile upsert
-- Date: 2025-11-20

BEGIN;

-- Drop indexes first
DROP INDEX IF EXISTS idx_users_zo_client_key;
DROP INDEX IF EXISTS idx_users_zo_roles;

-- Remove columns
ALTER TABLE users
  DROP COLUMN IF EXISTS zo_legacy_token,
  DROP COLUMN IF EXISTS zo_legacy_token_valid_till,
  DROP COLUMN IF EXISTS zo_client_key,
  DROP COLUMN IF EXISTS zo_device_info,
  DROP COLUMN IF EXISTS zo_roles;

COMMIT;


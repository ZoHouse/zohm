-- 011_drop_privy_columns_ROLLBACK.sql
-- ROLLBACK script for migration 011
-- WARNING: This cannot fully restore Privy functionality without data backup

BEGIN;

-- STEP 1: Recreate Privy ID column
ALTER TABLE users
  ADD COLUMN privy_id_deprecated TEXT,
  ADD COLUMN culture TEXT;

-- STEP 2: Restore from migration archive table (if available)
UPDATE users u
SET privy_id_deprecated = m.privy_id
FROM privy_to_zo_migration m
WHERE u.id = m.zo_user_id;

-- STEP 3: Revert auth method constraint
ALTER TABLE user_auth_methods
  DROP CONSTRAINT IF EXISTS user_auth_methods_auth_type_check;

ALTER TABLE user_auth_methods
  ADD CONSTRAINT user_auth_methods_auth_type_check 
  CHECK (auth_type IN ('email', 'google', 'twitter', 'discord', 'farcaster', 'wallet', 'phone'));

COMMIT;

-- NOTE: This rollback is incomplete. Full restoration would require:
-- 1. Restore Privy wallets from backup
-- 2. Restore Privy auth methods from backup
-- 3. Switch primary key back to privy_id (complex)
-- 
-- It's highly recommended to NOT run this migration until you're 100% confident.
-- Keep full database backup before running migration 011.


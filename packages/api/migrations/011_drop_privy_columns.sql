-- 011_drop_privy_columns.sql
-- DANGER: Run ONLY after 90%+ users migrated to ZO
-- Week 4: Final step to make ZO the only identity system

BEGIN;

-- STEP 1: Verify migration completion
DO $$
DECLARE
  total_users INTEGER;
  migrated_users INTEGER;
  migration_percentage NUMERIC;
BEGIN
  SELECT COUNT(*) INTO total_users FROM users;
  SELECT COUNT(*) INTO migrated_users FROM users WHERE zo_user_id IS NOT NULL;
  
  migration_percentage := (migrated_users::NUMERIC / total_users::NUMERIC) * 100;
  
  IF migration_percentage < 90 THEN
    RAISE EXCEPTION 'Migration incomplete: only % %% migrated. Need 90%% before dropping Privy columns.', 
      ROUND(migration_percentage, 2);
  END IF;
  
  RAISE NOTICE 'Migration verified: % %% migrated (% / % users)', 
    ROUND(migration_percentage, 2), migrated_users, total_users;
END $$;

-- STEP 2: Make zo_user_id NOT NULL (enforce all users have ZO identity)
ALTER TABLE users
  ALTER COLUMN zo_user_id SET NOT NULL;

-- STEP 3: Switch primary key from Privy ID to ZO user ID
-- (This is complex and requires careful ordering)

-- 3a. Drop foreign key constraints referencing users.id
ALTER TABLE completed_quests DROP CONSTRAINT IF EXISTS completed_quests_user_id_fkey;
ALTER TABLE user_wallets DROP CONSTRAINT IF EXISTS user_wallets_user_id_fkey;
ALTER TABLE user_auth_methods DROP CONSTRAINT IF EXISTS user_auth_methods_user_id_fkey;
ALTER TABLE user_reputations DROP CONSTRAINT IF EXISTS user_reputations_user_id_fkey;
ALTER TABLE user_streaks DROP CONSTRAINT IF EXISTS user_streaks_user_id_fkey;
ALTER TABLE user_inventory DROP CONSTRAINT IF EXISTS user_inventory_user_id_fkey;
ALTER TABLE city_progress DROP CONSTRAINT IF EXISTS city_progress_user_id_fkey;

-- 3b. Rename old Privy ID column
ALTER TABLE users RENAME COLUMN id TO privy_id_deprecated;

-- 3c. Rename ZO user ID to become primary ID
ALTER TABLE users RENAME COLUMN zo_user_id TO id;

-- 3d. Drop old primary key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;

-- 3e. Set new primary key
ALTER TABLE users ADD PRIMARY KEY (id);

-- 3f. Update all foreign key references (requires data migration)
-- NOTE: This assumes you've already updated child table user_id columns to use zo_user_id
-- If not, you need to run data migration first:
-- UPDATE completed_quests SET user_id = (SELECT zo_user_id FROM users WHERE users.privy_id_deprecated = completed_quests.user_id);
-- (Repeat for all child tables)

-- 3g. Recreate foreign key constraints
ALTER TABLE completed_quests
  ADD CONSTRAINT completed_quests_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_wallets
  ADD CONSTRAINT user_wallets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_auth_methods
  ADD CONSTRAINT user_auth_methods_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_reputations
  ADD CONSTRAINT user_reputations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_streaks
  ADD CONSTRAINT user_streaks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_inventory
  ADD CONSTRAINT user_inventory_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE city_progress
  ADD CONSTRAINT city_progress_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- STEP 4: Drop deprecated Privy columns
ALTER TABLE users
  DROP COLUMN IF EXISTS privy_id_deprecated,
  DROP COLUMN IF EXISTS culture;  -- Replaced by cultures (JSONB)

-- STEP 5: Drop Privy-specific auth methods
DELETE FROM user_auth_methods
WHERE auth_type IN ('google', 'twitter', 'discord', 'farcaster');

-- Only keep: email, wallet, phone (ZO-managed)

-- STEP 6: Update auth method constraint
ALTER TABLE user_auth_methods
  DROP CONSTRAINT IF EXISTS user_auth_methods_auth_type_check;

ALTER TABLE user_auth_methods
  ADD CONSTRAINT user_auth_methods_auth_type_check 
  CHECK (auth_type IN ('email', 'wallet', 'phone'));

-- STEP 7: Archive migration table (don't drop, keep for audit)
-- ALTER TABLE privy_to_zo_migration RENAME TO privy_to_zo_migration_archive;
-- (Keep it for now in case we need to reference old Privy IDs)

COMMIT;

-- Verification query:
-- SELECT 
--   COUNT(*) as total_users,
--   COUNT(CASE WHEN zo_pid IS NOT NULL THEN 1 END) as has_zo_pid,
--   COUNT(CASE WHEN zo_synced_at IS NOT NULL THEN 1 END) as synced_users
-- FROM users;


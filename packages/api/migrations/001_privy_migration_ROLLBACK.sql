-- ============================================
-- 🔄 PRIVY MIGRATION ROLLBACK
-- ============================================
-- Use this ONLY if you need to undo the migration
-- and restore the old members table structure
--
-- ⚠️ WARNING: This will delete all new Privy data!
-- Only run if you haven't fully migrated to Privy yet
-- ============================================

-- Drop the VIEW
DROP VIEW IF EXISTS members;

-- Drop RLS policies
DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS user_wallets_select_own ON user_wallets;
DROP POLICY IF EXISTS user_wallets_insert_own ON user_wallets;
DROP POLICY IF EXISTS user_auth_select_own ON user_auth_methods;
DROP POLICY IF EXISTS users_service_role ON users;
DROP POLICY IF EXISTS wallets_service_role ON user_wallets;
DROP POLICY IF EXISTS auth_methods_service_role ON user_auth_methods;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS set_primary_wallet(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_user_by_identifier(TEXT);

-- Drop new tables (cascade to delete all data)
DROP TABLE IF EXISTS user_auth_methods CASCADE;
DROP TABLE IF EXISTS user_wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Restore old members table
ALTER TABLE IF EXISTS members_backup_pre_privy RENAME TO members;

-- Verify restoration
SELECT 'Rollback complete! Old members table restored.' as status;
SELECT COUNT(*) as members_count FROM members;




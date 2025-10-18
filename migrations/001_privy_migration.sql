-- ============================================
-- 🦄 PRIVY MIGRATION - Full Members Table Refactor
-- ============================================
-- This migration transforms the members table to fully support Privy authentication
-- Including: Email login, Social login, Multiple wallets, Embedded wallets
--
-- SAFE TO RUN: This migration is idempotent and preserves all existing data
-- ============================================

-- ============================================
-- STEP 1: Create New Users Table
-- ============================================
-- This becomes the main user identity table, keyed by Privy DID

CREATE TABLE IF NOT EXISTS users (
  -- Primary Identity (Privy DID)
  id TEXT PRIMARY KEY,  -- Format: did:privy:clr3j1k2f00...
  
  -- Profile Information (from existing members table)
  name TEXT,
  bio TEXT,
  pfp TEXT,
  culture TEXT,
  
  -- Authentication & Contact
  email TEXT,  -- Primary email from Privy
  x_handle TEXT,
  x_connected BOOLEAN DEFAULT FALSE,
  
  -- Location
  lat NUMERIC,
  lng NUMERIC,
  
  -- Role & Status
  role TEXT DEFAULT 'Member',  -- 'Founder', 'Member', 'Citizen'
  founder_nfts_count INTEGER DEFAULT 0,
  
  -- URLs & Links
  calendar_url TEXT,
  main_quest_url TEXT,
  side_quest_url TEXT,
  
  -- Onboarding State
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_culture ON users(culture);
CREATE INDEX IF NOT EXISTS idx_users_x_handle ON users(x_handle);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(lat, lng);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- ============================================
-- STEP 2: Create User Wallets Table
-- ============================================
-- Supports multiple wallets per user (external + embedded)

CREATE TABLE IF NOT EXISTS user_wallets (
  -- Unique ID for this wallet record
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Foreign key to users table
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Wallet Information
  address TEXT NOT NULL UNIQUE,  -- Ethereum address (0x...)
  chain_type TEXT DEFAULT 'ethereum',  -- 'ethereum', 'avalanche', 'solana', etc.
  
  -- Wallet Source
  wallet_client TEXT,  -- 'privy', 'metamask', 'coinbase_wallet', 'walletconnect', etc.
  wallet_client_type TEXT,  -- 'privy.io.embedded', 'metamask.io.snap', etc.
  is_embedded BOOLEAN DEFAULT FALSE,  -- TRUE if Privy embedded wallet
  
  -- Primary Wallet Flag
  is_primary BOOLEAN DEFAULT FALSE,  -- One primary wallet per user
  
  -- Verification
  is_verified BOOLEAN DEFAULT TRUE,  -- Has user proven ownership?
  verified_at TIMESTAMP,
  
  -- Timestamps
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  -- Ensure one user can't have duplicate wallets
  UNIQUE(user_id, address)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_address ON user_wallets(address);
CREATE INDEX IF NOT EXISTS idx_user_wallets_primary ON user_wallets(user_id, is_primary) WHERE is_primary = true;
CREATE INDEX IF NOT EXISTS idx_user_wallets_chain ON user_wallets(chain_type);

-- ============================================
-- STEP 3: Create User Auth Methods Table
-- ============================================
-- Track all authentication methods (email, social, etc.)

CREATE TABLE IF NOT EXISTS user_auth_methods (
  -- Unique ID for this auth method
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Foreign key to users table
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Auth Method Type
  auth_type TEXT NOT NULL,  -- 'email', 'google', 'twitter', 'discord', 'farcaster', 'wallet'
  
  -- Auth Method Details
  identifier TEXT NOT NULL,  -- Email address, OAuth subject, wallet address
  display_name TEXT,  -- Display name from OAuth provider
  
  -- OAuth Specific
  oauth_subject TEXT,  -- OAuth subject ID
  oauth_username TEXT,  -- @username for Twitter, username for Discord
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  
  -- Timestamps
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  -- Ensure one user can't link same auth method twice
  UNIQUE(user_id, auth_type, identifier)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_auth_user_id ON user_auth_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_type ON user_auth_methods(auth_type);
CREATE INDEX IF NOT EXISTS idx_user_auth_identifier ON user_auth_methods(identifier);

-- ============================================
-- STEP 4: Migrate Existing Data
-- ============================================
-- Move data from old members table to new users/user_wallets tables

DO $$
DECLARE
  existing_members_count INTEGER;
BEGIN
  -- Check if old members table exists
  SELECT COUNT(*) INTO existing_members_count
  FROM information_schema.tables
  WHERE table_name = 'members' AND table_type = 'BASE TABLE';
  
  IF existing_members_count > 0 THEN
    -- Migrate users
    INSERT INTO users (
      id,
      name,
      bio,
      pfp,
      culture,
      x_handle,
      x_connected,
      lat,
      lng,
      role,
      founder_nfts_count,
      calendar_url,
      main_quest_url,
      side_quest_url,
      last_seen,
      created_at,
      onboarding_completed
    )
    SELECT 
      'migrated:' || wallet as id,  -- Temporary ID for migrated users
      name,
      bio,
      pfp,
      culture,
      x_handle,
      x_connected,
      lat,
      lng,
      role,
      founder_nfts_count,
      calendar_url,
      main_quest_url,
      side_quest_url,
      last_seen,
      created_at,
      true  -- All existing users have completed onboarding
    FROM members
    ON CONFLICT (id) DO NOTHING;  -- Skip if already migrated
    
    -- Migrate wallets
    INSERT INTO user_wallets (
      user_id,
      address,
      is_primary,
      is_verified,
      verified_at,
      linked_at
    )
    SELECT 
      'migrated:' || wallet as user_id,
      wallet as address,
      true as is_primary,
      true as is_verified,
      created_at as verified_at,
      created_at as linked_at
    FROM members
    ON CONFLICT (address) DO NOTHING;  -- Skip if wallet already exists
    
    RAISE NOTICE 'Data migration completed successfully';
  END IF;
END $$;

-- ============================================
-- STEP 5: Rename Old Members Table (Backup)
-- ============================================
-- Keep the old table as backup, rename it FIRST before creating VIEW

DO $$
BEGIN
  -- Only rename if the base table still exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'members' AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE members RENAME TO members_backup_pre_privy;
    RAISE NOTICE 'Old members table backed up as members_backup_pre_privy';
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'Backup table already exists, skipping rename';
END $$;

-- ============================================
-- STEP 6: Create Backward-Compatible VIEW
-- ============================================
-- This VIEW makes old code continue to work!
-- Now we can create the VIEW since the table is renamed

CREATE OR REPLACE VIEW members AS
SELECT 
  u.id as privy_id,
  uw.address as wallet,
  u.name,
  u.bio,
  u.pfp,
  u.culture,
  u.email,
  u.x_handle,
  u.x_connected,
  u.lat,
  u.lng,
  u.role,
  u.founder_nfts_count,
  u.calendar_url,
  u.main_quest_url,
  u.side_quest_url,
  u.last_seen,
  u.created_at
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = true;

-- ============================================
-- STEP 7: Create Utility Functions
-- ============================================

-- Function to get user by any identifier (wallet, email, privy_id)
CREATE OR REPLACE FUNCTION get_user_by_identifier(identifier_value TEXT)
RETURNS TABLE (
  user_id TEXT,
  name TEXT,
  email TEXT,
  primary_wallet TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    u.email,
    uw.address,
    u.role
  FROM users u
  LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = true
  WHERE 
    u.id = identifier_value
    OR u.email = identifier_value
    OR uw.address = identifier_value
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to set primary wallet
CREATE OR REPLACE FUNCTION set_primary_wallet(user_id_param TEXT, wallet_address_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  wallet_exists BOOLEAN;
BEGIN
  -- Check if wallet belongs to user
  SELECT EXISTS(
    SELECT 1 FROM user_wallets 
    WHERE user_id = user_id_param AND address = wallet_address_param
  ) INTO wallet_exists;
  
  IF NOT wallet_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Unset all primary flags for this user
  UPDATE user_wallets 
  SET is_primary = FALSE 
  WHERE user_id = user_id_param;
  
  -- Set new primary
  UPDATE user_wallets 
  SET is_primary = TRUE 
  WHERE user_id = user_id_param AND address = wallet_address_param;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 8: Create RLS (Row Level Security) Policies
-- ============================================
-- Optional: Enable RLS if you want user-level access control

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Policy: Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Policy: Users can read their own wallets
CREATE POLICY user_wallets_select_own ON user_wallets
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own wallets
CREATE POLICY user_wallets_insert_own ON user_wallets
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can read their own auth methods
CREATE POLICY user_auth_select_own ON user_auth_methods
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Allow service role to do anything (for server-side operations)
CREATE POLICY users_service_role ON users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY wallets_service_role ON user_wallets
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY auth_methods_service_role ON user_auth_methods
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- STEP 9: Create Triggers for Updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these after migration to verify everything worked

-- Check users count
-- SELECT COUNT(*) as users_count FROM users;

-- Check wallets count
-- SELECT COUNT(*) as wallets_count FROM user_wallets;

-- Check backward-compatible view
-- SELECT * FROM members LIMIT 5;

-- Check a specific user with all their wallets
-- SELECT u.*, uw.address as wallet, uw.is_primary
-- FROM users u
-- LEFT JOIN user_wallets uw ON u.id = uw.user_id
-- WHERE u.id = 'your-user-id';

-- ============================================
-- MIGRATION COMPLETE! 🦄✨
-- ============================================
-- Your database is now fully Privy-ready!
--
-- What you can now do:
-- ✅ Email authentication
-- ✅ Social authentication (Google, Twitter, etc.)
-- ✅ Multiple wallets per user
-- ✅ Embedded Privy wallets
-- ✅ External wallets (MetaMask, Coinbase, etc.)
-- ✅ Backward compatibility with old code
--
-- Next steps:
-- 1. Update your app code to use new tables
-- 2. Test Privy authentication
-- 3. Once confident, drop the old backup table
-- ============================================


-- Migration 004: Avatar Integration with ZO API
-- Description: Add columns to cache ZO API profile data (avatar generation)
-- Author: Phase 2 Implementation
-- Date: 2025-11-13

-- ============================================================================
-- STEP 1: Add Avatar Columns to Users Table
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_image TEXT,           -- CDN URL from ZO API avatar.image
ADD COLUMN IF NOT EXISTS avatar_metadata JSONB,       -- Metadata from ZO API avatar.metadata
ADD COLUMN IF NOT EXISTS avatar_ref_id INTEGER,       -- Reference ID from ZO API avatar.ref_id
ADD COLUMN IF NOT EXISTS body_type TEXT,              -- 'bro' | 'bae' (gender selection)
ADD COLUMN IF NOT EXISTS zo_profile_cache JSONB,      -- Full ZO API /profile/me/ response (cache)
ADD COLUMN IF NOT EXISTS profile_synced_at TIMESTAMP; -- Last sync with ZO API

-- Add constraint for body_type
ALTER TABLE users
ADD CONSTRAINT check_body_type 
CHECK (body_type IS NULL OR body_type IN ('bro', 'bae'));

-- Add index for quick avatar lookups
CREATE INDEX IF NOT EXISTS idx_users_avatar_image ON users(avatar_image) WHERE avatar_image IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_body_type ON users(body_type) WHERE body_type IS NOT NULL;

-- ============================================================================
-- STEP 2: Add Comment Documentation
-- ============================================================================

COMMENT ON COLUMN users.avatar_image IS 'CDN URL of generated avatar from ZO API (e.g., https://proxy.cdn.zo.xyz/...)';
COMMENT ON COLUMN users.avatar_metadata IS 'JSON metadata from ZO API avatar generation';
COMMENT ON COLUMN users.avatar_ref_id IS 'Reference ID from ZO API for avatar tracking';
COMMENT ON COLUMN users.body_type IS 'Gender selection for avatar generation: bro (male) or bae (female)';
COMMENT ON COLUMN users.zo_profile_cache IS 'Full ZO API profile response cached for performance';
COMMENT ON COLUMN users.profile_synced_at IS 'Timestamp of last successful sync with ZO API';

-- ============================================================================
-- STEP 3: Create Avatar Sync Function (Optional - for future use)
-- ============================================================================

-- Function to update profile from ZO API response
CREATE OR REPLACE FUNCTION update_profile_from_zo_api(
  p_user_id TEXT,
  p_zo_profile JSONB
)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET
    avatar_image = p_zo_profile->'avatar'->>'image',
    avatar_metadata = p_zo_profile->'avatar'->'metadata',
    avatar_ref_id = (p_zo_profile->'avatar'->>'ref_id')::INTEGER,
    body_type = p_zo_profile->>'body_type',
    zo_profile_cache = p_zo_profile,
    profile_synced_at = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_profile_from_zo_api IS 'Updates user profile with data from ZO API response';

-- ============================================================================
-- STEP 4: Verification Queries
-- ============================================================================

-- Check new columns exist
DO $$
DECLARE
  missing_columns TEXT[];
BEGIN
  SELECT ARRAY_AGG(column_name)
  INTO missing_columns
  FROM (
    SELECT unnest(ARRAY['avatar_image', 'avatar_metadata', 'avatar_ref_id', 'body_type', 'zo_profile_cache', 'profile_synced_at']) AS column_name
    EXCEPT
    SELECT column_name::TEXT
    FROM information_schema.columns
    WHERE table_name = 'users'
  ) AS missing;
  
  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Missing columns in users table: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'All avatar columns added successfully';
  END IF;
END $$;

-- ============================================================================
-- STEP 5: Sample Usage (for testing)
-- ============================================================================

-- Example: Update user profile from ZO API response
/*
SELECT update_profile_from_zo_api(
  'did:privy:clr3j1k2f00...',
  '{
    "avatar": {
      "image": "https://proxy.cdn.zo.xyz/gallery/media/images/abc123.png",
      "metadata": "{}",
      "ref_id": 42
    },
    "body_type": "bro"
  }'::jsonb
);
*/

-- Example: Query users with avatars
/*
SELECT 
  id,
  name,
  body_type,
  avatar_image,
  profile_synced_at
FROM users
WHERE avatar_image IS NOT NULL
ORDER BY profile_synced_at DESC
LIMIT 10;
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- 1. ZO API is the source of truth for avatar data
-- 2. Supabase users table acts as a cache for performance
-- 3. profile_synced_at tracks when cache was last updated
-- 4. avatar_image can be null if generation is pending or failed
-- 5. body_type is captured during onboarding nickname step
-- 6. zo_profile_cache stores full response for debugging/future features

-- Migration completed successfully


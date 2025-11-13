-- Add city column to users table
-- This column stores the user's city obtained from geocoding during onboarding

ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for city lookups
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE '✅ Added city column to users table';
END $$;


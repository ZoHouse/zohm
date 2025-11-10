-- ============================================
-- 🚨 RUN THIS IN SUPABASE SQL EDITOR NOW
-- ============================================
-- This fixes the missing city column error

-- Add city column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index for city lookups  
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'city';

-- Show success message
DO $$
BEGIN
  RAISE NOTICE '✅ City column added successfully!';
  RAISE NOTICE 'You can now complete onboarding without errors.';
END $$;


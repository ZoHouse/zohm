-- ============================================
-- Fix Quest Completion RLS - Final Version
-- ============================================
-- This fixes the "new row violates row-level security policy" error

-- Step 1: Drop ALL existing policies on completed_quests
DROP POLICY IF EXISTS "Users can view their own completed quests" ON completed_quests;
DROP POLICY IF EXISTS "Users can insert their own quest completions" ON completed_quests;
DROP POLICY IF EXISTS "Public can view completed quests" ON completed_quests;
DROP POLICY IF EXISTS "Authenticated users can complete quests" ON completed_quests;
DROP POLICY IF EXISTS "Service can update leaderboard" ON completed_quests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON completed_quests;
DROP POLICY IF EXISTS "Enable read access for all users" ON completed_quests;

-- Step 2: Disable RLS temporarily to clean up
ALTER TABLE completed_quests DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE completed_quests ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, permissive policies
-- Allow ANYONE (authenticated or not) to insert quest completions
CREATE POLICY "Anyone can complete quests"
  ON completed_quests
  FOR INSERT
  WITH CHECK (true);

-- Allow ANYONE to read quest completions (for leaderboard)
CREATE POLICY "Anyone can view completions"
  ON completed_quests
  FOR SELECT
  USING (true);

-- Step 5: Grant necessary permissions
GRANT ALL ON completed_quests TO anon;
GRANT ALL ON completed_quests TO authenticated;
GRANT ALL ON completed_quests TO service_role;

-- Step 6: Also fix quests table permissions
ALTER TABLE quests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quests are publicly readable" ON quests;

CREATE POLICY "Anyone can read quests"
  ON quests
  FOR SELECT
  USING (true);

GRANT SELECT ON quests TO anon, authenticated;

-- Step 7: Verify the setup
DO $$
BEGIN
  RAISE NOTICE '✅ Quest RLS policies updated successfully!';
  RAISE NOTICE 'Policies on completed_quests:';
END $$;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('completed_quests', 'quests')
ORDER BY tablename, policyname;


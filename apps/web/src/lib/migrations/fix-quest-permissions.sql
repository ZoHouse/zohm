-- ============================================
-- Fix Quest Completion Permissions
-- ============================================
-- This ensures users can complete quests and the data is properly stored

-- Enable RLS on completed_quests if not already enabled
ALTER TABLE completed_quests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own completed quests" ON completed_quests;
DROP POLICY IF EXISTS "Users can insert their own quest completions" ON completed_quests;
DROP POLICY IF EXISTS "Public can view completed quests" ON completed_quests;
DROP POLICY IF EXISTS "Authenticated users can complete quests" ON completed_quests;

-- Allow authenticated users to insert their own quest completions
CREATE POLICY "Authenticated users can complete quests"
  ON completed_quests
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to view all completed quests (for leaderboard)
CREATE POLICY "Public can view completed quests"
  ON completed_quests
  FOR SELECT
  TO public
  USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT ON completed_quests TO authenticated;
GRANT SELECT ON completed_quests TO anon;

-- Also ensure the leaderboards table has proper permissions
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Drop existing leaderboard policies
DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON leaderboards;
DROP POLICY IF EXISTS "Leaderboard updates via trigger only" ON leaderboards;

-- Allow anyone to read the leaderboard
CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboards
  FOR SELECT
  TO public
  USING (true);

-- Allow service role and postgres to insert/update (for trigger)
CREATE POLICY "Service can update leaderboard"
  ON leaderboards
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON leaderboards TO anon, authenticated;
GRANT ALL ON leaderboards TO service_role;

-- ============================================
-- Verification
-- ============================================
-- Run these to verify setup:
-- 
-- Check policies on completed_quests:
-- SELECT * FROM pg_policies WHERE tablename = 'completed_quests';
--
-- Check policies on leaderboards:
-- SELECT * FROM pg_policies WHERE tablename = 'leaderboards';


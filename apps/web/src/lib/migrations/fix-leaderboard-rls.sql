-- ============================================
-- Fix Leaderboard RLS for Trigger
-- ============================================
-- The trigger needs to be able to insert/update the leaderboard
-- but RLS was blocking it

-- Step 1: Drop all existing policies on leaderboards
DROP POLICY IF EXISTS "Leaderboard is publicly readable" ON leaderboards;
DROP POLICY IF EXISTS "Leaderboard updates via trigger only" ON leaderboards;
DROP POLICY IF EXISTS "Service can update leaderboard" ON leaderboards;
DROP POLICY IF EXISTS "Anyone can read leaderboard" ON leaderboards;
DROP POLICY IF EXISTS "Trigger can update leaderboard" ON leaderboards;

-- Step 2: Temporarily disable RLS to clean up
ALTER TABLE leaderboards DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Step 4: Create permissive policies
-- Allow ANYONE to read the leaderboard
CREATE POLICY "Public can read leaderboard"
  ON leaderboards
  FOR SELECT
  USING (true);

-- Allow ANYONE to insert/update (needed for trigger to work)
-- The trigger runs as the user who inserted into completed_quests
CREATE POLICY "Public can insert leaderboard"
  ON leaderboards
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update leaderboard"
  ON leaderboards
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Step 5: Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON leaderboards TO anon;
GRANT SELECT, INSERT, UPDATE ON leaderboards TO authenticated;
GRANT ALL ON leaderboards TO service_role;

-- Step 6: Verify the trigger function has proper security
-- Make the trigger function run with SECURITY DEFINER
DROP TRIGGER IF EXISTS quest_completion_leaderboard_update ON completed_quests;

CREATE OR REPLACE FUNCTION update_leaderboard_on_quest_completion()
RETURNS TRIGGER 
SECURITY DEFINER  -- This makes it run with the permissions of the function owner
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  reward_points INTEGER;
BEGIN
  -- Extract reward points from metadata, default to 420 if not specified
  reward_points := COALESCE((NEW.metadata->>'reward_zo')::INTEGER, 420);
  
  -- Insert new leaderboard entry or update existing one
  INSERT INTO leaderboards (
    wallet,
    zo_points,
    total_quests_completed,
    last_quest_completed_at,
    username,
    updated_at
  )
  VALUES (
    NEW.wallet_address,
    reward_points,
    1,
    NEW.completed_at,
    'Anon',
    NOW()
  )
  ON CONFLICT (wallet) 
  DO UPDATE SET 
    zo_points = leaderboards.zo_points + reward_points,
    total_quests_completed = leaderboards.total_quests_completed + 1,
    last_quest_completed_at = NEW.completed_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER quest_completion_leaderboard_update
AFTER INSERT ON completed_quests
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_on_quest_completion();

-- Step 7: Verify setup
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'leaderboards'
ORDER BY policyname;

-- Show trigger info
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'quest_completion_leaderboard_update';


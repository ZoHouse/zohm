-- ============================================
-- Leaderboard Auto-Update System
-- ============================================
-- This migration creates a system that automatically updates
-- the leaderboard when users complete quests.

-- Step 1: Create the leaderboards table if it doesn't exist
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT UNIQUE NOT NULL,
  username TEXT DEFAULT 'Anon',
  zo_points INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  last_quest_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_leaderboards_wallet ON leaderboards(wallet);
CREATE INDEX IF NOT EXISTS idx_leaderboards_zo_points ON leaderboards(zo_points DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_updated_at ON leaderboards(updated_at DESC);

-- Step 2: Create the trigger function
CREATE OR REPLACE FUNCTION update_leaderboard_on_quest_completion()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger
DROP TRIGGER IF EXISTS quest_completion_leaderboard_update ON completed_quests;

CREATE TRIGGER quest_completion_leaderboard_update
AFTER INSERT ON completed_quests
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_on_quest_completion();

-- Step 4: Create a function to sync username from users table (optional)
CREATE OR REPLACE FUNCTION sync_leaderboard_username(
  wallet_address TEXT,
  new_username TEXT
)
RETURNS VOID AS $$
BEGIN
  UPDATE leaderboards
  SET 
    username = new_username,
    updated_at = NOW()
  WHERE wallet = wallet_address;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add a helper function to recalculate leaderboard from scratch (for maintenance)
CREATE OR REPLACE FUNCTION recalculate_leaderboard()
RETURNS TABLE(wallet TEXT, total_points BIGINT, quest_count BIGINT) AS $$
BEGIN
  -- Truncate and rebuild leaderboard from completed_quests
  TRUNCATE leaderboards;
  
  RETURN QUERY
  INSERT INTO leaderboards (wallet, zo_points, total_quests_completed, last_quest_completed_at)
  SELECT 
    cq.wallet_address,
    SUM(COALESCE((cq.metadata->>'reward_zo')::INTEGER, 420)) as total_zo,
    COUNT(*) as quest_count,
    MAX(cq.completed_at) as last_completed
  FROM completed_quests cq
  GROUP BY cq.wallet_address
  RETURNING wallet, zo_points, total_quests_completed;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create RLS (Row Level Security) policies for the leaderboards table
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the leaderboard
CREATE POLICY "Leaderboard is publicly readable"
  ON leaderboards FOR SELECT
  USING (true);

-- Only allow the trigger function to insert/update
CREATE POLICY "Leaderboard updates via trigger only"
  ON leaderboards FOR ALL
  USING (false)
  WITH CHECK (false);

-- Grant necessary permissions
GRANT SELECT ON leaderboards TO anon, authenticated;
GRANT INSERT, UPDATE ON leaderboards TO service_role;

-- ============================================
-- Migration Complete
-- ============================================
-- The leaderboard will now automatically update when:
-- 1. A user completes a quest (via the trigger)
-- 2. Points are added based on the reward_zo in metadata
-- 3. Quest completion count is incremented
-- 
-- To manually recalculate the entire leaderboard:
-- SELECT * FROM recalculate_leaderboard();
--
-- To update a user's display name:
-- SELECT sync_leaderboard_username('0x...', 'NewUsername');


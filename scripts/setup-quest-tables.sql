-- ==========================================
-- ZO.XYZ QUEST SYSTEM DATABASE SETUP
-- ==========================================
-- Run this SQL in Supabase SQL Editor to set up the quest system tables

-- ==========================================
-- 1. USER QUEST STATS TABLE
-- ==========================================
-- Stores aggregate statistics for each user's quest performance

CREATE TABLE IF NOT EXISTS user_quest_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_address TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar TEXT,
  total_tokens INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  unique_locations INTEGER DEFAULT 0,
  multiplier DECIMAL(10, 2) DEFAULT 1.0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_available_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quest_stats_wallet ON user_quest_stats(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_quest_stats_best_score ON user_quest_stats(best_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_quest_stats_total_tokens ON user_quest_stats(total_tokens DESC);

-- ==========================================
-- 2. QUEST SCORES TABLE
-- ==========================================
-- Records individual quest attempts with score, location, and tokens earned

CREATE TABLE IF NOT EXISTS quest_scores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_address TEXT NOT NULL,
  score INTEGER NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  tokens_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quest_scores_wallet ON quest_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_quest_scores_score ON quest_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_quest_scores_completed_at ON quest_scores(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quest_scores_location ON quest_scores(location);

-- ==========================================
-- 3. AUTO-UPDATE FUNCTION
-- ==========================================
-- This function automatically updates user stats when a new quest score is recorded

CREATE OR REPLACE FUNCTION update_user_quest_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new record or update existing one
  INSERT INTO user_quest_stats (
    wallet_address,
    total_tokens,
    total_syncs,
    best_score,
    last_sync_at,
    next_sync_available_at,
    updated_at
  )
  VALUES (
    NEW.wallet_address,
    NEW.tokens_earned,
    1,
    NEW.score,
    NEW.completed_at,
    NEW.completed_at + INTERVAL '12 hours',
    NOW()
  )
  ON CONFLICT (wallet_address) DO UPDATE SET
    total_tokens = user_quest_stats.total_tokens + NEW.tokens_earned,
    total_syncs = user_quest_stats.total_syncs + 1,
    best_score = GREATEST(user_quest_stats.best_score, NEW.score),
    last_sync_at = NEW.completed_at,
    next_sync_available_at = NEW.completed_at + INTERVAL '12 hours',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. TRIGGER
-- ==========================================
-- Automatically update stats when quest is completed

DROP TRIGGER IF EXISTS trigger_update_user_quest_stats ON quest_scores;
CREATE TRIGGER trigger_update_user_quest_stats
AFTER INSERT ON quest_scores
FOR EACH ROW
EXECUTE FUNCTION update_user_quest_stats();

-- ==========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================
-- Configure access permissions

-- Enable RLS on both tables
ALTER TABLE user_quest_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view leaderboard" ON user_quest_stats;
DROP POLICY IF EXISTS "Users can view their own stats" ON user_quest_stats;
DROP POLICY IF EXISTS "Service role full access to stats" ON user_quest_stats;
DROP POLICY IF EXISTS "Anyone can insert quest scores" ON quest_scores;
DROP POLICY IF EXISTS "Service role full access to scores" ON quest_scores;
DROP POLICY IF EXISTS "Public can view all scores" ON quest_scores;

-- Allow anyone to view leaderboard (for public leaderboard)
CREATE POLICY "Public can view leaderboard"
ON user_quest_stats FOR SELECT
TO public
USING (true);

-- Allow anyone to insert quest scores (app will validate)
CREATE POLICY "Anyone can insert quest scores"
ON quest_scores FOR INSERT
TO public
WITH CHECK (true);

-- Allow public to view all scores (for leaderboard/history)
CREATE POLICY "Public can view all scores"
ON quest_scores FOR SELECT
TO public
USING (true);

-- Service role has full access to everything
CREATE POLICY "Service role full access to stats"
ON user_quest_stats FOR ALL
TO service_role
USING (true);

CREATE POLICY "Service role full access to scores"
ON quest_scores FOR ALL
TO service_role
USING (true);

-- ==========================================
-- 6. VERIFICATION QUERY
-- ==========================================
-- Run this to verify everything is set up correctly

-- Check if tables exist
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('user_quest_stats', 'quest_scores')
ORDER BY tablename;

-- Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_user_quest_stats';

-- Check if function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name = 'update_user_quest_stats';

-- ==========================================
-- DONE! 
-- ==========================================
-- Your quest system database is now set up.
-- The app will automatically start recording quest data.
-- 
-- Test by:
-- 1. Complete a quest in the app
-- 2. Check quest_scores table for your score
-- 3. Check user_quest_stats table for updated stats
-- 4. View leaderboard in QuestComplete screen



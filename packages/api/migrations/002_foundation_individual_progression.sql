-- ============================================
-- FOUNDATION + INDIVIDUAL PROGRESSION MIGRATION
-- ============================================
-- This migration establishes the complete foundation for the gamification system
-- including quest repeatability, user-based identity, and individual progression tracking
-- 
-- Safe to run: Idempotent, preserves all existing data
-- ============================================

-- ============================================
-- PART 1: FOUNDATION - User Identity & Quest System
-- ============================================

-- Remove unique constraint to allow repeatable quests
ALTER TABLE completed_quests DROP CONSTRAINT IF EXISTS unique_wallet_quest;

-- Add user_id and quest tracking columns to completed_quests
-- Note: latitude/longitude might already exist with NUMERIC(20,18) which is correct for coordinates
-- If they exist, we skip them. If not, we create with proper precision.
ALTER TABLE completed_quests
  ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS score INTEGER,
  ADD COLUMN IF NOT EXISTS location TEXT;

-- Add latitude/longitude only if they don't exist (they might already be there with correct precision)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'completed_quests' AND column_name = 'latitude') THEN
    ALTER TABLE completed_quests ADD COLUMN latitude NUMERIC(20,18);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'completed_quests' AND column_name = 'longitude') THEN
    ALTER TABLE completed_quests ADD COLUMN longitude NUMERIC(20,18);
  END IF;
END $$;

-- FIX: Ensure amount column can hold large token values (not GPS coordinates!)
-- If amount column exists with wrong precision, alter it
DO $$ 
BEGIN
  -- Check if amount column exists and has wrong type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'completed_quests' 
    AND column_name = 'amount'
    AND numeric_precision = 20 
    AND numeric_scale = 18
  ) THEN
    -- Amount column has GPS coordinate precision, fix it!
    ALTER TABLE completed_quests ALTER COLUMN amount TYPE NUMERIC;
    RAISE NOTICE 'Fixed amount column precision to allow large token values';
  END IF;
END $$;

-- Backfill user_id from wallet_address for completed_quests
UPDATE completed_quests cq
SET user_id = (
  SELECT uw.user_id FROM user_wallets uw 
  WHERE uw.address = cq.wallet_address LIMIT 1
)
WHERE user_id IS NULL;

-- Extend quests table for categorization and rewards
ALTER TABLE quests
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,  -- Human-readable identifier for API lookups
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'one-time' 
    CHECK (category IN ('daily', 'weekly', 'seasonal', 'one-time', 'node', 'pioneer', 'city')),
  ADD COLUMN IF NOT EXISTS cooldown_hours INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS requirements JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS rewards_breakdown JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS active_from TIMESTAMP,
  ADD COLUMN IF NOT EXISTS active_until TIMESTAMP,
  ADD COLUMN IF NOT EXISTS max_completions INTEGER;

-- Update leaderboards to use user_id (make wallet nullable since user_id is now primary)
ALTER TABLE leaderboards
  ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES users(id);

-- Make wallet nullable since we're moving to user-based identity
ALTER TABLE leaderboards 
  ALTER COLUMN wallet DROP NOT NULL;

-- Add unique constraint on user_id for trigger ON CONFLICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'leaderboards_user_id_unique'
  ) THEN
    ALTER TABLE leaderboards
    ADD CONSTRAINT leaderboards_user_id_unique UNIQUE (user_id);
  END IF;
END $$;

-- Backfill user_id from wallet for leaderboards
UPDATE leaderboards lb
SET user_id = (
  SELECT uw.user_id FROM user_wallets uw 
  WHERE uw.address = lb.wallet LIMIT 1
)
WHERE user_id IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_completed_quests_user_id ON completed_quests(user_id);
CREATE INDEX IF NOT EXISTS idx_completed_quests_quest_user ON completed_quests(quest_id, user_id);
CREATE INDEX IF NOT EXISTS idx_completed_quests_completed_at ON completed_quests(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_quests_slug ON quests(slug);
CREATE INDEX IF NOT EXISTS idx_quests_category ON quests(category);
CREATE INDEX IF NOT EXISTS idx_quests_active ON quests(active_from, active_until);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON leaderboards(user_id);

-- Insert voice-sync-quest
INSERT INTO quests (id, slug, title, description, reward, status, category, cooldown_hours, rewards_breakdown)
VALUES (
  gen_random_uuid(),
  'voice-sync-quest',  -- Human-readable identifier for API
  'Quantum Voice Sync',
  'Sync your voice frequency with the quantum field. Stop the counter at 1111 to win maximum rewards!',
  200,
  'active',
  'daily',
  12,
  '{"zo_tokens": 200, "reputation": {"Explorer": 10}, "items": [{"type": "badge", "id": "voice-sync-winner"}]}'::jsonb
) ON CONFLICT (slug) DO UPDATE SET
  category = 'daily',
  cooldown_hours = 12,
  rewards_breakdown = '{"zo_tokens": 200, "reputation": {"Explorer": 10}, "items": [{"type": "badge", "id": "voice-sync-winner"}]}'::jsonb;

-- ============================================
-- PART 2: INDIVIDUAL PROGRESSION - Reputation, Streaks, Inventory
-- ============================================

-- Extend users table with gamification fields
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS zo_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_tier TEXT DEFAULT 'prospect' 
    CHECK (user_tier IN ('prospect', 'settler', 'pioneer', 'elder', 'legend')),
  ADD COLUMN IF NOT EXISTS last_streak_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS total_reputation_score INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_tier ON users(user_tier);
CREATE INDEX IF NOT EXISTS idx_users_zo_balance ON users(zo_balance DESC);

-- Create user_reputations table
CREATE TABLE IF NOT EXISTS user_reputations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trait TEXT NOT NULL CHECK (trait IN ('Builder', 'Connector', 'Explorer', 'Pioneer')),
  score INTEGER DEFAULT 0 CHECK (score >= 0),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, trait)
);

CREATE INDEX IF NOT EXISTS idx_user_reputations_user_id ON user_reputations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reputations_trait ON user_reputations(trait);
CREATE INDEX IF NOT EXISTS idx_user_reputations_score ON user_reputations(score DESC);

-- Create user_streaks table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('login', 'quest', 'event', 'checkin')),
  count INTEGER DEFAULT 0 CHECK (count >= 0),
  last_action_at TIMESTAMP,
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, streak_type)
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_streaks_type ON user_streaks(streak_type);

-- Create user_inventory table
CREATE TABLE IF NOT EXISTS user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('badge', 'nft', 'collectible', 'item')),
  item_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  metadata JSONB DEFAULT '{}',
  acquired_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_type ON user_inventory(item_type);

-- ============================================
-- PART 3: TRIGGER - Auto-update stats on quest completion
-- ============================================

CREATE OR REPLACE FUNCTION on_completed_quest_update_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user balance
  UPDATE users 
  SET zo_balance = zo_balance + COALESCE(NEW.amount, 0),
      updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Update reputation from metadata
  IF NEW.metadata ? 'reputation_delta' THEN
    INSERT INTO user_reputations (user_id, trait, score)
    SELECT NEW.user_id, key, value::INTEGER
    FROM jsonb_each_text(NEW.metadata->'reputation_delta')
    ON CONFLICT (user_id, trait) 
    DO UPDATE SET 
      score = user_reputations.score + EXCLUDED.score,
      updated_at = NOW();
  END IF;
  
  -- Award items from metadata
  IF NEW.metadata ? 'items_awarded' THEN
    INSERT INTO user_inventory (user_id, item_type, item_id, quantity)
    SELECT 
      NEW.user_id, 
      value->>'type', 
      value->>'id', 
      COALESCE((value->>'quantity')::INTEGER, 1)
    FROM jsonb_array_elements(NEW.metadata->'items_awarded')
    ON CONFLICT (user_id, item_type, item_id)
    DO UPDATE SET 
      quantity = user_inventory.quantity + EXCLUDED.quantity;
  END IF;
  
  -- Update leaderboard
  INSERT INTO leaderboards (user_id, wallet, username, zo_points, total_quests_completed)
  SELECT 
    NEW.user_id,
    uw.address,
    u.name,
    COALESCE(NEW.amount, 0),
    1
  FROM users u
  LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = true
  WHERE u.id = NEW.user_id
  ON CONFLICT (user_id) DO UPDATE
  SET zo_points = leaderboards.zo_points + COALESCE(NEW.amount, 0),
      total_quests_completed = leaderboards.total_quests_completed + 1,
      last_quest_completed_at = NEW.completed_at,
      updated_at = NOW();
  
  -- Update quest streak
  INSERT INTO user_streaks (user_id, streak_type, count, last_action_at)
  VALUES (NEW.user_id, 'quest', 1, NEW.completed_at)
  ON CONFLICT (user_id, streak_type) DO UPDATE
  SET count = CASE 
    WHEN DATE(user_streaks.last_action_at) = DATE(NEW.completed_at) - INTERVAL '1 day' 
    THEN user_streaks.count + 1
    WHEN DATE(user_streaks.last_action_at) = DATE(NEW.completed_at)
    THEN user_streaks.count
    ELSE 1
  END,
  longest_streak = GREATEST(user_streaks.longest_streak, 
    CASE 
      WHEN DATE(user_streaks.last_action_at) = DATE(NEW.completed_at) - INTERVAL '1 day' 
      THEN user_streaks.count + 1
      ELSE user_streaks.count
    END
  ),
  last_action_at = NEW.completed_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_quest_completion ON completed_quests;
CREATE TRIGGER trigger_quest_completion
AFTER INSERT ON completed_quests
FOR EACH ROW EXECUTE FUNCTION on_completed_quest_update_stats();

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables exist
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_name IN ('completed_quests', 'quests', 'leaderboards', 'user_reputations', 'user_streaks', 'user_inventory')
ORDER BY table_name;

-- Check trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trigger_quest_completion';

-- Check voice-sync-quest created
SELECT id, slug, title, category, cooldown_hours FROM quests WHERE slug = 'voice-sync-quest';

-- ============================================
-- MIGRATION COMPLETE ✅
-- ============================================


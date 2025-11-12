-- ============================================
-- ROLLBACK: Foundation + Individual Progression Migration
-- ============================================
-- This script safely rolls back the gamification foundation changes
-- Run this if you need to revert to the previous state
-- ============================================

-- Drop trigger
DROP TRIGGER IF EXISTS trigger_quest_completion ON completed_quests;
DROP FUNCTION IF EXISTS on_completed_quest_update_stats();

-- Drop new tables
DROP TABLE IF EXISTS user_inventory CASCADE;
DROP TABLE IF EXISTS user_streaks CASCADE;
DROP TABLE IF EXISTS user_reputations CASCADE;

-- Remove columns from users table
ALTER TABLE users
  DROP COLUMN IF EXISTS total_reputation_score,
  DROP COLUMN IF EXISTS last_streak_at,
  DROP COLUMN IF EXISTS user_tier,
  DROP COLUMN IF EXISTS zo_balance;

-- Remove columns from leaderboards
ALTER TABLE leaderboards
  DROP COLUMN IF EXISTS user_id;

-- Remove columns from quests
ALTER TABLE quests
  DROP COLUMN IF EXISTS max_completions,
  DROP COLUMN IF EXISTS active_until,
  DROP COLUMN IF EXISTS active_from,
  DROP COLUMN IF EXISTS rewards_breakdown,
  DROP COLUMN IF EXISTS requirements,
  DROP COLUMN IF EXISTS cooldown_hours,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS slug;

-- Remove columns from completed_quests
ALTER TABLE completed_quests
  DROP COLUMN IF EXISTS longitude,
  DROP COLUMN IF EXISTS latitude,
  DROP COLUMN IF EXISTS location,
  DROP COLUMN IF EXISTS score,
  DROP COLUMN IF EXISTS user_id;

-- Restore unique constraint (if needed)
-- Note: Only uncomment if you want to restore the old one-time quest behavior
-- ALTER TABLE completed_quests ADD CONSTRAINT unique_wallet_quest UNIQUE (wallet_address, quest_id);

-- Delete voice-sync-quest
DELETE FROM quests WHERE slug = 'voice-sync-quest';

-- ============================================
-- ROLLBACK COMPLETE ✅
-- ============================================
-- Note: This does not restore old data, only the schema
-- Backup your database before running migrations in production
-- ============================================


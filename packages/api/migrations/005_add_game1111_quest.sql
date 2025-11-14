-- Migration 005: Add Game1111 Quest
-- Creates the recurring Game1111 quest in the quests table
-- Date: 2025-11-13

BEGIN;

-- Insert Game1111 quest if it doesn't exist
INSERT INTO quests (
  slug,
  title,
  description,
  reward,
  status,
  category,
  cooldown_hours,
  rewards_breakdown,
  created_at
)
VALUES (
  'game-1111',
  'Quantum Voice Sync',
  'Match the frequency 1111 with your voice. The closer you get, the more $ZO you earn! Dynamic rewards: Perfect 1111 = 200 $ZO, Score 0 = 50 $ZO.',
  200, -- max reward for perfect score
  'active',
  'daily', -- repeatable every 12 hours
  12, -- 12 hour cooldown
  '{"zo_tokens": 200, "dynamic": true, "formula": "Base 50 + (1 - distance/1111) * 150"}'::jsonb,
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  reward = EXCLUDED.reward,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  cooldown_hours = EXCLUDED.cooldown_hours,
  rewards_breakdown = EXCLUDED.rewards_breakdown;

-- Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM quests WHERE slug = 'game-1111'
  ) THEN
    RAISE NOTICE '✅ Game1111 quest created/updated successfully';
    RAISE NOTICE '   - Slug: game-1111';
    RAISE NOTICE '   - Cooldown: 12 hours';
    RAISE NOTICE '   - Max reward: 200 $ZO';
    RAISE NOTICE '   - Dynamic rewards enabled';
  ELSE
    RAISE EXCEPTION '❌ Failed to create Game1111 quest';
  END IF;
END $$;

COMMIT;

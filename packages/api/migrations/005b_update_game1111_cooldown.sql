-- Migration 005b: Update Game1111 Quest Cooldown to 12 hours
-- Updates the existing quest cooldown from 24 to 12 hours
-- Date: 2025-11-13

BEGIN;

-- Update Game1111 quest cooldown
UPDATE quests
SET 
  cooldown_hours = 12,
  updated_at = NOW()
WHERE slug = 'game-1111';

-- Verify
DO $$
DECLARE
  quest_cooldown INTEGER;
BEGIN
  SELECT cooldown_hours INTO quest_cooldown
  FROM quests 
  WHERE slug = 'game-1111';
  
  IF quest_cooldown = 12 THEN
    RAISE NOTICE '✅ Game1111 quest cooldown updated successfully';
    RAISE NOTICE '   - New cooldown: 12 hours';
    RAISE NOTICE '   - Quest available every 12 hours';
  ELSE
    RAISE EXCEPTION '❌ Failed to update cooldown. Current value: % hours', quest_cooldown;
  END IF;
END $$;

COMMIT;


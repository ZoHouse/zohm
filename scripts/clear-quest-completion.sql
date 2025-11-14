-- ==========================================
-- CLEAR QUEST COMPLETION FOR TESTING
-- ==========================================
-- This script clears your recent game1111 quest completion
-- so you can test the quest again immediately
-- 
-- Run this in Supabase SQL Editor
-- ==========================================

-- Option 1: Clear by your Privy user ID (if you know it)
-- Replace 'YOUR_PRIVY_USER_ID' with your actual Privy DID
/*
DELETE FROM completed_quests
WHERE user_id = 'YOUR_PRIVY_USER_ID'
  AND quest_id = (SELECT id FROM quests WHERE slug = 'game-1111');
*/

-- Option 2: Clear by wallet address (easier)
-- Replace '0xYOUR_WALLET_ADDRESS' with your actual wallet
/*
DELETE FROM completed_quests
WHERE user_id = (
  SELECT user_id FROM user_wallets 
  WHERE address = '0xYOUR_WALLET_ADDRESS' 
  LIMIT 1
)
AND quest_id = (SELECT id FROM quests WHERE slug = 'game-1111');
*/

-- Option 3: Clear ALL game1111 completions for testing (nuclear option)
/*
DELETE FROM completed_quests
WHERE quest_id = (SELECT id FROM quests WHERE slug = 'game-1111');
*/

-- Option 4: View your recent completions first (to confirm what to delete)
SELECT 
  cq.id,
  cq.user_id,
  u.name,
  uw.address as wallet_address,
  q.slug as quest_slug,
  cq.score,
  cq.amount as tokens_earned,
  cq.completed_at,
  NOW() - cq.completed_at as time_since_completion
FROM completed_quests cq
JOIN quests q ON cq.quest_id = q.id
JOIN users u ON cq.user_id = u.id
LEFT JOIN user_wallets uw ON uw.user_id = u.id AND uw.is_primary = true
WHERE q.slug = 'game-1111'
ORDER BY cq.completed_at DESC
LIMIT 10;

-- ==========================================
-- After viewing, delete specific completion by ID
-- ==========================================
-- Replace 'COMPLETION_ID_HERE' with the ID from above query
/*
DELETE FROM completed_quests
WHERE id = 'COMPLETION_ID_HERE';
*/

-- ==========================================
-- VERIFY DELETION
-- ==========================================
-- Run this to confirm deletion worked
SELECT COUNT(*) as remaining_completions
FROM completed_quests cq
JOIN quests q ON cq.quest_id = q.id
WHERE q.slug = 'game-1111';


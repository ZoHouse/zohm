-- ==========================================
-- CLEAR QUEST FOR @samurairann
-- ==========================================
-- Run this in Supabase SQL Editor
-- ==========================================

-- Step 1: Find your user by X handle and see completions
SELECT 
  cq.id as completion_id,
  u.id as user_id,
  u.name,
  u.x_handle,
  uw.address as wallet_address,
  cq.score,
  cq.amount as tokens_earned,
  cq.completed_at,
  NOW() - cq.completed_at as time_ago
FROM users u
LEFT JOIN completed_quests cq ON cq.user_id = u.id
LEFT JOIN quests q ON cq.quest_id = q.id
LEFT JOIN user_wallets uw ON uw.user_id = u.id AND uw.is_primary = true
WHERE u.x_handle = 'samurairann'
  AND q.slug = 'game-1111'
ORDER BY cq.completed_at DESC;

-- Step 2: Delete your game1111 completions
DELETE FROM completed_quests
WHERE user_id = (
  SELECT id FROM users WHERE x_handle = 'samurairann'
)
AND quest_id = (
  SELECT id FROM quests WHERE slug = 'game-1111'
);

-- Step 3: Verify deletion
SELECT 
  u.x_handle,
  COUNT(cq.id) as remaining_completions
FROM users u
LEFT JOIN completed_quests cq ON cq.user_id = u.id
LEFT JOIN quests q ON cq.quest_id = q.id AND q.slug = 'game-1111'
WHERE u.x_handle = 'samurairann'
GROUP BY u.x_handle;


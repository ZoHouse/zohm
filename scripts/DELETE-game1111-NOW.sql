-- ==========================================
-- 🧹 DELETE ALL GAME1111 COMPLETIONS
-- User: samurairann (did:privy:cmhxtylyw009rla0chg62in3y)
-- ==========================================
-- Copy this ENTIRE block into Supabase SQL Editor and run it
-- ==========================================

-- 1️⃣ VIEW BEFORE DELETE (should show 2 completions)
SELECT 
  id,
  score,
  amount as tokens,
  completed_at,
  AGE(NOW(), completed_at) as time_ago
FROM completed_quests
WHERE user_id = 'did:privy:cmhxtylyw009rla0chg62in3y'
  AND quest_id = '1269698e-d5e8-4a2e-b28c-ff99cc3d1361'
ORDER BY completed_at DESC;

-- 2️⃣ DELETE ALL (Run this to clear completions)
DELETE FROM completed_quests
WHERE user_id = 'did:privy:cmhxtylyw009rla0chg62in3y'
  AND quest_id = '1269698e-d5e8-4a2e-b28c-ff99cc3d1361';

-- 3️⃣ VERIFY (should return 0 rows)
SELECT 
  id,
  score,
  amount,
  completed_at
FROM completed_quests
WHERE user_id = 'did:privy:cmhxtylyw009rla0chg62in3y'
  AND quest_id = '1269698e-d5e8-4a2e-b28c-ff99cc3d1361';

-- ✅ Expected result: No rows found
-- 🎮 Now refresh your browser and Game1111 should show "Available"


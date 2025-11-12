-- ==========================================
-- DATABASE INSPECTION QUERY
-- ==========================================
-- Run this in Supabase SQL Editor to see what tables you currently have

-- 1. List all your tables
SELECT 
  table_schema,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. Check specifically for quest tables
SELECT 
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_quest_stats') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as user_quest_stats_status,
  CASE 
    WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quest_scores') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as quest_scores_status;

-- 3. Count rows in quest tables (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_quest_stats') THEN
    RAISE NOTICE '📊 user_quest_stats row count: %', (SELECT COUNT(*) FROM user_quest_stats);
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'quest_scores') THEN
    RAISE NOTICE '📊 quest_scores row count: %', (SELECT COUNT(*) FROM quest_scores);
  END IF;
END $$;

-- 4. Check existing tables (members, nodes, etc.)
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE columns.table_name = tables.table_name) as column_count
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


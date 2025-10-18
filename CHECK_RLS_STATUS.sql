-- Check Row Level Security (RLS) status for Privy tables
-- Run this in Supabase SQL Editor

SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'user_wallets', 'user_auth_methods')
ORDER BY tablename;

-- Expected result: All should show "RLS Enabled" = FALSE
-- If any show TRUE, run this:

-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_wallets DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_auth_methods DISABLE ROW LEVEL SECURITY;



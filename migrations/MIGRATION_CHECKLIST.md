# 🦄 Privy Migration Checklist

Follow these steps to migrate your database safely.

---

## ✅ Pre-Migration Checklist

- [ ] **Backup your database** (Supabase Dashboard → Database → Backups → Create Backup)
- [ ] **Test in development first** (if you have a staging environment)
- [ ] **Read the full migration SQL** to understand what it does
- [ ] **Have the rollback script ready** (`001_privy_migration_ROLLBACK.sql`)

---

## 🚀 Migration Steps

### 1. Open Supabase SQL Editor

1. Go to your Supabase project
2. Click **SQL Editor** in the sidebar
3. Click **New Query**

### 2. Run the Migration

1. Open `migrations/001_privy_migration.sql`
2. **Copy the entire file contents** (Cmd/Ctrl + A, then Cmd/Ctrl + C)
3. **Paste into Supabase SQL Editor**
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. **Wait for completion** (may take 30-60 seconds)

### 3. Check for Success

You should see messages like:
```
✅ NOTICE: Data migration completed successfully
✅ NOTICE: Old members table backed up as members_backup_pre_privy
```

If you see any **ERROR** messages, **STOP** and check the error.

---

## 🔍 Verify Migration

Run these queries in the SQL Editor to verify:

### Check New Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('users', 'user_wallets', 'user_auth_methods')
ORDER BY table_name;
```
**Expected:** 3 rows (user_auth_methods, user_wallets, users)

### Check Data Migrated
```sql
-- Count users
SELECT COUNT(*) as users_count FROM users;

-- Count wallets
SELECT COUNT(*) as wallets_count FROM user_wallets;

-- Check a sample user
SELECT * FROM users LIMIT 1;

-- Check backward-compatible view
SELECT * FROM members LIMIT 1;
```

### Check Backup Exists
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'members_backup_pre_privy';
```
**Expected:** 1 row

---

## ✅ Post-Migration Checklist

- [ ] All verification queries returned expected results
- [ ] Old data is visible in new `users` table
- [ ] Old data is visible in new `user_wallets` table
- [ ] `members` VIEW returns data
- [ ] Backup table `members_backup_pre_privy` exists
- [ ] Test Privy login in your app
- [ ] Test creating a new user
- [ ] Test updating a user profile

---

## 🆘 If Something Goes Wrong

### Option 1: Check the Error

Most errors are harmless. Common ones:

**"relation already exists"**
- ✅ Safe to ignore
- The migration is idempotent (can run multiple times)

**"column already exists"**
- ✅ Safe to ignore
- The migration uses `IF NOT EXISTS`

**"permission denied"**
- ❌ You need admin/service role access
- Make sure you're using the service role key

### Option 2: Rollback

If you need to undo the migration:

1. Open `migrations/001_privy_migration_ROLLBACK.sql`
2. Copy contents
3. Paste into Supabase SQL Editor
4. Run
5. This will restore your old `members` table

⚠️ **WARNING:** Rollback will delete all new Privy user data!

---

## 📊 Migration Summary

**What Changed:**

| Before | After |
|--------|-------|
| `members` (table) | `members_backup_pre_privy` (backup) |
| Single wallet per user | Multiple wallets per user |
| Wallet-only auth | Email, social, and wallet auth |
| No Privy support | Full Privy support |
| - | `users` (new main table) |
| - | `user_wallets` (new table) |
| - | `user_auth_methods` (new table) |
| - | `members` (VIEW for compatibility) |

**Backward Compatibility:**

- ✅ Old code that queries `members` table still works (it's now a VIEW)
- ✅ All existing user data is preserved
- ✅ All existing wallet addresses are preserved
- ✅ Old backup table is kept for safety

---

## 🎯 Next Steps

After successful migration:

1. **Test your app** with existing users
2. **Test Privy login** with new users
3. **Update your code** to use new `usePrivyUser` hook
4. **Monitor** for any errors
5. **After 1-2 weeks**, if everything works, you can drop the backup:

```sql
-- ⚠️ ONLY RUN AFTER YOU'RE 100% CONFIDENT
DROP TABLE IF EXISTS members_backup_pre_privy;
```

---

## ✅ Migration Complete!

Once all checkboxes above are checked, your migration is complete! 🎉

Your database now supports:
- 🔐 Email authentication
- 🌐 Social authentication (Google, Twitter, etc.)
- 💼 Multiple wallets per user
- 🦄 Privy embedded wallets
- 🔗 External wallets (MetaMask, Coinbase, etc.)

Welcome to the Privy world! 🦄✨



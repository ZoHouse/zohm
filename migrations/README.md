# 🦄 Privy Migration Guide

This guide will walk you through migrating your database to fully support Privy authentication.

---

## 📋 What This Migration Does

### ✅ **Before (Old System)**
```
members table (wallet as primary key)
└── Single wallet per user
└── No email/social login support
└── Limited to wallet authentication
```

### 🎯 **After (New System)**
```
users table (privy_id as primary key)
├── user_wallets table
│   ├── Multiple wallets per user
│   ├── Embedded + external wallets
│   └── Primary wallet designation
├── user_auth_methods table
│   ├── Email authentication
│   ├── Social authentication (Google, Twitter, etc.)
│   └── Wallet authentication
└── members VIEW (backward compatible)
    └── Old code continues to work!
```

---

## 🚀 Step-by-Step Migration

### **Step 1: Backup Your Database**

Before running any migration, **ALWAYS** backup your database:

```bash
# In Supabase Dashboard:
# 1. Go to Database > Backups
# 2. Click "Create Backup"
# 3. Wait for confirmation
```

Or export using CLI:

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Create backup
supabase db dump -f backup_$(date +%Y%m%d).sql
```

---

### **Step 2: Run the Migration**

#### **Option A: Via Supabase Dashboard (Recommended)**

1. Open your Supabase project
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `001_privy_migration.sql`
5. Paste into the editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success" message

#### **Option B: Via Supabase CLI**

```bash
# Navigate to your project
cd /Users/samuraizan/zohm/zohm

# Run the migration
supabase db push

# Or run the SQL file directly
psql YOUR_DATABASE_URL -f migrations/001_privy_migration.sql
```

---

### **Step 3: Verify Migration**

Run these queries in the SQL Editor to verify everything worked:

```sql
-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('users', 'user_wallets', 'user_auth_methods');
-- Should return 3 rows

-- Check users count (should match old members count)
SELECT COUNT(*) as users_count FROM users;

-- Check wallets count (should match old members count)
SELECT COUNT(*) as wallets_count FROM user_wallets;

-- Check backward-compatible view
SELECT * FROM members LIMIT 5;
-- Should return data in old format

-- Check if old table was backed up
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'members_backup_pre_privy';
-- Should return 1 row
```

---

### **Step 4: Update Your Code**

#### **4.1: Import New Utilities**

```typescript
// Old way
import { useWallet } from '@/hooks/useWallet';
import { supabase } from '@/lib/supabase';

// New way (both work!)
import { usePrivyUser } from '@/hooks/usePrivyUser';
import { 
  getUserById, 
  updateUserProfile, 
  upsertUserFromPrivy 
} from '@/lib/privyDb';
```

#### **4.2: Update Components**

**Before:**
```typescript
export default function ProfilePanel() {
  const { address, connected } = useWallet();

  useEffect(() => {
    if (address) {
      supabase
        .from('members')
        .select('*')
        .eq('wallet', address)
        .single()
        .then(({ data }) => setProfile(data));
    }
  }, [address]);

  // ...
}
```

**After:**
```typescript
export default function ProfilePanel() {
  const { 
    userProfile, 
    displayName, 
    hasCompletedOnboarding,
    updateProfile 
  } = usePrivyUser();

  // Profile is automatically loaded and synced!
  // No need for manual useEffect

  const handleSave = async () => {
    await updateProfile({
      name: 'New Name',
      bio: 'New Bio',
    });
  };

  // ...
}
```

#### **4.3: Update ProfileSetup Component**

```typescript
// src/components/ProfileSetup.tsx

import { usePrivyUser } from '@/hooks/usePrivyUser';

export default function ProfileSetup() {
  const { 
    privyUser, 
    completeOnboarding,
    userProfile 
  } = usePrivyUser();

  const handleSubmit = async (data: ProfileFormData) => {
    const success = await completeOnboarding({
      name: data.name,
      bio: data.bio,
      culture: data.culture,
      lat: data.lat,
      lng: data.lng,
    });

    if (success) {
      // Profile created! User is onboarded!
      console.log('✅ Onboarding complete!');
    }
  };

  // ...
}
```

---

### **Step 5: Test Everything**

#### **Test Checklist:**

- [ ] **Existing users can login**
  - Open app
  - Connect wallet
  - Verify profile loads

- [ ] **New Privy email login works**
  - Click "Login with Privy"
  - Use email authentication
  - Complete onboarding
  - Verify profile saved

- [ ] **New Privy social login works**
  - Click "Login with Privy"
  - Use Google/Twitter
  - Complete onboarding
  - Verify profile saved

- [ ] **Multiple wallets work**
  - Login with Privy
  - Connect additional wallet
  - Verify all wallets show in profile
  - Change primary wallet
  - Verify UI updates

- [ ] **Backward compatibility works**
  - Old code that queries `members` table
  - Should continue working via VIEW

---

## 🔧 Troubleshooting

### **Issue: Migration fails with "relation already exists"**

**Solution:** The migration is idempotent. Just run it again, it will skip existing tables.

---

### **Issue: No data in new tables**

**Cause:** Old `members` table might have different name.

**Solution:** Check table name and update migration:

```sql
-- Check what tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- If your table is named differently, update the migration
-- and change 'members' to your actual table name
```

---

### **Issue: RLS (Row Level Security) blocking queries**

**Cause:** RLS policies are too restrictive.

**Solution:** Temporarily disable RLS for testing:

```sql
-- Disable RLS on all tables
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_methods DISABLE ROW LEVEL SECURITY;

-- Test your queries

-- Re-enable RLS when done
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_methods ENABLE ROW LEVEL SECURITY;
```

---

### **Issue: TypeScript errors with new types**

**Cause:** Using old types with new schema.

**Solution:** Import types from `privyDb.ts`:

```typescript
import type { 
  UserRecord, 
  UserWalletRecord, 
  FullUserProfile 
} from '@/lib/privyDb';
```

---

## 📊 Database Schema Reference

### **users table**

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Privy DID |
| `name` | TEXT | User's display name |
| `email` | TEXT | Primary email |
| `bio` | TEXT | User bio |
| `pfp` | TEXT | Profile picture URL |
| `culture` | TEXT | Cultural category |
| `x_handle` | TEXT | Twitter handle |
| `role` | TEXT | 'Founder', 'Member', 'Citizen' |
| `lat/lng` | NUMERIC | Location |
| `onboarding_completed` | BOOLEAN | Has finished onboarding |
| `created_at` | TIMESTAMP | Account creation |
| `last_seen` | TIMESTAMP | Last activity |

### **user_wallets table**

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Wallet record ID |
| `user_id` | TEXT (FK) | References users(id) |
| `address` | TEXT (UNIQUE) | Wallet address |
| `chain_type` | TEXT | 'ethereum', 'avalanche', etc. |
| `wallet_client` | TEXT | 'privy', 'metamask', etc. |
| `is_embedded` | BOOLEAN | Privy embedded wallet? |
| `is_primary` | BOOLEAN | Primary wallet for user |
| `linked_at` | TIMESTAMP | When linked |

### **user_auth_methods table**

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Auth method ID |
| `user_id` | TEXT (FK) | References users(id) |
| `auth_type` | TEXT | 'email', 'google', 'twitter', etc. |
| `identifier` | TEXT | Email address, OAuth subject, etc. |
| `display_name` | TEXT | Name from OAuth provider |
| `oauth_username` | TEXT | @username for social |
| `linked_at` | TIMESTAMP | When linked |

---

## 🎯 Next Steps

Once migration is complete:

1. **Update all components** to use `usePrivyUser` hook
2. **Test thoroughly** with different login methods
3. **Monitor** for any errors in production
4. **After 1-2 weeks**, if everything works, you can drop the backup:

```sql
-- ⚠️ ONLY RUN THIS AFTER YOU'RE 100% CONFIDENT
DROP TABLE IF EXISTS members_backup_pre_privy;
```

---

## 🆘 Need Help?

If something goes wrong:

1. **Don't panic!** The old table is backed up as `members_backup_pre_privy`
2. Check the troubleshooting section above
3. Look at Supabase logs (Settings > Logs)
4. Restore from backup if needed

---

## 🦄 Migration Complete!

Your database is now fully Privy-ready with support for:

✅ Email authentication  
✅ Social authentication (Google, Twitter, Discord, etc.)  
✅ Multiple wallets per user  
✅ Embedded Privy wallets  
✅ External wallets (MetaMask, Coinbase, etc.)  
✅ Backward compatibility with old code  

**Welcome to the future of authentication!** 🎉



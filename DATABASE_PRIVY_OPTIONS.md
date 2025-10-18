# 🗄️ DATABASE OPTIONS FOR PRIVY INTEGRATION

## ⚠️ THE PROBLEM

**Current Schema:**
```sql
members (
  wallet TEXT PRIMARY KEY  -- ❌ Privy users might not have wallet!
)
```

**Privy Reality:**
- Users can login with email (no wallet)
- Users can have multiple wallets
- User identity = Privy DID (not wallet address)

---

## 🎯 THREE OPTIONS

### **Option 1: Quick Fix (Temporary)**
**Add Privy ID column to existing table**

#### SQL:
```sql
-- Add privy_id column
ALTER TABLE members 
ADD COLUMN privy_id TEXT UNIQUE;

-- Add index for fast lookups
CREATE INDEX idx_members_privy_id ON members(privy_id);

-- Add email column
ALTER TABLE members
ADD COLUMN email TEXT;
```

#### How it Works:
```typescript
// When user logs in with Privy
const privyUser = usePrivy();

if (privyUser.wallet) {
  // User has wallet - use existing flow
  await supabase.from('members').upsert({
    wallet: privyUser.wallet.address,
    privy_id: privyUser.id,  // NEW: Store Privy ID
    email: privyUser.email?.address,
    // ... rest of profile
  });
} else {
  // User has NO wallet (email/social login)
  await supabase.from('members').upsert({
    wallet: privyUser.id,  // 🤮 Hacky: Use Privy ID as "wallet"
    privy_id: privyUser.id,
    email: privyUser.email?.address,
    // ... rest of profile
  });
}
```

#### ✅ Pros:
- Minimal changes
- Works immediately
- Backward compatible
- Can test Privy without breaking existing system

#### ❌ Cons:
- Hacky (using Privy ID as wallet for email users)
- Still can't handle multiple wallets
- Confusing schema
- Technical debt

#### ⏱️ Time to Implement: **1 hour**

---

### **Option 2: Proper Migration (Recommended)**
**New schema with separate identity and wallets**

#### SQL:
```sql
-- Step 1: Create new users table with Privy ID as primary key
CREATE TABLE users (
  id TEXT PRIMARY KEY,  -- Privy DID
  name TEXT,
  bio TEXT,
  pfp TEXT,
  email TEXT,  -- NEW: Email from Privy
  culture TEXT,
  lat NUMERIC,
  lng NUMERIC,
  role TEXT DEFAULT 'Member',
  founder_nfts_count INTEGER DEFAULT 0,
  calendar_url TEXT,
  main_quest_url TEXT,
  side_quest_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Step 2: Create user_wallets table (one user, many wallets)
CREATE TABLE user_wallets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address TEXT NOT NULL UNIQUE,
  wallet_client TEXT,  -- 'privy', 'metamask', 'coinbase', etc.
  is_embedded BOOLEAN DEFAULT FALSE,  -- Privy embedded wallet
  is_primary BOOLEAN DEFAULT FALSE,   -- Primary wallet for this user
  chain_type TEXT DEFAULT 'ethereum', -- 'ethereum', 'avalanche', etc.
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  UNIQUE(user_id, address)
);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_address ON user_wallets(address);

-- Step 3: Create backward-compatible VIEW
CREATE VIEW members AS
SELECT 
  u.id as privy_id,
  uw.address as wallet,
  u.name,
  u.bio,
  u.email,
  u.culture,
  u.pfp,
  u.role,
  u.lat,
  u.lng,
  u.calendar_url,
  u.founder_nfts_count,
  u.main_quest_url,
  u.side_quest_url,
  u.last_seen,
  u.created_at
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = true;

-- Step 4: Migrate existing data
INSERT INTO users (
  id, name, bio, pfp, culture, lat, lng, role,
  founder_nfts_count, calendar_url, main_quest_url,
  side_quest_url, last_seen, created_at, onboarding_completed
)
SELECT 
  'migrated:' || wallet as id,  -- Temporary ID for existing users
  name, bio, pfp, culture, lat, lng, role,
  founder_nfts_count, calendar_url, main_quest_url,
  side_quest_url, last_seen, created_at,
  true  -- Existing users completed onboarding
FROM members;  -- OLD table

INSERT INTO user_wallets (
  user_id, address, is_primary, is_verified, linked_at
)
SELECT 
  'migrated:' || wallet as user_id,
  wallet as address,
  true as is_primary,
  true as is_verified,
  created_at as linked_at
FROM members;  -- OLD table

-- Step 5: Rename old table (keep as backup)
ALTER TABLE members RENAME TO members_old_backup;
```

#### How it Works:
```typescript
// When user logs in with Privy
const { user } = usePrivy();

// Create/update user record
const { data: userData } = await supabase
  .from('users')
  .upsert({
    id: user.id,  // Privy DID
    email: user.email?.address,
    last_seen: new Date().toISOString(),
  })
  .select()
  .single();

// Store all linked wallets
for (const account of user.linkedAccounts) {
  if (account.type === 'wallet') {
    await supabase.from('user_wallets').upsert({
      user_id: user.id,
      address: account.address,
      wallet_client: account.walletClient,
      is_embedded: account.walletClient === 'privy',
      is_primary: account === user.linkedAccounts[0], // First = primary
    });
  }
}

// Old queries still work via VIEW!
const { data } = await supabase
  .from('members')  // This is now a VIEW
  .select('*')
  .eq('wallet', someWalletAddress);
```

#### ✅ Pros:
- Proper data model
- Supports multiple wallets
- Supports email/social users
- Backward compatible (VIEW)
- Scalable for future

#### ❌ Cons:
- More complex migration
- Need to update queries
- Testing required

#### ⏱️ Time to Implement: **1 day**

---

### **Option 3: Parallel System (Test & Migrate)**
**Keep old system, add new system, migrate gradually**

#### SQL:
```sql
-- Create new tables alongside old ones
CREATE TABLE privy_users (
  privy_id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE privy_wallets (
  privy_id TEXT REFERENCES privy_users(privy_id),
  wallet_address TEXT UNIQUE,
  is_primary BOOLEAN DEFAULT FALSE
);

-- Old `members` table stays unchanged
```

#### How it Works:
```typescript
// Check if Privy user or old wallet user
const { user: privyUser } = usePrivy();
const { address: oldWalletAddress } = useWallet();

if (privyUser?.authenticated) {
  // New Privy flow
  await supabase.from('privy_users').upsert({
    privy_id: privyUser.id,
    email: privyUser.email?.address,
  });
} else if (oldWalletAddress) {
  // Old wallet flow (unchanged)
  await supabase.from('members').upsert({
    wallet: oldWalletAddress,
  });
}
```

#### ✅ Pros:
- Zero risk to existing system
- Can test thoroughly
- Gradual migration
- Rollback easy

#### ❌ Cons:
- Duplicate code paths
- More complex app logic
- Need to migrate users eventually
- Temporary solution

#### ⏱️ Time to Implement: **2-3 hours**

---

## 🎯 RECOMMENDATION

### **For RIGHT NOW (Testing Phase):**
**Use Option 1 (Quick Fix)**

Why?
- ✅ Test Privy immediately
- ✅ Minimal changes
- ✅ Can iterate quickly
- ✅ Learn what you need

### **For Production (1-2 weeks):**
**Use Option 2 (Proper Migration)**

Why?
- ✅ Clean data model
- ✅ Supports all Privy features
- ✅ Scalable
- ✅ Professional

---

## 📋 QUICK FIX IMPLEMENTATION

Want to test Privy RIGHT NOW? Here's the 1-hour solution:

### Step 1: Update Database Schema
```sql
-- Run in Supabase SQL Editor
ALTER TABLE members 
ADD COLUMN IF NOT EXISTS privy_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS idx_members_privy_id ON members(privy_id);
```

### Step 2: Create Helper Hook
```typescript
// src/hooks/usePrivyProfile.ts
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '@/lib/supabase';

export function usePrivyProfile() {
  const { user, authenticated } = usePrivy();

  const saveProfile = async (profileData: any) => {
    if (!user) return;

    // Determine what to use as wallet field
    const walletAddress = 
      user.wallet?.address ||           // External wallet
      user.linkedAccounts.find(a => a.type === 'wallet')?.address ||  // Any wallet
      `privy:${user.id}`;               // Fallback: use Privy ID

    await supabase.from('members').upsert({
      wallet: walletAddress,
      privy_id: user.id,
      email: user.email?.address,
      ...profileData,
      last_seen: new Date().toISOString(),
    });
  };

  return { user, authenticated, saveProfile };
}
```

### Step 3: Update ProfileSetup
```typescript
// In ProfileSetup.tsx
import { usePrivy } from '@privy-io/react-auth';

const { user } = usePrivy();

// When saving profile:
await supabase.from('members').upsert({
  wallet: user.wallet?.address || `privy:${user.id}`,
  privy_id: user.id,
  email: user.email?.address,
  name: profileData.name,
  // ... rest
});
```

---

## 🤔 WHICH OPTION SHOULD YOU CHOOSE?

### Choose **Option 1** if:
- ✅ You want to test Privy TODAY
- ✅ You're still experimenting
- ✅ You want quick iteration

### Choose **Option 2** if:
- ✅ You're ready to commit to Privy
- ✅ You want a clean architecture
- ✅ You have 1-2 days for migration

### Choose **Option 3** if:
- ✅ You're very risk-averse
- ✅ You have many existing users
- ✅ You want to A/B test both systems

---

## 💡 MY RECOMMENDATION

**Start with Option 1 TODAY:**
1. Add `privy_id` and `email` columns (5 minutes)
2. Test Privy with these quick changes (1 hour)
3. See how it feels, get user feedback

**Then migrate to Option 2 NEXT WEEK:**
1. Create proper schema (4 hours)
2. Migrate existing data (2 hours)
3. Update code to use new schema (4 hours)
4. Test thoroughly (4 hours)

**Total: 1 day of focused work for proper migration**

---

## 🚀 WANT TO START?

I can implement **Option 1 (Quick Fix)** right now in 5 minutes!

Just say the word and I'll:
1. ✅ Add the SQL migration
2. ✅ Create the helper hook
3. ✅ Update ProfileSetup to use Privy
4. ✅ Test it with the login button

**Ready?** 🦄✨




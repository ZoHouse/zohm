# 🔐 PRIVY DATABASE MIGRATION PLAN

## 📊 Current State Analysis

### Current `members` Table Structure
```sql
CREATE TABLE members (
  wallet TEXT PRIMARY KEY,           -- ❌ Problem: Single wallet as identity
  name TEXT,
  bio TEXT,
  culture TEXT,
  pfp TEXT,
  role TEXT DEFAULT 'Member',
  lat NUMERIC,
  lng NUMERIC,
  calendar_url TEXT,
  founder_nfts_count INTEGER DEFAULT 0,
  x_handle TEXT,
  x_connected BOOLEAN DEFAULT FALSE,
  main_quest_url TEXT,
  side_quest_url TEXT,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Current Issues with Privy
1. **Single Wallet = Identity**: Current DB uses wallet address as primary key
2. **No Multi-Auth Support**: Can't handle email, social, or multiple wallets
3. **No Privy User ID**: Can't track Privy's unique user identifier
4. **No Embedded Wallets**: Privy creates wallets for users - need to track these
5. **Limited Auth Methods**: Only supports wallet connection

---

## 🎯 Privy User Model (What We Need to Support)

### Privy User Object Structure
```typescript
{
  id: "did:privy:clr3..." // Privy's unique user ID (DID format)
  
  // Multiple authentication methods
  linkedAccounts: [
    { type: "email", address: "user@example.com" },
    { type: "wallet", address: "0x123...", walletClient: "metamask" },
    { type: "wallet", address: "0x456...", walletClient: "privy" }, // embedded
    { type: "google_oauth", subject: "google_12345...", email: "user@gmail.com" },
    { type: "twitter_oauth", subject: "twitter_12345...", username: "@user" },
    { type: "discord_oauth", subject: "discord_12345...", username: "user#1234" },
    { type: "phone", number: "+1234567890" },
  ],
  
  createdAt: Date,
  lastLoginAt: Date
}
```

---

## 🔄 PROPOSED DATABASE SCHEMA

### Option 1: ✅ RECOMMENDED - Separate Identity from Wallets

```sql
-- ==============================
-- MAIN USER TABLE (Identity)
-- ==============================
CREATE TABLE users (
  id TEXT PRIMARY KEY,                    -- Privy user ID (did:privy:...)
  
  -- Profile Info
  name TEXT,
  bio TEXT,
  pfp TEXT,
  culture TEXT,
  
  -- Location
  lat NUMERIC,
  lng NUMERIC,
  
  -- Metadata
  role TEXT DEFAULT 'Member',
  founder_nfts_count INTEGER DEFAULT 0,
  
  -- Links
  calendar_url TEXT,
  main_quest_url TEXT,
  side_quest_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0
);

-- ==============================
-- USER AUTHENTICATION METHODS
-- ==============================
CREATE TABLE user_auth_methods (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Auth Type
  auth_type TEXT NOT NULL,  -- 'wallet', 'email', 'google', 'twitter', 'discord', 'phone'
  
  -- Auth Identifier (depends on type)
  auth_identifier TEXT NOT NULL,  -- wallet address, email, social ID, phone
  
  -- Additional Data (JSON for flexibility)
  auth_metadata JSONB,  -- { walletClient: 'metamask', isEmbedded: true, etc. }
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,  -- One primary auth method per user
  
  -- Timestamps
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(auth_type, auth_identifier)
);

-- Index for fast lookups
CREATE INDEX idx_user_auth_user_id ON user_auth_methods(user_id);
CREATE INDEX idx_user_auth_type ON user_auth_methods(auth_type);
CREATE INDEX idx_user_auth_identifier ON user_auth_methods(auth_identifier);
CREATE INDEX idx_user_auth_primary ON user_auth_methods(user_id, is_primary);

-- ==============================
-- WALLETS (Denormalized for easy access)
-- ==============================
CREATE TABLE user_wallets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Wallet Info
  address TEXT NOT NULL UNIQUE,
  wallet_client TEXT,  -- 'metamask', 'privy', 'coinbase', 'walletconnect', etc.
  is_embedded BOOLEAN DEFAULT FALSE,  -- Privy embedded wallet
  chain_type TEXT DEFAULT 'ethereum',  -- 'ethereum', 'solana', 'polygon', etc.
  
  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- NFT Data (for founder status)
  founder_nft_balance INTEGER DEFAULT 0,
  last_nft_check TIMESTAMP,
  
  -- Timestamps
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  UNIQUE(user_id, address)
);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_address ON user_wallets(address);
CREATE INDEX idx_user_wallets_primary ON user_wallets(user_id, is_primary);

-- ==============================
-- SOCIAL CONNECTIONS (Optional)
-- ==============================
CREATE TABLE user_social_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Platform
  platform TEXT NOT NULL,  -- 'twitter', 'discord', 'google', 'github', etc.
  
  -- Social Identity
  social_id TEXT NOT NULL,  -- Platform-specific user ID
  username TEXT,
  display_name TEXT,
  profile_url TEXT,
  avatar_url TEXT,
  
  -- OAuth Data
  access_token_encrypted TEXT,  -- Store encrypted if needed
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP,
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT TRUE,  -- Show on profile?
  
  -- Timestamps
  connected_at TIMESTAMP DEFAULT NOW(),
  last_synced_at TIMESTAMP,
  
  UNIQUE(user_id, platform)
);

CREATE INDEX idx_user_social_user_id ON user_social_connections(user_id);
CREATE INDEX idx_user_social_platform ON user_social_connections(platform);

-- ==============================
-- MIGRATION COMPATIBILITY VIEW
-- ==============================
-- Create a view that mimics the old `members` table for backward compatibility
CREATE VIEW members AS
SELECT 
  u.id as user_id,
  uw.address as wallet,  -- Primary wallet address
  u.name,
  u.bio,
  u.culture,
  u.pfp,
  u.role,
  u.lat,
  u.lng,
  u.calendar_url,
  u.founder_nfts_count,
  usc_twitter.username as x_handle,
  (usc_twitter.is_verified IS NOT NULL) as x_connected,
  u.main_quest_url,
  u.side_quest_url,
  u.last_seen,
  u.created_at
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = true
LEFT JOIN user_social_connections usc_twitter ON u.id = usc_twitter.user_id AND usc_twitter.platform = 'twitter';
```

---

## 🔀 MIGRATION STRATEGY

### Phase 1: Create New Tables (No Breaking Changes)
```sql
-- Run all CREATE TABLE statements above
-- This can be done while app is running
-- Existing `members` table stays intact
```

### Phase 2: Migrate Existing Data
```sql
-- Migrate users from `members` to `users` + `user_wallets`
INSERT INTO users (
  id, name, bio, pfp, culture, lat, lng, role, 
  founder_nfts_count, calendar_url, main_quest_url, 
  side_quest_url, last_seen, created_at, onboarding_completed
)
SELECT 
  'did:privy:migrated:' || wallet as id,  -- Create synthetic Privy ID
  name, bio, pfp, culture, lat, lng, role,
  founder_nfts_count, calendar_url, main_quest_url,
  side_quest_url, last_seen, created_at,
  true  -- Existing users have completed onboarding
FROM members
WHERE wallet IS NOT NULL;

-- Migrate wallet addresses to `user_wallets`
INSERT INTO user_wallets (
  user_id, address, wallet_client, is_primary, is_verified,
  founder_nft_balance, linked_at
)
SELECT 
  'did:privy:migrated:' || wallet as user_id,
  wallet as address,
  'unknown' as wallet_client,  -- We don't know which wallet client
  true as is_primary,
  true as is_verified,
  founder_nfts_count,
  created_at as linked_at
FROM members
WHERE wallet IS NOT NULL;

-- Migrate to user_auth_methods
INSERT INTO user_auth_methods (
  user_id, auth_type, auth_identifier, is_verified, is_primary, linked_at
)
SELECT 
  'did:privy:migrated:' || wallet as user_id,
  'wallet' as auth_type,
  wallet as auth_identifier,
  true as is_verified,
  true as is_primary,
  created_at as linked_at
FROM members
WHERE wallet IS NOT NULL;

-- Migrate Twitter connections if they exist
INSERT INTO user_social_connections (
  user_id, platform, username, is_verified, is_public, connected_at
)
SELECT 
  'did:privy:migrated:' || wallet as user_id,
  'twitter' as platform,
  x_handle,
  x_connected,
  true as is_public,
  created_at as connected_at
FROM members
WHERE x_handle IS NOT NULL;
```

### Phase 3: Update Application Code
See "Code Changes Required" section below

### Phase 4: Deprecate Old Table (After Testing)
```sql
-- Once new system is verified working:
-- 1. Rename old table (don't delete immediately)
ALTER TABLE members RENAME TO members_deprecated_backup;

-- 2. Replace with view for backward compatibility
-- (Already created in Phase 1)

-- 3. After 30 days of successful operation, drop backup
-- DROP TABLE members_deprecated_backup;
```

---

## 💻 CODE CHANGES REQUIRED

### 1. Install Privy SDK
```bash
npm install @privy-io/react-auth @privy-io/server-auth
```

### 2. Update Environment Variables
```env
# Add to .env.local
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Keep existing
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Replace `useWallet` Hook with Privy Hook
**Current**: `src/hooks/useWallet.ts` (MetaMask direct)
**New**: Wrap Privy's `usePrivy()` hook

```typescript
// src/hooks/usePrivyUser.ts
import { usePrivy, useWallets } from '@privy-io/react-auth';

export function usePrivyUser() {
  const {
    ready,
    authenticated,
    user,
    login,
    logout,
    linkEmail,
    linkWallet,
    linkGoogle,
    linkTwitter,
    linkDiscord,
  } = usePrivy();
  
  const { wallets } = useWallets();
  
  // Get primary wallet
  const primaryWallet = wallets.find(w => /* logic */);
  
  return {
    isReady: ready,
    isAuthenticated: authenticated,
    privyUser: user,
    userId: user?.id,
    primaryWallet: primaryWallet?.address,
    allWallets: wallets,
    login,
    logout,
    linkEmail,
    linkWallet,
    linkGoogle,
    linkTwitter,
    linkDiscord,
  };
}
```

### 4. Update Database Queries

**Before (using wallet as key):**
```typescript
const { data } = await supabase
  .from('members')
  .select('*')
  .eq('wallet', walletAddress)
  .single();
```

**After (using Privy user ID):**
```typescript
const { data } = await supabase
  .from('users')
  .select(`
    *,
    user_wallets(*),
    user_social_connections(*)
  `)
  .eq('id', privyUserId)
  .single();
```

**Or use the backward-compatible view:**
```typescript
// Still works during transition!
const { data } = await supabase
  .from('members')  // This is now a VIEW
  .select('*')
  .eq('wallet', walletAddress)
  .single();
```

### 5. Update Profile Creation

**Before:**
```typescript
await supabase.from('members').upsert({
  wallet: address,
  name: 'User',
  // ...
});
```

**After:**
```typescript
// Create user record
const { data: user } = await supabase.from('users').upsert({
  id: privyUser.id,
  name: 'User',
  // ...
});

// Link authentication methods
for (const account of privyUser.linkedAccounts) {
  await supabase.from('user_auth_methods').upsert({
    user_id: privyUser.id,
    auth_type: account.type,
    auth_identifier: account.address || account.email || account.subject,
    auth_metadata: account,
    is_primary: account === privyUser.linkedAccounts[0],
  });
  
  // If it's a wallet, also add to user_wallets
  if (account.type === 'wallet') {
    await supabase.from('user_wallets').upsert({
      user_id: privyUser.id,
      address: account.address,
      wallet_client: account.walletClient,
      is_embedded: account.walletClient === 'privy',
      is_primary: account === privyUser.linkedAccounts[0],
    });
  }
}
```

---

## 🎨 BENEFITS OF NEW SCHEMA

### ✅ Privy Features Unlocked
1. **Social Login**: Google, Twitter, Discord, GitHub
2. **Email/SMS Login**: No wallet required
3. **Embedded Wallets**: Privy creates wallets for users
4. **Multi-Wallet**: Users can link multiple wallets
5. **Progressive Onboarding**: Start with email, add wallet later
6. **Account Recovery**: Email recovery for wallet access

### ✅ Database Benefits
1. **Single Source of Truth**: User ID = Privy DID
2. **Flexible Auth**: Easy to add new auth methods
3. **Better Queries**: Join on user_id instead of wallet
4. **Migration Safe**: View provides backward compatibility
5. **Future Proof**: Can add passkeys, phone, etc.

### ✅ UX Benefits
1. **Faster Onboarding**: No MetaMask required
2. **Lower Friction**: Email login → explore → add wallet later
3. **Better Mobile**: Works without mobile wallet apps
4. **Account Linking**: Connect all identities to one profile
5. **Secure**: Privy handles auth security

---

## 🚨 POTENTIAL CHALLENGES

### Challenge 1: Existing Users with Only Wallet
**Solution**: Migration script creates synthetic Privy IDs
- When they login with Privy for first time
- Match wallet address to find existing user
- Replace synthetic ID with real Privy ID
- Keep all profile data intact

### Challenge 2: Multiple Wallets per User
**Solution**: `is_primary` flag + primary wallet view
- One wallet marked as primary
- All quests/NFTs checked across all wallets
- UI shows all wallets, lets user pick primary

### Challenge 3: Backward Compatibility
**Solution**: `members` VIEW mimics old table
- Old queries still work during migration
- Gradually update queries to new schema
- Remove view after full migration

### Challenge 4: Founder NFT Checking
**Solution**: Check all user's wallets
```typescript
const { data: wallets } = await supabase
  .from('user_wallets')
  .select('address')
  .eq('user_id', userId);

let totalNFTs = 0;
for (const wallet of wallets) {
  const nfts = await checkFounderNFT(wallet.address);
  totalNFTs += nfts;
}

// Update founder status
await supabase.from('users').update({
  founder_nfts_count: totalNFTs,
  role: totalNFTs > 0 ? 'Founder' : 'Member'
}).eq('id', userId);
```

---

## 📋 MIGRATION CHECKLIST

### Pre-Migration
- [ ] Review Privy pricing & limits
- [ ] Create Privy account & app
- [ ] Test Privy in development
- [ ] Back up current `members` table
- [ ] Create migration rollback plan

### Database Changes
- [ ] Create new tables (users, user_auth_methods, user_wallets, user_social_connections)
- [ ] Create indexes
- [ ] Run data migration script
- [ ] Create backward-compatible view
- [ ] Test queries against new schema

### Code Changes
- [ ] Install Privy SDK
- [ ] Add Privy provider to app
- [ ] Create `usePrivyUser` hook
- [ ] Update all auth flows
- [ ] Update profile queries
- [ ] Update NFT checking logic
- [ ] Update onboarding flow
- [ ] Add multi-wallet UI
- [ ] Add social login buttons

### Testing
- [ ] Test new user signup (email, social, wallet)
- [ ] Test existing user login (wallet match)
- [ ] Test multi-wallet linking
- [ ] Test profile data persistence
- [ ] Test founder NFT checking
- [ ] Test backward-compatible queries
- [ ] Test on mobile

### Launch
- [ ] Deploy database changes to production
- [ ] Run migration script
- [ ] Deploy code changes
- [ ] Monitor errors & user feedback
- [ ] Keep old `members` table for 30 days
- [ ] Final cleanup after verification

---

## 🔮 FUTURE ENHANCEMENTS (Post-Privy)

### Easy Wins
1. **Passkey Support**: Privy supports WebAuthn passkeys
2. **Phone Login**: SMS verification
3. **Cross-Chain**: Support Solana, Polygon, Base, etc.
4. **Social Graph**: "Friends who use X" feature
5. **Unified Identity**: See user's full web3+web2 identity

### Advanced
1. **Account Abstraction**: ERC-4337 smart contract wallets
2. **Session Keys**: Temporary signing without wallet popup
3. **Social Recovery**: Friends help recover account
4. **Delegation**: Let apps act on your behalf
5. **Privacy Layers**: Zero-knowledge proofs for age verification, etc.

---

## 💰 COST CONSIDERATIONS

### Privy Pricing (as of 2024)
- **Free Tier**: 1,000 MAU (Monthly Active Users)
- **Starter**: $99/mo for 5,000 MAU
- **Pro**: Custom pricing for >5,000 MAU

### Recommendation
Start with free tier (1,000 MAU is plenty for MVP)

---

## 🎯 RECOMMENDED NEXT STEPS

### Step 1: Prototype (1-2 days)
- Create Privy account
- Test basic auth flow in dev
- Try all login methods (email, wallet, social)
- Confirm it works on mobile

### Step 2: Schema Design (1 day)
- Review & refine proposed schema
- Create migration scripts
- Test on dev database

### Step 3: Code Migration (3-5 days)
- Replace wallet connect with Privy
- Update all database queries
- Add multi-wallet support
- Update UI for social logins

### Step 4: Testing (2-3 days)
- Test all user flows
- Test existing user migration
- Test multi-auth scenarios
- Mobile testing

### Step 5: Launch (1 day)
- Deploy database changes
- Deploy code changes
- Monitor for issues
- Support users during transition

**Total Estimated Time: 1-2 weeks**

---

## 📚 RESOURCES

- [Privy Docs](https://docs.privy.io/)
- [Privy React SDK](https://docs.privy.io/guide/react)
- [Privy Server SDK](https://docs.privy.io/guide/server)
- [Supabase Row Level Security with Privy](https://supabase.com/docs/guides/auth/row-level-security)

---

**Ready to proceed? What aspect would you like to tackle first?** 🦄✨




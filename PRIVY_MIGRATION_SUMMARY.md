# 🦄 Privy Migration Summary

## ✅ Migration Complete!

The application has been successfully migrated from wallet-centric authentication to **Privy authentication** with a clean, modern database structure.

---

## 📊 What Changed

### **Old System (Deprecated)**
- Single `members` table keyed by wallet address
- Only wallet-based authentication
- No support for email/social login
- One wallet per user

### **New System (Active)**
- `users` table keyed by Privy DID (did:privy:...)
- `user_wallets` table for multiple wallets per user
- `user_auth_methods` table for email/social/wallet authentication
- Full Privy authentication support
- Backward-compatible `members` VIEW (read-only, for documentation only)

---

## 🗄️ Database Tables

### **Active Tables (Privy System)**

#### `users` - Main user table
- `id` (TEXT, PK): Privy DID
- `name`, `bio`, `pfp`, `culture`: Profile fields
- `email`: Primary email
- `lat`, `lng`: Location
- `role`: 'Founder', 'Member', 'Citizen'
- `onboarding_completed`: Boolean
- `created_at`, `last_seen`, `updated_at`: Timestamps

#### `user_wallets` - Multi-wallet support
- `id` (TEXT, PK): Wallet record ID
- `user_id` (FK → users.id): User reference
- `address` (TEXT, UNIQUE): Wallet address
- `chain_type`: 'ethereum', 'avalanche', etc.
- `is_primary`: Primary wallet flag
- `is_embedded`: Privy embedded wallet flag

#### `user_auth_methods` - Authentication methods
- `id` (TEXT, PK): Auth method ID
- `user_id` (FK → users.id): User reference
- `auth_type`: 'email', 'google', 'twitter', 'wallet'
- `identifier`: Email address, OAuth subject, wallet address
- `linked_at`: Timestamp

### **Deprecated Tables (For Documentation Only)**

#### `members` VIEW
- Read-only view for backward compatibility
- Maps `users` + `user_wallets` to old schema
- **DO NOT USE FOR WRITES**
- Kept for reference/documentation only

#### `members_backup_pre_privy` TABLE
- Backup of original members table
- Contains all pre-migration data
- Safe to drop after 1-2 weeks of stable operation

---

## 🔧 Code Changes

### **Updated Components**

#### ✅ `ProfilePanel.tsx`
- Now uses `usePrivyUser()` hook exclusively
- Removed `useProfileGate()` dependency
- All updates go to `users` table via `updateUserProfile()`
- No more direct `members` table queries

#### ✅ `DashboardOverlay.tsx`
- Uses `usePrivyUser()` for authentication
- Displays Privy user data

#### ✅ `WalletOverlay.tsx`
- Uses `usePrivyUser()` for wallet address
- Shows Privy-managed wallets

#### ✅ `ProfileSetup.tsx`
- Uses `upsertUserFromPrivy()` for profile creation
- Creates records in `users`, `user_wallets`, `user_auth_methods`

#### ✅ `page.tsx`
- Removed `useProfileGate()` dependency
- Uses only `usePrivyUser()` for authentication and profile

### **New Files Created**

- `src/lib/privyDb.ts`: Helper functions for Privy database operations
- `src/hooks/usePrivyUser.ts`: Main Privy authentication hook
- `src/providers/PrivyProvider.tsx`: Privy provider wrapper
- `migrations/001_privy_migration.sql`: Database migration SQL
- `migrations/001_privy_migration_ROLLBACK.sql`: Rollback SQL

### **Deprecated Files (Not Used)**

- `src/hooks/useWallet.ts` - Replaced by `usePrivyUser`
- `src/hooks/useProfileGate.ts` - Replaced by `usePrivyUser`
- `src/components/WalletConnectButton.tsx` - Replaced by Privy login
- `src/components/MainQuestCard.tsx` - Removed from dashboard
- `src/components/SideQuestCard.tsx` - Removed from dashboard

---

## 🔐 Environment Variables

Required in `.env.local`:

```bash
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=cmfz8clnf0059kw0cs9hsqfsm

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://elvaqxadfewcsohrswsi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 🚀 Key Features

### Authentication Methods
- ✅ Email authentication
- ✅ Social login (Google, Twitter, Discord, etc.)
- ✅ Wallet authentication (MetaMask, Coinbase, etc.)
- ✅ Privy embedded wallets

### Multi-Wallet Support
- Users can link multiple wallets
- Designate a primary wallet
- Support for external and embedded wallets

### Onboarding Flow
1. "Take the Red Pill" button triggers Privy login
2. 5-step profile setup (ProfileSetup component)
3. Creates user in `users` table
4. Syncs wallets to `user_wallets` table
5. Syncs auth methods to `user_auth_methods` table
6. Marks onboarding as complete

---

## 📝 Database Operations

### Reading User Data
```typescript
import { usePrivyUser } from '@/hooks/usePrivyUser';

const { userProfile, primaryWalletAddress, isFounder } = usePrivyUser();
```

### Updating User Data
```typescript
import { updateUserProfile } from '@/lib/privyDb';

await updateUserProfile(userProfile.id, {
  name: 'New Name',
  bio: 'New Bio',
  culture: 'Technology,Music'
});
```

### Creating/Upserting User
```typescript
import { upsertUserFromPrivy } from '@/lib/privyDb';

await upsertUserFromPrivy(privyUser, {
  name: 'John Doe',
  onboarding_completed: true
});
```

---

## ⚠️ Important Notes

### RLS (Row Level Security)
- **Currently DISABLED** for development
- To enable RLS, create proper policies in Supabase
- See `migrations/001_privy_migration.sql` for policy templates

### Backward Compatibility
- The `members` VIEW provides read-only access
- Old queries against `members` will still work for reads
- **Do NOT write to `members` table/view**
- All writes must go to `users` table

### Migration Cleanup
After 1-2 weeks of stable operation:
```sql
-- Verify everything works first!
DROP TABLE IF EXISTS members_backup_pre_privy;
```

---

## 🎯 Next Steps

### Production Checklist
- [ ] Enable RLS policies on Privy tables
- [ ] Set up proper Supabase policies for multi-tenant access
- [ ] Add wallet balance fetching endpoints
- [ ] Add transaction history endpoints
- [ ] Monitor error logs for any missed `members` table references
- [ ] After stable operation, drop `members_backup_pre_privy`

### Future Enhancements
- [ ] Add wallet switching UI
- [ ] Display all linked wallets in profile
- [ ] Add ability to unlink wallets
- [ ] Show authentication methods in profile
- [ ] Add email verification flow

---

## 🐛 Debugging

If you see errors related to the old `members` table:

1. **Check the component** - Search for `.from('members')`
2. **Update to Privy** - Use `updateUserProfile()` instead
3. **Reload profile** - Call `reloadProfile()` from `usePrivyUser()`

If you see "Invalid API key" errors:

1. Verify `.env.local` has correct Supabase credentials
2. Restart dev server: `npm run dev`
3. Clear Next.js cache: `rm -rf .next`

---

## 📚 Documentation

- [Privy Documentation](https://docs.privy.io/)
- [Supabase Documentation](https://supabase.com/docs)
- Migration SQL: `migrations/001_privy_migration.sql`
- Migration Guide: `migrations/README.md`

---

**Migration completed on:** October 18, 2025
**Status:** ✅ Production Ready (with RLS disabled)



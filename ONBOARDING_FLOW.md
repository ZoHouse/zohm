# 🦄 Onboarding Flow - How It Works

## ✨ Overview

Your app now supports **BOTH** Privy authentication (email, social, wallet) **AND** legacy wallet-only authentication, with the same beautiful 5-step onboarding experience for everyone.

---

## 🚀 How It Works

### **Step 1: User Lands on the App**

The app checks authentication status:

```
┌─────────────────────────────┐
│  Is user authenticated?     │
└─────────────────────────────┘
           │
           ├── YES (Privy) ────────────────┐
           │                                │
           ├── YES (Wallet) ───────────────┤
           │                                │
           └── NO ─────────────────────────┘
                                            │
                                    Show "Login with Privy"
                                    or "Connect Wallet" button
```

### **Step 2: Profile Check**

If authenticated, check if profile is complete:

```typescript
// For Privy users:
if (privyAuthenticated) {
  if (privyOnboardingComplete && privyUserProfile) {
    // ✅ Show main app
  } else {
    // 🎭 Show ProfileSetup (5-step onboarding)
  }
}

// For legacy wallet users:
if (walletConnected) {
  if (profileExistsInDatabase) {
    // ✅ Show main app
  } else {
    // 🎭 Show ProfileSetup (5-step onboarding)
  }
}
```

### **Step 3: ProfileSetup Modal**

The same 5-step onboarding for ALL users:

1. **Name** - "What's your name?"
2. **Bio** - "Tell us about yourself"
3. **Culture** - "What's your primary culture?"
4. **Location** - "Where are you located?"
5. **Calendar** - "Calendar Integration (Optional)"

### **Step 4: Save Profile**

When user completes onboarding:

```typescript
// Privy users → Save to new `users` table
await upsertUserFromPrivy(privyUser, {
  name, bio, culture, lat, lng, calendar_url,
  onboarding_completed: true
});

// Legacy wallet users → Save to old `members` table
await supabase.from('members').upsert({
  wallet, name, bio, culture, lat, lng, calendar_url
});
```

### **Step 5: Welcome to the App!**

User sees the main app with:
- 3D map with events
- Dashboard with profile
- Wallet overlay (for Privy users)

---

## 🎭 The "Red Pill" Button

The button that triggers onboarding is the **"Login with Privy"** or **"Connect Wallet"** button.

### Where to find it:

1. **Privy Login Button** (NEW):
   - Located in the top-right corner
   - Text: "Login with Privy"
   - Opens Privy modal with email/social/wallet options

2. **Wallet Connect Button** (OLD):
   - Your existing WalletConnectButton component
   - Connects MetaMask, Coinbase Wallet, etc.

---

## 🔄 Flow Diagram

```
┌──────────────────────────────────────────────────┐
│                 User Visits App                  │
└──────────────────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────┐
         │  Authentication Status  │
         └─────────────────────────┘
                   │
    ┌──────────────┼──────────────┐
    │              │              │
    ▼              ▼              ▼
Privy User    Wallet User    Not Logged In
    │              │              │
    ▼              ▼              └─────────────┐
┌───────┐      ┌───────┐                       │
│Profile│      │Profile│                       │
│Check  │      │Check  │                       │
└───────┘      └───────┘                       │
    │              │                            │
    ├─Complete?    ├─Exists?                   │
    │              │                            │
YES │         YES  │                            │
    │              │                            │
    ▼              ▼                            ▼
┌──────────────────────────────────────────────────┐
│               Show Main App                      │
│  ✅ 3D Map   ✅ Dashboard   ✅ Events          │
└──────────────────────────────────────────────────┘

NO  │         NO   │
    │              │
    ▼              ▼
┌──────────────────────────────────────────────────┐
│          🎭 ProfileSetup Modal                   │
│                                                   │
│  Step 1: Name                                    │
│  Step 2: Bio                                     │
│  Step 3: Culture                                 │
│  Step 4: Location                                │
│  Step 5: Calendar (optional)                     │
│                                                   │
│  [Back]                    [Next/Complete Setup] │
└──────────────────────────────────────────────────┘
                       │
                       ▼ (After completion)
┌──────────────────────────────────────────────────┐
│     ✅ Profile Saved → Welcome to Zo World!     │
└──────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### **Files Modified:**

1. **`src/components/ProfileSetup.tsx`**
   - Added Privy support with `usePrivy()` hook
   - Saves to `users` table for Privy users
   - Saves to `members` table for legacy wallet users
   - Same 5-step UI for everyone

2. **`src/app/page.tsx`**
   - Added `usePrivyUser()` hook
   - Checks both Privy and wallet authentication
   - Shows ProfileSetup based on `onboarding_completed` flag
   - Backward compatible with old wallet flow

3. **Database Schema:**
   - NEW: `users` table (Privy users)
   - NEW: `user_wallets` table (multiple wallets)
   - NEW: `user_auth_methods` table (email, social)
   - OLD: `members` table (now a VIEW for compatibility)

### **Key State Variables:**

```typescript
// Privy state
const { 
  authenticated: privyAuthenticated,
  userProfile: privyUserProfile,
  hasCompletedOnboarding: privyOnboardingComplete,
} = usePrivyUser();

// Legacy wallet state
const wallet = useWallet();

// Profile status
const [userProfileStatus, setUserProfileStatus] = useState<
  'loading' | 'exists' | 'not_exists' | null
>(null);

// Onboarding trigger
const shouldShowOnboarding = 
  (privyAuthenticated && userProfileStatus === 'not_exists') ||
  (wallet.isConnected && !privyAuthenticated && userProfileStatus === 'not_exists');
```

---

## 🧪 Testing Guide

### **Test Case 1: New Privy User (Email)**

1. Click "Login with Privy" button
2. Choose "Email"
3. Enter email and verify
4. ✅ ProfileSetup modal appears
5. Complete 5 steps
6. ✅ Lands on main app

### **Test Case 2: New Privy User (Google)**

1. Click "Login with Privy" button
2. Choose "Google"
3. Sign in with Google
4. ✅ ProfileSetup modal appears
5. Complete 5 steps
6. ✅ Lands on main app

### **Test Case 3: New Privy User (Wallet)**

1. Click "Login with Privy" button
2. Choose "MetaMask" (or other wallet)
3. Connect wallet
4. ✅ ProfileSetup modal appears
5. Complete 5 steps
6. ✅ Lands on main app

### **Test Case 4: Legacy Wallet User**

1. Connect wallet via old WalletConnect button
2. ✅ ProfileSetup modal appears (if new user)
3. Complete 5 steps
4. ✅ Lands on main app

### **Test Case 5: Returning User**

1. Login with Privy OR connect wallet
2. ✅ Directly lands on main app (no onboarding)
3. Profile data loads from database

---

## 🎯 Key Features

✅ **Universal Onboarding** - Same 5-step experience for all users  
✅ **Multiple Auth Methods** - Email, Google, Twitter, Wallet  
✅ **Backward Compatible** - Legacy wallet users still work  
✅ **Smart Routing** - New users see onboarding, returning users skip it  
✅ **Database Migration** - New schema supports Privy, old schema still works  
✅ **Profile Persistence** - All data saved properly in database  

---

## 🐛 Debugging

If onboarding doesn't show:

1. **Check browser console** for logs:
   ```
   🦄 Privy user detected!
   ❌ Privy user needs to complete onboarding
   🎭 Showing onboarding screen
   ```

2. **Check Privy authentication**:
   ```typescript
   console.log('Privy:', {
     authenticated: privyAuthenticated,
     hasProfile: !!privyUserProfile,
     onboardingComplete: privyOnboardingComplete
   });
   ```

3. **Check database**:
   ```sql
   -- For Privy users
   SELECT * FROM users WHERE id = 'did:privy:...';
   
   -- For wallet users
   SELECT * FROM members WHERE wallet = '0x...';
   ```

---

## 🦄 Next Steps

After users complete onboarding:

1. They see the main app with the map
2. Their profile appears in the dashboard
3. They can edit their profile anytime
4. For Privy users, they can open the wallet overlay

---

## 💡 Tips

- **Privy Login Button** is positioned top-right at `z-[9999]`
- **ProfileSetup Modal** appears on top of everything at `z-50`
- **Both auth methods work simultaneously** - no conflicts
- **User can switch** between Privy and wallet authentication

**Welcome to the new onboarding experience!** 🎉




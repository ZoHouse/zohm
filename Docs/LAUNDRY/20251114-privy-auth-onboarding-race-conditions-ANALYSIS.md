# Privy Auth → Onboarding Race Conditions - Complete Analysis

**Date**: 2025-11-14  
**Issue**: Avatar selection screen flashes during Privy authentication  
**Severity**: High - Affects all new user first impressions  

---

## 🔴 The Flashing Problem

### **What User Sees:**

```
1. Click "Connect Wallet" on Landing Page
2. Privy modal opens
3. User connects wallet
4. Brief loading screen ✅ (expected)
5. FLASH: Avatar screen appears for 100ms ❌
6. FLASH: Loading screen again ❌
7. FLASH: Nickname screen appears ❌
8. Finally: Stable on nickname screen ✅
```

**Result**: User sees avatar screen flash before nickname screen, confusing flow

---

## 🔍 Root Cause Analysis

### **Race Condition Chain:**

```typescript
// page.tsx lines 134-171

useEffect(() => {
  const initApp = async () => {
    // ... Supabase checks ...
    
    // 🔴 PROBLEM STARTS HERE:
    if (privyReady && privyAuthenticated && !privyLoading && privyUserProfile) {
      console.log('🦄 Privy user authenticated, ready, and profile loaded!');
      
      if (privyOnboardingComplete) {
        setUserProfileStatus('exists');
      } else {
        setUserProfileStatus('not_exists'); // ❌ Triggers re-render!
      }
    }
  };
  
  initApp();
}, [privyReady, privyAuthenticated, privyOnboardingComplete, privyLoading, privyUserProfile]);
//   ↑ PROBLEM: privyUserProfile changes multiple times during load
```

### **Timeline of Events:**

| Time | Event | State Changes | Component Rendered |
|------|-------|---------------|-------------------|
| T0 | User clicks "Connect" | - | `<LandingPage>` |
| T1 | Privy modal opens | `privyAuthenticated = true` (pending) | `<LandingPage>` |
| T2 | Wallet connected | `privyAuthenticated = true`, `privyLoading = true` | `<LoadingScreen>` |
| T3 | **Profile loading (partial)** | `privyUserProfile = { wallet: "0x..." }` | ⚠️ **Effect triggers** |
| T4 | **Effect runs #1** | `userProfileStatus = 'not_exists'` | `<Onboarding2 step="nickname">` ✅ |
| T5 | **Profile updates (more data)** | `privyUserProfile = { wallet, email, ... }` | ⚠️ **Effect triggers again** |
| T6 | **Effect runs #2** | `userProfileStatus = 'not_exists'` (again) | Unmount → Remount ❌ |
| T7 | **Profile finalizes** | `privyUserProfile = { ...complete }` | ⚠️ **Effect triggers again** |
| T8 | **Effect runs #3** | `userProfileStatus = 'not_exists'` (again) | Unmount → Remount ❌ |
| T9 | **Stable** | `privyLoading = false` | `<Onboarding2 step="nickname">` ✅ |

**Problem**: Steps T3-T8 cause **3 unmount/remount cycles** = **flashing**

---

## 🐛 Why Avatar Screen Appears

### **Onboarding2 State Persistence:**

```typescript
// Onboarding2.tsx line 26
const [step, setStep] = useState('nickname'); // ✅ Starts at nickname

// BUT: If component unmounts/remounts during race condition...
```

**Hypothesis**: Between unmount/remount cycles:
1. React might persist some state incorrectly
2. Or: localStorage/session might have stale avatar state
3. Or: Privy profile might have partial `onboarding_completed` flag

Let me check if there's avatar state somewhere...

### **Checking for Stale State:**

```typescript
// Could be in:
// 1. localStorage.getItem('onboarding_step') ❓
// 2. Privy custom metadata ❓
// 3. React dev tools showing wrong initial state ❓
```

---

## ✅ Solution Architecture

### **Fix 1: Debounce Profile Status Setting**

```typescript
// NEW: Use ref to track if we've already set status
const hasSetProfileStatus = useRef(false);

useEffect(() => {
  const initApp = async () => {
    // ... Supabase checks ...
    
    // FIXED: Only set status once when truly stable
    if (
      privyReady && 
      privyAuthenticated && 
      !privyLoading && 
      privyUserProfile &&
      !hasSetProfileStatus.current  // ✅ Prevent multiple calls
    ) {
      console.log('🦄 Privy user authenticated and stable!');
      
      // Add small delay to ensure profile is fully loaded
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (privyOnboardingComplete) {
        setUserProfileStatus('exists');
      } else {
        setUserProfileStatus('not_exists');
      }
      
      hasSetProfileStatus.current = true; // ✅ Mark as set
    }
  };
  
  initApp();
}, [privyReady, privyAuthenticated, privyOnboardingComplete, privyLoading]);
//  ↑ REMOVED privyUserProfile from deps to prevent re-triggers
```

---

### **Fix 2: Add Loading Guard During Profile Stabilization**

```typescript
// page.tsx - Add new loading state

const [isProfileStabilizing, setIsProfileStabilizing] = useState(false);

useEffect(() => {
  if (privyAuthenticated && privyLoading) {
    setIsProfileStabilizing(true);
  } else if (privyAuthenticated && !privyLoading && userProfileStatus) {
    // Profile loaded and status set
    setIsProfileStabilizing(false);
  }
}, [privyAuthenticated, privyLoading, userProfileStatus]);

// THEN: Add guard before showing onboarding
if (isProfileStabilizing) {
  return <LoadingScreen message="Preparing your portal..." />;
}

if (userProfileStatus === 'not_exists') {
  return <Onboarding2 ... />;
}
```

---

### **Fix 3: Wrap State Updates in startTransition**

```typescript
import { startTransition } from 'react';

// Inside initApp
startTransition(() => {
  if (privyOnboardingComplete) {
    setUserProfileStatus('exists');
  } else {
    setUserProfileStatus('not_exists');
  }
});
```

This tells React: "This state update is not urgent, batch it with others"

---

### **Fix 4: Add Onboarding2 Mount Guard**

```typescript
// Onboarding2.tsx

const [isReady, setIsReady] = useState(false);

useEffect(() => {
  // Small delay to prevent flash during mount
  const timer = setTimeout(() => setIsReady(true), 50);
  return () => clearTimeout(timer);
}, []);

if (!isReady) {
  return (
    <div className="fixed inset-0 bg-black" />
  );
}

// Then render actual onboarding
```

---

## 📊 Impact Analysis

### **Current (Broken):**
- ❌ Avatar screen flashes 1-3 times
- ❌ Component unmounts/remounts 2-3 times
- ❌ useEffect runs 3-5 times during profile load
- ❌ Poor first impression
- ❌ Potential state corruption

### **After Fix:**
- ✅ Single smooth transition: Landing → Loading → Nickname
- ✅ No flashing
- ✅ useEffect runs once when stable
- ✅ Clean first impression
- ✅ Guaranteed state consistency

---

## 🔧 Implementation Steps

### **Step 1: Add hasSetProfileStatus ref**
```typescript
// page.tsx - After other refs
const hasSetProfileStatus = useRef(false);
```

### **Step 2: Modify initApp effect**
```typescript
// Remove privyUserProfile from dependencies
// Add hasSetProfileStatus check
// Add 100ms stabilization delay
```

### **Step 3: Add isProfileStabilizing state**
```typescript
const [isProfileStabilizing, setIsProfileStabilizing] = useState(false);
```

### **Step 4: Add loading guard**
```typescript
if (isProfileStabilizing) {
  return <LoadingScreen message="Preparing your portal..." />;
}
```

### **Step 5: Test thoroughly**
```
1. Fresh user (new wallet)
2. Returning user (existing profile)
3. Slow network simulation
4. Multiple rapid logins
```

---

## 🎯 Testing Checklist

### **Before Fix:**
- [ ] Observe avatar screen flash
- [ ] Count number of unmount/remounts (console logs)
- [ ] Check useEffect call count
- [ ] Verify state corruption possibility

### **After Fix:**
- [ ] No avatar screen flash ✅
- [ ] Single mount of Onboarding2 ✅
- [ ] useEffect called once ✅
- [ ] Smooth Loading → Nickname transition ✅
- [ ] Test with slow network ✅
- [ ] Test with fast network ✅

---

## 🚨 Related Issues

This race condition is **connected to** the QuestComplete → Map animation issue:

| Issue | Root Cause | Shared Problem |
|-------|-----------|----------------|
| Avatar flash on auth | Multiple useEffect triggers | **Async state updates not debounced** |
| Map animation broken | Multiple setState calls | **No batching of state changes** |
| Loading screen flash | Conditional render race | **No single loading state machine** |

**All 3 issues need the same architectural fix:**
- Single state machine
- Debounced async operations
- Batched state updates
- Guaranteed order of operations

---

## 💡 Long-Term Solution

Create a **unified auth + onboarding state machine**:

```typescript
// hooks/useAuthFlow.ts

type AuthState = 
  | 'initializing'
  | 'unauthenticated'
  | 'authenticating'
  | 'profile-loading'
  | 'onboarding-required'
  | 'onboarding-in-progress'
  | 'ready';

export function useAuthFlow() {
  const [state, setState] = useState<AuthState>('initializing');
  
  // Single transition function
  const transition = (to: AuthState) => {
    console.log(`Auth flow: ${state} → ${to}`);
    setState(to);
  };
  
  // Guaranteed state transitions
  useEffect(() => {
    if (privyReady && !privyAuthenticated) {
      transition('unauthenticated');
    } else if (privyAuthenticated && privyLoading) {
      transition('profile-loading');
    } else if (privyAuthenticated && !privyLoading && !privyOnboardingComplete) {
      transition('onboarding-required');
    } else if (privyAuthenticated && !privyLoading && privyOnboardingComplete) {
      transition('ready');
    }
  }, [privyReady, privyAuthenticated, privyLoading, privyOnboardingComplete]);
  
  return state;
}

// Then in page.tsx:
const authState = useAuthFlow();

if (authState === 'initializing' || authState === 'profile-loading') {
  return <LoadingScreen />;
}
if (authState === 'unauthenticated') {
  return <LandingPage />;
}
if (authState === 'onboarding-required' || authState === 'onboarding-in-progress') {
  return <OnboardingFlow />;
}
if (authState === 'ready') {
  return <MainApp />;
}
```

---

## 🏁 Immediate Action Plan

**Priority 1 (Now)**: Quick fix
1. Add `hasSetProfileStatus` ref
2. Remove `privyUserProfile` from deps
3. Add 100ms delay
**Time**: 15 minutes

**Priority 2 (Soon)**: Loading guard
1. Add `isProfileStabilizing` state
2. Show loading during stabilization
**Time**: 10 minutes

**Priority 3 (Later)**: State machine
1. Create `useAuthFlow` hook
2. Refactor page.tsx to use it
**Time**: 1 hour

---

**Current Status**: Analysis complete  
**Next Step**: Implement Priority 1 quick fix  
**Estimated fix time**: 25 minutes total

---

**Authored by**: AI + @samurairann  
**Date**: 2025-11-14  
**Vibe**: 🔍🛠️ Let's squash these race conditions!


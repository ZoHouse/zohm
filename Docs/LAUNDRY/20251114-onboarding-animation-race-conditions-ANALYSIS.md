# Onboarding → Space Animation Race Conditions - Deep Analysis

**Date**: 2025-11-14  
**Issue**: Flashing errors, race conditions during onboarding completion → space animation  
**Root Cause**: Multiple async state updates causing component unmount/remount cycles  

---

## 🔴 Current Broken Flow

### **Step-by-Step Breakdown:**

```
1. User completes QuestComplete
   └─> handleQuestCompleteGoHome() triggered

2. handleQuestCompleteGoHome() does:
   ├─> setIsTransitioningFromOnboarding(true)
   ├─> reloadProfile() [ASYNC - 500ms+]
   ├─> setTimeout 500ms
   ├─> setUserProfileStatus('exists') ⚠️ CAUSES RE-RENDER
   ├─> setTimeout 200ms
   ├─> setShouldAnimateFromSpace(true) ⚠️ CAUSES RE-RENDER
   ├─> setOnboardingStep(null) ⚠️ CAUSES RE-RENDER
   └─> setIsLoading(false) ⚠️ CAUSES RE-RENDER

3. Each setState triggers re-render:
   ├─> QuestComplete unmounts
   ├─> Loading screen briefly shows (if guards fail)
   ├─> Main app tries to mount
   ├─> MapCanvas tries to initialize
   ├─> But userLocation might not be ready yet
   └─> Animation tries to trigger but map not ready
```

### **Race Conditions Identified:**

| Race # | Component A | Component B | Result |
|--------|-------------|-------------|--------|
| **1** | `reloadProfile()` loading | `setUserProfileStatus('exists')` | Profile data not ready when main app renders |
| **2** | `MapCanvas` initialization | `shouldAnimateFromSpace = true` | Animation triggers before map loaded |
| **3** | User location fetch | Map ready for markers | User marker not placed yet |
| **4** | Multiple setState calls | React re-render batching | Intermediate states flash on screen |
| **5** | `isTransitioningFromOnboarding` flag | Loading screen guards | Brief loading flash |

### **Flashing Symptoms:**

```
Frame 1: QuestComplete visible
Frame 2: Brief black screen (unmount)
Frame 3: Loading spinner (guard failed)
Frame 4: Main app rendering without data (profile not ready)
Frame 5: Error state (userLocation null)
Frame 6: Data arrives, re-render
Frame 7: Map initializes
Frame 8: Animation triggers (finally works)
```

**User sees**: 2-3 flashes + errors that "auto-resolve"

---

## ✅ Proper Flow (What It Should Be)

### **Ideal State Transitions:**

```
┌─────────────────────┐
│  QuestComplete      │
│  [User clicks "Go"] │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────┐
│  Smooth Fade to Black   │ ← Single visual transition
│  "Entering Zo World..." │
└──────────┬──────────────┘
           │
           ├─> 1. Update DB (background)
           ├─> 2. Reload profile (background)
           ├─> 3. Fetch events/nodes (background)
           ├─> 4. Prepare map data (background)
           └─> 5. Wait for ALL async operations
           │
           ▼
┌─────────────────────────┐
│  Map at Space View      │ ← Instant render, no flashing
│  (zoom 0, centered)     │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Smooth 8s Animation    │
│  Space → User Location  │
└─────────────────────────┘
```

### **Key Principles:**

1. **Single Transition Point**: QuestComplete → Black Screen → Map
2. **Batch All State Updates**: Use `React.startTransition()` or single setState
3. **Pre-load Everything**: Don't render map until ALL data ready
4. **No Intermediate Renders**: Loading screen OR map, never both
5. **Guaranteed Order**: DB → Profile → Data → Map → Animation

---

## 🔧 Root Causes

### **Problem 1: Multiple setState Cascades**

```typescript
// BAD: 4 separate setState calls = 4 re-renders
setUserProfileStatus('exists');     // Re-render 1
setShouldAnimateFromSpace(true);   // Re-render 2
setOnboardingStep(null);           // Re-render 3
setIsLoading(false);               // Re-render 4
```

**Fix**: Use a single reducer or batched setState

```typescript
// GOOD: Single atomic update
React.startTransition(() => {
  setTransitionState({
    userProfileStatus: 'exists',
    shouldAnimateFromSpace: true,
    onboardingStep: null,
    isLoading: false
  });
});
```

---

### **Problem 2: Async Operations Not Awaited Properly**

```typescript
// BAD: setTimeout doesn't guarantee completion
await reloadProfile();
await new Promise(resolve => setTimeout(resolve, 500));  // Arbitrary!
```

**Fix**: Use proper async/await with state checks

```typescript
// GOOD: Wait for actual data, not arbitrary time
await reloadProfile();
// Poll until profile data is confirmed loaded
await waitForCondition(() => privyUserProfile?.city !== undefined, 5000);
```

---

### **Problem 3: Loading Guards Too Complex**

```typescript
// BAD: Multiple nested conditions cause flashing
if (!privyReady || privyLoading) && !isTransitioningFromOnboarding) {
  return <LoadingScreen />;
}
if (userProfileStatus !== 'exists' && !isTransitioningFromOnboarding) {
  return <LoadingScreen />;
}
if (!isMobileReady && !isTransitioningFromOnboarding) {
  return <LoadingScreen />;
}
```

**Fix**: Single loading state with clear phases

```typescript
// GOOD: One loading state machine
if (appState === 'initializing') return <LoadingScreen />;
if (appState === 'onboarding') return <OnboardingFlow />;
if (appState === 'transitioning') return <TransitionScreen />;
if (appState === 'ready') return <MainApp />;
```

---

### **Problem 4: Map Initialization Race**

```typescript
// BAD: Map tries to animate before loaded
useEffect(() => {
  if (shouldAnimateFromSpace && map.current) {
    // map.current exists but may not be loaded yet!
    map.current.flyTo(...);  // Might fail
  }
}, [shouldAnimateFromSpace]);
```

**Fix**: Wait for map 'load' event explicitly

```typescript
// GOOD: Guarantee map is ready
useEffect(() => {
  if (!map.current) return;
  
  const handleMapLoad = () => {
    if (shouldAnimateFromSpace && userLocationMarker.current) {
      // Now it's safe to animate
      map.current.flyTo(...);
    }
  };
  
  if (map.current.loaded()) {
    handleMapLoad();
  } else {
    map.current.on('load', handleMapLoad);
  }
}, [shouldAnimateFromSpace]);
```

---

### **Problem 5: User Location Not Guaranteed**

```typescript
// BAD: Assume location is ready
const userLocation = { lat: userHomeLat, lng: userHomeLng };
// But these might be null!
```

**Fix**: Pre-fetch location during onboarding

```typescript
// GOOD: Get location BEFORE transitioning
const location = await getOnboardingLocation();  // From Onboarding2
// Store in state
// Pass to map AFTER confirming it's set
```

---

## 🎯 Proposed Solution

### **Phase 1: Refactor State Management**

Create a single **transition coordinator**:

```typescript
// New file: hooks/useOnboardingTransition.ts

export function useOnboardingTransition() {
  const [phase, setPhase] = useState<'idle' | 'preparing' | 'ready'>('idle');
  const [preparedData, setPreparedData] = useState(null);

  const prepareTransition = async (userId, location) => {
    setPhase('preparing');
    
    try {
      // 1. Update DB
      await updateUserProfile(userId, { onboarding_completed: true });
      
      // 2. Reload profile and wait for confirmation
      await reloadProfile();
      await waitForProfileData();
      
      // 3. Pre-fetch events/nodes
      const [events, nodes] = await Promise.all([
        fetchEvents(),
        fetchNodes()
      ]);
      
      // 4. Confirm location is set
      if (!location) throw new Error('Location required');
      
      // 5. Package everything
      setPreparedData({ events, nodes, location });
      setPhase('ready');
      
    } catch (error) {
      console.error('Transition prep failed:', error);
      setPhase('idle');
    }
  };

  return { phase, preparedData, prepareTransition };
}
```

### **Phase 2: Update page.tsx**

```typescript
const { phase, preparedData, prepareTransition } = useOnboardingTransition();

const handleQuestCompleteGoHome = async () => {
  // Trigger preparation
  await prepareTransition(privyUser?.id, onboardingLocation);
};

// Render logic
if (phase === 'preparing') {
  return <TransitionScreen message="Entering Zo World..." />;
}

if (phase === 'ready' && preparedData) {
  return (
    <MainApp
      shouldAnimateFromSpace={true}
      userLocation={preparedData.location}
      events={preparedData.events}
      nodes={preparedData.nodes}
      preloadComplete={true}  // Signal: Everything ready!
    />
  );
}
```

### **Phase 3: Update MapCanvas**

```typescript
// MapCanvas.tsx - Simplified animation trigger

useEffect(() => {
  if (!map.current || !shouldAnimateFromSpace || !preloadComplete) return;
  
  // Wait for map to be fully loaded
  const animate = () => {
    if (!map.current.loaded()) {
      map.current.once('load', animate);
      return;
    }
    
    // Everything is ready - animate!
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 17,
      pitch: 65,
      bearing: -30,
      duration: 8000,
      essential: true
    });
  };
  
  animate();
}, [shouldAnimateFromSpace, preloadComplete]);
```

---

## 📊 Comparison

| Aspect | Current (Broken) | Proposed (Fixed) |
|--------|------------------|------------------|
| **State Updates** | 4 separate | 1 atomic |
| **Async Handling** | `setTimeout` guesses | Proper `await` + polling |
| **Loading States** | 3-4 loading screens | 1 transition screen |
| **Data Guarantee** | Race conditions | Pre-loaded, verified |
| **Visual Flashing** | 2-3 flashes | 0 flashes |
| **Error States** | Visible errors | Silent background handling |
| **Animation Timing** | Unreliable | Guaranteed |
| **User Experience** | Janky | Buttery smooth |

---

## ✅ Success Criteria

After fix, the flow should be:

1. ✅ User clicks "Go Home" on QuestComplete
2. ✅ Single fade to black with "Entering Zo World..."
3. ✅ **Zero flashing, zero errors visible**
4. ✅ Map appears at space view (zoom 0) instantly
5. ✅ Smooth 8-second animation to user location
6. ✅ Map fully interactive at end

**No intermediate states, no re-renders, no race conditions.**

---

## 🚀 Implementation Steps

1. **Create `useOnboardingTransition` hook** (1 hour)
2. **Refactor `page.tsx` to use hook** (30 min)
3. **Add `TransitionScreen` component** (15 min)
4. **Simplify MapCanvas animation logic** (30 min)
5. **Test full flow end-to-end** (1 hour)
6. **Remove all `setTimeout` hacks** (15 min)

**Total effort**: ~3.5 hours

---

## 📝 Notes

- **Do NOT use arbitrary `setTimeout`** - always wait for actual state/events
- **Batch ALL state updates** - use `startTransition` or reducers
- **Pre-load EVERYTHING** - don't render until ready
- **Single loading screen** - no nested conditionals
- **Guarantee order** - DB → Profile → Data → UI

---

**Current Status**: Analysis complete, solution designed  
**Next Step**: Implement `useOnboardingTransition` hook  
**Priority**: **HIGH** - Affects all new user onboarding

---

**Authored by**: AI + @samurairann  
**Date**: 2025-11-14  
**Vibe**: 🔍🛠️ Time to fix this properly!


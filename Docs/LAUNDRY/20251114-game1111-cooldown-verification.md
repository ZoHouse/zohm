# Game1111 12-Hour Cooldown Verification

**Date**: 2025-11-14  
**Status**: ✅ Mostly Complete - Needs UI Enhancement  
**Quest**: game-1111 (Quantum Voice Sync)

---

## 📋 Current Implementation Status

### ✅ **1. Database Setup** - COMPLETE
- **Migration**: `005_add_game1111_quest.sql`
- **Cooldown**: `cooldown_hours = 12` ✓
- **Category**: `daily` (repeatable)
- **Reward**: Dynamic 50-200 $ZO based on proximity to 1111
- **Formula**: `Base 50 + (1 - distance/1111) * 150`

```sql
-- Quest exists with correct cooldown
SELECT slug, cooldown_hours, category, status 
FROM quests 
WHERE slug = 'game-1111';

-- Expected output:
-- slug: game-1111
-- cooldown_hours: 12
-- category: daily
-- status: active
```

### ✅ **2. API Cooldown Logic** - COMPLETE
**File**: `apps/web/src/app/api/quests/complete/route.ts`

**Flow**:
1. User completes game1111
2. API checks `canUserCompleteQuest(user_id, quest_id, 12)`
3. If cooldown active → Returns `429` with `next_available_at`
4. If available → Records completion → Calculates next cooldown

**Logic** (lines 63-75):
```typescript
if (quest.cooldown_hours > 0) {
  const cooldownCheck = await canUserCompleteQuest(user_id, quest.id, quest.cooldown_hours);
  
  if (!cooldownCheck.canComplete) {
    return NextResponse.json(
      {
        error: 'Quest is on cooldown',
        next_available_at: cooldownCheck.nextAvailableAt,
      },
      { status: 429 } // Too Many Requests
    );
  }
}
```

### ✅ **3. Cooldown Service** - COMPLETE
**File**: `apps/web/src/lib/questService.ts`

**Function**: `canUserCompleteQuest(userId, questId, cooldownHours)`

**Logic**:
```typescript
// Get last completion
const { data } = await supabase
  .from('completed_quests')
  .select('completed_at')
  .eq('user_id', userId)
  .eq('quest_id', questId)
  .order('completed_at', { ascending: false })
  .limit(1)
  .single();

// Calculate hours since last completion
const hoursSinceLastCompletion = (now - lastCompletedAt) / (1000 * 60 * 60);

// Check cooldown
if (hoursSinceLastCompletion >= cooldownHours) {
  return { canComplete: true };
} else {
  return { 
    canComplete: false, 
    nextAvailableAt: lastCompletedAt + (cooldownHours * 60 * 60 * 1000)
  };
}
```

### ⚠️ **4. UI Cooldown Display** - NEEDS IMPROVEMENT
**File**: `apps/web/src/components/QuestAudio.tsx`

**Current State**:
- ✅ Shows "Once every 12 hrs" text (line 95)
- ❌ Does NOT check cooldown before allowing play
- ❌ Does NOT show countdown timer when on cooldown
- ❌ Does NOT disable play button when on cooldown

**Current Text** (line 93-97):
```tsx
{!hasWon && (
  <p className="font-rubik text-[14px] font-normal text-white/60 text-center leading-[18px] m-0 mt-1">
    Once every 12 hrs
  </p>
)}
```

---

## 🔧 Required Improvements

### **Issue**: User can start the game even when on cooldown

**Problem**: The game allows users to play and only rejects them AFTER completing the quest, which is a bad UX.

**Solution**: Check cooldown BEFORE allowing play + show countdown timer

---

## 🎯 Implementation Plan

### **Step 1**: Add Cooldown Check Hook
**File**: `apps/web/src/hooks/useQuestCooldown.ts` (NEW)

```typescript
import { useEffect, useState } from 'react';
import { getTimeUntilNextQuest } from '@/lib/questService';

export function useQuestCooldown(userId: string | undefined, questId: string, cooldownHours: number) {
  const [canPlay, setCanPlay] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState<string>('Available now');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!userId) {
      setCanPlay(true);
      setIsChecking(false);
      return;
    }

    const checkCooldown = async () => {
      const time = await getTimeUntilNextQuest(userId, questId, cooldownHours);
      setTimeRemaining(time);
      setCanPlay(time === 'Available now');
      setIsChecking(false);
    };

    checkCooldown();
    
    // Refresh every minute
    const interval = setInterval(checkCooldown, 60000);
    return () => clearInterval(interval);
  }, [userId, questId, cooldownHours]);

  return { canPlay, timeRemaining, isChecking };
}
```

### **Step 2**: Update Game1111 Component
**File**: `apps/web/src/components/QuestAudio.tsx`

**Changes**:
1. Import the hook
2. Check cooldown status
3. Show countdown timer when on cooldown
4. Disable play when on cooldown

```tsx
import { useQuestCooldown } from '@/hooks/useQuestCooldown';

// Inside QuestAudio component:
const { canPlay, timeRemaining, isChecking } = useQuestCooldown(userId, 'game-1111', 12);

// Update bottom text to show countdown:
<div className="absolute bottom-[56px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-0 z-20">
  <p className="font-rubik text-[16px] font-medium text-white text-center leading-[20px] m-0">
    {hasWon ? 'You Won! 1111 $Zo Synced!' : 'Sync at 1111 & Manifest $Zo'}
  </p>
  {!hasWon && (
    <p className="font-rubik text-[14px] font-normal text-white/60 text-center leading-[18px] m-0 mt-1">
      {canPlay ? 'Once every 12 hrs' : `Next available in: ${timeRemaining}`}
    </p>
  )}
</div>

// Update Stop button to be disabled when on cooldown:
<button
  onClick={handleStop}
  disabled={!isRunning || !canPlay}
  className={`px-5 py-4 font-rubik text-[16px] font-semibold border-none rounded-xl cursor-pointer transition-all duration-200 
    ${canPlay 
      ? 'bg-white text-black hover:bg-zo-accent hover:shadow-[0_4px_20px_rgba(207,255,80,0.4)]' 
      : 'bg-gray-500 text-gray-300 cursor-not-allowed'
    }
    active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
>
  {!canPlay ? `On Cooldown: ${timeRemaining}` : (isRunning ? 'Stop at 1111' : 'Try Again')}
</button>
```

### **Step 3**: Add Cooldown Overlay (Optional Enhancement)
Show a full-screen overlay with countdown when user tries to access the quest on cooldown:

```tsx
{!canPlay && !isChecking && (
  <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center">
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-4">Quest on Cooldown</h2>
      <p className="text-lg text-white/80 mb-2">Next available in:</p>
      <p className="text-3xl font-bold text-zo-accent">{timeRemaining}</p>
      <p className="text-sm text-white/60 mt-4">Come back later to sync again!</p>
    </div>
  </div>
)}
```

---

## 📊 Testing Checklist

### Database Tests
- [ ] Verify quest exists: `SELECT * FROM quests WHERE slug = 'game-1111';`
- [ ] Check cooldown: `SELECT cooldown_hours FROM quests WHERE slug = 'game-1111';` → Should return `12`
- [ ] Check completions: `SELECT * FROM completed_quests WHERE quest_id = (SELECT id FROM quests WHERE slug = 'game-1111') ORDER BY completed_at DESC;`

### API Tests
- [ ] Complete quest first time → Should succeed
- [ ] Try to complete again immediately → Should return `429` with `next_available_at`
- [ ] Wait 12 hours → Should succeed again

### UI Tests
- [ ] First play → Game works normally
- [ ] After completion → Should show "Next available in: Xh Ym"
- [ ] After 12 hours → Should show "Once every 12 hrs" again
- [ ] Countdown updates every minute
- [ ] Play button disabled when on cooldown

### Edge Cases
- [ ] User with no completions → Can play immediately
- [ ] User completes at 11:59 PM → Can play again at 11:59 AM next day
- [ ] Multiple users → Each has independent cooldown
- [ ] User logs out and back in → Cooldown persists

---

## 🚀 Deployment Steps

1. **Database** (Already done ✅)
   - Migration `005_add_game1111_quest.sql` sets cooldown to 12 hours
   - No additional DB changes needed

2. **Backend** (Already done ✅)
   - API endpoint `/api/quests/complete` handles cooldown
   - Service function `canUserCompleteQuest` checks cooldown
   - No changes needed

3. **Frontend** (Needs work ⚠️)
   - Create `useQuestCooldown` hook
   - Update `QuestAudio.tsx` component
   - Add cooldown UI elements
   - Test on staging

4. **Testing** (After frontend changes)
   - Complete quest as test user
   - Verify 429 response on immediate retry
   - Verify countdown timer shows correctly
   - Verify quest becomes available after 12 hours

---

## 🎯 Acceptance Criteria

### Must Have (P0)
- ✅ Database has 12-hour cooldown set
- ✅ API enforces 12-hour cooldown
- ⚠️ UI checks cooldown BEFORE allowing play
- ⚠️ UI shows countdown timer when on cooldown
- ⚠️ Play button disabled when on cooldown

### Nice to Have (P1)
- [ ] Full-screen cooldown overlay with visual design
- [ ] Push notification when cooldown expires (mobile)
- [ ] Calendar reminder option
- [ ] Cooldown bypass for admins/testing

### Future Enhancements (P2)
- [ ] Dynamic cooldown based on vibe score
- [ ] Streak bonuses for consistent 12-hour plays
- [ ] "Wake me up" notification feature
- [ ] Cooldown reduction items/power-ups

---

## 📝 Summary

**Current Status**: Backend is fully functional ✅  
**Next Steps**: Add frontend cooldown check and UI ⚠️  
**Estimated Time**: 1-2 hours  
**Priority**: High (affects UX significantly)

**Key Issue**: Users can currently start the game even when on cooldown, only to be rejected after completing it. This creates frustration.

**Fix**: Add `useQuestCooldown` hook to check cooldown status before allowing play, and show a countdown timer.


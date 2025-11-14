# Game1111 Quest Container Integration

**Goal**: Make game1111 a repeatable quest in the quest container that activates every 12 hours

**Date**: 2025-11-14

---

## 📋 Current Flow

```
User Opens App
    ↓
Clicks "Quests" in Nav
    ↓
Sees Quest List (QuestsOverlay)
    ↓
Clicks "Join Quest" on game-1111
    ↓
??? (Need to implement)
    ↓
Launches full voice + 1111 game (QuestAudio component)
    ↓
Game completes
    ↓
Records completion via API
    ↓
Quest shows "On Cooldown" for 12 hours
    ↓
After 12 hours → Shows "Available" again
```

---

## 🎯 Implementation Steps

### **Step 1**: Verify Database Setup ✅

Quest already exists in database with correct settings:

```sql
-- Check quest exists with correct cooldown
SELECT slug, title, cooldown_hours, category, status, reward 
FROM quests 
WHERE slug = 'game-1111';

-- Expected output:
-- slug: game-1111
-- title: Quantum Voice Sync
-- cooldown_hours: 12
-- category: daily
-- status: active
-- reward: 200
```

**Status**: ✅ Already configured in `packages/api/migrations/005_add_game1111_quest.sql`

---

### **Step 2**: Add Quest Launcher State Management

**File**: `apps/web/src/components/QuestsOverlay.tsx`

Add state to track when game1111 should be launched:

```typescript
const [showGame1111, setShowGame1111] = useState(false);
const [game1111UserId, setGame1111UserId] = useState<string | undefined>();
```

---

### **Step 3**: Modify Quest Cooldown Checking

**File**: `apps/web/src/components/QuestsOverlay.tsx`

Current code only checks `isQuestCompleted` (one-time quests). Need to add cooldown checking for repeatable quests:

```typescript
import { canUserCompleteQuest } from '@/lib/questService';
import { supabase } from '@/lib/supabase';

// Inside loadQuestsAndCheckCompletion:
const questsWithCompletion = await Promise.all(
  q.map(async (quest) => {
    // For one-time quests (no cooldown)
    if (!quest.cooldown_hours || quest.cooldown_hours === 0) {
      const isCompleted = await isQuestCompleted(primaryWalletAddress, quest.id);
      return {
        ...quest,
        status: isCompleted ? 'completed' : quest.status,
        canComplete: !isCompleted,
        nextAvailableAt: null
      };
    }
    
    // For repeatable quests (with cooldown)
    const cooldownCheck = await canUserCompleteQuest(
      primaryWalletAddress, 
      quest.id, 
      quest.cooldown_hours
    );
    
    return {
      ...quest,
      status: quest.status, // Keep original status (always 'active')
      canComplete: cooldownCheck.canComplete,
      nextAvailableAt: cooldownCheck.nextAvailableAt,
      lastCompletedAt: cooldownCheck.lastCompletedAt
    };
  })
);
```

---

### **Step 4**: Update Quest Card UI to Show Cooldown

**File**: `apps/web/src/components/QuestsOverlay.tsx`

Update the quest card rendering to show cooldown timer:

```tsx
{quests.map((q) => (
  <GlowCard key={q.id} hoverable>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base text-black">{q.title}</h3>
          {q.status === 'active' && q.canComplete && <GlowChip showDot>Available</GlowChip>}
          {q.status === 'active' && !q.canComplete && <GlowChip>On Cooldown</GlowChip>}
          {q.status === 'completed' && !q.cooldown_hours && <GlowChip>Completed</GlowChip>}
          {q.status === 'developing' && <GlowChip>Developing</GlowChip>}
        </div>
        <p className="text-sm text-gray-700 mb-3">{q.description}</p>
        
        {/* Show cooldown timer if on cooldown */}
        {!q.canComplete && q.nextAvailableAt && (
          <p className="text-xs text-gray-500 mb-2">
            ⏰ Available in: <CooldownTimer targetDate={q.nextAvailableAt} />
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <GlowChip>{q.reward} $ZO</GlowChip>
          {q.cooldown_hours && <GlowChip>Every {q.cooldown_hours}h</GlowChip>}
        </div>
      </div>
    </div>
    <div className="mt-4">
      <GlowButton 
        variant="primary"
        className="w-full"
        onClick={() => handleJoinQuest(q)}
        disabled={!authenticated || !q.canComplete || q.status === 'developing'}
      >
        {!authenticated ? 'Log in to Play' : 
         !q.canComplete ? 'On Cooldown' : 
         q.status === 'developing' ? 'Coming Soon' : 
         'Play Quest'}
      </GlowButton>
    </div>
  </GlowCard>
))}
```

---

### **Step 5**: Create Cooldown Timer Component

**File**: `apps/web/src/components/CooldownTimer.tsx` (NEW)

```tsx
'use client';

import { useState, useEffect } from 'react';

interface CooldownTimerProps {
  targetDate: string;
}

export default function CooldownTimer({ targetDate }: CooldownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeRemaining('Available now');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else if (minutes > 0) {
        setTimeRemaining(`${minutes}m ${seconds}s`);
      } else {
        setTimeRemaining(`${seconds}s`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="font-mono font-semibold">{timeRemaining}</span>;
}
```

---

### **Step 6**: Handle Quest Launch (game-1111 specific)

**File**: `apps/web/src/components/QuestsOverlay.tsx`

Update `handleJoinQuest` to launch game1111:

```typescript
const handleJoinQuest = async (quest: QuestEntry) => {
  if (!authenticated || !primaryWalletAddress) {
    setVerificationResult('Please log in first');
    return;
  }
  
  // Special handling for game-1111 quest
  if (quest.slug === 'game-1111') {
    // Get user ID from users table
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', primaryWalletAddress)
      .single();
    
    if (user) {
      setGame1111UserId(user.id);
      setShowGame1111(true);
    } else {
      setVerificationResult('User profile not found. Please complete onboarding.');
    }
    return;
  }
  
  // Original logic for other quests
  setSelectedQuest(quest);
  setShowJoinPopup(true);
};
```

---

### **Step 7**: Render QuestAudio Component

**File**: `apps/web/src/components/QuestsOverlay.tsx`

Add QuestAudio component to the overlay:

```tsx
import QuestAudio from './QuestAudio';

// Inside return statement, before closing </div>:
{showGame1111 && (
  <div className="fixed inset-0 z-[100] bg-black">
    <QuestAudio
      userId={game1111UserId}
      onComplete={(score, tokensEarned) => {
        console.log('🎮 Game1111 completed:', { score, tokensEarned });
        
        // Close game view
        setShowGame1111(false);
        
        // Refresh quests to update cooldown status
        if (primaryWalletAddress) {
          loadQuestsAndCheckCompletion();
        }
        
        // Show success message
        setVerificationResult(`🎉 Quest completed! You earned ${tokensEarned} $ZO`);
      }}
    />
  </div>
)}
```

---

### **Step 8**: Update TypeScript Types

**File**: `apps/web/src/lib/supabase.ts`

Add cooldown fields to QuestEntry type:

```typescript
export interface QuestEntry {
  id: string;
  slug: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  category: string;
  cooldown_hours?: number;
  rewards_breakdown?: any;
  created_at?: string;
  updated_at?: string;
  // Additional fields for cooldown tracking
  canComplete?: boolean;
  nextAvailableAt?: string;
  lastCompletedAt?: string;
}
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  1. User clicks "Quests" in NavBar                          │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  2. QuestsOverlay loads quests from database                │
│     - Fetches all quests from `quests` table                │
│     - For each quest with cooldown_hours > 0:               │
│       → Check last completion time                          │
│       → Calculate if can complete                           │
│       → Calculate next available time                       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Quest List Rendered                                     │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🎮 Quantum Voice Sync              [Available]     │    │
│  │ Match frequency 1111 with your voice               │    │
│  │                                                     │    │
│  │ 💰 50-200 $ZO  |  ⏰ Every 12h                     │    │
│  │                                                     │    │
│  │           [  Play Quest  ]                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                             │
│  OR (if on cooldown):                                       │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🎮 Quantum Voice Sync              [On Cooldown]   │    │
│  │ Match frequency 1111 with your voice               │    │
│  │ ⏰ Available in: 8h 23m                             │    │
│  │                                                     │    │
│  │ 💰 50-200 $ZO  |  ⏰ Every 12h                     │    │
│  │                                                     │    │
│  │           [   On Cooldown   ]  ⛔                   │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  4. User clicks "Play Quest"                                │
│     - handleJoinQuest() called                              │
│     - Detects slug === 'game-1111'                          │
│     - Gets user ID from users table                         │
│     - Sets showGame1111 = true                              │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  5. QuestAudio Component Renders                            │
│     - Full-screen experience                                │
│     - Shows permission flow                                 │
│     - Voice authentication                                  │
│     - Stone ring video animation                            │
│     - Game1111 counter                                      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  6. User plays game                                         │
│     - Counter runs 0000-9999                                │
│     - User clicks "Stop at 1111"                            │
│     - Score recorded (distance from 1111)                   │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  7. Quest completion recorded                               │
│     - POST /api/quests/complete                             │
│     - Body: { user_id, quest_id: 'game-1111', score }       │
│     - API checks cooldown                                   │
│     - Records in completed_quests table                     │
│     - Calculates tokens: 50 + (proximity * 150)             │
│     - Returns: { success, tokens, next_available_at }       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  8. onComplete callback triggered                           │
│     - Closes QuestAudio component                           │
│     - Refreshes quest list                                  │
│     - Quest now shows "On Cooldown" for 12 hours            │
│     - Shows success message with tokens earned              │
└─────────────────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│  9. After 12 hours                                          │
│     - Cooldown timer counts down in real-time               │
│     - When timer reaches 0:                                 │
│       → "On Cooldown" chip changes to "Available"           │
│       → Button becomes clickable again                      │
│       → User can play quest again                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📂 Files to Modify

### New Files
1. ✅ `apps/web/src/hooks/useQuestCooldown.ts` - Already created
2. ⚠️ `apps/web/src/components/CooldownTimer.tsx` - Need to create

### Modified Files
1. ⚠️ `apps/web/src/components/QuestsOverlay.tsx` - Add game1111 launcher
2. ⚠️ `apps/web/src/lib/supabase.ts` - Update QuestEntry interface
3. ✅ `apps/web/src/components/QuestAudio.tsx` - Already has cooldown support

---

## 🧪 Testing Checklist

### First Play
- [ ] Open app → Click "Quests"
- [ ] See "Quantum Voice Sync" quest with "Available" badge
- [ ] Button shows "Play Quest"
- [ ] Click "Play Quest"
- [ ] QuestAudio component launches full-screen
- [ ] Complete game (stop at any number)
- [ ] Quest completion recorded
- [ ] Return to quest list
- [ ] Quest now shows "On Cooldown" badge
- [ ] Button is disabled
- [ ] Countdown timer shows time remaining

### Cooldown Period
- [ ] Countdown timer updates every second/minute
- [ ] "On Cooldown" badge persists
- [ ] Button remains disabled
- [ ] Shows "⏰ Available in: Xh Ym"

### After 12 Hours
- [ ] Countdown reaches 0
- [ ] Badge changes to "Available"
- [ ] Button becomes clickable
- [ ] Can play quest again

### Multiple Users
- [ ] User A completes quest
- [ ] User B can still play (independent cooldowns)
- [ ] User A sees cooldown, User B sees available

---

## 🚀 Next Steps

1. **Create CooldownTimer component** ⏰
2. **Modify QuestsOverlay** to add:
   - game1111 launcher state
   - Cooldown checking logic
   - Quest card cooldown UI
   - QuestAudio rendering
3. **Update QuestEntry interface** with cooldown fields
4. **Test complete flow** from quest list → game → completion → cooldown

---

## 💡 Key Insights

**Why This Design?**
- ✅ Quest data lives in database (single source of truth)
- ✅ Cooldown enforcement happens in API (secure)
- ✅ UI checks cooldown (better UX, no wasted clicks)
- ✅ Real-time countdown (engagement)
- ✅ Reusable for future repeatable quests

**Repeatable Quest Pattern**:
```
Quest with cooldown_hours > 0
    ↓
Check last completion time
    ↓
If time_since_last >= cooldown_hours:
    Show "Available", enable button
Else:
    Show "On Cooldown", show countdown, disable button
```

This pattern can be reused for:
- Daily quests (24h cooldown)
- Weekly challenges (168h cooldown)
- Hourly activities (1h cooldown)
- Custom timers (any N hours)

---

## 🎯 Summary

**Current State**: Game1111 has backend cooldown ✅, but no quest container integration ❌

**After Implementation**: Game1111 appears as a repeatable quest in the quest list with full cooldown UI ✅

**User Experience**:
1. Opens quest list
2. Sees game1111 as "Available" or "On Cooldown"
3. Clicks "Play Quest" when available
4. Plays full voice + 1111 game experience
5. Quest completes and shows cooldown
6. Can play again after 12 hours

**Time to Implement**: 2-3 hours


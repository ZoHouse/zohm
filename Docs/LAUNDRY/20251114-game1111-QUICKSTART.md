# Game1111 Repeatable Quest - Quick Start Guide

**Status**: 70% Complete ✅  
**Time to Complete**: 2-3 hours  
**Priority**: High

---

## ✅ What's Already Done

### 1. Database ✅
- Quest exists in `quests` table with `slug = 'game-1111'`
- Cooldown set to 12 hours
- Dynamic reward: 50-200 $ZO based on score
- Migration files ready (`005_add_game1111_quest.sql`)

### 2. API Cooldown Logic ✅
- `/api/quests/complete` endpoint handles cooldown
- Returns `429` if quest on cooldown
- `canUserCompleteQuest()` service function works
- Records completions in `completed_quests` table

### 3. Game Component ✅
- `QuestAudio.tsx` has full voice + game1111 experience
- Uses `useQuestCooldown` hook to check status
- Shows cooldown timer in game UI
- Disables play button when on cooldown
- Calculates dynamic rewards (proximity to 1111)

---

## ⚠️ What Needs to Be Done

### 1. Quest Container Integration (2-3 hours)

**Goal**: Make game1111 appear in quest list and launch from there

**Files to Create**:
```
apps/web/src/components/CooldownTimer.tsx
```

**Files to Modify**:
```
apps/web/src/components/QuestsOverlay.tsx
apps/web/src/lib/supabase.ts (QuestEntry interface)
```

**Changes Needed**:
1. Add cooldown checking to quest loading
2. Show countdown timer on quest cards
3. Add game1111 launcher logic
4. Render QuestAudio when clicked

---

## 🚀 Quick Implementation (Step by Step)

### Step 1: Create Cooldown Timer Component (15 min)

Create `apps/web/src/components/CooldownTimer.tsx`:

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

      if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`);
      } else {
        setTimeRemaining(`${minutes}m`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [targetDate]);

  return <span className="font-mono font-semibold text-zo-accent">{timeRemaining}</span>;
}
```

---

### Step 2: Update QuestEntry Interface (5 min)

In `apps/web/src/lib/supabase.ts`, add cooldown fields:

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
  
  // Cooldown tracking (added at runtime)
  canComplete?: boolean;
  nextAvailableAt?: string;
  lastCompletedAt?: string;
}
```

---

### Step 3: Modify QuestsOverlay (90 min)

In `apps/web/src/components/QuestsOverlay.tsx`:

**A. Add imports**:
```typescript
import { canUserCompleteQuest } from '@/lib/questService';
import QuestAudio from './QuestAudio';
import CooldownTimer from './CooldownTimer';
```

**B. Add state for game launcher**:
```typescript
const [showGame1111, setShowGame1111] = useState(false);
const [game1111UserId, setGame1111UserId] = useState<string | undefined>();
```

**C. Update quest loading to check cooldowns**:
```typescript
const loadQuestsAndCheckCompletion = async () => {
  const [q, lb] = await Promise.all([getQuests(), getLeaderboards()]);
  
  if (q) {
    // Get user ID for cooldown checks
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', primaryWalletAddress)
      .single();
    
    const questsWithCompletion = await Promise.all(
      q.map(async (quest) => {
        // For repeatable quests (with cooldown)
        if (quest.cooldown_hours && quest.cooldown_hours > 0 && user) {
          const cooldownCheck = await canUserCompleteQuest(
            user.id, 
            quest.id, 
            quest.cooldown_hours
          );
          
          return {
            ...quest,
            canComplete: cooldownCheck.canComplete,
            nextAvailableAt: cooldownCheck.nextAvailableAt,
            lastCompletedAt: cooldownCheck.lastCompletedAt
          };
        }
        
        // For one-time quests (no cooldown)
        const isCompleted = await isQuestCompleted(primaryWalletAddress, quest.id);
        return {
          ...quest,
          status: isCompleted ? 'completed' : quest.status,
          canComplete: !isCompleted
        };
      })
    );
    setQuests(questsWithCompletion);
  }
  
  setLeaders(lb);
};
```

**D. Update handleJoinQuest for game1111**:
```typescript
const handleJoinQuest = async (quest: QuestEntry) => {
  if (!authenticated || !primaryWalletAddress) {
    setVerificationResult('Please log in first');
    return;
  }
  
  // Special handling for game-1111
  if (quest.slug === 'game-1111') {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', primaryWalletAddress)
      .single();
    
    if (user) {
      setGame1111UserId(user.id);
      setShowGame1111(true);
    } else {
      setVerificationResult('User profile not found.');
    }
    return;
  }
  
  // Original logic for other quests
  setSelectedQuest(quest);
  setShowJoinPopup(true);
};
```

**E. Update quest card rendering**:
```tsx
{quests.map((q) => (
  <GlowCard key={q.id} hoverable>
    <div className="flex items-start justify-between gap-3">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-base text-black">{q.title}</h3>
          {/* Status badges */}
          {q.status === 'active' && q.canComplete !== false && <GlowChip showDot>Available</GlowChip>}
          {q.status === 'active' && q.canComplete === false && <GlowChip>On Cooldown</GlowChip>}
          {q.status === 'completed' && !q.cooldown_hours && <GlowChip>Completed</GlowChip>}
        </div>
        
        <p className="text-sm text-gray-700 mb-3">{q.description}</p>
        
        {/* Cooldown timer */}
        {q.canComplete === false && q.nextAvailableAt && (
          <p className="text-xs text-gray-600 mb-2">
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
        disabled={!authenticated || q.canComplete === false}
      >
        {!authenticated ? 'Log in to Play' : 
         q.canComplete === false ? 'On Cooldown' : 
         'Play Quest'}
      </GlowButton>
    </div>
  </GlowCard>
))}
```

**F. Add QuestAudio renderer at end of return statement**:
```tsx
{/* Game1111 Full-Screen Experience */}
{showGame1111 && (
  <div className="fixed inset-0 z-[100] bg-black">
    <QuestAudio
      userId={game1111UserId}
      onComplete={async (score, tokensEarned) => {
        console.log('🎮 Game1111 completed:', { score, tokensEarned });
        
        // Close game
        setShowGame1111(false);
        
        // Refresh quests to show new cooldown status
        await loadQuestsAndCheckCompletion();
        
        // Show success
        setVerificationResult(`🎉 Quest completed! You earned ${tokensEarned} $ZO`);
        setTimeout(() => setVerificationResult(''), 5000);
      }}
    />
  </div>
)}
```

---

## 🧪 Testing Flow

### Test 1: First Play
```
1. Open app
2. Click "Quests" in nav
3. See "Quantum Voice Sync" with "Available" badge
4. Click "Play Quest"
5. Game launches full-screen
6. Complete game (any score)
7. Returns to quest list
8. Quest now shows "On Cooldown" with countdown timer
9. Button is disabled
```

### Test 2: Cooldown Period
```
1. Quest shows "On Cooldown" badge
2. Timer shows "11h 59m" and counts down
3. Button is disabled with text "On Cooldown"
4. Refresh page → cooldown persists
```

### Test 3: After 12 Hours
```
1. Wait 12 hours (or manually update DB timestamp)
2. Timer reaches "Available now"
3. Badge changes to "Available"
4. Button becomes enabled
5. Can play quest again
```

---

## 🔍 How It Works

```
┌─────────────────────────────────────────────────────────┐
│                   QUEST CONTAINER                       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🎮 Quantum Voice Sync         [Available]       │  │
│  │  Match frequency 1111 with your voice            │  │
│  │                                                   │  │
│  │  💰 50-200 $ZO  |  ⏰ Every 12h                  │  │
│  │                                                   │  │
│  │            [  Play Quest  ]  ← Click here        │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                 QUEST AUDIO COMPONENT                   │
│  (Full-screen black background)                         │
│                                                         │
│  1. Permission check                                    │
│  2. Voice authentication ("Zo Zo Zo")                   │
│  3. Stone ring forms (video animation)                  │
│  4. Counter runs 0000-9999                              │
│  5. Player clicks "Stop at 1111"                        │
│  6. Score calculated (proximity to 1111)                │
│  7. Tokens awarded (50-200 $ZO)                         │
│                                                         │
│              [ onComplete callback ]                    │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│            QUEST COMPLETION RECORDED                    │
│                                                         │
│  POST /api/quests/complete                              │
│  ├─ Records in completed_quests table                   │
│  ├─ Calculates next_available_at (now + 12h)            │
│  └─ Returns success + tokens earned                     │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│              QUEST LIST REFRESHES                       │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  🎮 Quantum Voice Sync         [On Cooldown]     │  │
│  │  Match frequency 1111 with your voice            │  │
│  │  ⏰ Available in: 11h 59m      ← Countdown       │  │
│  │                                                   │  │
│  │  💰 50-200 $ZO  |  ⏰ Every 12h                  │  │
│  │                                                   │  │
│  │            [   On Cooldown   ]  ⛔               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Key Files Reference

### Already Complete ✅
- `packages/api/migrations/005_add_game1111_quest.sql` - DB setup
- `apps/web/src/lib/questService.ts` - Cooldown checking
- `apps/web/src/hooks/useQuestCooldown.ts` - React hook
- `apps/web/src/components/QuestAudio.tsx` - Full game experience
- `apps/web/src/app/api/quests/complete/route.ts` - API endpoint

### Need to Create ⚠️
- `apps/web/src/components/CooldownTimer.tsx`

### Need to Modify ⚠️
- `apps/web/src/components/QuestsOverlay.tsx`
- `apps/web/src/lib/supabase.ts`

---

## 🎯 Summary

**What you get after implementation**:

✅ Game1111 appears in quest list  
✅ Shows "Available" or "On Cooldown" status  
✅ Real-time countdown timer  
✅ Click "Play Quest" → launches full game  
✅ Game completes → records in DB → shows cooldown  
✅ After 12 hours → available again  
✅ Fully repeatable every 12 hours  

**Current state**: Backend works ✅, UI integration needed ⚠️  
**Time to complete**: 2-3 hours  
**Difficulty**: Medium (mostly UI wiring)

---

Ready to implement? Let me know and I'll help you step by step! 🚀






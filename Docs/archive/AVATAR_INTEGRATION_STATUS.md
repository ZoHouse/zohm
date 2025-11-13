# Phase 2 Implementation Status

**Last Updated**: 2025-11-13  
**Branch**: `samurai-new`

---

## 📋 Overview

This document tracks progress for Phase 2 implementation:
1. **Avatar Generation** (ZO API integration) 
2. **Game1111 Data Integration** (Quest completion + Leaderboard)

---

## ✅ Completed (Phase 2A - Avatar Backend)

### 1. Database Migration
- **File**: `migrations/004_avatar_integration.sql`
- **Added columns**:
  - `avatar_image` - CDN URL from ZO API
  - `avatar_metadata` - JSON metadata
  - `avatar_ref_id` - Reference ID
  - `body_type` - 'bro' | 'bae' (gender selection)
  - `zo_profile_cache` - Full ZO API response cache
  - `profile_synced_at` - Last sync timestamp
- **Helper function**: `update_profile_from_zo_api()`
- **Rollback**: `migrations/004_avatar_integration_ROLLBACK.sql`

### 2. API Routes
- **`/api/avatar/generate`** (POST)
  - Proxies to ZO API: `POST /api/v1/profile/me/`
  - Accepts: `{ userId, bodyType: 'bro'|'bae' }`
  - Returns: `{ success, message, profile }`
  
- **`/api/avatar/status`** (GET)
  - Proxies to ZO API: `GET /api/v1/profile/me/`
  - Polls for avatar.image availability
  - Caches result to Supabase when ready
  - Returns: `{ status: 'pending'|'ready'|'error', avatarUrl?, profile? }`

### 3. React Hook
- **File**: `src/hooks/useAvatarGeneration.ts`
- **Features**:
  - `generateAvatar({ userId, gender })` - Triggers generation
  - Automatic polling (1s interval, 10 max attempts)
  - Maps `gender: 'male'|'female'` → `body_type: 'bro'|'bae'`
  - Error handling & timeout management
  - Non-blocking (proceeds after 10s if timeout)
  - Auto-cleanup on unmount

### 4. Documentation
- **`ENV_SETUP.md`** - Environment variables guide
- **`AVATAR_INTEGRATION_STATUS.md`** - This file

---

## ⏳ Pending (Need ZO API Credentials)

### Required from ZO Backend Team:
```bash
ZO_API_BASE_URL=https://api.zo.xyz
ZO_CLIENT_KEY_WEB=your_web_client_key
ZO_CLIENT_DEVICE_ID=your_device_id
ZO_CLIENT_DEVICE_SECRET=your_device_secret
```

### Also Need to Solve:
**Authentication Flow**: How do we get `ZO_USER_TOKEN` for webapp users?

**Options**:
1. **User authenticates with ZO API** during Privy login → store token in `user_metadata.zo_token`
2. **Server-to-server**: Use service account credentials (if ZO supports it)
3. **Hybrid**: Use Privy DID to authenticate with ZO API

**Current Implementation**: Expects `user.user_metadata.zo_token` to exist

---

## 🚧 Next Steps (UI Integration)

### 5. Update NicknameStep Component
**File**: `src/components/NicknameStep.tsx`

**Changes needed**:
```tsx
// Add gender selection UI
const [gender, setGender] = useState<'male' | 'female' | null>(null);

// Add radio buttons or toggle for male/female
<div className="gender-selection">
  <button onClick={() => setGender('male')}>Male (Bro)</button>
  <button onClick={() => setGender('female')}>Female (Bae)</button>
</div>

// Pass gender to next step
onComplete({ nickname, gender });
```

### 6. Update AvatarStep Component
**File**: `src/components/AvatarStep.tsx`

**Changes needed**:
```tsx
import { useAvatarGeneration } from '@/hooks/useAvatarGeneration';

const AvatarStep = ({ userId, gender }) => {
  const { generateAvatar, isGenerating, avatarUrl, error } = useAvatarGeneration();
  
  useEffect(() => {
    // Auto-generate on mount
    generateAvatar({ userId, gender });
  }, []);
  
  return (
    <>
      {isGenerating && <LoadingAnimation />}
      {avatarUrl && <img src={avatarUrl} alt="Generated Avatar" />}
      {error && <ErrorMessage />}
    </>
  );
};
```

### 7. Original Phase 2 Goals (Data Integration)
- [ ] Wire QuestComplete to save `game_score` + `coins_earned`
- [ ] Implement leaderboard query

---

## 📋 Testing Checklist

### Before Production:
- [ ] Run migration: `npm run migrate:up` (or Supabase dashboard)
- [ ] Add ZO API credentials to `.env.local`
- [ ] Test authentication flow (get ZO token)
- [ ] Test avatar generation API: `POST /api/avatar/generate`
- [ ] Test polling API: `GET /api/avatar/status`
- [ ] Test timeout handling (10 attempts)
- [ ] Test error states (network failure, invalid credentials)
- [ ] Verify Supabase cache updates correctly
- [ ] Test on mobile viewport
- [ ] Test "Continue without avatar" flow

---

## 🔍 Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                      ZOHM Webapp                            │
│  ┌──────────────┐    ┌─────────────┐    ┌──────────────┐  │
│  │ NicknameStep │ -> │ AvatarStep  │ -> │ VoiceQuest   │  │
│  │ (+ gender)   │    │ (generate)  │    │              │  │
│  └──────────────┘    └──────┬──────┘    └──────────────┘  │
└──────────────────────────────┼───────────────────────────────┘
                               │
                    useAvatarGeneration()
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ↓                             ↓
    ┌───────────────────────┐     ┌─────────────────────┐
    │   Next.js API Routes  │     │    Supabase DB      │
    │  /api/avatar/*        │     │   (Cache Layer)     │
    └──────────┬────────────┘     └─────────────────────┘
               │
               ↓
    ┌─────────────────────┐
    │     ZO API          │
    │  (Source of Truth)  │
    │  /api/v1/profile/*  │
    └─────────────────────┘
```

---

## 🎯 Success Criteria

### MVP (Minimum Viable Product):
✅ Database schema supports avatar caching  
✅ API routes proxy to ZO API correctly  
✅ Hook handles generation + polling  
✅ Non-blocking timeout (10s)  
⏳ UI shows loading state during generation  
⏳ UI displays generated avatar when ready  
⏳ User can proceed without avatar on timeout  

### Full Integration:
⏳ ZO authentication working for webapp users  
⏳ Avatar persists across sessions (cached in Supabase)  
⏳ Profile page shows avatar  
⏳ User can switch avatars post-onboarding (future)  

---

## 📞 Next Action Items

### For You:
1. **Get ZO API credentials** from backend team (see `ENV_SETUP.md`)
2. **Clarify authentication**: How webapp users get ZO tokens
3. **Run database migration** once credentials are ready
4. **Test API routes** with real credentials

### For Me (when ready):
1. Update `NicknameStep` with gender selection UI
2. Update `AvatarStep` with generation flow
3. Add loading animations (pulsing opacity 0.5↔1.0)
4. Wire up QuestComplete data integration
5. Implement leaderboard query

---

**Status**: 🟡 **60% Complete** (Backend ready, pending credentials + UI)  
**Blocker**: Need ZO API credentials + auth strategy  
**ETA**: 2-4 hours after credentials obtained

---

## 🎮 Game1111 Data Integration (Phase 2B)

### ❌ Current Issues (Critical)

**Problem**: Game works but nothing is saved to database!

1. **Quest completion not saved**
   - Score stored only in React state (lost on refresh)
   - Tokens not persisted to database
   - No record in `completed_quests` table

2. **Leaderboard not updated**
   - Trigger exists but never fires (no INSERT to `completed_quests`)
   - User rankings stay static

3. **Token calculation too simple**
   - Current: `hasWon ? 200 : 100`
   - Should be: Proximity-based (420 for perfect, 100-400 for close)

4. **Quest entry missing**
   - Database has no `game-1111-quest` row in `quests` table
   - API returns 404 when trying to complete quest

5. **Cooldown not enforced**
   - User can play infinitely
   - Should be once every 12 hours

---

### 🎯 Required Implementations

#### 1. Token Reward Calculation (Proximity-Based)

**Current (Static):**
```typescript
// In QuestAudio.tsx line 704:
const tokensEarned = hasWon ? 200 : 100;  // ❌ Too simple
```

**Needed (Dynamic):**
```typescript
const calculateTokensEarned = (score: number): number => {
  const distance = Math.abs(score - 1111);
  
  if (distance === 0) return 420;      // Perfect: exactly 1111
  if (distance <= 10) return 400;      // Very close: 1101-1121
  if (distance <= 50) return 350;      // Close: 1061-1161
  if (distance <= 100) return 250;     // Decent: 1011-1211
  return 100;                          // Participation: anything else
};
```

**Examples:**
- Score 1111 → 420 tokens ⭐
- Score 1115 → 400 tokens (distance: 4)
- Score 1150 → 350 tokens (distance: 39)
- Score 1200 → 250 tokens (distance: 89)
- Score 5555 → 100 tokens (distance: 4444)

---

#### 2. Leaderboard Logic (Already Simple!)

**How it works (automatic):**
```sql
-- Leaderboard table (already exists)
CREATE TABLE leaderboards (
  user_id TEXT UNIQUE,
  username TEXT,
  zo_points INTEGER,  -- ⭐ Total points = rank
  total_quests_completed INTEGER
);

-- Ranking query (simple!)
SELECT 
  rank() OVER (ORDER BY zo_points DESC) as rank,
  username,
  zo_points,
  total_quests_completed
FROM leaderboards
ORDER BY zo_points DESC;
```

**Ranking logic:**
- More points = Higher rank
- Automatic via database trigger
- No manual calculation needed!

**Example:**
```
Rank | Username    | Points | Quests
-----|-------------|--------|-------
  1  | alice.zo    | 5420   | 25
  2  | bob.zo      | 4850   | 20
  3  | charlie.zo  | 3920   | 18
```

---

#### 3. Database Save Flow

**Current (Broken):**
```
User plays game → Score: 1111 → "You won!"
                                    ↓
                            ❌ Nothing saved
                            ❌ Leaderboard static
```

**Needed (Fixed):**
```
User plays game → Score: 1111 → Calculate tokens (420)
                                    ↓
                     POST /api/quests/complete
                                    ↓
                     INSERT INTO completed_quests
                                    ↓
                        Trigger fires (automatic)
                                    ↓
                     UPDATE leaderboards (zo_points += 420)
                     UPDATE users (zo_balance += 420)
                                    ↓
                     Return success + rewards
```

**Code needed in `QuestAudio.tsx`:**
```typescript
onWin={async (score, hasWon) => {
  console.log('🎮 Game completed:', { score, hasWon, userId });
  
  // Calculate tokens with proximity formula
  const tokensEarned = calculateTokensEarned(score);
  
  // Save to database
  try {
    const response = await fetch('/api/quests/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        quest_id: 'game-1111-quest',
        score: score,
        location: 'webapp',
        metadata: {
          quest_title: 'Quantum Voice Sync',
          completed_via: 'webapp',
          game_won: hasWon,
          reward_zo: tokensEarned,  // ⭐ Dynamic calculation
        }
      })
    });
    
    const data = await response.json();
    console.log('✅ Quest saved:', data);
    
    onComplete(score, data.rewards.zo_tokens);
  } catch (error) {
    console.error('❌ Save failed:', error);
    onComplete(score, tokensEarned);  // Continue anyway
  }
}}
```

---

#### 4. Create Quest Entry (SQL)

**Run this in Supabase SQL Editor:**
```sql
-- Create game-1111-quest entry
INSERT INTO quests (
  id,
  slug,
  title,
  description,
  reward,
  category,
  cooldown_hours,
  status,
  rewards_breakdown
) VALUES (
  gen_random_uuid()::text,
  'game-1111-quest',
  'Quantum Voice Sync',
  'Sync your voice frequency and stop the counter at 1111 to manifest maximum $ZO tokens! The closer you get, the more you earn.',
  200,
  'daily',
  12,  -- Once every 12 hours
  'active',
  '{
    "zo_tokens": 200,
    "reputation": {"Explorer": 10, "Pioneer": 5},
    "items": [
      {
        "type": "badge",
        "id": "quantum-sync-master",
        "quantity": 1,
        "metadata": {
          "name": "Quantum Sync Master",
          "description": "Perfect synchronization achieved",
          "rarity": "legendary"
        }
      }
    ]
  }'::jsonb
);
```

---

### 📊 Implementation Checklist

#### Phase 2B Tasks:
- [ ] Add `calculateTokensEarned()` function to QuestAudio.tsx
- [ ] Wire `onWin` callback to call `/api/quests/complete`
- [ ] Create `game-1111-quest` entry in database (SQL above)
- [ ] Test quest completion saves to `completed_quests`
- [ ] Verify leaderboard updates automatically (trigger)
- [ ] Verify user balance increases (`users.zo_balance`)
- [ ] Test cooldown enforcement (12 hour limit)
- [ ] Update QuestComplete screen to show real data from DB

---

### 🧪 Testing Checklist

After implementation:
- [ ] Play game, win (score 1111) → Check 420 tokens awarded
- [ ] Play game, close (score 1115) → Check 400 tokens awarded
- [ ] Play game, far (score 5555) → Check 100 tokens awarded
- [ ] Verify `completed_quests` table has new row
- [ ] Verify `leaderboards` table updated (zo_points increased)
- [ ] Verify `users.zo_balance` increased
- [ ] Try playing again immediately → Should be blocked (cooldown)
- [ ] Check leaderboard page → Rank should update
- [ ] Refresh page → Data persists (not lost)

---

### 🎯 Priority: HIGH

**Why critical:**
- Game works perfectly but data is lost
- Users can't see progress or rankings
- Leaderboard stays empty
- Tokens don't accumulate

**ETA**: 1-2 hours to implement  
**Risk**: Low (trigger already exists, just need to call API)

---

**Status**: 🟡 **60% Complete** (Backend ready, pending credentials + UI)  
**Avatar Blocker**: Need ZO API credentials + auth strategy  
**Game Blocker**: Need to implement database save logic  
**Overall ETA**: 3-6 hours to complete both Phase 2A & 2B



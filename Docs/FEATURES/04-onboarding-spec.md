# Onboarding — Feature Spec

**Version**: 1.0  
**Owner**: Product / Growth  
**Last Updated**: 2025-11-13  
**Status**: 🚧 In Progress

---

## Purpose

Deliver a short, high-conversion onboarding that registers identity, links profile, shows Node map, and introduces first quests.

**Target Time**: < 3 minutes from landing to map view

## Onboarding Steps

### 1. Welcome + Brief Ethos
**Duration**: 10 seconds

- Video plays: `onboarding.mp4`
- Shows Zo World visual identity
- "Zo Zo Zo!" catchphrase
- Subtle background audio

### 2. Nickname + Handle
**Duration**: 20 seconds

- Input field for nickname
- Optional: Handle (@username)
- Validation: 3-20 characters, no special chars
- Save to `users.nickname`

### 3. Connect Wallet or Phone
**Duration**: 30 seconds

**Current (v1.0)**: Privy Authentication
- Email magic link
- Social (Google, Twitter, Discord)
- Crypto wallets (MetaMask, WalletConnect)
- Embedded wallet creation

**Future (v2.0)**: ZO API Phone Auth
- Phone number + OTP
- Backend creates wallet automatically
- See `WALLET_AND_PHONE_TO_PROFILE_FLOW.md`

### 4. Select Body Type for Avatar
**Duration**: 15 seconds

- Two options: "bro" (male) or "bae" (female)
- Visual cards with illustrations
- Selection triggers avatar generation via ZO API
- See `FEATURES/avatar-generation.md` (planned)

### 5. PFP Selection
**Duration**: 30 seconds

**Options**:
1. **Generated Avatar** (from step 4)
2. **NFT Profile Picture** (if wallet has NFTs)
3. **Static Unicorn Library** (fallback)

**Flow**:
```
If avatar_generated:
  Show generated avatar with "Use This" button
Else if has_nfts:
  Show NFT grid, select one
Else:
  Show unicorn library, select one

Save to users.pfp
```

### 6. Tutorial Quest (One-time)
**Duration**: 60 seconds

**Quest**: "Quantum Voice Sync" (Game1111 tutorial mode)
- Explains quest mechanics
- User completes mini-game
- Earns first tokens
- Seeds initial Vibe Score

**Rewards**:
- 50 $ZO tokens (fixed, not dynamic)
- +10 Explorer reputation
- "First Quest" badge

### 7. City Selection & Node Suggestion
**Duration**: 30 seconds

- Detect user's location (with permission)
- Show nearest city
- Suggest closest Node
- Set `users.home_city`
- Show map centered on user's city

---

## API & DB

### Complete Onboarding Endpoint
```typescript
POST /api/onboarding/complete

Request:
{
  user_id: string;
  nickname: string;
  body_type: 'bro' | 'bae';
  pfp_source: 'generated' | 'nft' | 'unicorn';
  pfp_url: string;
  home_city: string;
  tutorial_quest_completed: boolean;
}

Response:
{
  success: true;
  data: {
    user: User;
    initial_vibe_score: number;
    suggested_node: Node;
  };
}
```

### Database Updates
```sql
-- Mark onboarding complete
UPDATE users 
SET 
  onboarding_completed = true,
  onboarding_completed_at = NOW(),
  nickname = $1,
  body_type = $2,
  pfp = $3,
  home_city = $4
WHERE id = $5;

-- Insert tutorial quest completion
INSERT INTO completed_quests (
  user_id,
  quest_id,
  score,
  reward_amount,
  location,
  metadata
) VALUES (
  $1,
  (SELECT id FROM quests WHERE slug = 'tutorial-voice-quest'),
  50, -- Fixed score for tutorial
  50, -- 50 ZO tokens
  'onboarding',
  '{"is_tutorial": true, "onboarding_step": 6}'::jsonb
);

-- Create initial Vibe Score
INSERT INTO vibe_scores (
  user_id,
  score,
  breakdown,
  features
) VALUES (
  $1,
  60, -- Baseline score
  '{"behavior": 10, "presence": 10, "flow": 10, "social": 0, "creative": 0, "node": 0, "decay": 0}'::jsonb,
  '{}'::jsonb
);
```

## UX Notes

### Progressive Loading
- Show animated loader during avatar generation
- Display "Generating your avatar..." with progress bar
- If generation takes > 10 seconds, allow skip

### Error Handling
- If avatar generation fails, fallback to unicorn library
- If wallet connection fails, retry or skip to phone auth
- If location denied, show city picker

### Skip Logic
- Users can skip PFP selection (default unicorn assigned)
- Users can skip city selection (prompts again on first map view)
- Tutorial quest cannot be skipped (required for baseline Vibe Score)

### Mobile Optimization
- Touch-friendly buttons (min 44x44 px)
- Swipe navigation between steps
- Native keyboard handling
- Auto-advance after selection

## Telemetry

Track each step:
- `onboarding_start` - User lands on onboarding
- `onboarding_nickname` - Nickname entered
- `onboarding_auth` - Auth method used (privy/zo_api/wallet)
- `onboarding_avatar_select` - Body type selected
- `onboarding_pfp_select` - PFP source chosen
- `onboarding_tutorial` - Tutorial quest completed
- `onboarding_city` - City selected
- `onboarding_complete` - Full flow completed

**Funnel Metrics**:
```
Landing → Nickname → Auth → Avatar → PFP → Tutorial → City → Complete
100%   → 85%      → 70%  → 65%    → 60% → 50%     → 45%  → 40%
```

**Target**: 40% completion rate within 3 minutes

## Acceptance Criteria

- [ ] New users complete onboarding in < 3 minutes (p50)
- [x] Users can enter nickname and save
- [ ] Avatar generation triggers correctly
- [ ] Tutorial quest auto-accepted and shows in UI
- [ ] Users land on map after completion
- [ ] Initial Vibe Score calculated (baseline = 60)
- [ ] Onboarding can be resumed if user closes tab

## Tests

### E2E Test (Full Flow)
```typescript
describe('Onboarding Flow', () => {
  it('completes full onboarding journey', async () => {
    // 1. Landing page loads
    await page.goto('/onboarding');
    
    // 2. Enter nickname
    await page.fill('[data-testid="nickname-input"]', 'TestUser');
    await page.click('[data-testid="nickname-next"]');
    
    // 3. Connect wallet (mock Privy)
    await mockPrivyAuth();
    
    // 4. Select body type
    await page.click('[data-testid="body-type-bro"]');
    await waitForAvatarGeneration();
    
    // 5. Confirm PFP
    await page.click('[data-testid="use-generated-avatar"]');
    
    // 6. Complete tutorial quest
    await playTutorialQuest();
    expect(await page.textContent('[data-testid="tokens-earned"]')).toContain('50');
    
    // 7. Select city
    await page.click('[data-testid="city-san-francisco"]');
    
    // 8. Verify landing on map
    await page.waitForSelector('[data-testid="map-canvas"]');
    expect(page.url()).toContain('/map');
    
    // 9. Check database
    const user = await getUser(testUserId);
    expect(user.onboarding_completed).toBe(true);
    expect(user.zo_points).toBe(50);
  });
});
```

### Unit Tests
```typescript
describe('Onboarding API', () => {
  it('marks onboarding complete', async () => {
    const result = await POST('/api/onboarding/complete', {
      user_id: 'test-user',
      nickname: 'TestUser',
      body_type: 'bro',
      pfp_url: 'https://cdn.zo.xyz/avatar/123.png',
      home_city: 'San Francisco',
      tutorial_quest_completed: true
    });
    
    expect(result.success).toBe(true);
    expect(result.data.initial_vibe_score).toBeGreaterThan(0);
  });
  
  it('prevents completing onboarding twice', async () => {
    await completeOnboarding(userId);
    const result = await completeOnboarding(userId);
    expect(result.success).toBe(false);
    expect(result.error).toContain('already completed');
  });
});
```

## Current Implementation

**Location**: 
- `apps/web/src/app/onboarding/` (presumed, needs verification)
- `apps/web/src/components/PrivyProvider.tsx` (auth)

**Status**:
- ✅ Privy authentication working
- ⚠️ Nickname step exists but needs polish
- ❌ Avatar generation not integrated
- ❌ Tutorial quest not auto-accepted
- ❌ City selection not implemented
- ❌ Onboarding completion tracking missing

## Work Order Snippet

```markdown
# WO-XXX: Complete Onboarding Flow v1.0

## Scope
- Implement `/api/onboarding/complete` endpoint
- Add avatar generation step (integrate ZO API)
- Auto-accept tutorial quest on step 6
- Add city selection with location detection
- Track onboarding funnel metrics
- Add resume capability (save progress)

## Files to Create/Modify
- `apps/web/src/app/api/onboarding/complete/route.ts`
- `apps/web/src/app/onboarding/page.tsx`
- `apps/web/src/components/onboarding/NicknameStep.tsx`
- `apps/web/src/components/onboarding/AvatarStep.tsx`
- `apps/web/src/components/onboarding/TutorialQuestStep.tsx`
- `apps/web/src/components/onboarding/CitySelectionStep.tsx`
- `migrations/XXX_onboarding_tracking.sql`

## Database Changes
- Add `onboarding_completed` boolean to users table
- Add `onboarding_completed_at` timestamp
- Add `onboarding_progress` JSONB for resume capability

## Tests
- E2E test for full onboarding flow
- API test for completion endpoint
- Funnel tracking test
- Resume capability test

## Acceptance Criteria
- Users complete onboarding in < 3 minutes
- Tutorial quest auto-accepted
- Initial Vibe Score created
- Users land on map with their city selected
- Funnel metrics tracked for each step
```

## Related Documentation

- `Docs/WALLET_AND_PHONE_TO_PROFILE_FLOW.md` - Future auth migration
- `Docs/VIBE_SCORE.md` - Initial Vibe Score calculation
- `Docs/QUESTS_SYSTEM.md` - Tutorial quest mechanics
- `Docs/FEATURES/avatar-generation.md` - Avatar generation (planned)
- `Docs/API_CONTRACTS.md` - API endpoint contracts


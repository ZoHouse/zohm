# Quests — Feature Spec

**Version**: 1.0  
**Owner**: Game Systems  
**Last Updated**: 2025-11-13  
**Status**: ✅ Core Implementation Complete (see QUESTS_SYSTEM.md)

---

## Purpose

Quests are the core interaction primitives that generate signals for the Life Design Engine. They can be one-time, scheduled recurring, or timed events with proofs.

## Quest Types

### 1. One-time Quest
Single execution (e.g., Voice Quest, Tutorial)
- User accepts → completes → receives reward
- Cannot be repeated

### 2. Recurring Quest
Scheduled (e.g., Game1111 every 24 hours)
- Has cooldown period
- Can be completed multiple times
- Tracks next available time

### 3. Location-based Quest
Requires presence at Node
- GPS verification required
- Geofence check (within X meters)
- Optional AR marker scan

### 4. Audio/Voice Quest
Record and submit short clip as proof
- 10-30 second audio recording
- Waveform preview
- Audio stored securely

### 5. Social Quest
Invite or collaborate to complete
- Requires multiple participants
- Rewards split or bonus for all
- Examples: Event attendance, referrals

## API Contracts

### Get Available Quests
```typescript
GET /api/quests?city=<cityId>

Response:
{
  success: true;
  data: {
    quests: Quest[];
    user_progress?: Record<string, UserQuestStatus>;
  };
}

interface Quest {
  id: string;
  slug: string;
  title: string;
  description: string;
  quest_type: 'mini_game' | 'location' | 'social' | 'progressive' | 'voice';
  reward: number;
  rewards_breakdown: RewardsBreakdown;
  cooldown_hours: number;
  is_repeatable: boolean;
  verification_type: 'auto' | 'manual' | 'gps' | 'contract';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  is_active: boolean;
}
```

### Get Quest Details
```typescript
GET /api/quests/:id

Response:
{
  success: true;
  data: {
    quest: Quest;
    user_status?: {
      accepted: boolean;
      completed_count: number;
      last_completed_at?: string;
      next_available_at?: string;
    };
  };
}
```

### Accept Quest
```typescript
POST /api/quests/:id/accept

Request:
{
  user_id: string;
}

Response:
{
  success: true;
  data: {
    user_quest_id: string;
    accepted_at: string;
    expires_at?: string; // For timed quests
  };
}
```

### Submit Quest (with Proof)
```typescript
POST /api/quests/:id/submit

Request:
{
  user_id: string;
  quest_id: string;
  score?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  proof: {
    ts: string;
    source: 'webapp' | 'mobile' | 'api';
    payload: any; // Quest-specific proof data
    signature?: string; // Optional wallet signature
  };
  metadata?: Record<string, any>;
}

Response:
{
  success: true;
  data: {
    completion_id: string;
    rewards: {
      zo_tokens: number;
      reputation: Record<string, number>;
      items: any[];
    };
    next_available_at?: string; // If repeatable
    vibe_delta?: VibeScoreDelta;
  };
}
```

### Verify Quest (Server/Worker)
```typescript
POST /api/quests/:id/verify

Request:
{
  user_quest_id: string;
  verifier_id: string;
  verified: boolean;
  verifier_notes?: string;
}

Response:
{
  success: true;
  data: {
    verification_id: string;
    status: 'verified' | 'rejected';
  };
}
```

## DB Surface

### `quests` table
```sql
CREATE TABLE quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  quest_type TEXT NOT NULL,
  node_id UUID REFERENCES nodes(id), -- Optional location constraint
  reward INTEGER DEFAULT 0,
  rewards_breakdown JSONB,
  cooldown_hours INTEGER DEFAULT 0,
  is_repeatable BOOLEAN DEFAULT false,
  verification_type TEXT DEFAULT 'auto',
  difficulty TEXT DEFAULT 'medium',
  schedule JSONB, -- For recurring quests
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `user_quests` table (Quest Acceptance/Status)
```sql
CREATE TABLE user_quests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT REFERENCES users(id),
  quest_id UUID REFERENCES quests(id),
  status TEXT NOT NULL, -- 'accepted', 'in_progress', 'submitted', 'completed', 'expired'
  accepted_at TIMESTAMP DEFAULT NOW(),
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP,
  score INTEGER,
  proof_hash TEXT, -- SHA256 of proof payload
  metadata JSONB,
  
  INDEX idx_user_quests_user (user_id),
  INDEX idx_user_quests_quest (quest_id),
  INDEX idx_user_quests_status (status)
);
```

### `quest_proofs` table (Detailed Proof Storage)
```sql
CREATE TABLE quest_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_quest_id UUID REFERENCES user_quests(id) ON DELETE CASCADE,
  proof_json JSONB NOT NULL, -- Full proof payload
  verified BOOLEAN DEFAULT false,
  verifier_id TEXT REFERENCES users(id),
  verifier_notes TEXT,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_proofs_user_quest (user_quest_id),
  INDEX idx_proofs_verified (verified)
);
```

### `completed_quests` table (Legacy - for compatibility)
```sql
-- See DATABASE_SCHEMA.md for full definition
-- This table tracks quest completions for leaderboard/rewards
```

## Proof & Verification

### Proof Standard
All proofs follow this minimal structure:

```typescript
interface QuestProof {
  ts: string;           // ISO timestamp
  source: string;       // 'webapp' | 'mobile' | 'api'
  payload: any;         // Quest-specific data
  signature?: string;   // Optional wallet signature
}
```

### Verification Methods

**Auto Verification** (`verification_type: 'auto'`):
- No additional checks
- Used for: Mini-games, tutorials
- Example: Game1111 (score is self-evident)

**GPS Verification** (`verification_type: 'gps'`):
- Check `latitude` and `longitude` within geofence
- Geofence radius stored in `quest.metadata.geofence_radius_meters`
- Formula: Haversine distance ≤ radius

**Manual Verification** (`verification_type: 'manual'`):
- Human moderator reviews proof
- Used for: Creative submissions, event attendance
- Verifier adds notes and approval/rejection

**Contract Verification** (`verification_type: 'contract'`):
- On-chain proof (NFT ownership, transaction, etc.)
- Verify signature matches wallet address
- Check blockchain state

## Vibe Integration

Quest completion returns a `vibe_delta` that updates Vibe Score:

```typescript
interface VibeScoreDelta {
  behavior_recent: number;    // +0.2 for quest completion
  flow_indicator: number;     // Based on performance
  social_sync?: number;       // If social quest
  creative_output?: number;   // If creative submission
}
```

See `VIBE_SCORE.md` for how these deltas affect the overall score.

## Acceptance Criteria

- [x] Quests listed correctly per city
- [x] Users can complete quests
- [x] Cooldown system works (24-hour for Game1111)
- [x] Rewards distributed automatically
- [x] Leaderboard updates on completion
- [ ] Quest acceptance flow (user_quests table)
- [ ] Proof verification system
- [ ] Social quest multi-user support
- [ ] Location-based GPS verification

## Tests

### Unit Tests
```typescript
describe('Quest API', () => {
  it('accepts quest and creates user_quest record', async () => {
    const result = await acceptQuest(userId, questId);
    expect(result.data.user_quest_id).toBeDefined();
  });
  
  it('enforces cooldown on repeatable quests', async () => {
    await completeQuest(userId, 'game-1111-quest');
    const result = await completeQuest(userId, 'game-1111-quest');
    expect(result.success).toBe(false);
    expect(result.error).toContain('cooldown');
  });
  
  it('verifies GPS proof for location quests', async () => {
    const proof = {
      ts: new Date().toISOString(),
      source: 'mobile',
      payload: { latitude: 37.7749, longitude: -122.4194 }
    };
    const result = await submitQuest(userId, locationQuestId, proof);
    expect(result.success).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Quest Completion Flow', () => {
  it('completes full quest lifecycle', async () => {
    // Accept quest
    const accepted = await acceptQuest(userId, questId);
    
    // Submit proof
    const submitted = await submitQuest(userId, questId, proof);
    
    // Verify rewards
    expect(submitted.data.rewards.zo_tokens).toBeGreaterThan(0);
    
    // Check leaderboard updated
    const leaderboard = await getLeaderboard();
    const userEntry = leaderboard.find(e => e.user_id === userId);
    expect(userEntry.zo_points).toBeGreaterThan(0);
  });
});
```

## Current Implementation

**Status**:
- ✅ Core quest completion API (`/api/quests/complete`)
- ✅ Cooldown system working
- ✅ Dynamic reward calculation (Game1111)
- ✅ Leaderboard auto-update triggers
- ⚠️ Quest acceptance flow needs implementation
- ❌ Proof verification system not built
- ❌ Social quests not implemented
- ❌ Location verification not implemented

**See**: `Docs/QUESTS_SYSTEM.md` for complete technical documentation

## Work Order Snippet

```markdown
# WO-XXX: Implement Quest Acceptance & Proof System

## Scope
- Add `user_quests` and `quest_proofs` tables
- Implement `/api/quests/:id/accept` endpoint
- Update `/api/quests/:id/submit` to handle proofs
- Add GPS verification for location quests
- Build proof verification UI for moderators

## Files to Create
- `migrations/XXX_user_quests.sql`
- `migrations/XXX_quest_proofs.sql`
- `apps/web/src/app/api/quests/[id]/accept/route.ts`
- `apps/web/src/app/api/quests/[id]/verify/route.ts`
- `apps/web/src/lib/gpsVerification.ts`
- `apps/web/src/components/ProofVerificationPanel.tsx`

## Tests
- Unit tests for each endpoint
- GPS verification haversine distance test
- Proof storage and retrieval test
- Manual verification workflow test

## Acceptance Criteria
- Users can accept quests before completing
- Proofs stored securely with hash
- GPS verification works within 100m accuracy
- Manual verification UI functional
```

## Related Documentation

- `Docs/QUESTS_SYSTEM.md` - Complete technical specification
- `Docs/API_CONTRACTS.md` - API endpoint contracts
- `Docs/DATABASE_SCHEMA.md` - Database schema
- `Docs/VIBE_SCORE.md` - Vibe Score integration
- `Docs/FEATURES/06-game1111-spec.md` - Game1111 specific implementation


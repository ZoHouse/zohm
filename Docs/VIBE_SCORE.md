# Vibe Score Specification

**Version**: 1.1  
**Last Updated**: 2025-11-18  
**Owner**: Platform / Systems  
**Status**: ✅ V1 Implemented (Simple Quantum Sync Completion Rate)

---

## Purpose

**Vibe Score** is a real-time percentage (0–100) expressing how closely a citizen is aligned with their optimal personal timeline at this moment.

**Philosophy**: The Vibe Score isn't a judgment—it's a compass. It reflects your resonance with the Zo Protocol's quantum field, guiding you toward flow states and meaningful connections.

---

## V1 Implementation (Current)

**Formula**: `Vibe Score = (Completed Syncs / Expected Syncs) × 100`

### Simple Math
- **Completed Syncs** = Number of Game1111 (Quantum Sync) quests completed
- **Expected Syncs** = Days since account creation × 2 (12hr cooldown = 2 syncs/day possible)
- **Vibe Score** = Completion percentage (0-100%)

### Examples
- Account created today, completed 2 syncs → **100%** (2/2)
- Account created today, completed 2 syncs, missed 1 → **67%** (2/3)
- Account 5 days old, completed 8 syncs → **80%** (8/10 expected)

### API Endpoint
```
GET /api/vibe/:userId
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 80,
    "breakdown": {
      "completedSyncs": 8,
      "expectedSyncs": 10,
      "missedSyncs": 2,
      "accountAgeDays": 5,
      "completionRate": 0.8
    },
    "timestamp": "2025-11-18T12:00:00Z",
    "userId": "did:privy:xxx"
  }
}
```

---

## V2 Future Enhancements (Planned)

The following advanced features are planned for future versions:

---

## Inputs (Derived Features)

All inputs are normalized to `0..1` range:

| Feature | Description | Range | Weight |
|---------|-------------|-------|--------|
| `behavior_recent` | Normalized activity in last 24h | 0..1 | 25 |
| `session_presence` | Active session length and interactions | 0..1 | 20 |
| `node_context` | Node resonance factor where user is present | 0..1 | 30 |
| `flow_indicator` | Quest success, time-in-flow heuristics | 0..1 | 25 |
| `social_sync` | Recent positive interactions / accepted invites | 0..1 | 15 |
| `creative_output` | Uploads, contributions, event hosting | 0..1 | 15 |
| `decay` | Time since last signal (minutes) | 0..∞ | -0.01/min |

---

## Output

```typescript
interface VibeScoreResponse {
  score: number;              // 0 <= score <= 100
  breakdown: {
    behavior: number;         // Contribution from behavior_recent
    presence: number;         // Contribution from session_presence
    node: number;             // Contribution from node_context
    flow: number;             // Contribution from flow_indicator
    social: number;           // Contribution from social_sync
    creative: number;         // Contribution from creative_output
    decay: number;            // Penalty from inactivity
  };
  timestamp: string;          // ISO timestamp
  user_id: string;
}
```

---

## Reference Calculation (Starter)

```typescript
function calculateVibeScore(features: VibeFeatures): VibeScoreResponse {
  const base = 50;
  
  let score_raw = base;
  score_raw += 25 * features.behavior_recent;
  score_raw += 20 * features.session_presence;
  score_raw += 30 * features.node_context;
  score_raw += 25 * features.flow_indicator;
  score_raw += 15 * features.social_sync;
  score_raw += 15 * features.creative_output;
  score_raw -= features.decay * 0.01;
  
  const score = Math.max(0, Math.min(100, Math.round(score_raw)));
  
  return {
    score,
    breakdown: {
      behavior: 25 * features.behavior_recent,
      presence: 20 * features.session_presence,
      node: 30 * features.node_context,
      flow: 25 * features.flow_indicator,
      social: 15 * features.social_sync,
      creative: 15 * features.creative_output,
      decay: -features.decay * 0.01
    },
    timestamp: new Date().toISOString(),
    user_id: features.user_id
  };
}
```

**Note**: Weights above are example starting points for experiments. Tune based on user feedback and behavioral data.

---

## API

### GET `/api/v1/vibe/:userId`

**Description**: Fetch current vibe score and breakdown for a user.

**Path Parameters**:
- `userId` (string, required) - User's identifier

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 78,
    "breakdown": {
      "behavior": 18.5,
      "presence": 14.2,
      "node": 24.0,
      "flow": 21.3,
      "social": 9.5,
      "creative": 12.0,
      "decay": -1.5
    },
    "timestamp": "2025-11-13T15:30:00Z",
    "user_id": "did:privy:xxx"
  }
}
```

---

### POST `/api/v1/vibe/compute`

**Description**: Compute a score given feature inputs (for testing/simulation).

**Request Body**:
```json
{
  "userId": "did:privy:xxx",
  "features": {
    "behavior_recent": 0.74,
    "session_presence": 0.71,
    "node_context": 0.80,
    "flow_indicator": 0.85,
    "social_sync": 0.63,
    "creative_output": 0.80,
    "decay": 15
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "score": 78,
    "breakdown": {
      "behavior": 18.5,
      "presence": 14.2,
      "node": 24.0,
      "flow": 21.3,
      "social": 9.5,
      "creative": 12.0,
      "decay": -0.15
    },
    "timestamp": "2025-11-13T15:30:00Z"
  }
}
```

---

## Feature Extraction (Data Sources)

### 1. `behavior_recent` (Activity Score)

**Source**: `completed_quests`, `user_streaks`, `city_progress`

**Formula**:
```typescript
function computeBehaviorRecent(userId: string): number {
  const last24h = Date.now() - 24 * 60 * 60 * 1000;
  
  // Count quests completed in last 24h
  const questsCount = await countQuestsCompleted(userId, last24h);
  
  // Check login streak
  const hasLoginToday = await checkLoginStreak(userId);
  
  // Normalize: 0 quests = 0, 5+ quests = 1
  const questScore = Math.min(1, questsCount / 5);
  const loginBonus = hasLoginToday ? 0.2 : 0;
  
  return Math.min(1, questScore + loginBonus);
}
```

---

### 2. `session_presence` (Engagement Score)

**Source**: Session tracking, page views, time-on-site

**Formula**:
```typescript
function computeSessionPresence(userId: string): number {
  const sessionDuration = await getActiveSessionDuration(userId); // minutes
  const interactions = await getSessionInteractions(userId); // clicks, navigation
  
  // Normalize: 30min+ session = 1, 0 interactions = 0
  const durationScore = Math.min(1, sessionDuration / 30);
  const interactionScore = Math.min(1, interactions / 20);
  
  return (durationScore * 0.6 + interactionScore * 0.4);
}
```

---

### 3. `node_context` (Location Resonance)

**Source**: `nodes` table, user's current location, GPS data

**Formula**:
```typescript
function computeNodeContext(userId: string): number {
  const currentNode = await getUserCurrentNode(userId);
  
  if (!currentNode) return 0.3; // Baseline if not at a node
  
  // Node has a "resonance" property (0..1) based on:
  // - Community activity at node
  // - Events happening now
  // - User's historical affinity with this node
  const nodeResonance = currentNode.resonance || 0.5;
  
  return nodeResonance;
}
```

---

### 4. `flow_indicator` (Performance Score)

**Source**: Quest scores, game performance, time-in-flow metrics

**Formula**:
```typescript
function computeFlowIndicator(userId: string): number {
  const recentScores = await getRecentQuestScores(userId, 3); // Last 3 quests
  
  if (recentScores.length === 0) return 0.4; // Baseline
  
  // Calculate average performance (normalized to 0..1)
  const avgPerformance = recentScores.reduce((sum, score) => {
    // For Game1111: distance from 1111, normalized
    const distance = Math.abs(1111 - score);
    const normalized = Math.max(0, 1 - distance / 1111);
    return sum + normalized;
  }, 0) / recentScores.length;
  
  return avgPerformance;
}
```

---

### 5. `social_sync` (Social Score)

**Source**: Event RSVPs, friend interactions, messages sent

**Formula**:
```typescript
function computeSocialSync(userId: string): number {
  const last7days = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  const eventsAttended = await countEventsAttended(userId, last7days);
  const invitesAccepted = await countInvitesAccepted(userId, last7days);
  const messagesExchanged = await countMessages(userId, last7days);
  
  // Normalize: 2+ events = high social, 5+ messages = engaged
  const eventScore = Math.min(1, eventsAttended / 2);
  const inviteScore = Math.min(1, invitesAccepted / 3);
  const messageScore = Math.min(1, messagesExchanged / 5);
  
  return (eventScore * 0.4 + inviteScore * 0.3 + messageScore * 0.3);
}
```

---

### 6. `creative_output` (Contribution Score)

**Source**: User-created content, event hosting, quest submissions

**Formula**:
```typescript
function computeCreativeOutput(userId: string): number {
  const last30days = Date.now() - 30 * 24 * 60 * 60 * 1000;
  
  const eventsHosted = await countEventsHosted(userId, last30days);
  const contentUploaded = await countContentUploads(userId, last30days);
  const questsCreated = await countUserQuestsCreated(userId, last30days);
  
  // Normalize: 1 event hosted = high creativity
  const hostScore = Math.min(1, eventsHosted / 1);
  const uploadScore = Math.min(1, contentUploaded / 5);
  const questScore = Math.min(1, questsCreated / 2);
  
  return (hostScore * 0.5 + uploadScore * 0.3 + questScore * 0.2);
}
```

---

### 7. `decay` (Inactivity Penalty)

**Source**: Time since last activity

**Formula**:
```typescript
function computeDecay(userId: string): number {
  const lastActivity = await getLastActivityTime(userId);
  const minutesSinceActivity = (Date.now() - lastActivity) / (1000 * 60);
  
  // Returns minutes (used as negative weight)
  return minutesSinceActivity;
}
```

---

## Privacy & Storage

### Storage Rules

1. **Store only derived features and scores** - Avoid storing raw location streams or raw audio
2. **Short retention for high-frequency signals** - Keep 24-72 hours of raw data
3. **Aggregate into daily summaries** - Long-term profiles use daily/weekly aggregates
4. **User-controlled opt-out** - Users can disable Vibe Score tracking entirely

### Database Schema

```sql
CREATE TABLE vibe_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id),
  score INTEGER NOT NULL, -- 0-100
  breakdown JSONB NOT NULL,
  features JSONB NOT NULL,
  computed_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_vibe_user_time (user_id, computed_at DESC)
);

-- Keep only last 7 days of scores
CREATE OR REPLACE FUNCTION cleanup_old_vibe_scores()
RETURNS void AS $$
BEGIN
  DELETE FROM vibe_scores
  WHERE computed_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;
```

---

## Usage

### UI Display

**Profile Page**:
```tsx
<VibeScoreWidget>
  <VibePercentage>{vibeScore.score}%</VibePercentage>
  <VibeBreakdown>
    <Bar label="Flow" value={vibeScore.breakdown.flow} />
    <Bar label="Node" value={vibeScore.breakdown.node} />
    <Bar label="Behavior" value={vibeScore.breakdown.behavior} />
    {/* ... other bars */}
  </VibeBreakdown>
</VibeScoreWidget>
```

**Map View** (subtle indicator):
```tsx
<UserAvatar vibeGlow={vibeScore.score > 70 ? 'bright' : 'dim'} />
```

---

### Quest Suggestions

Use thresholds to trigger contextual suggestions:

```typescript
if (vibeScore.breakdown.flow < 10) {
  // Low flow → suggest easy warm-up quest
  suggestQuest('game-1111-quest');
}

if (vibeScore.breakdown.social < 5) {
  // Low social → suggest event attendance
  suggestQuest('attend-community-meetup');
}

if (vibeScore.breakdown.node > 25 && vibeScore.breakdown.creative < 5) {
  // High node resonance, low creativity → suggest content creation
  suggestQuest('upload-node-photo');
}
```

---

### Coach Messages

Contextual guidance based on Vibe Score:

| Score Range | Message |
|-------------|---------|
| 0-20 | "Take a break. Your vibe will reset." |
| 21-40 | "Light activity detected. Try a quick quest?" |
| 41-60 | "You're warming up. Keep the momentum going." |
| 61-80 | "Strong vibe! You're in sync with the protocol." |
| 81-100 | "Peak resonance! You're a beacon in the network." |

---

## Safety & Guardrails

### What Vibe Score Should NOT Do

❌ **Never use score alone to forcibly move funds** - Vibe Score is informational, not transactional  
❌ **Never gate essential features behind high scores** - All core features must be accessible regardless of score  
❌ **Never expose raw scores publicly without consent** - Users control visibility  
❌ **Never punish low scores** - Low score = guidance, not penalty

### What Vibe Score SHOULD Do

✅ **Suggest personalized quests** - Tailor recommendations to current state  
✅ **Visualize user engagement** - Help users understand their patterns  
✅ **Unlock bonus rewards** - High scores can unlock optional perks  
✅ **Guide onboarding** - New users see what increases their score

---

## Testing & Validation

### Test Cases

```typescript
describe('Vibe Score Calculation', () => {
  test('Perfect activity (all 1.0) = ~100 score', () => {
    const features = {
      behavior_recent: 1.0,
      session_presence: 1.0,
      node_context: 1.0,
      flow_indicator: 1.0,
      social_sync: 1.0,
      creative_output: 1.0,
      decay: 0
    };
    const result = calculateVibeScore(features);
    expect(result.score).toBeGreaterThanOrEqual(95);
  });
  
  test('Zero activity = ~50 score (baseline)', () => {
    const features = {
      behavior_recent: 0,
      session_presence: 0,
      node_context: 0,
      flow_indicator: 0,
      social_sync: 0,
      creative_output: 0,
      decay: 0
    };
    const result = calculateVibeScore(features);
    expect(result.score).toBe(50);
  });
  
  test('Decay reduces score over time', () => {
    const features = {
      behavior_recent: 0.8,
      session_presence: 0.8,
      node_context: 0.8,
      flow_indicator: 0.8,
      social_sync: 0.8,
      creative_output: 0.8,
      decay: 100 // 100 minutes inactive
    };
    const result = calculateVibeScore(features);
    expect(result.breakdown.decay).toBe(-1.0);
  });
});
```

---

## Future Enhancements

**v1.1 - Personalized Weights** 🔮
- Machine learning to adjust weights per user
- Learn what activities correlate with user's self-reported "good vibes"

**v1.2 - Predictive Vibe** 🔮
- Forecast future vibe score based on patterns
- "If you complete this quest, your vibe score will increase by ~8 points"

**v1.3 - Collective Vibe** 🔮
- City-level vibe scores
- Node-level vibe heatmaps
- "San Francisco's vibe is at 82% today"

**v2.0 - Quantum Resonance** 🔮
- Integrate with on-chain reputation
- NFT-gated vibe multipliers
- Founder Pass holders get bonus weight on creative output

---

## Related Documentation

- `API_CONTRACTS.md` - API endpoint specifications
- `ARCHITECTURE.md` - System architecture overview
- `QUESTS_SYSTEM.md` - Quest mechanics and rewards
- `DATABASE_SCHEMA.md` - Database tables and relationships
- `CONSTRAINTS.md` - Editable/immutable path rules for AI coding


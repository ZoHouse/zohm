# API Contracts - Core Endpoints (v1)

**Project**: Zo World Map (ZOHM)  
**Last Updated**: 2025-11-13  
**Purpose**: Contract definitions for AI and human developers

---

## Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}
```

**Success Example**:
```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  }
}
```

**Error Example**:
```json
{
  "success": false,
  "error": "User not found",
  "details": {
    "user_id": "did:privy:xxx",
    "searched_in": "users_table"
  }
}
```

---

## Authentication

### Current (v1.0): Privy Token

Protected endpoints require:

```http
Authorization: Bearer <privy_token>
```

### Future (v2.0): ZO API Token

Protected endpoints will require:

```http
Authorization: Bearer <zo_api_token>
client-device-id: <device_id>
client-device-secret: <device_secret>
```

---

## Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limit exceeded or cooldown active |
| 500 | Internal Server Error | Server-side error |

---

## Vibe Score Endpoints

### GET `/api/v1/vibe/:userId`

**Description**: Returns current vibe score and breakdown.

**Path Parameters**:
- `userId` (string, required) - User identifier

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

**Status**: 🔮 Planned for v2.0

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
    }
  }
}
```

**Status**: 🔮 Planned for v2.0

---

## Quest Endpoints

### POST `/api/quests/complete`

**Description**: Record quest completion with score and location data.

**Request Body**:
```json
{
  "user_id": "did:privy:xxx",
  "quest_id": "game-1111-quest",
  "score": 1095,
  "location": "webapp",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "metadata": {
    "quest_title": "Quantum Voice Sync",
    "completed_via": "webapp",
    "game_won": true,
    "reward_zo": 84
  }
}
```

**Response** (Success):
```json
{
  "success": true,
  "completion_id": "uuid-xxx-xxx",
  "rewards": {
    "zo_tokens": 84,
    "reputation": {
      "explorer": 10
    },
    "items": []
  },
  "next_available_at": "2025-11-14T10:30:00Z"
}
```

**Response** (Cooldown):
```json
{
  "success": false,
  "error": "Quest is on cooldown",
  "next_available_at": "2025-11-14T10:30:00Z"
}
```

**Validation Rules**:
- `user_id` and `quest_id` are required
- `score` must be non-negative integer
- `latitude` and `longitude` are optional but recommended for location quests
- Must check cooldown before allowing completion

**Status**: ✅ Implemented

---

### POST `/api/v1/game1111/submit`

**Description**: Submit Game1111 score with proof (alternative endpoint with additional validation).

**Request Body**:
```json
{
  "userId": "did:privy:xxx",
  "walletAddress": "0x1234...",
  "questId": "game-1111-quest",
  "score": 1095,
  "durationMs": 10000,
  "proof": {
    "timestamp": "2025-11-13T15:30:00Z",
    "signature": "0xabc...",
    "frequencies": [1100, 1105, 1095, 1111]
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "recordId": "uuid-xxx",
    "leaderboardSummary": {
      "rank": 15,
      "totalPlayers": 523
    }
  }
}
```

**Validation Rules**:
- Validate timestamp is recent (within 5 minutes)
- Validate signature matches user's wallet
- Optional: Verify frequency data integrity

**Status**: 🚧 Planned (enhanced version of `/api/quests/complete`)

---

## Leaderboard Endpoints

### GET `/api/leaderboard`

**Description**: Fetch global leaderboard ranked by zo_points.

**Query Parameters**:
- `limit` (number, optional, default: 50, max: 100)
- `offset` (number, optional, default: 0)

**Response**:
```json
{
  "success": true,
  "data": {
    "leaderboard": [
      {
        "rank": 1,
        "user_id": "did:privy:xxx",
        "nickname": "CryptoKnight",
        "zo_points": 15000,
        "pfp": "https://cdn.zo.xyz/avatars/xxx.png",
        "home_city": "New York"
      }
    ],
    "total_users": 1523
  }
}
```

**Status**: ✅ Implemented

---

## User Endpoints

### GET `/api/users/:id/progress`

**Description**: Fetch user's overall progress.

**Response**:
```json
{
  "success": true,
  "data": {
    "user_id": "did:privy:xxx",
    "zo_points": 1500,
    "quests_completed": 23,
    "level": 5,
    "home_city": "San Francisco",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Status**: ✅ Implemented

---

### GET `/api/users/:id/streaks`

**Description**: Get user's streak data.

**Response**:
```json
{
  "success": true,
  "data": {
    "streaks": [
      {
        "streak_type": "login",
        "current_streak": 7,
        "longest_streak": 15,
        "last_activity_at": "2025-11-13T08:00:00Z"
      }
    ]
  }
}
```

**Status**: ✅ Implemented

---

### GET `/api/users/:id/reputations`

**Description**: Get user's reputation scores.

**Response**:
```json
{
  "success": true,
  "data": {
    "reputations": [
      {
        "reputation_type": "builder",
        "score": 450,
        "level": 3,
        "updated_at": "2025-11-10T12:00:00Z"
      }
    ]
  }
}
```

**Status**: ✅ Implemented

---

## Avatar Endpoints

### POST `/api/avatar/generate`

**Description**: Trigger avatar generation via ZO API proxy.

**Request Body**:
```json
{
  "user_id": "did:privy:xxx",
  "body_type": "bro"
}
```

**Body Type**: `"bro"` | `"bae"`

**Response**:
```json
{
  "success": true,
  "message": "Avatar generation started. Poll /api/avatar/status for updates."
}
```

**Status**: ✅ Implemented

---

### GET `/api/avatar/status`

**Description**: Poll for avatar generation completion.

**Query Parameters**:
- `user_id` (string, required)

**Response** (Generating):
```json
{
  "success": true,
  "data": {
    "status": "generating",
    "avatar_url": null,
    "message": "Avatar is being generated..."
  }
}
```

**Response** (Ready):
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "avatar_url": "https://proxy.cdn.zo.xyz/gallery/media/images/xxx.png",
    "metadata": {
      "ref_id": 12345,
      "body_type": "bro"
    }
  }
}
```

**Polling Strategy**:
- Client polls every 1 second
- Max 10 attempts (10 seconds total)
- Avatar typically ready in 2-5 seconds

**Status**: ✅ Implemented

---

## NFT & Web3 Endpoints

### POST `/api/check-nft`

**Description**: Verify NFT ownership (Founder Pass).

**Request Body**:
```json
{
  "walletAddress": "0x1234...",
  "chainId": 8453,
  "contractAddresses": [
    "0xFounderPassContract..."
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "hasNFT": true,
    "ownedContracts": ["0xFounderPassContract..."],
    "metadata": {
      "token_ids": ["123", "456"],
      "total_owned": 2
    }
  }
}
```

**Status**: ✅ Implemented

---

### POST `/api/send-token-reward`

**Description**: Send ERC-20 tokens as quest rewards.

**Request Body**:
```json
{
  "recipientAddress": "0x1234...",
  "amount": 100,
  "questId": "game-1111-quest"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "txHash": "0xabcdef...",
    "amount": 100,
    "symbol": "ZOHM"
  }
}
```

**Status**: ✅ Implemented

---

## City Endpoints

### GET `/api/cities`

**Description**: List all cities with stats.

**Response**:
```json
{
  "success": true,
  "data": {
    "cities": [
      {
        "id": "uuid-xxx",
        "name": "San Francisco",
        "latitude": 37.7749,
        "longitude": -122.4194,
        "population": 245,
        "total_zo_earned": 125000,
        "is_active": true
      }
    ]
  }
}
```

**Status**: ✅ Implemented

---

### POST `/api/sync-home-city`

**Description**: Update user's home city.

**Request Body**:
```json
{
  "user_id": "did:privy:xxx",
  "city_name": "San Francisco"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "home_city": "San Francisco"
  }
}
```

**Status**: ✅ Implemented

---

## Calendar Endpoints

### GET `/api/calendar`

**Description**: Fetch upcoming events from iCal sources.

**Response**:
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event-xxx",
        "title": "Community Meetup",
        "start": "2025-11-20T18:00:00Z",
        "end": "2025-11-20T20:00:00Z",
        "location": "Zo House SF"
      }
    ]
  }
}
```

**Status**: ✅ Implemented

---

## AR Endpoints

### POST `/api/ar/scan`

**Description**: Verify AR marker scan at physical location.

**Request Body**:
```json
{
  "user_id": "did:privy:xxx",
  "marker_id": "zo-house-sf-entrance",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "scan_data": {
    "marker_type": "qr_code",
    "timestamp": "2025-11-13T10:30:00Z"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "reward": {
      "zo_tokens": 50,
      "badge": "location_pioneer"
    }
  }
}
```

**Status**: ✅ Implemented

---

## Validation Rules (AI Must Follow)

### All Endpoints

1. **Timestamp Validation**: All timestamps in proofs must be within 5 minutes of server time
2. **Signature Validation**: If proof includes signature, validate against user's wallet
3. **Rate Limiting**: Implement rate limits (see below)
4. **Error Handling**: Always return structured error responses
5. **Logging**: Log all requests with user_id, endpoint, timestamp, success/failure

### Quest Completion

1. **Cooldown Check**: MUST check cooldown before allowing completion
2. **User Existence**: MUST verify user exists in database
3. **Quest Existence**: MUST verify quest exists and is active
4. **Score Validation**: Score must be non-negative integer
5. **Token Calculation**: Use deterministic formula (no randomness)

### Avatar Generation

1. **One-Time Generation**: Check if user already has avatar before allowing generation
2. **Body Type Validation**: Must be exactly `"bro"` or `"bae"`
3. **Polling Limit**: Frontend must not poll more than 10 times

---

## Rate Limiting (Planned for v2.0)

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/quests/complete` | 100 requests | per hour per user |
| `/api/avatar/generate` | 1 request | per 24 hours per user |
| `/api/avatar/status` | 60 requests | per minute per user |
| `/api/leaderboard` | 60 requests | per minute per IP |
| All other endpoints | 200 requests | per hour per user |

**Status**: 🔮 Planned

---

## Error Response Examples

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid body_type. Must be 'bro' or 'bae'",
  "details": {
    "provided": "invalid_value",
    "allowed": ["bro", "bae"]
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": "Missing or invalid authorization token"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Quest not found",
  "details": {
    "quest_id": "invalid-quest-id"
  }
}
```

### 429 Too Many Requests
```json
{
  "success": false,
  "error": "Quest is on cooldown",
  "next_available_at": "2025-11-14T10:30:00Z",
  "details": {
    "cooldown_hours": 24,
    "time_remaining_minutes": 143
  }
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Database connection failed",
  "details": {
    "timestamp": "2025-11-13T15:30:00Z",
    "request_id": "req_abc123"
  }
}
```

---

## Testing Endpoints

All endpoints must have:

1. **Unit tests** for business logic
2. **Integration tests** for database interactions
3. **E2E tests** for full request/response flow

**Example Test**:
```typescript
describe('POST /api/quests/complete', () => {
  it('should record quest completion', async () => {
    const response = await fetch('/api/quests/complete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token'
      },
      body: JSON.stringify({
        user_id: 'test_user',
        quest_id: 'game-1111-quest',
        score: 1095
      })
    });
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.rewards.zo_tokens).toBeGreaterThan(0);
  });
  
  it('should enforce cooldown', async () => {
    // Complete quest once
    await completeQuest('test_user', 'game-1111-quest');
    
    // Try to complete again immediately
    const response = await completeQuest('test_user', 'game-1111-quest');
    
    expect(response.status).toBe(429);
    expect(response.body.error).toBe('Quest is on cooldown');
  });
});
```

---

## Related Documentation

- `API_ENDPOINTS.md` - Detailed API reference with examples
- `VIBE_SCORE.md` - Vibe Score specification and calculation
- `QUESTS_SYSTEM.md` - Quest mechanics and reward formulas
- `CONSTRAINTS.md` - Editable/immutable path rules
- `ARCHITECTURE.md` - System architecture overview


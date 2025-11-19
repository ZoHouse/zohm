# API Endpoints Reference

**Project**: Zo World Map (ZOHM) WebApp  
**Last Updated**: November 19, 2025  
**Base URL**: `/api/`

> **🤖 For machine-readable contracts, see [API_CONTRACTS.md](./API_CONTRACTS.md)**  
> This file provides detailed examples and usage patterns.

---

## Table of Contents

1. [Authentication](#authentication)
2. [User Management](#user-management)
3. [Quest System](#quest-system)
4. [Leaderboard](#leaderboard)
5. [Cities & Locations](#cities--locations)
6. [Avatar & Profile](#avatar--profile)
7. [NFT & Web3](#nft--web3)
8. [Calendar Events](#calendar-events)
9. [AR Features](#ar-features)
10. [Database Setup](#database-setup)

---

## Authentication

### Current: Privy-based (v1.0)

Authentication is handled client-side via `@privy-io/react-auth`. API routes verify the user's session token.

**Headers Required**:
```http
Authorization: Bearer <privy_token>
```

**User Identifier**: Privy DID (`did:privy:clr3j1k2f00...`)

### Future: ZO API Phone Auth (v2.0)

See `ARCHITECTURE.md` for migration plan.

---

## User Management

### Get User Progress

```http
GET /api/users/{id}/progress
```

**Description**: Fetch user's overall progress including tokens, quests completed, and level.

**Path Parameters**:
- `id` (string, required) - User's Privy DID

**Response**:
```json
{
  "user_id": "did:privy:xxx",
  "zo_points": 1500,
  "quests_completed": 23,
  "level": 5,
  "home_city": "San Francisco",
  "created_at": "2025-01-15T10:30:00Z"
}
```

---

### Get User Streaks

```http
GET /api/users/{id}/streaks
```

**Description**: Get user's streak data (login, quest, event, checkin).

**Path Parameters**:
- `id` (string, required) - User's Privy DID

**Response**:
```json
{
  "streaks": [
    {
      "streak_type": "login",
      "current_streak": 7,
      "longest_streak": 15,
      "last_activity_at": "2025-11-13T08:00:00Z"
    },
    {
      "streak_type": "quest",
      "current_streak": 3,
      "longest_streak": 10,
      "last_activity_at": "2025-11-12T14:00:00Z"
    }
  ]
}
```

---

### Get User Reputations

```http
GET /api/users/{id}/reputations
```

**Description**: Get user's reputation scores (Builder, Connector, Explorer, Pioneer).

**Path Parameters**:
- `id` (string, required) - User's Privy DID

**Response**:
```json
{
  "reputations": [
    {
      "reputation_type": "builder",
      "score": 450,
      "level": 3,
      "updated_at": "2025-11-10T12:00:00Z"
    },
    {
      "reputation_type": "explorer",
      "score": 680,
      "level": 4,
      "updated_at": "2025-11-12T16:00:00Z"
    }
  ]
}
```

---

### Get User Inventory

```http
GET /api/users/{id}/inventory
```

**Description**: Get user's inventory items (badges, NFTs, collectibles).

**Path Parameters**:
- `id` (string, required) - User's Privy DID

**Response**:
```json
{
  "inventory": [
    {
      "item_type": "badge",
      "item_id": "early_adopter",
      "quantity": 1,
      "metadata": {
        "name": "Early Adopter",
        "description": "Joined during beta",
        "image": "https://cdn.zo.xyz/badges/early-adopter.png"
      },
      "acquired_at": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

## Quest System

### Complete Quest

```http
POST /api/quests/complete
```

**Description**: Record a quest completion with score and location data.

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
  "error": "Quest is on cooldown",
  "next_available_at": "2025-11-14T10:30:00Z"
}
```

**Status Codes**:
- `200` - Success
- `400` - Missing required fields
- `404` - Quest or user not found
- `429` - Quest on cooldown
- `500` - Server error

**Quest Cooldown Logic**:
- If `cooldown_hours > 0`, checks last completion time
- Returns `next_available_at` timestamp if on cooldown
- Cooldown is per-user, per-quest

---

## Leaderboard

### Get Global Leaderboard

```http
GET /api/leaderboard
```

**Description**: Fetch top users ranked by `zo_points`.

**Query Parameters**:
- `limit` (number, optional) - Number of results (default: 50, max: 100)
- `offset` (number, optional) - Pagination offset (default: 0)

**Response**:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "did:privy:xxx",
      "nickname": "CryptoKnight",
      "zo_points": 15000,
      "pfp": "https://cdn.zo.xyz/avatars/xxx.png",
      "home_city": "New York"
    },
    {
      "rank": 2,
      "user_id": "did:privy:yyy",
      "nickname": "DeFiQueen",
      "zo_points": 12500,
      "pfp": "https://cdn.zo.xyz/avatars/yyy.png",
      "home_city": "San Francisco"
    }
  ],
  "total_users": 1523
}
```

**Notes**:
- Leaderboard updates automatically via database triggers
- Rankings are based on `zo_points` (total tokens earned)
- Ties are broken by `created_at` (earlier users rank higher)

---

## Cities & Locations

### Get All Cities

```http
GET /api/cities
```

**Description**: List all cities with population and activity stats.

**Response**:
```json
{
  "cities": [
    {
      "id": "uuid-xxx",
      "name": "San Francisco",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "population": 245,
      "total_zo_earned": 125000,
      "is_active": true,
      "metadata": {
        "tier": "Metropolis",
        "region": "North America"
      }
    }
  ]
}
```

---

### Sync User's Home City

```http
POST /api/sync-home-city
```

**Description**: Update a user's home city.

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
  "home_city": "San Francisco"
}
```

---

### Sync City Data

```http
POST /api/cities/sync
```

**Description**: Bulk update city stats (admin endpoint).

**Request Body**:
```json
{
  "cities": [
    {
      "name": "San Francisco",
      "population": 250,
      "total_zo_earned": 130000
    }
  ]
}
```

---

## Avatar & Profile

### Generate Avatar (ZO API Proxy)

```http
POST /api/avatar/generate
```

**Description**: Trigger avatar generation via ZO API.

**Request Body**:
```json
{
  "user_id": "did:privy:xxx",
  "body_type": "bro"
}
```

**Body Type Options**:
- `"bro"` - Male body shape
- `"bae"` - Female body shape

**Response**:
```json
{
  "success": true,
  "message": "Avatar generation started. Poll /api/avatar/status for updates."
}
```

**Polling Strategy**:
- Client should poll `/api/avatar/status` every 1 second
- Max 10 attempts (10 seconds total)
- Avatar typically ready in 2-5 seconds

---

### Check Avatar Status

```http
GET /api/avatar/status?user_id={user_id}
```

**Description**: Poll for avatar generation completion.

**Query Parameters**:
- `user_id` (string, required) - User's Privy DID

**Response** (Generating):
```json
{
  "status": "generating",
  "avatar_url": null,
  "message": "Avatar is being generated..."
}
```

**Response** (Ready):
```json
{
  "status": "ready",
  "avatar_url": "https://proxy.cdn.zo.xyz/gallery/media/images/xxx_1699999999.png",
  "metadata": {
    "ref_id": 12345,
    "body_type": "bro"
  }
}
```

**Response** (Error):
```json
{
  "status": "error",
  "error": "Avatar generation failed"
}
```

---

### Upload Profile Photo

```http
POST /api/upload-profile-photo
```

**Description**: Upload custom profile photo (alternative to generated avatar).

**Request**: Multipart form data
- `file` (File) - Image file (PNG, JPG, WEBP)
- `user_id` (string) - User's Privy DID

**Response**:
```json
{
  "success": true,
  "photo_url": "https://cdn.supabase.co/storage/v1/object/public/profile-photos/xxx.jpg"
}
```

---

## NFT & Web3

### Check NFT Ownership

```http
POST /api/check-nft
```

**Description**: Verify if a wallet owns specific NFT contracts (Founder Pass verification).

**Request Body**:
```json
{
  "walletAddress": "0x1234567890abcdef...",
  "chainId": 8453,
  "contractAddresses": [
    "0xFounderPassContract...",
    "0xAnotherNFTContract..."
  ]
}
```

**Response**:
```json
{
  "hasNFT": true,
  "ownedContracts": [
    "0xFounderPassContract..."
  ],
  "metadata": {
    "token_ids": ["123", "456"],
    "total_owned": 2
  }
}
```

---

### Send Token Reward

```http
POST /api/send-token-reward
```

**Description**: Send ERC-20 tokens as quest rewards (backend wallet).

**Request Body**:
```json
{
  "recipientAddress": "0x1234567890abcdef...",
  "amount": 100,
  "questId": "game-1111-quest"
}
```

**Response**:
```json
{
  "success": true,
  "txHash": "0xabcdef123456...",
  "amount": 100,
  "symbol": "ZOHM"
}
```

---

### Send AVAX Reward

```http
POST /api/send-avax-reward
```

**Description**: Send native AVAX as reward (legacy, replaced by token rewards).

**Request Body**:
```json
{
  "recipientAddress": "0x1234567890abcdef...",
  "amount": "0.1"
}
```

---

## Calendar Events

### Get Calendar Events

```http
GET /api/calendar
```

**Description**: Fetch upcoming events from all iCal sources.

**Response**:
```json
{
  "events": [
    {
      "id": "event-xxx",
      "title": "Community Meetup",
      "start": "2025-11-20T18:00:00Z",
      "end": "2025-11-20T20:00:00Z",
      "location": "Zo House SF",
      "description": "Monthly community gathering",
      "calendar_source": "zo-house-events"
    }
  ]
}
```

---

### Add Calendar Source

```http
POST /api/add-calendar
```

**Description**: Add a new iCal feed source (admin).

**Request Body**:
```json
{
  "name": "Zo House Events",
  "ical_url": "https://calendar.google.com/calendar/ical/xxx/public/basic.ics",
  "color": "#00FF00"
}
```

---

### Get Canonical Events (NEW)

```http
GET /api/events/canonical
```

**Description**: Fetch deduplicated, geocoded events from canonical event store. Supports filtering by location and date range.

**Query Parameters**:
- `lat` (number, optional) - Latitude for location-based filtering
- `lng` (number, optional) - Longitude for location-based filtering  
- `radius` (number, optional) - Radius in kilometers (requires lat/lng)
- `from` (ISO timestamp, optional) - Start date filter (default: now)
- `to` (ISO timestamp, optional) - End date filter
- `limit` (number, optional) - Max results (default: 100)

**Response**:
```json
{
  "events": [
    {
      "Event Name": "Founders Dinner",
      "Date & Time": "2025-11-15T19:00:00.000Z",
      "Location": "Zo House, 300 4th St, San Francisco, CA",
      "Latitude": "37.7817",
      "Longitude": "-122.4012",
      "Event URL": "https://luma.com/event/evt-xxx",
      "_canonical": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "uid": "1d736245c0cd",
        "tz": "America/Los_Angeles",
        "geocode_status": "success",
        "version": 1
      }
    }
  ],
  "meta": {
    "total": 46,
    "filtered_by_location": true,
    "location_filter": {
      "lat": 37.7749,
      "lng": -122.4194,
      "radius": 100
    },
    "date_range": {
      "from": "2025-11-14T00:00:00Z",
      "to": "unlimited"
    },
    "limit": 100,
    "source": "canonical_events"
  }
}
```

**Feature Flags**:
- Requires `FEATURE_CANONICAL_EVENTS_READ=true`
- Returns 503 if feature is disabled

**Example Requests**:
```bash
# Get all upcoming events
curl http://localhost:3000/api/events/canonical

# Get events near San Francisco within 50km
curl "http://localhost:3000/api/events/canonical?lat=37.7749&lng=-122.4194&radius=50"

# Get events for specific date range
curl "http://localhost:3000/api/events/canonical?from=2025-11-20T00:00:00Z&to=2025-11-30T23:59:59Z"
```

---

### Trigger Event Sync Worker (NEW)

```http
POST /api/worker/sync-events
```

**Description**: Manually trigger the canonical events sync worker. Fetches events from all calendar sources, deduplicates, geocodes, and upserts to database.

**Query Parameters**:
- `apply` (boolean, optional) - Enable writes (default: dry-run)
- `calendar` (string, optional) - Process single calendar only (e.g., `cal-123`)
- `verbose` (boolean, optional) - Enable detailed logging

**Response**:
```json
{
  "success": true,
  "stats": {
    "processed": 46,
    "inserted": 12,
    "updated": 5,
    "skipped": 29,
    "errors": 0,
    "dryRunOnly": false,
    "duration_ms": 8234
  },
  "duration_ms": 8234,
  "config": {
    "dry_run": false,
    "calendar_filter": "all",
    "feature_flags": {
      "read": false,
      "write": true,
      "dryRun": false,
      "fullyEnabled": false,
      "workerWriting": true
    }
  },
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

**Feature Flags**:
- Respects `CANONICAL_DRY_RUN` environment variable
- Respects `FEATURE_CANONICAL_EVENTS_WRITE` environment variable

**Example Requests**:
```bash
# Dry-run mode (safe, no DB writes)
curl -X POST http://localhost:3000/api/worker/sync-events

# Apply mode (actual writes)
curl -X POST "http://localhost:3000/api/worker/sync-events?apply=true"

# Process single calendar with verbose logging
curl -X POST "http://localhost:3000/api/worker/sync-events?calendar=cal-ZVonmjVxLk7F2oM&verbose=true"
```

**Security Note**: This endpoint should be protected with authentication in production.

---

### Check Worker Status (NEW)

```http
GET /api/worker/sync-events
```

**Description**: Check the status of the event sync worker and current feature flag configuration.

**Response**:
```json
{
  "status": "ready",
  "worker": "canonical-events-sync",
  "feature_flags": {
    "read": false,
    "write": false,
    "dryRun": true,
    "fullyEnabled": false,
    "workerWriting": false
  },
  "usage": {
    "trigger_sync": "POST /api/worker/sync-events",
    "dry_run": "POST /api/worker/sync-events (default)",
    "apply_mode": "POST /api/worker/sync-events?apply=true",
    "single_calendar": "POST /api/worker/sync-events?calendar=cal-123",
    "verbose_logs": "POST /api/worker/sync-events?verbose=true"
  },
  "timestamp": "2025-11-14T10:30:00.000Z"
}
```

---

## AR Features

### AR Scan Verification

```http
POST /api/ar/scan
```

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
  "reward": {
    "zo_tokens": 50,
    "badge": "location_pioneer"
  }
}
```

---

## Database Setup

### Initialize Database

```http
GET /api/setup-database
```

**Description**: Run initial database setup (tables, triggers, RLS policies).

**Security**: Should be protected by admin auth in production.

**Response**:
```json
{
  "success": true,
  "message": "Database initialized successfully",
  "tables_created": 10,
  "triggers_created": 3
}
```

---

## Error Handling

All endpoints follow consistent error response format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

**Common Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid auth token)
- `404` - Resource not found
- `429` - Rate limited / cooldown
- `500` - Internal server error

---

## Rate Limiting

**Current**: No rate limiting implemented (planned for v2.0)

**Planned**:
- Quest completion: 100 requests/hour per user
- Profile updates: 20 requests/minute per user
- Leaderboard: 60 requests/minute per IP

---

## Webhooks (Future)

**Status**: 🔮 Planned for v2.0

**Planned Events**:
- `quest.completed` - User completes a quest
- `user.level_up` - User reaches new level
- `city.milestone` - City reaches population/activity milestone
- `nft.detected` - New NFT detected in user's wallet

---

## SDK & Client Libraries

**JavaScript/TypeScript**:
```typescript
import { ZohmClient } from '@zohm/sdk'

const client = new ZohmClient({
  baseUrl: 'https://app.zo.xyz',
  authToken: privyToken
})

await client.quests.complete({
  questId: 'game-1111-quest',
  score: 1095
})
```

**Status**: 🚧 Coming soon

---

## Testing

**Development Base URL**: `http://localhost:3000/api/`  
**Staging Base URL**: `https://staging.zo.xyz/api/`  
**Production Base URL**: `https://app.zo.xyz/api/`

**Test User**:
```json
{
  "user_id": "did:privy:test123",
  "nickname": "TestUser",
  "home_city": "Test City"
}
```

---

## Related Documentation

- `ARCHITECTURE.md` - System architecture and tech stack
- `DATABASE_SCHEMA.md` - Complete database schema reference
- `QUESTS_SYSTEM.md` - Quest mechanics and reward calculations
- `ZO_API_DOCUMENTATION.md` - External ZO API reference
- `WALLET_AND_PHONE_TO_PROFILE_FLOW.md` - Auth migration plan


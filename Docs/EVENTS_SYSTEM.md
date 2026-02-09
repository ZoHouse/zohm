# Zo World Events System Documentation

**Version**: 1.0  
**Last Updated**: January 22, 2026  
**Status**: Active (Legacy iCal Mode)

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Flow](#data-flow)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Configuration](#configuration)
8. [Feature Flags](#feature-flags)
9. [Current Issues](#current-issues)
10. [Improvement Recommendations](#improvement-recommendations)
11. [RSVP System](#rsvp-system) ⭐ NEW
12. [Authentication System](#authentication-system) ⭐ NEW
13. [Event Admin System](#event-admin-system) ⭐ NEW
14. [Users Table Schema Reference](#users-table-schema-reference)
15. [Implementation Checklist](#implementation-checklist)

---

## Overview

The Events System displays events on the map and in list overlays. Events are sourced from **iCal/Luma calendar feeds** and can optionally be stored in a **canonical events table** for better performance and deduplication.

### Current Status
- **Primary Mode**: Legacy iCal parsing (client-side)
- **Canonical Events**: Implemented but empty (worker not running)
- **Calendars in DB**: 2 active calendars

### Key Files
| Category | Files |
|----------|-------|
| **Data Fetching** | `lib/icalParser.ts`, `lib/calendarConfig.ts`, `lib/eventWorker.ts` |
| **API Routes** | `api/calendar/route.ts`, `api/events/canonical/route.ts`, `api/events/geojson/route.ts` |
| **Components** | `EventsOverlay.tsx`, `MobileEventsListOverlay.tsx`, `MapCanvas.tsx` |
| **Hooks** | `useMapGeoJSON.ts` |
| **Config** | `lib/featureFlags.ts` |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          EVENT SOURCES                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  Luma Calendars (iCal)                                                  │
│  ├── Zo House Bangalore (cal-ZVonmjVxLk7F2oM)                          │
│  ├── Zo House San Francisco (cal-3YNnBTToy9fnnjQ)                      │
│  └── Discover Feeds (SF, Singapore)                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       INGESTION LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────┐         ┌──────────────────────┐              │
│  │  LEGACY MODE (Active)│         │ CANONICAL MODE (Off) │              │
│  │                      │         │                      │              │
│  │  /api/calendar       │         │  eventWorker.ts      │              │
│  │       │              │         │       │              │              │
│  │       ▼              │         │       ▼              │              │
│  │  iCal Proxy          │         │  Sync to DB          │              │
│  │       │              │         │       │              │              │
│  │       ▼              │         │       ▼              │              │
│  │  icalParser.ts       │         │  canonical_events    │              │
│  │  (client-side)       │         │  (Supabase)          │              │
│  └──────────────────────┘         └──────────────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          GEOCODING                                       │
├─────────────────────────────────────────────────────────────────────────┤
│  Mapbox Geocoding API                                                   │
│  ├── Location string → lat/lng                                          │
│  ├── Hardcoded coords for Zo Houses                                     │
│  └── Results cached in canonical_events table                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DISPLAY LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │   MapCanvas     │  │  EventsOverlay  │  │ MobileEvents    │         │
│  │                 │  │   (Desktop)     │  │   ListOverlay   │         │
│  │  - Markers      │  │                 │  │                 │         │
│  │  - Popups       │  │  - Search       │  │  - Search       │         │
│  │  - Fly-to       │  │  - List         │  │  - List         │         │
│  │  - Clustering   │  │  - Details      │  │  - Host button  │         │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Current Flow (Legacy iCal Mode)

```
1. User opens app
         │
         ▼
2. page.tsx: loadLiveEvents()
         │
         ▼
3. getCalendarUrls() → Fetches from `calendars` table
         │
         ▼
4. URLs converted to proxy: /api/calendar?url={encoded_url}
         │
         ▼
5. /api/calendar/route.ts → Fetches raw iCal from Luma
         │
         ▼
6. fetchAllCalendarEventsWithGeocoding()
         │
         ├── parseICS() → Extract events from iCal
         │
         └── geocodeLocation() → Get lat/lng from Mapbox
                  │
                  ▼
7. setEvents(liveEvents) → State updated
         │
         ▼
8. Components receive events via props
         │
         ├── MapCanvas → Renders markers
         ├── EventsOverlay → Renders list (desktop)
         └── MobileEventsListOverlay → Renders list (mobile)
```

### Canonical Events Flow (Not Active)

```
1. Worker triggered (manual or cron)
         │
         ▼
2. syncCanonicalEvents()
         │
         ▼
3. Fetch events from all calendars
         │
         ▼
4. For each event:
         │
         ├── Generate canonical_uid (hash of title + date + location)
         │
         ├── Check if exists in canonical_events
         │
         ├── Geocode if needed
         │
         └── Upsert to canonical_events table
                  │
                  ▼
5. UI fetches from /api/events/canonical or /api/events/geojson
```

---

## Database Schema

### `calendars` Table

Stores calendar source configurations.

```sql
CREATE TABLE calendars (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  url         TEXT NOT NULL,           -- iCal feed URL
  type        TEXT DEFAULT 'ical',     -- 'ical' | 'google' | 'manual'
  is_active   BOOLEAN DEFAULT true,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);
```

**Current Records:**
| Name | URL | Status |
|------|-----|--------|
| Zo House San Francisco | `https://api2.luma.com/ics/get?entity=calendar&id=cal-3YNnBTToy9fnnjQ` | Active |
| Zo House Bangalore | `https://api2.luma.com/ics/get?entity=calendar&id=cal-ZVonmjVxLk7F2oM` | Active |

---

### `canonical_events` Table

Deduplicated, geocoded event store (currently empty).

```sql
CREATE TABLE canonical_events (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_uid         TEXT UNIQUE NOT NULL,  -- Hash for deduplication
  title                 TEXT NOT NULL,
  description           TEXT,
  location_raw          TEXT,                  -- Original location string
  lat                   DOUBLE PRECISION,
  lng                   DOUBLE PRECISION,
  geocode_status        TEXT,                  -- 'success' | 'failed' | 'cached'
  geocode_attempted_at  TIMESTAMPTZ,
  starts_at             TIMESTAMPTZ NOT NULL,
  ends_at               TIMESTAMPTZ,
  tz                    TEXT DEFAULT 'UTC',
  source_refs           JSONB,                 -- Array of source URLs
  raw_payload           JSONB,                 -- Original iCal data
  event_version         INTEGER DEFAULT 1,     -- For updates
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_canonical_events_starts_at ON canonical_events(starts_at);
CREATE INDEX idx_canonical_events_geo ON canonical_events(lat, lng);
CREATE INDEX idx_canonical_events_uid ON canonical_events(canonical_uid);
```

**Current Status:** Empty (0 records)

---

### `canonical_event_changes` Table (Audit)

Tracks all changes to canonical events for debugging.

```sql
CREATE TABLE canonical_event_changes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_event_id  UUID REFERENCES canonical_events(id),
  change_type         TEXT NOT NULL,  -- 'insert' | 'update' | 'dry-run'
  payload             JSONB,
  created_at          TIMESTAMPTZ DEFAULT now()
);
```

---

## API Endpoints

### 1. `/api/calendar` - iCal Proxy

**Purpose:** Fetches raw iCal data from external sources (avoids CORS).

**Method:** `GET`

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `url` | Yes* | Direct URL to iCal feed (encoded) |
| `id` | Yes* | Luma calendar ID (legacy) |

*One of `url` or `id` is required.

**Response:** Raw iCal text (`text/calendar`)

**Example:**
```bash
GET /api/calendar?url=https%3A%2F%2Fapi2.luma.com%2Fics%2Fget%3Fentity%3Dcalendar%26id%3Dcal-3YNnBTToy9fnnjQ
```

---

### 2. `/api/events/canonical` - Canonical Events API

**Purpose:** Fetch events from database with filtering.

**Method:** `GET`

**Query Parameters:**
| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `lat` | No | - | User latitude (for distance filtering) |
| `lng` | No | - | User longitude |
| `radius` | No | - | Radius in km |
| `from` | No | now | Start date filter |
| `to` | No | - | End date filter |
| `limit` | No | 100 | Max results |

**Response:**
```json
{
  "events": [
    {
      "Event Name": "Zo Chill",
      "Date & Time": "2026-01-25T18:00:00Z",
      "Location": "Zo House Bangalore",
      "Latitude": "12.932658",
      "Longitude": "77.634402",
      "Event URL": "https://lu.ma/zochill",
      "_canonical": {
        "id": "uuid",
        "uid": "hash",
        "geocode_status": "success"
      }
    }
  ],
  "meta": {
    "total": 1,
    "source": "canonical_events"
  }
}
```

**Feature Flag:** Requires `FEATURE_CANONICAL_EVENTS_READ=true`

---

### 3. `/api/events/geojson` - GeoJSON API

**Purpose:** Returns events and nodes as GeoJSON for map clustering.

**Method:** `GET`

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `bbox` | Yes | Bounding box: `west,south,east,north` |
| `from` | No | Start date filter |
| `to` | No | End date filter |
| `includeNodes` | No | Include nodes in response |

**Response:**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "event-uuid",
      "geometry": {
        "type": "Point",
        "coordinates": [77.634402, 12.932658]
      },
      "properties": {
        "id": "uuid",
        "name": "Zo Chill",
        "type": "event",
        "starts_at": "2026-01-25T18:00:00Z"
      }
    }
  ]
}
```

---

### 4. `/api/worker/sync-events` - Manual Sync Trigger

**Purpose:** Manually trigger event sync worker.

**Method:** `POST`

**Body:**
```json
{
  "dryRun": true,
  "calendarId": "cal-123",
  "verbose": true
}
```

---

## Frontend Components

### `EventsOverlay.tsx` (Desktop)

**Location:** `components/EventsOverlay.tsx`

**Features:**
- Search filter by name/location
- Chronological sorting
- Click to fly to event on map
- "Host Your Event" CTA

**Props:**
```typescript
interface EventsOverlayProps {
  isVisible: boolean;
  events: EventData[];
  onEventClick?: (event: EventData) => void;
  closeMapPopups?: (() => void) | null;
  onClose?: () => void;
}
```

---

### `MobileEventsListOverlay.tsx` (Mobile)

**Location:** `components/MobileEventsListOverlay.tsx`

**Features:**
- Bottom sheet with spring animation
- Search filter
- Chronological sorting
- Auto-close on event select

**Props:**
```typescript
interface MobileEventsListOverlayProps {
  isVisible: boolean;
  onClose: () => void;
  events: EventData[];
  onEventClick?: (event: EventData) => void;
}
```

---

### `MapCanvas.tsx` - Event Markers

**Location:** `components/MapCanvas.tsx` (lines 1456-1564)

**Features:**
- Custom image markers (`/event-marker.jpg`)
- Popup with event details
- Fly-to animation
- RSVP button linking to Luma

---

### `useMapGeoJSON.ts` - GeoJSON Hook

**Location:** `hooks/useMapGeoJSON.ts`

**Features:**
- Auto-fetch on map move (debounced 300ms)
- Abort previous requests
- Bounds change detection
- Mapbox clustering integration

---

## Configuration

### Environment Variables

```bash
# Calendar & Geocoding
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx           # Required for geocoding
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # For server-side iCal fetches

# Feature Flags (Canonical Events)
FEATURE_CANONICAL_EVENTS_READ=false        # UI reads from DB
FEATURE_CANONICAL_EVENTS_WRITE=false       # Worker writes to DB
CANONICAL_DRY_RUN=true                     # Worker in test mode

# Supabase (for canonical events)
SUPABASE_SERVICE_ROLE_KEY=xxx             # Required for RLS bypass
```

---

### `calendarConfig.ts`

**Emergency Fallback URLs:**
```typescript
const EMERGENCY_FALLBACK_CALENDAR_URLS = [
  'https://api2.luma.com/ics/get?entity=discover&id=discplace-BDj7GNbGlsF7Cka', // SF Discover
  'https://api2.luma.com/ics/get?entity=discover&id=discplace-mUbtdfNjfWaLQ72', // Singapore
  'https://api2.luma.com/ics/get?entity=calendar&id=cal-ZVonmjVxLk7F2oM',       // BLR
  'https://api2.luma.com/ics/get?entity=calendar&id=cal-3YNnBTToy9fnnjQ',       // SF
];
```

---

## Feature Flags

| Flag | Default | Description |
|------|---------|-------------|
| `FEATURE_CANONICAL_EVENTS_READ` | `false` | UI fetches from database instead of iCal |
| `FEATURE_CANONICAL_EVENTS_WRITE` | `false` | Worker writes to canonical_events table |
| `CANONICAL_DRY_RUN` | `true` | Worker logs only, no writes |

### Rollout Plan (Not Started)

1. **Phase 1:** Enable `WRITE` + `DRY_RUN` → Validate worker logic
2. **Phase 2:** Disable `DRY_RUN` → Populate canonical_events
3. **Phase 3:** Enable `READ` for 10% → A/B test
4. **Phase 4:** Enable `READ` for 100% → Full migration

---

## Current Issues

### 🔴 Critical
1. **`canonical_events` table is empty** - Worker not running
2. **No cron job** - Events not automatically synced

### 🟡 Medium
3. **Geocoding on every load** - No caching in legacy mode
4. **No event deduplication** - Same event from multiple sources shows twice
5. **Hardcoded Zo House coordinates** - In `icalParser.ts` instead of database

### 🟢 Minor
6. **No event categories/tags** - Can't filter by type
7. **No event images** - All events use same marker
8. **No RSVP tracking** - Can't see who's attending

---

## Improvement Recommendations

### Immediate (This Sprint)

1. **Enable Canonical Events System**
   ```bash
   FEATURE_CANONICAL_EVENTS_WRITE=true
   CANONICAL_DRY_RUN=false
   ```
   Then run worker manually or set up cron.

2. **Add More Calendars**
   - Insert new rows in `calendars` table
   - Support community-submitted calendars

3. **Add Event Categories**
   ```sql
   ALTER TABLE canonical_events ADD COLUMN category TEXT;
   -- Values: 'social', 'workshop', 'party', 'meetup', 'conference'
   ```

### Future Enhancements

4. **Event Images**
   - Parse image from Luma description
   - Store `image_url` in canonical_events

5. **RSVP Integration**
   - Track which users RSVP'd
   - Show attendee count

6. **User-Generated Events**
   - Allow users to create events
   - Moderation workflow

7. **Push Notifications**
   - Notify users of events near them
   - Event reminders

---

## File Reference

```
apps/web/src/
├── app/
│   ├── api/
│   │   ├── calendar/route.ts           # iCal proxy
│   │   ├── events/
│   │   │   ├── canonical/route.ts      # DB events API
│   │   │   └── geojson/route.ts        # GeoJSON API
│   │   └── worker/
│   │       └── sync-events/route.ts    # Manual sync trigger
│   └── page.tsx                        # Main page (loadLiveEvents)
├── components/
│   ├── EventsOverlay.tsx               # Desktop overlay
│   ├── MobileEventsListOverlay.tsx     # Mobile overlay
│   └── MapCanvas.tsx                   # Map with markers
├── hooks/
│   └── useMapGeoJSON.ts               # GeoJSON fetching hook
└── lib/
    ├── calendarConfig.ts              # Calendar URL management
    ├── canonicalUid.ts                # UID generation
    ├── eventWorker.ts                 # Sync worker
    ├── featureFlags.ts                # Feature toggles
    ├── icalParser.ts                  # iCal parsing + geocoding
    └── supabase.ts                    # DB helpers (getActiveCalendars)
```

---

## Quick Commands

```bash
# Check calendar count
curl "https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/calendars?select=*" \
  -H "apikey: YOUR_ANON_KEY"

# Manually sync events (dry run)
curl -X POST http://localhost:3000/api/worker/sync-events \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "verbose": true}'

# Check canonical_events count
curl "https://elvaqxadfewcsohrswsi.supabase.co/rest/v1/canonical_events?select=count" \
  -H "apikey: YOUR_ANON_KEY"
```

---

## RSVP System

### Overview

The RSVP system allows authenticated users to register their attendance for events. This integrates with the ZO authentication system and stores attendance data in Supabase.

### Proposed Database Schema

#### `event_rsvps` Table

```sql
CREATE TABLE event_rsvps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id            UUID NOT NULL,                    -- References canonical_events OR external event ID
  event_source        TEXT NOT NULL DEFAULT 'canonical', -- 'canonical' | 'luma' | 'external'
  external_event_id   TEXT,                             -- Luma event ID if external
  user_id             UUID NOT NULL REFERENCES users(id),
  status              TEXT NOT NULL DEFAULT 'going',    -- 'going' | 'interested' | 'not_going' | 'waitlist'
  rsvp_type           TEXT DEFAULT 'standard',         -- 'standard' | 'vip' | 'speaker' | 'organizer'
  checked_in          BOOLEAN DEFAULT false,
  checked_in_at       TIMESTAMPTZ,
  checked_in_by       UUID REFERENCES users(id),        -- Admin who checked them in
  notes               TEXT,                             -- Admin notes
  metadata            JSONB DEFAULT '{}',               -- Additional data (ticket type, etc.)
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_user_event UNIQUE (event_id, user_id, event_source)
);

-- Indexes
CREATE INDEX idx_event_rsvps_event ON event_rsvps(event_id, event_source);
CREATE INDEX idx_event_rsvps_user ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_status ON event_rsvps(status);
CREATE INDEX idx_event_rsvps_checked_in ON event_rsvps(checked_in) WHERE checked_in = true;
```

#### `event_organizers` Table (Admin Access)

```sql
CREATE TABLE event_organizers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL,                          -- References canonical_events OR external
  event_source TEXT NOT NULL DEFAULT 'canonical',
  user_id     UUID NOT NULL REFERENCES users(id),
  role        TEXT NOT NULL DEFAULT 'organizer',      -- 'owner' | 'organizer' | 'volunteer' | 'check_in_only'
  permissions JSONB DEFAULT '{}',                     -- Granular permissions
  created_at  TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_organizer_event UNIQUE (event_id, user_id, event_source)
);
```

### RSVP States

| Status | Description | UI Indicator |
|--------|-------------|--------------|
| `going` | Confirmed attendance | ✅ Green badge |
| `interested` | Maybe attending | 🤔 Yellow badge |
| `not_going` | Declined | ❌ Gray badge |
| `waitlist` | Event full, on waitlist | ⏳ Orange badge |

### RSVP API Endpoints (Proposed)

#### 1. `POST /api/events/{eventId}/rsvp` - Create/Update RSVP

**Auth Required:** Yes (ZO Bearer Token)

**Body:**
```json
{
  "status": "going",
  "eventSource": "canonical"
}
```

**Response:**
```json
{
  "success": true,
  "rsvp": {
    "id": "uuid",
    "status": "going",
    "created_at": "2026-01-22T10:00:00Z"
  }
}
```

#### 2. `GET /api/events/{eventId}/rsvps` - Get Event Attendees

**Auth Required:** Yes (organizer or admin)

**Query Params:**
| Param | Description |
|-------|-------------|
| `status` | Filter by status |
| `checkedIn` | Filter by check-in status |
| `limit` | Pagination limit |
| `offset` | Pagination offset |

**Response:**
```json
{
  "rsvps": [
    {
      "id": "uuid",
      "user": {
        "id": "user-uuid",
        "name": "John Doe",
        "pfp": "https://...",
        "phone": "+91...",
        "zo_pid": "ZO123"
      },
      "status": "going",
      "checked_in": false,
      "created_at": "2026-01-22T10:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "going": 40,
    "interested": 5,
    "checked_in": 12
  }
}
```

#### 3. `POST /api/events/{eventId}/rsvps/{rsvpId}/check-in` - Check In User

**Auth Required:** Yes (organizer or admin)

**Response:**
```json
{
  "success": true,
  "checked_in_at": "2026-01-22T18:30:00Z"
}
```

#### 4. `GET /api/users/me/rsvps` - Get User's RSVPs

**Auth Required:** Yes

**Response:**
```json
{
  "rsvps": [
    {
      "id": "uuid",
      "event": {
        "id": "event-uuid",
        "title": "Zo Chill Friday",
        "starts_at": "2026-01-25T18:00:00Z",
        "location": "Zo House Bangalore"
      },
      "status": "going",
      "checked_in": false
    }
  ]
}
```

---

## Authentication System

### Overview

Zo World uses **ZO API** as the primary authentication provider. Users authenticate via phone number + OTP, and the system maintains session tokens in both localStorage (client) and Supabase (server).

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER LOGIN FLOW                                 │
└─────────────────────────────────────────────────────────────────────────┘

1. User enters phone number
         │
         ▼
2. POST /api/zo/auth/send-otp
         │
         ├── Calls ZOHM Proxy: POST /auth/otp/send-otp
         │
         └── Response: { success: true, message: "OTP sent" }
                  │
                  ▼
3. User enters 6-digit OTP
         │
         ▼
4. POST /api/zo/auth/verify-otp
         │
         ├── Calls ZOHM Proxy: POST /auth/otp/verify-otp
         │
         ├── Response includes:
         │   ├── access_token (JWT)
         │   ├── refresh_token
         │   ├── device_id + device_secret
         │   └── user profile
         │
         ├── Creates/updates user in Supabase
         │
         └── Syncs full profile from ZO API
                  │
                  ▼
5. Client stores tokens in localStorage:
   ├── zo_user_id
   ├── zo_access_token
   ├── zo_device_id
   └── zo_device_secret
                  │
                  ▼
6. Subsequent API calls include:
   ├── Authorization: Bearer {access_token}
   ├── client-key: {platform_key}
   ├── client-device-id: {device_id}
   └── client-device-secret: {device_secret}
```

### Session Storage

#### Client-Side (localStorage)

| Key | Description |
|-----|-------------|
| `zo_user_id` | ZO API user ID (primary identifier) |
| `zo_access_token` | JWT access token for API calls |
| `zo_token` | Same as access_token (legacy compat) |
| `zo_device_id` | Device ID (required for all ZO API calls) |
| `zo_device_secret` | Device secret (required for all ZO API calls) |
| `zo_nickname` | User's nickname (fallback for display) |

#### Server-Side (Supabase `users` table)

```typescript
interface UserAuthFields {
  // ZO Identity
  zo_user_id: string;        // ZO API user.id
  zo_pid: string;            // ZO Passport ID (e.g., "ZO-12345")
  
  // Access Tokens
  zo_token: string;          // JWT access token
  zo_token_expiry: string;   // Access token expiry
  zo_refresh_token: string;  // Refresh token
  zo_refresh_token_expiry: string;
  
  // Device Credentials (required for all API calls)
  zo_device_id: string;
  zo_device_secret: string;
  
  // Legacy Fields
  zo_legacy_token: string;
  zo_legacy_token_valid_till: string;
  zo_client_key: string;
  zo_device_info: object;    // Device metadata from ZO API
  
  // Roles & Membership
  zo_roles: string[];        // e.g., ["property-manager", "housekeeping-admin"]
  zo_membership: string;     // 'founder' | 'citizen' | 'none'
}
```

### Authentication Hooks

#### `useZoAuth()` Hook

Primary hook for authentication state and profile management.

```typescript
const {
  // User data
  userProfile,           // Full user profile from Supabase
  userId,                // User ID
  
  // Auth state
  isAuthenticated,       // Boolean: user is logged in
  isLoading,             // Boolean: profile is loading
  hasCompletedOnboarding,
  isFounder,             // Has founder NFTs
  
  // Actions
  logout,                // Clear session and logout
  reloadProfile,         // Refresh profile from DB
  syncZoProfile,         // Sync from ZO API
} = useZoAuth();
```

#### `usePhoneAuth()` Hook (for login flow)

```typescript
const {
  sendOtp,              // (countryCode, phone) => Promise
  verifyOtp,            // (countryCode, phone, otp) => Promise
  isLoading,
  error,
} = usePhoneAuth();
```

### Session Expiry Handling

When a ZO API call returns `403 "Session expired"`:

1. `zoApiClient` interceptor catches the error
2. Dispatches `zoSessionExpired` custom event
3. `useZoAuth` hook listens and triggers logout
4. User is prompted to re-login

```typescript
// In zoApiClient.ts
if (status === 403 && errorDetail === 'Session expired.') {
  window.dispatchEvent(new CustomEvent('zoSessionExpired', {
    detail: { message: 'Your session has expired. Please login again.' }
  }));
  localStorage.removeItem('zo_access_token');
}
```

### Required Headers for ZO API Calls

All ZO API calls (via ZOHM proxy) require these headers:

| Header | Source | Description |
|--------|--------|-------------|
| `Authorization` | `Bearer {zo_access_token}` | JWT token |
| `client-key` | `ZO_CLIENT_KEY_WEB` env var | Platform API key |
| `client-device-id` | `zo_device_id` localStorage | Device identifier |
| `client-device-secret` | `zo_device_secret` localStorage | Device secret |

### API Proxy Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Client (Browser)│────▶│ /api/zo/*        │────▶│ ZOHM Proxy      │
│                 │     │ (Next.js API)    │     │ (Railway)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
                                               ┌─────────────────┐
                                               │  ZO API         │
                                               │  (zo.xyz)       │
                                               └─────────────────┘
```

**ZOHM Proxy URL:** `https://zohm-api.up.railway.app`

---

## Event Admin System

### Overview

The Event Admin system allows organizers to manage events, view RSVPs, and check in attendees. Access is controlled via the `event_organizers` table.

### Admin Roles & Permissions

| Role | Can View Attendees | Can Check In | Can Edit Event | Can Manage Organizers |
|------|-------------------|--------------|----------------|----------------------|
| `owner` | ✅ | ✅ | ✅ | ✅ |
| `organizer` | ✅ | ✅ | ✅ | ❌ |
| `volunteer` | ✅ | ✅ | ❌ | ❌ |
| `check_in_only` | ✅ (limited) | ✅ | ❌ | ❌ |

### Admin API Endpoints (Proposed)

#### 1. `GET /api/admin/events` - List Organizer's Events

**Auth Required:** Yes (must have organizer role for at least one event)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Zo Chill Friday",
      "starts_at": "2026-01-25T18:00:00Z",
      "my_role": "owner",
      "stats": {
        "total_rsvps": 45,
        "going": 40,
        "checked_in": 12
      }
    }
  ]
}
```

#### 2. `GET /api/admin/events/{eventId}` - Event Dashboard

**Auth Required:** Yes (organizer)

**Response:**
```json
{
  "event": {
    "id": "uuid",
    "title": "Zo Chill Friday",
    "description": "Weekly community hangout",
    "starts_at": "2026-01-25T18:00:00Z",
    "ends_at": "2026-01-25T22:00:00Z",
    "location": "Zo House Bangalore",
    "lat": 12.932658,
    "lng": 77.634402
  },
  "stats": {
    "total_rsvps": 45,
    "going": 40,
    "interested": 5,
    "checked_in": 12,
    "check_in_rate": "30%"
  },
  "organizers": [
    { "user_id": "uuid", "name": "Samurai", "role": "owner" }
  ]
}
```

#### 3. `POST /api/admin/events/{eventId}/organizers` - Add Organizer

**Auth Required:** Yes (owner only)

**Body:**
```json
{
  "user_id": "uuid",
  "role": "volunteer"
}
```

#### 4. `GET /api/admin/events/{eventId}/export` - Export Attendees

**Auth Required:** Yes (organizer)

**Query Params:**
- `format`: `csv` | `json`
- `include`: `all` | `going` | `checked_in`

**Response (CSV):**
```csv
name,phone,email,status,checked_in,checked_in_at
John Doe,+919876543210,john@email.com,going,true,2026-01-25T18:30:00Z
Jane Smith,+919876543211,jane@email.com,going,false,
```

### Admin UI Components (Proposed)

```
apps/web/src/
├── app/
│   └── admin/
│       └── events/
│           ├── page.tsx                  # Events list
│           └── [eventId]/
│               ├── page.tsx              # Event dashboard
│               ├── attendees/page.tsx    # Attendee list
│               └── check-in/page.tsx     # Check-in interface
├── components/
│   └── admin/
│       ├── EventDashboard.tsx
│       ├── AttendeeList.tsx
│       ├── CheckInScanner.tsx            # QR code scanner
│       ├── AttendeeSearch.tsx
│       └── ExportButton.tsx
```

### Check-In Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CHECK-IN FLOW                                   │
└─────────────────────────────────────────────────────────────────────────┘

Option A: QR Code Scan
─────────────────────
1. Admin opens check-in page
2. Scans user's ZO Passport QR (contains zo_pid)
3. System looks up RSVP by zo_pid + event_id
4. Marks as checked in

Option B: Manual Search
─────────────────────
1. Admin opens attendee list
2. Searches by name or phone
3. Clicks "Check In" button
4. System marks as checked in

Option C: Self Check-In (Kiosk Mode)
─────────────────────
1. Kiosk displays event check-in page
2. User scans their QR or enters phone
3. OTP verification (optional)
4. Auto check-in
```

### Signal Integration

All RSVP and check-in actions emit signals for the Reality Engine:

| Action | Signal Type | Payload |
|--------|-------------|---------|
| User RSVPs | `event_rsvp_created` | `{ userId, eventId, status }` |
| User checks in | `event_check_in` | `{ userId, eventId, nodeId }` |
| Attendance confirmed | `event_attended` | `{ userId, eventId, duration }` |

### RLS Policies (Proposed)

```sql
-- Users can read their own RSVPs
CREATE POLICY "Users can view own RSVPs"
  ON event_rsvps FOR SELECT
  USING (user_id = auth.uid());

-- Users can create/update their own RSVPs
CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR ALL
  USING (user_id = auth.uid());

-- Organizers can view all RSVPs for their events
CREATE POLICY "Organizers can view event RSVPs"
  ON event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.event_id = event_rsvps.event_id
        AND event_organizers.user_id = auth.uid()
    )
  );

-- Organizers can update RSVPs (check-in)
CREATE POLICY "Organizers can check in attendees"
  ON event_rsvps FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM event_organizers
      WHERE event_organizers.event_id = event_rsvps.event_id
        AND event_organizers.user_id = auth.uid()
    )
  );
```

---

## Users Table Schema Reference

The `users` table stores all user data including authentication fields.

### Core Identity Fields

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (same as `zo_user_id` for ZO users) |
| `name` | TEXT | Display name (from nickname fields) |
| `bio` | TEXT | User bio/description |
| `pfp` | TEXT | Profile picture URL |
| `phone` | TEXT | Phone number |
| `email` | TEXT | Email address |

### ZO Identity Fields

| Column | Type | Description |
|--------|------|-------------|
| `zo_user_id` | TEXT | ZO API user.id |
| `zo_pid` | TEXT | ZO Passport ID (e.g., "ZO-12345") |
| `zo_membership` | TEXT | 'founder' \| 'citizen' \| 'none' |
| `zo_roles` | TEXT[] | Array of roles from ZO API |

### ZO Auth Token Fields

| Column | Type | Description |
|--------|------|-------------|
| `zo_token` | TEXT | JWT access token |
| `zo_token_expiry` | TIMESTAMPTZ | Access token expiry |
| `zo_refresh_token` | TEXT | Refresh token |
| `zo_refresh_token_expiry` | TIMESTAMPTZ | Refresh token expiry |
| `zo_device_id` | TEXT | Device ID for API calls |
| `zo_device_secret` | TEXT | Device secret for API calls |
| `zo_legacy_token` | TEXT | Legacy token format |
| `zo_client_key` | TEXT | Client key used |
| `zo_device_info` | JSONB | Device metadata |

### Location Fields

| Column | Type | Description |
|--------|------|-------------|
| `lat` | DOUBLE | Current latitude (dynamic) |
| `lng` | DOUBLE | Current longitude (dynamic) |
| `zo_home_location` | JSONB | Home base: `{ lat, lng }` |
| `city` | TEXT | City name |

### Profile Sync Fields

| Column | Type | Description |
|--------|------|-------------|
| `zo_synced_at` | TIMESTAMPTZ | Last ZO API sync time |
| `zo_sync_status` | TEXT | 'never' \| 'synced' \| 'stale' \| 'error' |
| `onboarding_completed` | BOOLEAN | Has completed onboarding |
| `onboarding_step` | INTEGER | Current onboarding step |

---

## Implementation Checklist

### Phase 1: Database Setup
- [ ] Create `event_rsvps` table
- [ ] Create `event_organizers` table
- [ ] Add RLS policies
- [ ] Add indexes

### Phase 2: API Endpoints
- [ ] `POST /api/events/{id}/rsvp` - User RSVP
- [ ] `GET /api/events/{id}/rsvps` - Admin list attendees
- [ ] `POST /api/events/{id}/rsvps/{id}/check-in` - Check in
- [ ] `GET /api/users/me/rsvps` - User's events
- [ ] `GET /api/admin/events` - Organizer's events
- [ ] `GET /api/admin/events/{id}/export` - Export CSV

### Phase 3: Admin UI
- [ ] Events list page
- [ ] Event dashboard with stats
- [ ] Attendee list with search
- [ ] Check-in interface
- [ ] Export functionality

### Phase 4: User-Facing UI
- [ ] RSVP button on event cards
- [ ] "My Events" section in profile
- [ ] Event reminder notifications

### Phase 5: Advanced Features
- [ ] QR code check-in scanner
- [ ] Kiosk mode for self check-in
- [ ] Waitlist management
- [ ] Capacity limits

---

*Document maintained by Platform Team. Last audit: January 2026.*

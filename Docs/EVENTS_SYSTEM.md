# Zo World Events System — Technical Documentation

**Version**: 2.0
**Last Updated**: February 9, 2026
**Status**: Active (Dual-mode: Community Events + Legacy iCal)
**Code-verified**: All types, routes, and components audited against source

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Type System](#type-system)
5. [API Endpoints](#api-endpoints)
6. [Event Creation Flow](#event-creation-flow)
7. [Vibe Check — Pending Event Governance](#vibe-check--pending-event-governance)
8. [RSVP System](#rsvp-system)
9. [Cover Images & Culture Stickers](#cover-images--culture-stickers)
10. [iCal Ingestion Pipeline](#ical-ingestion-pipeline)
11. [Canonical Events Worker](#canonical-events-worker)
12. [Feature Flags](#feature-flags)
13. [GeoJSON & Map Integration](#geojson--map-integration)
14. [Frontend Components](#frontend-components)
15. [Authentication & Authorization](#authentication--authorization)
16. [File Reference](#file-reference)

---

## Overview

The Events System powers community-driven events across the Zo World network. It operates in **dual mode**:

| Mode | Status | Source | Description |
|------|--------|--------|-------------|
| **Community Events** | Active | `canonical_events` table | User-created events with RSVP, cultures, cover images |
| **Legacy iCal** | Active | Luma iCal feeds | External events ingested via iCal proxy |
| **Canonical Worker** | Standby | Feature-flagged | Syncs iCal events to database (not yet enabled) |

### Key Numbers (from source code)

- **19 event cultures** (17 named + `follow_your_heart` + `default`)
- **3 event categories**: `community`, `sponsored`, `ticketed`
- **3 location types**: `zo_property`, `custom`, `online`
- **8 RSVP statuses**: `pending`, `going`, `interested`, `not_going`, `waitlist`, `cancelled`, `approved`, `rejected`
- **5 host types**: `citizen`, `founder_member`, `admin`, `sponsor`, `vibe_curator`
- **11 API routes** handling events
- **5-step** event creation modal

---

## Architecture

```
                     ┌──────────────────────────────────────────┐
                     │           EVENT SOURCES                   │
                     ├──────────────────────────────────────────┤
                     │                                          │
                     │  ┌─────────────┐    ┌─────────────────┐ │
                     │  │  Community   │    │  Luma iCal      │ │
                     │  │  Users       │    │  Calendar Feeds │ │
                     │  │  (5-step     │    │  (BLR, SF,      │ │
                     │  │   modal)     │    │   Discover)     │ │
                     │  └──────┬──────┘    └───────┬─────────┘ │
                     └─────────┼───────────────────┼───────────┘
                               │                   │
                               ▼                   ▼
              ┌────────────────────────┐  ┌─────────────────────────┐
              │   POST /api/events     │  │   /api/calendar         │
              │   (Create + validate   │  │   (iCal proxy, CORS     │
              │    + auto-RSVP host)   │  │    bypass)              │
              └────────┬───────────────┘  └────────┬────────────────┘
                       │                           │
                       ▼                           ▼
              ┌────────────────────────┐  ┌─────────────────────────┐
              │   canonical_events     │  │   icalParser.ts         │
              │   (Supabase table)     │  │   (Client-side parse    │
              │                        │  │    + Mapbox geocode)    │
              └────────┬───────────────┘  └────────┬────────────────┘
                       │                           │
                       ▼                           ▼
              ┌────────────────────────────────────────────────────┐
              │                  DISPLAY LAYER                      │
              ├────────────────────────────────────────────────────┤
              │                                                    │
              │  /api/events/geojson ──► MapCanvas (markers)       │
              │  /api/events          ──► EventsOverlay (desktop)  │
              │  /api/events/mine     ──► MyEventsCard (dashboard) │
              │  /api/events/[id]/rsvp──► RSVP management          │
              │                                                    │
              └────────────────────────────────────────────────────┘
```

### Dual Data Path

The system currently serves events through two independent paths:

1. **Community Events Path** (database-backed):
   - User creates event via `HostEventModal` (5-step form)
   - `POST /api/events` validates, determines host type, inserts to `canonical_events`
   - Host auto-RSVP'd as "going" with `rsvp_type: 'host'`
   - Events appear in map via `/api/events/geojson` and lists via `/api/events`
   - RSVPs managed via `/api/events/[id]/rsvp`

2. **Legacy iCal Path** (client-side parsing):
   - `page.tsx` calls `loadLiveEvents()` on mount
   - `calendarConfig.ts` fetches active calendar URLs from `calendars` table
   - URLs proxied through `/api/calendar` (CORS bypass)
   - `icalParser.ts` parses iCal data client-side
   - `geocodeLocation()` adds lat/lng via Mapbox API
   - Hardcoded Zo House coordinates as fallback (BLR, SF, Whitefield)

---

## Database Schema

### 7 Tables

#### 1. `canonical_events` — Primary event store

All events (community-created and synced) live here.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `canonical_uid` | TEXT UNIQUE | Deduplication key. Community: `community-{userId}-{timestamp}`. iCal: hash of title+date+location |
| `title` | TEXT NOT NULL | Event name (min 5 chars enforced by API) |
| `description` | TEXT | Event description |
| `category` | TEXT | `community` \| `sponsored` \| `ticketed` |
| `culture` | TEXT | One of 19 `EventCulture` slugs |
| `source_type` | TEXT | `community` \| `ical` \| `luma` \| `activity_manager` \| `admin` |
| `starts_at` | TIMESTAMPTZ NOT NULL | Event start time |
| `ends_at` | TIMESTAMPTZ | Event end time |
| `tz` | TEXT | Timezone (default: `Asia/Kolkata` for community, `UTC` for iCal) |
| `location_type` | TEXT | `zo_property` \| `custom` \| `online` |
| `location_name` | TEXT | Venue name |
| `location_raw` | TEXT | Raw address string |
| `location_address` | TEXT | Formatted address |
| `lat` | DOUBLE PRECISION | Latitude |
| `lng` | DOUBLE PRECISION | Longitude |
| `zo_property_id` | UUID FK | References `nodes.id` if at a Zo property |
| `meeting_point` | TEXT | Specific meeting instructions |
| `max_capacity` | INTEGER | Max attendees (null = unlimited) |
| `current_rsvp_count` | INTEGER | Denormalized count of "going" RSVPs |
| `host_id` | UUID FK | References `users.id` |
| `host_type` | TEXT | `citizen` \| `founder_member` \| `admin` \| `sponsor` \| `vibe_curator` |
| `submission_status` | TEXT | `draft` \| `pending` \| `approved` \| `rejected` \| `cancelled` |
| `is_ticketed` | BOOLEAN | Whether event requires ticket purchase |
| `ticket_price` | NUMERIC | Price (if ticketed) |
| `ticket_currency` | TEXT | Currency code (default: `INR`) |
| `external_rsvp_url` | TEXT | External registration link |
| `luma_event_id` | TEXT | Luma event ID (for synced events) |
| `cover_image_url` | TEXT | Supabase Storage URL or default sticker path |
| `geocode_status` | TEXT | `success` \| `failed` \| `cached` (for synced events) |
| `geocode_attempted_at` | TIMESTAMPTZ | Last geocoding attempt |
| `source_refs` | JSONB | Array of `{ event_url, fetched_at }` |
| `raw_payload` | JSONB | Original iCal data (for synced events) |
| `event_version` | INTEGER | Incremented on update (default: 1) |
| `created_at` | TIMESTAMPTZ | Record creation time |
| `updated_at` | TIMESTAMPTZ | Last modification time |

**Indexes:**
```sql
CREATE INDEX idx_canonical_events_starts_at ON canonical_events(starts_at);
CREATE INDEX idx_canonical_events_geo ON canonical_events(lat, lng);
CREATE INDEX idx_canonical_events_uid ON canonical_events(canonical_uid);
```

**Key view:** `user_profiles` (joined via `canonical_events_host_id_fkey`) provides `display_name` and `avatar_url` for GeoJSON host info.

---

#### 2. `event_rsvps` — Attendance tracking

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `event_id` | UUID FK | References `canonical_events.id` |
| `user_id` | UUID FK | References `users.id` |
| `status` | TEXT NOT NULL | `pending` \| `going` \| `interested` \| `not_going` \| `waitlist` \| `cancelled` \| `approved` \| `rejected` |
| `rsvp_type` | TEXT | `standard` \| `vip` \| `speaker` \| `organizer` \| `host` |
| `checked_in` | BOOLEAN | Whether user checked in at event (default: false) |
| `checked_in_at` | TIMESTAMPTZ | Check-in timestamp |
| `checked_in_by` | UUID FK | Admin/host who performed check-in |
| `notes` | TEXT | Admin notes |
| `metadata` | JSONB | Additional data |
| `created_at` | TIMESTAMPTZ | RSVP creation time |
| `updated_at` | TIMESTAMPTZ | Last modification time |

**Constraints:**
```sql
CONSTRAINT unique_user_event UNIQUE (event_id, user_id)
```

---

#### 3. `event_cultures` — Culture definitions

Stored in database, served via `/api/events/cultures`. Fallback hardcoded in `CultureSelector.tsx`.

| Column | Type | Description |
|--------|------|-------------|
| `slug` | TEXT PK | e.g. `science_technology`, `food`, `follow_your_heart` |
| `name` | TEXT | Display name (e.g. "Science & Tech") |
| `emoji` | TEXT | Emoji icon |
| `color` | TEXT | Hex color code |
| `asset_file` | TEXT | Filename in `/Cultural Stickers/` |
| `description` | TEXT | Short description |
| `tags` | TEXT[] | Searchable tags |
| `is_active` | BOOLEAN | Whether shown in selector |
| `sort_order` | INTEGER | Display order |

**19 Culture Slugs** (from `types/events.ts`):
`science_technology`, `business`, `design`, `food`, `game`, `health_fitness`, `home_lifestyle`, `law`, `literature_stories`, `music_entertainment`, `nature_wildlife`, `photography`, `spiritual`, `travel_adventure`, `television_cinema`, `stories_journal`, `sport`, `follow_your_heart`, `default`

---

#### 4. `calendars` — iCal feed sources

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `name` | TEXT NOT NULL | Calendar display name |
| `url` | TEXT NOT NULL | iCal feed URL |
| `type` | TEXT | `ical` \| `google` \| `manual` (default: `ical`) |
| `is_active` | BOOLEAN | Whether to fetch (default: true) |
| `description` | TEXT | Notes about this calendar |
| `created_at` | TIMESTAMPTZ | Record creation |
| `updated_at` | TIMESTAMPTZ | Last modification |

**Active calendars:**
| Name | Feed |
|------|------|
| Zo House Bangalore | `cal-ZVonmjVxLk7F2oM` |
| Zo House San Francisco | `cal-3YNnBTToy9fnnjQ` |

**Emergency fallback feeds** (hardcoded in `calendarConfig.ts`):
- SF Discover: `discplace-BDj7GNbGlsF7Cka`
- Singapore Discover: `discplace-mUbtdfNjfWaLQ72`
- BLR Calendar: `cal-ZVonmjVxLk7F2oM`
- SF Calendar: `cal-3YNnBTToy9fnnjQ`

---

#### 5. `canonical_event_changes` — Audit trail

Tracks all worker operations for debugging.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Auto-generated |
| `canonical_event_id` | UUID FK | References `canonical_events.id` |
| `change_type` | TEXT NOT NULL | `insert` \| `update` \| `dry-run` |
| `payload` | JSONB | Operation details |
| `created_at` | TIMESTAMPTZ | Timestamp |

---

#### 6. `nodes` — Zo properties (used for event locations)

Events with `location_type: 'zo_property'` reference a node. The GeoJSON route looks up node coordinates when events lack lat/lng.

---

#### 7. `users` — User accounts (host info)

Events join to `users` for host info. Key fields used by events API:
- `id`, `name`, `pfp`, `role`, `zo_membership`, `founder_nfts_count`, `zo_roles`
- View `user_profiles` provides `display_name` and `avatar_url`

---

## Type System

All event types are defined in `apps/web/src/types/events.ts` (406 lines).

### Core Enums

```typescript
type EventCategory   = 'community' | 'sponsored' | 'ticketed';
type EventCulture    = 'science_technology' | 'business' | ... | 'follow_your_heart' | 'default';  // 19 values
type SubmissionStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';
type HostType        = 'citizen' | 'founder_member' | 'admin' | 'sponsor' | 'vibe_curator';
type LocationType    = 'zo_property' | 'custom' | 'online';
type SourceType      = 'ical' | 'luma' | 'community' | 'activity_manager' | 'admin';
type RsvpStatus      = 'pending' | 'going' | 'interested' | 'not_going' | 'waitlist' | 'cancelled' | 'approved' | 'rejected';
type RsvpType        = 'standard' | 'vip' | 'speaker' | 'organizer' | 'host';
```

### Key Interfaces

| Interface | Description |
|-----------|-------------|
| `CommunityEvent` | Full event record from database (34 fields) |
| `EventHost` | Host info joined from users table |
| `EventMarkerData` | Simplified event for map markers |
| `CreateEventInput` | Input for creating events (maps to 5-step modal) |
| `CreateEventResponse` | API response after creating event |
| `EventRsvp` | RSVP record with optional joined user/event data |
| `RsvpUser` | User info for RSVP display (id, name, pfp, phone, zo_pid) |
| `EventsListResponse` | Paginated events list with meta |
| `MyEventsResponse` | User's hosted events, RSVPs, past events, and stats |
| `EventAttendeesResponse` | Attendee list with going/interested/waitlist/checked_in counts |
| `EventFilters` | Query parameters for filtering events |
| `EventCultureConfig` | Culture definition (slug, name, emoji, color, asset, etc.) |
| `HostEventModalState` | UI state for the creation modal |

### Display Helpers

```typescript
const EVENT_CATEGORY_CONFIG: Record<EventCategory, { label, emoji, color, bgColor }>
// community → { label: 'Community', emoji: '🌱', color: '#22c55e' }
// sponsored → { label: 'Sponsored', emoji: '⭐', color: '#a855f7' }
// ticketed  → { label: 'Ticketed',  emoji: '🎟️', color: '#eab308' }
```

---

## API Endpoints

### Overview Table

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/api/events` | No | List events with filters |
| `POST` | `/api/events` | Yes | Create community event |
| `GET` | `/api/events/[id]` | No | Get event details + RSVP stats |
| `PUT` | `/api/events/[id]` | Yes | Update event (host/admin only) |
| `DELETE` | `/api/events/[id]` | Yes | Cancel event (soft delete) |
| `GET` | `/api/events/[id]/rsvp` | No | Get attendees list |
| `POST` | `/api/events/[id]/rsvp` | Yes | Create/update user RSVP |
| `PATCH` | `/api/events/[id]/rsvp` | Yes | Host manages RSVPs (approve/check-in) |
| `GET` | `/api/events/mine` | Yes | User's hosted events + RSVPs |
| `POST` | `/api/events/upload-cover` | Yes | Upload cover image to Supabase Storage |
| `GET` | `/api/events/cultures` | No | List active cultures |
| `GET` | `/api/events/geojson` | No | GeoJSON for map markers |
| `GET` | `/api/events/canonical` | No | Legacy canonical events (feature-flagged) |
| `GET` | `/api/calendar` | No | iCal proxy (CORS bypass) |
| `POST` | `/api/worker/sync-events` | No | Trigger canonical event sync |
| `POST` | `/api/add-calendar` | No | Add new calendar source |

---

### 1. `GET /api/events` — List Events

Fetches approved events from `canonical_events` with filtering.

**Query Parameters:**

| Param | Default | Description |
|-------|---------|-------------|
| `category` | `all` | Filter: `community`, `sponsored`, `ticketed`, or `all` |
| `culture` | — | Filter by culture slug |
| `status` | `approved` | Filter by submission status |
| `host_id` | — | Filter by host user ID |
| `start_date` | `now` | ISO timestamp, defaults to current time |
| `end_date` | — | ISO timestamp upper bound |
| `limit` | `50` | Max results |
| `offset` | `0` | Pagination offset |

**Response:** `EventsListResponse`
```json
{
  "events": [{ ...CommunityEvent, "host": { "id", "name", "pfp", "display_name" } }],
  "meta": { "total": 12, "page": 1, "limit": 50, "has_more": false }
}
```

**Implementation notes:**
- Uses `supabaseAdmin` to bypass RLS for reading
- Fetches host info separately per event (N+1 — noted in LAUNDRY)
- Host `display_name` defaults to `host.name || 'Host'`
- Phone number is never exposed (privacy)

---

### 2. `POST /api/events` — Create Event

Creates a new community event. Auto-determines host type and submission status.

**Auth:** Required (`x-user-id` header or `zo_user_id` cookie)

**Body:** `CreateEventInput`

**Validation:**
- Title must be >= 5 characters
- `starts_at` and `ends_at` required
- Start must be in the future
- End must be after start

**Host Type Determination** (`getHostTypeAndStatus()`):

```
User has zo_roles 'admin' or 'vibe-curator'
  → host_type: 'admin', submission_status: 'approved'

User has role='Founder' OR zo_membership='founder' OR founder_nfts_count > 0
  → host_type: 'founder_member', submission_status: 'approved'

Otherwise (citizen)
  → host_type: 'citizen', submission_status: 'pending'
```

**Key behavior:**
- `canonical_uid` set to `community-{userId}-{timestamp}`
- `source_type` always set to `community`
- Default timezone: `Asia/Kolkata`
- Default currency: `INR`
- Host is auto-RSVP'd as `{ status: 'going', rsvp_type: 'host' }`
- Returns different message based on approval status

---

### 3. `GET /api/events/[id]` — Event Details

Returns single event with host info and RSVP stats.

**Response:**
```json
{
  "event": { ...CommunityEvent, "host": { "id", "name", "pfp", "role", "zo_membership" } },
  "stats": { "going": 12, "interested": 5, "waitlist": 2 }
}
```

---

### 4. `PUT /api/events/[id]` — Update Event

**Auth:** Host or admin only.

**Editable fields:**
`title`, `description`, `culture`, `starts_at`, `ends_at`, `location_name`, `location_raw`, `lat`, `lng`, `meeting_point`, `max_capacity`, `cover_image_url`

Fields NOT editable via API: `category`, `source_type`, `host_id`, `host_type`, `submission_status`, `is_ticketed`

---

### 5. `DELETE /api/events/[id]` — Cancel Event

**Auth:** Host or admin only. Soft delete — sets `submission_status: 'cancelled'`. Cannot cancel past events.

---

### 6. `GET /api/events/[id]/rsvp` — Get Attendees

Returns all RSVPs for an event with user info. Uses batch user fetch to avoid N+1.

**Query params:** `status` — filter by RSVP status

**Response:** `EventAttendeesResponse`
```json
{
  "attendees": [{ ...EventRsvp, "user": { "id", "name", "pfp", "phone", "zo_pid" } }],
  "meta": { "total": 45, "going": 40, "interested": 5, "waitlist": 0, "checked_in": 12 }
}
```

---

### 7. `POST /api/events/[id]/rsvp` — User RSVP

**Auth:** Required.

**Body:** `{ status: RsvpStatus, rsvp_type?: RsvpType }`

**RSVP Flow:**

```
New user RSVPs with status="going"
  → Overridden to "interested" (requires host approval)

User RSVPs with status="going" AND event at max_capacity
  → Overridden to "waitlist"

Existing RSVP
  → Updated in place

User changes FROM "going" to something else AND event has max_capacity
  → Oldest waitlisted user auto-promoted to "going"
```

**Side effects:**
- `current_rsvp_count` on `canonical_events` is recalculated after every RSVP change
- Waitlist promotion happens automatically via `promoteFromWaitlist()`

---

### 8. `PATCH /api/events/[id]/rsvp` — Host Manages RSVPs

**Auth:** Host or admin only.

**Body:** `{ rsvp_id?: string, user_id?: string, status?: string, checked_in?: boolean }`

Hosts can:
- Approve RSVPs (set `status: 'going'`)
- Reject RSVPs
- Check in attendees (`checked_in: true` sets `checked_in_at` and `checked_in_by`)
- Must provide either `rsvp_id` or `user_id`

---

### 9. `GET /api/events/mine` — My Events

**Auth:** Required.

Returns three sections for the authenticated user:

| Section | Query | Description |
|---------|-------|-------------|
| `hosted` | `canonical_events WHERE host_id={userId} AND source_type='community'` | Events user is hosting (upcoming only) |
| `rsvps` | `event_rsvps WHERE user_id={userId} AND status IN ('going','interested','waitlist')` | Upcoming RSVPs with event details (batch fetched) |
| `past` | `event_rsvps WHERE user_id={userId} AND checked_in=true` | Past attended events (max 20) |

**Response:** `MyEventsResponse`
```json
{
  "hosted": [...],
  "rsvps": [...],
  "past": [...],
  "stats": { "total_hosted": 3, "total_attended": 12, "upcoming_count": 2 }
}
```

---

### 10. `POST /api/events/upload-cover` — Upload Cover Image

Uploads event cover image to Supabase Storage bucket `event-covers`.

**Auth:** Required.

**Content-Type:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Image file (JPEG, PNG, GIF, WebP) |
| `eventId` | string | Optional event ID for path organization |

**Constraints:**
- Max size: 5MB
- Allowed types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Path: `{userId}/{eventId|new}/{uuid}.{ext}`
- UUID generated via `uuid` package

**Response:**
```json
{ "success": true, "url": "https://...supabase.co/storage/v1/object/public/event-covers/...", "path": "..." }
```

---

### 11. `GET /api/events/cultures` — List Cultures

Returns active cultures from `event_cultures` table, sorted by `sort_order`. Excludes `default` slug.

**Response:** `CulturesResponse`
```json
{ "cultures": [{ "slug": "science_technology", "name": "Science & Tech", "emoji": "🔬", ... }] }
```

---

### 12. `GET /api/events/geojson` — GeoJSON for Map

Returns events (and optionally nodes) as GeoJSON `FeatureCollection` for Mapbox clustering.

**Query Parameters:**

| Param | Required | Description |
|-------|----------|-------------|
| `bbox` | Yes | Bounding box: `west,south,east,north` |
| `from` | No | Start date filter |
| `to` | No | End date filter |
| `includeNodes` | No | Include node markers (default: false) |

**Implementation details:**
- Fetches ALL approved events first, then filters by bbox
- For events with `zo_property_id` but no lat/lng, looks up coordinates from `nodes` table
- Joins `user_profiles` view for host display_name and avatar_url
- Extracts `event_url` from `source_refs[0].event_url`
- Safety limit: 500 events max
- Cache: `public, s-maxage=60, stale-while-revalidate=300`
- Content-Type: `application/geo+json`

**GeoJSON Feature properties (events):**
```json
{
  "id": "uuid", "name": "Event Title", "type": "event",
  "starts_at": "...", "ends_at": "...", "event_url": "...",
  "location": "raw address", "location_name": "venue name",
  "category": "community", "culture": "food",
  "cover_image_url": "...",
  "host_id": "uuid", "host_type": "founder_member",
  "host_name": "display name", "host_avatar": "url",
  "max_capacity": 50, "formatted_date": "Sat, Feb 15, 2026"
}
```

---

### 13. `GET /api/events/canonical` — Legacy Canonical Events

Feature-flagged (`FEATURE_CANONICAL_EVENTS_READ`). Returns events transformed to match the legacy `ParsedEvent` interface for UI compatibility.

- Uses Haversine distance calculation for radius filtering
- Transforms to `{ 'Event Name', 'Date & Time', Location, Latitude, Longitude, 'Event URL', _canonical }`
- 5-minute cache

---

### 14. `GET /api/calendar` — iCal Proxy

Fetches raw iCal data from external sources (avoids CORS).

| Param | Description |
|-------|-------------|
| `url` | Direct URL to iCal feed (encoded) |
| `id` | Luma calendar ID (legacy) |

Returns: raw iCal text (`text/calendar`)

---

### 15. `POST /api/worker/sync-events` — Trigger Worker

Manual trigger for canonical event sync worker.

**Body:**
```json
{ "dryRun": true, "calendarId": "cal-123", "verbose": true }
```

---

## Event Creation Flow

The `HostEventModal` component implements a 5-step wizard:

```
Step 1: TYPE          Step 2: VIBE         Step 3: DETAILS
───────────────────   ──────────────────   ──────────────────
"What kind of         "What's the          "Tell us more"
 event?"               theme?"
                                           - Title (min 5 chars)
┌──────────────┐      ┌────────────────┐   - Description
│  Community   │      │  4x4 grid of   │   - Start date/time
│  Sponsored→  │      │  16 culture    │   - End date/time
│  typeform    │      │  stickers      │   - Cover image upload
│  Ticketed    │      │  (lazy loaded) │   - Max capacity
└──────────────┘      └────────────────┘
       │                     │                    │
       ▼                     ▼                    ▼
Step 4: LOCATION      Step 5: REVIEW
──────────────────    ──────────────────
"Where is it?"        "Confirm & create"

┌────────────────┐    Summary of all
│ Zo Property    │    fields with edit
│ Custom Address │    buttons per section
│ Online         │
└────────────────┘    [Create Event] →
                      POST /api/events
```

### Step Details

**Step 1 — Event Type:**
- `community`: Standard community event (continues to step 2)
- `sponsored`: Opens external Typeform (`zostel.typeform.com/to/LgcBfa0M`)
- `ticketed`: Creates ticketed event with price fields

**Step 2 — Culture/Vibe:**
- Fetches cultures from `/api/events/cultures` (falls back to 16 hardcoded cultures)
- 4-column grid of culture stickers from `/Cultural Stickers/` directory
- Each sticker is a `.png` image loaded with lazy loading for mobile performance
- Selected culture shows preview with emoji, name, and description

**Step 3 — Details:**
- Title input (min 5 characters)
- Description textarea
- Start/end datetime pickers (HTML5 `datetime-local`)
- Cover image upload via `ImageUpload` component → `/api/events/upload-cover`
- Optional max capacity input

**Step 4 — Location:**
Three modes via `LocationSelector` component:
- **Zo Property**: Fetches nodes list, user selects from dropdown
- **Custom Address**: Mapbox address autocomplete (150ms debounce, request cancellation, proximity-based results)
- **Online**: Meeting link text input
- Auto-detects user geolocation for search proximity (fallback: India center)

**Step 5 — Review:**
- Summary card showing all entered information
- Edit buttons to jump back to any step
- Submit button → `POST /api/events`
- Success message varies by approval status

---

## Vibe Check — Pending Event Governance

When a pending event is created (Citizens/Members), the system can automatically trigger a **Telegram-based community vote** via the Vibe Check system. This is feature-flagged and non-blocking.

### Trigger Point

In `POST /api/events` (after event insert and host auto-RSVP):

```
Event inserted with submission_status = 'pending'
       │
       ├── Is FEATURE_VIBE_CHECK_TELEGRAM enabled?
       │     NO  → Event sits pending (manual admin action required)
       │     YES ↓
       │
       └── createVibeCheck(event)  ← non-blocking (.catch() swallows errors)
             │
             ├── Insert vibe_checks row (expires_at = now + 24h)
             ├── Post message to Telegram group (with inline vote buttons)
             └── Store tg_message_id on vibe_checks row
```

### Resolution

A cron worker (`POST /api/worker/resolve-vibe-checks`) runs every 15 minutes:

1. Finds all `vibe_checks` where `status = 'open'` and `expires_at <= now()`
2. For each: if `upvotes > downvotes` → approved, else → rejected
3. Updates `canonical_events.submission_status` to match
4. Edits the Telegram message to show final result (buttons removed)
5. If approved and `FEATURE_LUMA_API_SYNC` is enabled, pushes to Luma

### Key Properties

- **Non-blocking**: Errors in `createVibeCheck()` are caught and logged, never fail the event creation
- **Simple majority**: No quorum, no percentage threshold — just `upvotes > downvotes`
- **24-hour window**: Fixed, not adjusted for event proximity
- **Any group member**: Not restricted to founders — anyone in the TG group can vote
- **One vote per user**: UNIQUE constraint on `(vibe_check_id, tg_user_id)`

For full architectural details, see [SYSTEM_FLOWS.md — Section 3](./SYSTEM_FLOWS.md#3-vibe-check--telegram-event-governance).

---

## RSVP System

### Status State Machine

```
New user RSVPs
  ├─ (auto) → "interested" (waiting for host approval)
  └─ (at capacity) → "waitlist"

Host approves
  └─ "interested" → "going"

Host rejects
  └─ "interested" → "rejected"

User cancels
  └─ any → "cancelled" / "not_going"

User leaves "going" + event has capacity limit
  └─ triggers promoteFromWaitlist() → oldest waitlisted → "going"
```

### Capacity & Waitlist Logic

1. When a user RSVPs and event is at `max_capacity`:
   - Status auto-set to `waitlist`
2. When someone leaves "going":
   - `promoteFromWaitlist()` finds oldest `waitlist` RSVP
   - Promotes to `going`
   - Recalculates `current_rsvp_count`
3. `current_rsvp_count` is denormalized on `canonical_events`:
   - Updated via `updateEventRsvpCount()` after every RSVP change
   - Counts only `status: 'going'` RSVPs

### Check-In

Hosts can check in attendees via `PATCH /api/events/[id]/rsvp`:
```json
{ "rsvp_id": "uuid", "checked_in": true }
```
Sets `checked_in_at` to current timestamp and `checked_in_by` to the host's user ID.

---

## Cover Images & Culture Stickers

### Image Priority (from `eventCoverDefaults.ts`)

```
1. Uploaded cover image (Supabase Storage)
     ↓ fallback
2. Culture-based default sticker (e.g. /Cultural Stickers/Food.png)
     ↓ fallback
3. Category-based default (e.g. /dashboard-assets/community-demo-day.jpg)
     ↓ fallback
4. General fallback: /dashboard-assets/event-placeholder.jpg
```

### Culture Sticker Mapping

All 19 cultures map to sticker images in `/public/Cultural Stickers/`:

| Culture | File |
|---------|------|
| `science_technology` | `Science&Technology.png` |
| `business` | `Business.png` |
| `design` | `Design.png` |
| `food` | `Food.png` |
| `game` | `Game.png` |
| `health_fitness` | `Health&Fitness.png` |
| `home_lifestyle` | `Home&Lifestyle.png` |
| `law` | `Law.png` |
| `literature_stories` | `Literature&Stories.png` |
| `music_entertainment` | `Music&Entertainment.png` |
| `nature_wildlife` | `Nature&Wildlife.png` |
| `photography` | `Photography.png` |
| `spiritual` | `Spiritual.png` |
| `sport` | `Sport.png` |
| `stories_journal` | `Stories&Journal.png` |
| `television_cinema` | `Television&Cinema.png` |
| `travel_adventure` | `Travel&Adventure.png` |
| `follow_your_heart` | `FollowYourHeart.png` |
| `default` | `/dashboard-assets/event-placeholder.jpg` |

### Upload Specs

- **Bucket**: `event-covers` (Supabase Storage)
- **Max size**: 5MB
- **Allowed types**: JPEG, PNG, GIF, WebP
- **Path format**: `{userId}/{eventId|new}/{uuid}.{ext}`

---

## iCal Ingestion Pipeline

### Flow

```
calendars table → getCalendarUrls() → CORS proxy → parseICS() → geocode → display
```

### `calendarConfig.ts`

- Fetches active calendars from `calendars` Supabase table
- Falls back to 4 hardcoded emergency URLs if database unavailable
- Converts external URLs to proxy format: `/api/calendar?url={encoded}`
- Handles server-side vs client-side URL resolution

### `icalParser.ts`

**`parseICS(icsData)`:**
- Splits iCal data into lines, handles multi-line values
- Extracts: `SUMMARY` → Event Name, `DTSTART` → Date & Time, `LOCATION`, `DESCRIPTION` → Event URL, `GEO` → Latitude/Longitude
- Handles UTC format (`YYYYMMDDTHHMMSSZ`) and basic date format
- Filters to future events only
- Sorts chronologically

**`geocodeLocation(locationName)`:**
- Mapbox Geocoding API v5
- Returns `{ lat, lng }` or null

**`fetchAllCalendarEventsWithGeocoding(calendarUrls)`:**
- Fetches all calendars, parses iCal, geocodes missing coordinates
- **Hardcoded Zo House coordinates** as fast fallback:
  - Bangalore/Koramangala: `12.932658, 77.634402`
  - San Francisco: `37.7817309, -122.401198`
  - Whitefield: `12.9725, 77.745`

---

## Canonical Events Worker

Located in `lib/eventWorker.ts`. Syncs iCal events to `canonical_events` table.

### Configuration

```typescript
interface WorkerConfig {
  dryRun?: boolean;      // Log only (default: true via feature flag)
  calendarId?: string;   // Process single calendar
  verbose?: boolean;     // Extra logging
}
```

### Sync Process

```
1. Fetch calendar URLs from config
2. For each calendar, fetch + parse iCal events
3. For each event:
   a. Generate canonical_uid (hash of title+date+location)
   b. Check if exists in DB
   c. If dry-run: log to canonical_event_changes
   d. If new: geocode + insert
   e. If existing: retry geocoding if failed >24h ago
4. Return stats: { processed, inserted, updated, skipped, errors }
```

### Safety Features

- **Dry-run mode**: Logs to `canonical_event_changes` with `change_type: 'dry-run'`
- **Idempotent**: Uses `canonical_uid` for deduplication
- **Geocode retry**: Only retries failed geocoding after 24 hours
- **Audit trail**: All operations logged to `canonical_event_changes`
- **Feature-flagged**: Must enable `CANONICAL_EVENTS_WRITE` + disable `CANONICAL_DRY_RUN`

### CLI Usage

```bash
# Dry run (default)
npx ts-node lib/eventWorker.ts

# Apply changes
npx ts-node lib/eventWorker.ts --apply

# Single calendar, verbose
npx ts-node lib/eventWorker.ts --calendar=cal-ZVonmjVxLk7F2oM --verbose
```

---

## Feature Flags

Defined in `lib/featureFlags.ts`. Controls the canonical events rollout.

| Flag | Env Variable | Default | Description |
|------|-------------|---------|-------------|
| `CANONICAL_EVENTS_READ` | `FEATURE_CANONICAL_EVENTS_READ` | `false` | UI fetches from database instead of iCal |
| `CANONICAL_EVENTS_WRITE` | `FEATURE_CANONICAL_EVENTS_WRITE` | `false` | Worker writes to `canonical_events` table |
| `CANONICAL_DRY_RUN` | `CANONICAL_DRY_RUN` | `true` | Worker logs only, no writes |

### Helper Functions

```typescript
isCanonicalEventsEnabled()  // true if both READ and WRITE are true
shouldWorkerWrite()         // true if WRITE=true AND DRY_RUN=false
getFeatureFlagState()       // Returns full state object for debugging
```

### Rollout Plan (Not Started)

```
Phase 1: WRITE=true, DRY_RUN=true   → Validate worker logic (72h staging)
Phase 2: WRITE=true, DRY_RUN=false  → Populate canonical_events (24h staging)
Phase 3: READ=true (10%)            → A/B test against iCal
Phase 4: READ=true (100%)           → Full migration, retire iCal path
```

---

## GeoJSON & Map Integration

### Data Flow

```
MapCanvas (Mapbox GL) ← useMapGeoJSON hook
                           │
                           ├── Debounced 300ms on map move
                           ├── Aborts previous requests
                           └── GET /api/events/geojson?bbox={w,s,e,n}&includeNodes=true
                                    │
                                    ├── Fetch all approved events
                                    ├── Look up node coords for zo_property events
                                    ├── Filter by bounding box
                                    ├── Join user_profiles for host info
                                    └── Return GeoJSON FeatureCollection
```

### Node Coordinate Fallback

When events have `zo_property_id` but no lat/lng:
1. GeoJSON route fetches all nodes: `SELECT id, latitude, longitude FROM nodes`
2. Builds lookup map: `nodesMap[nodeId] = { lat, lng }`
3. For each event missing coords, looks up `nodesMap[event.zo_property_id]`

---

## Frontend Components

### Event Components (`components/events/`)

| Component | File | Lines | Description |
|-----------|------|-------|-------------|
| `HostEventModal` | `events/HostEventModal.tsx` | ~425 | 5-step event creation wizard |
| `EditEventModal` | `events/EditEventModal.tsx` | ~372 | Event editing (reuses similar UI) |
| `CultureSelector` | `events/CultureSelector.tsx` | 159 | 4-column grid of culture stickers |
| `LocationSelector` | `events/LocationSelector.tsx` | ~434 | 3-mode location picker with Mapbox |
| `EventTypeSelector` | `events/EventTypeSelector.tsx` | — | Community/Sponsored/Ticketed selector |
| `ImageUpload` | `events/ImageUpload.tsx` | — | Cover image upload with preview |

### Event Display Components

| Component | File | Description |
|-----------|------|-------------|
| `EventsOverlay` | `components/EventsOverlay.tsx` | Desktop sidebar — search, list, "Host Your Event" CTA |
| `MobileEventsListOverlay` | `components/MobileEventsListOverlay.tsx` | Mobile bottom sheet with spring animation |
| `MapCanvas` | `components/MapCanvas.tsx` | Mapbox GL map with event/node markers and clustering |
| `MyEventsCard` | `desktop-dashboard/MyEventsCard.tsx` | Desktop dashboard widget showing hosted/upcoming events |
| `MobileMyEventsCard` | `mobile-dashboard/MobileMyEventsCard.tsx` | Mobile dashboard events widget |

### Event Pages

| Page | Route | Description |
|------|-------|-------------|
| `my-events/page.tsx` | `/my-events` | Full events management — hosted events, RSVPs, past events (~789 lines) |

### Utility Libraries

| Library | File | Description |
|---------|------|-------------|
| `icalParser.ts` | `lib/icalParser.ts` | iCal parsing, geocoding, Zo House coordinate fallback |
| `calendarConfig.ts` | `lib/calendarConfig.ts` | Calendar URL management, emergency fallbacks, CORS proxy |
| `eventWorker.ts` | `lib/eventWorker.ts` | Canonical event sync worker with dry-run mode |
| `eventCoverDefaults.ts` | `lib/eventCoverDefaults.ts` | Cover image fallback chain (culture → category → default) |
| `featureFlags.ts` | `lib/featureFlags.ts` | Canonical events feature flag management |
| `geocoding.ts` | `lib/geocoding.ts` | Mapbox address search with session caching, proximity, prefetch |
| `canonicalUid.ts` | `lib/canonicalUid.ts` | UID generation for deduplication |

---

## Authentication & Authorization

### Auth Pattern (all event APIs)

```typescript
const userId = request.headers.get('x-user-id') ||
               request.cookies.get('zo_user_id')?.value;
```

Auth is checked at the API level. No middleware — each route validates independently.

### Permission Matrix

| Action | Citizen | Founder/Member | Admin | Vibe Curator |
|--------|---------|----------------|-------|--------------|
| Create event | Pending approval | Auto-approved | Auto-approved | Auto-approved |
| Edit own event | Yes | Yes | Yes | Yes |
| Edit others' events | No | No | Yes | No |
| Cancel own event | Yes | Yes | Yes | Yes |
| Cancel others' events | No | No | Yes | No |
| RSVP to events | Yes | Yes | Yes | Yes |
| View attendees | Yes | Yes | Yes | Yes |
| Manage RSVPs (approve/reject) | Own events only | Own events only | All events | Own events only |
| Check in attendees | Own events only | Own events only | All events | Own events only |

### RLS Bypass

All event API routes use `supabaseAdmin || supabase` pattern:
- `supabaseAdmin` (service role key) bypasses Row Level Security
- Falls back to anonymous `supabase` client if service role unavailable

---

## File Reference

```
apps/web/src/
├── types/
│   └── events.ts                           # All type definitions (406 lines)
├── app/
│   ├── api/
│   │   ├── calendar/route.ts               # iCal proxy
│   │   ├── add-calendar/route.ts           # Add calendar source
│   │   ├── events/
│   │   │   ├── route.ts                    # GET (list) + POST (create)
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts               # GET/PUT/DELETE single event
│   │   │   │   └── rsvp/route.ts          # GET/POST/PATCH RSVP management
│   │   │   ├── mine/route.ts              # GET user's events
│   │   │   ├── upload-cover/route.ts      # POST cover image upload
│   │   │   ├── cultures/route.ts          # GET active cultures
│   │   │   ├── geojson/route.ts           # GET GeoJSON for map
│   │   │   └── canonical/route.ts         # GET canonical events (flagged)
│   │   └── worker/
│   │       └── sync-events/route.ts       # POST trigger sync
│   ├── my-events/page.tsx                  # Events management page
│   └── page.tsx                            # Main page (loadLiveEvents)
├── components/
│   ├── events/
│   │   ├── HostEventModal.tsx             # 5-step creation wizard
│   │   ├── EditEventModal.tsx             # Event editing
│   │   ├── CultureSelector.tsx            # Culture grid selector
│   │   ├── LocationSelector.tsx           # 3-mode location picker
│   │   ├── EventTypeSelector.tsx          # Category selector
│   │   └── ImageUpload.tsx                # Cover image upload
│   ├── EventsOverlay.tsx                  # Desktop events sidebar
│   ├── MobileEventsListOverlay.tsx        # Mobile events sheet
│   ├── MapCanvas.tsx                      # Map with markers
│   ├── desktop-dashboard/
│   │   └── MyEventsCard.tsx               # Desktop dashboard widget
│   └── mobile-dashboard/
│       └── MobileMyEventsCard.tsx         # Mobile dashboard widget
├── hooks/
│   └── useMapGeoJSON.ts                   # GeoJSON fetching hook
└── lib/
    ├── calendarConfig.ts                  # Calendar URL management
    ├── canonicalUid.ts                    # UID generation
    ├── eventCoverDefaults.ts              # Cover image fallback chain
    ├── eventWorker.ts                     # Canonical sync worker
    ├── featureFlags.ts                    # Feature toggles
    ├── geocoding.ts                       # Mapbox address search
    ├── icalParser.ts                      # iCal parsing + geocoding
    └── supabase.ts                        # DB helpers (getActiveCalendars)
```

---

## Environment Variables

```bash
# Required
NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx           # Mapbox for geocoding + map
NEXT_PUBLIC_BASE_URL=http://localhost:3000 # For server-side iCal fetches

# Supabase
SUPABASE_SERVICE_ROLE_KEY=xxx             # Required for RLS bypass in event APIs

# Feature Flags (Canonical Events)
FEATURE_CANONICAL_EVENTS_READ=false        # UI reads from DB vs iCal
FEATURE_CANONICAL_EVENTS_WRITE=false       # Worker writes to DB
CANONICAL_DRY_RUN=true                     # Worker in test mode
```

---

*Document code-verified against source. Last audit: February 9, 2026.*

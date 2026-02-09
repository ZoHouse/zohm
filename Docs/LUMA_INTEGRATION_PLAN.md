# Luma API Integration Plan

**Date**: February 9, 2026 (updated with decisions)
**Status**: Planning — decisions finalized
**Goal**: Bidirectional sync between game.zo.xyz and Luma — all community events push to Luma after approval, all Luma events pull into game.zo.xyz, RSVPs sync both ways, edits sync bidirectionally

---

## Table of Contents

1. [Current State vs Target State](#current-state-vs-target-state)
2. [Field Comparison: game.zo.xyz vs Luma](#field-comparison)
3. [Gap Analysis](#gap-analysis)
4. [Architecture](#architecture)
5. [Phase 1: Luma API Client + Read Sync](#phase-1-luma-api-client--read-sync)
6. [Phase 2: Push Community Events to Luma](#phase-2-push-community-events-to-luma)
7. [Phase 3: Two-Way RSVP Sync + Webhooks (Real-Time)](#phase-3-two-way-rsvp-sync)
8. [Modal Upgrade: New Fields](#modal-upgrade-new-fields)
9. [Database Changes](#database-changes)
10. [API Keys & Security](#api-keys--security)
11. [File Changes Summary](#file-changes-summary)
12. [Decisions Log](#decisions-log-resolved)

---

## Current State vs Target State

### Current State

```
Community events → canonical_events table → displayed on map/lists
Luma events     → iCal feeds → client-side parsing → displayed on map
                   (no RSVP data, no cover images, fragile geocoding)
```

- **2 Luma calendars** with API keys:
  - **BLRxZo** (`cal-ZVonmjVxLk7F2oM`) — Bangalore-specific events
  - **Zo Events** (`cal-3YNnBTToy9fnnjQ`) — global/all events (renamed from SFOxZo, which was unused for 2 months)
- **2+ iCal-only feeds** (Discover SF, Singapore) — no API keys, stay on iCal polling
- Community events live only in game.zo.xyz — no Luma presence
- RSVPs are game.zo.xyz-only — Luma RSVPs are invisible

### Target State

```
Community events → canonical_events → auto-push to Luma (background)
Luma events     → Luma API sync → canonical_events (rich data)
iCal feeds      → iCal parser (unchanged) → client-side display
RSVPs           → two-way sync between event_rsvps and Luma guests
```

- Every community event auto-published on Luma **after approval** (host gets a lu.ma link)
- Luma events synced with cover images, coordinates, descriptions, RSVP counts
- RSVPs flow both directions: game.zo.xyz ↔ Luma (user must have email to RSVP)
- Edits sync **both ways** — edit on app updates Luma, edit on Luma updates app
- Events without location show in events list only (not on map)
- iCal parser stays for non-API calendars (polling sync)
- **2 Luma calendars**: BLRxZo (Bangalore) + Zo Events (global, formerly SFOxZo)

---

## Field Comparison

### game.zo.xyz 5-Step Modal vs Luma Event Create

| game.zo.xyz Field | Luma API Field | Match | Notes |
|---|---|---|---|
| **Step 1: Type** | | | |
| `category` (`community`/`sponsored`/`ticketed`) | — | No Luma equivalent | Map to ticket type: free vs fiat-price |
| **Step 2: Vibe** | | | |
| `culture` (19 EventCulture slugs) | — | No Luma equivalent | Could map to Luma event tags |
| **Step 3: Details** | | | |
| `title` | `name` | Direct match | |
| `description` | `description` / `description_md` | Match | Luma supports markdown — upgrade opportunity |
| `starts_at` (ISO datetime) | `start_at` (ISO datetime) | Direct match | |
| `ends_at` (ISO datetime) | `end_at` (ISO datetime) | Direct match | |
| `timezone` (default: `Asia/Kolkata`) | `timezone` (IANA, required) | Direct match | We default to Asia/Kolkata, Luma requires explicit |
| `cover_image_url` (Supabase Storage) | `cover_url` (any URL, required) | Match | Luma requires a cover — use culture sticker as fallback |
| `max_capacity` | Ticket type `max_capacity` | Indirect | Luma capacity is per ticket type, not per event |
| **Step 4: Location** | | | |
| `location_type` (`zo_property`/`custom`/`online`) | — | No direct equivalent | Luma infers from geo vs meeting_url |
| `location_name` | `geo_address_json.description` | Partial match | Luma uses structured address object |
| `location_address` | `geo_address_json.full_address` | Partial match | |
| `lat` / `lng` | `geo_latitude` / `geo_longitude` | Direct match | Luma stores as strings, we use numbers |
| `zo_property_id` | — | No Luma equivalent | Internal reference to our nodes table |
| `meeting_point` | `geo_address_json.description` | Partial match | Could use address description field |
| — (online events) | `meeting_url` | Match | We have `location_type: 'online'` but no dedicated URL field |
| **Not in our modal** | | | |
| — | `visibility` (`public`/`members-only`/`private`) | Missing from our modal | Default all to `public` |
| — | `duration_interval` (ISO 8601) | Missing | Can compute from start/end |
| — | `registration_questions` (array) | Missing | Luma supports custom reg questions |
| — | `feedback_email` (post-event survey) | Missing | Luma auto-sends feedback emails |
| — | `can_register_for_multiple_tickets` | Missing | Multi-ticket support |
| — | Ticket types (free/paid, capacity per tier) | Missing | Our `is_ticketed` is boolean only |

### Luma Event Object → Our canonical_events Mapping

| Luma Response Field | Our Column | Action |
|---|---|---|
| `id` (evt-xxx) | `luma_event_id` | Store directly |
| `name` | `title` | Direct map |
| `description_md` | `description` | Store markdown version |
| `start_at` | `starts_at` | Direct map |
| `end_at` | `ends_at` | Direct map |
| `timezone` | `tz` | Direct map |
| `geo_latitude` | `lat` | Parse string → float |
| `geo_longitude` | `lng` | Parse string → float |
| `geo_address_json.full_address` | `location_raw` | Direct map |
| `geo_address_json.description` | `location_name` | Direct map |
| `geo_address_json.city` | — | Available but no column |
| `geo_address_json.country` | — | Available but no column |
| `meeting_url` | — | Need new column or use `external_rsvp_url` |
| `cover_url` | `cover_image_url` | Direct map |
| `url` | `external_rsvp_url` | The lu.ma event page URL |
| `visibility` | — | Need new column or store in metadata |
| `hosts` (array) | `host_id` | Map first host to our users table |
| `tags` (array) | `culture` | Map Luma tags → culture slugs |
| `registration_questions` | — | Store in `raw_payload` |

### Luma Guest Object → Our event_rsvps Mapping

| Luma Guest Field | Our Column | Action |
|---|---|---|
| `id` | — | Store as `luma_guest_id` (new column) |
| `user_email` | → match `users.email` | Lookup user by email |
| `user_name` | → match `users.name` | Fallback identifier |
| `phone_number` | → match `users.phone` | Primary match for Zo users |
| `approval_status` | `status` | Map: see below |
| `checked_in_at` (on ticket) | `checked_in`, `checked_in_at` | Direct map |
| `registered_at` | `created_at` | Direct map |
| `event_tickets` | `rsvp_type`, `metadata` | Ticket type → rsvp_type |

**Luma approval_status → Our RsvpStatus mapping:**

| Luma Status | Our Status |
|---|---|
| `approved` | `going` |
| `pending_approval` | `pending` |
| `invited` | `interested` |
| `declined` | `rejected` |
| `waitlist` | `waitlist` |
| `session` | `going` (auto-approved) |

---

## Gap Analysis

### What We Need to Add to Our Modal

| Priority | Field | Why | Decision |
|---|---|---|---|
| **High** | `meeting_url` (optional) | For online/hybrid events. Luma requires it for virtual events | Add to frontend as optional field. Mostly IRL events, so `null` is fine. Show input in all location modes, not just online |
| **High** | Cover image (mandatory upload) | Luma requires `cover_url`. Users should always upload a cover | **Make cover upload mandatory** in the modal. Culture stickers are fallback only (for Luma push if upload somehow missing) |
| **Medium** | `visibility` selector | Default `public`, but allow `members-only` for founder-gated events | Default to `public` for now |
| **Low** | Registration questions | Let hosts add 1-3 custom questions | Deferred |
| **Low** | Ticket tiers | Our `is_ticketed` + `ticket_price` is flat. Luma supports multiple tiers | Deferred |
| **Low** | `feedback_email` toggle | Auto-send post-event feedback email via Luma | Deferred |

### What Luma Doesn't Have (Our Advantages)

| Our Feature | Luma | Notes |
|---|---|---|
| 19 event cultures with stickers | Event tags (flat strings) | Our culture system is richer — push as Luma tags |
| `zo_property_id` (node linking) | — | Internal feature, no need to push |
| `host_type` (citizen/founder/admin) | Hosts array | Our role system is more granular |
| `submission_status` (pending/approved) | — | Luma auto-publishes. We gate citizens |
| `source_type` (community/ical/luma) | — | Internal tracking |
| Waitlist auto-promotion | Manual | Our `promoteFromWaitlist()` is automated |

### Cover Image Requirement

**Decision: Cover image upload is mandatory in the modal.** Users must upload a cover image when creating an event. Culture stickers serve as a fallback only — for the rare case where a cover is needed for Luma push but somehow missing.

Luma **requires** `cover_url` to create an event. Our solution:

```
User uploads cover image → use Supabase Storage URL (primary, mandatory)
Fallback: culture selected → use culture sticker URL (must be publicly accessible)
Fallback: no culture → use default event placeholder
```

**Problem**: Our culture stickers are at `/Cultural Stickers/Food.png` — local public paths. Luma needs full HTTPS URLs.

**Solution**: Use `${NEXT_PUBLIC_BASE_URL}/Cultural Stickers/${asset_file}` or upload stickers to Supabase Storage for reliable URLs. The deployed Vercel URL works: `https://game.zo.xyz/Cultural Stickers/Food.png`.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐  ┌──────────────────────┐  ┌──────────────────┐  │
│  │ Community Users   │  │ Luma API              │  │ iCal Feeds       │  │
│  │ (5-step modal)    │  │ BLRxZo + Zo Events    │  │ (no API keys)    │  │
│  └────────┬─────────┘  └────────┬──────────────┘  └────────┬─────────┘  │
│           │                     │                      │            │
└───────────┼─────────────────────┼──────────────────────┼────────────┘
            │                     │                      │
            ▼                     ▼                      ▼
   ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐
   │ POST /api/events │  │ Luma Sync       │  │ iCal Parser         │
   │                  │  │ Worker          │  │ (unchanged)         │
   │ 1. Save to DB    │  │                 │  │                     │
   │ 2. Auto-RSVP     │  │ Pull events     │  │ Parse + geocode     │
   │ 3. Push to Luma  │  │ Pull guests     │  │ Client-side         │
   │    (background)  │  │ Merge to DB     │  │                     │
   └────────┬─────────┘  └────────┬────────┘  └──────────┬──────────┘
            │                     │                       │
            ▼                     ▼                       ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                    canonical_events                               │
   │                                                                   │
   │  source_type:   'community'    │  'luma'         │  'ical'       │
   │  luma_event_id: evt-xxx (new)  │  evt-xxx        │  null         │
   │  luma_sync:     'pushed'       │  'pulled'       │  null         │
   │  cover_image:   uploaded (req) │  cover_url      │  sticker      │
   │  coordinates:   from modal     │  from Luma      │  geocoded     │
   │  RSVP sync:     two-way        │  two-way        │  none         │
   │  sync method:   webhooks (RT)  │  webhooks (RT)  │  polling      │
   │  no-location:   list only      │  list only      │  list only    │
   └──────────────────────────────────────────────────────────────────┘
            │
            ▼
   ┌──────────────────────────────────────────────────────────────────┐
   │                    RSVP TWO-WAY SYNC                              │
   │              (events with luma_event_id only)                     │
   │                                                                   │
   │  ┌─────────────────────────────────────────────────────────┐     │
   │  │  PUSH: game.zo.xyz → Luma                               │     │
   │  │  User RSVPs on app → POST /v1/event/add-guests          │     │
   │  │  Host approves → POST /v1/event/update-guest-status     │     │
   │  └─────────────────────────────────────────────────────────┘     │
   │                                                                   │
   │  ┌─────────────────────────────────────────────────────────┐     │
   │  │  PULL: Luma → game.zo.xyz                               │     │
   │  │  Sync worker → GET /v1/event/get-guests                 │     │
   │  │  Match by email/phone → upsert event_rsvps              │     │
   │  └─────────────────────────────────────────────────────────┘     │
   └──────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Luma API Client + Read Sync

**Goal**: Replace iCal parsing for BLR+SF calendars with rich Luma API data.

### New Files

#### `lib/lumaApi.ts` — Luma API Client

```typescript
// Core client wrapping Luma REST API
// Base URL: https://public-api.luma.com
// Auth: x-luma-api-key header

interface LumaConfig {
  apiKey: string;
  calendarId: string;  // for context
}

// Calendar configs (from env vars)
// 2 Luma calendars — both keys available
const LUMA_CALENDARS = {
  blr: { apiKey: process.env.LUMA_BLR_API_KEY, calendarId: 'cal-ZVonmjVxLk7F2oM' },
  zo_events: { apiKey: process.env.LUMA_ZO_EVENTS_API_KEY, calendarId: 'cal-3YNnBTToy9fnnjQ' },
  // ^ Renamed from SFOxZo → Zo Events (global calendar for all events)
};

// Methods needed:
listEvents(config, { after?, before?, limit? })     → LumaEvent[]
getEvent(config, eventId)                            → LumaEvent
getGuests(config, eventId, { status?, limit? })      → LumaGuest[]
createEvent(config, data)                            → LumaEvent
updateEvent(config, eventId, data)                   → LumaEvent
addGuests(config, eventId, guests[])                 → LumaGuest[]
updateGuestStatus(config, eventId, guestEmail, status) → void
```

#### `lib/lumaSyncWorker.ts` — Sync Worker

```typescript
// Replaces eventWorker.ts for Luma-API calendars
// Runs on cron or manual trigger

async function syncLumaEvents():
  1. For each Luma calendar (BLR, Zo Events):
     a. GET /v1/calendar/list-events (after: now, sort: start_at asc)
     b. For each event:
        - Check if exists in canonical_events by luma_event_id
        - If new: INSERT with source_type='luma', map all fields
        - If exists: UPDATE changed fields (title, time, location, cover)
        - Pull cover_url, geo_latitude, geo_longitude, description_md
     c. Pagination: follow next_cursor until has_more=false
  2. Return sync stats

async function syncLumaGuests(eventId):
  1. GET /v1/event/get-guests for the event
  2. For each guest:
     - Match to users table by email or phone
     - Upsert event_rsvps with mapped status
  3. Update current_rsvp_count on canonical_events
```

### Changes to Existing Files

| File | Change |
|------|--------|
| `featureFlags.ts` | Add `LUMA_API_SYNC: boolean` flag |
| `calendarConfig.ts` | Skip Luma iCal URLs when API sync is enabled |
| `eventWorker.ts` | Add conditional: if LUMA_API_SYNC, call lumaSyncWorker instead |
| `/api/worker/sync-events/route.ts` | Support `source: 'luma-api'` param |

### New API Route

`/api/worker/sync-luma/route.ts` — Manual trigger for Luma sync

### Env Vars

```bash
LUMA_BLR_API_KEY=<your-blr-api-key>
LUMA_ZO_EVENTS_API_KEY=<your-zo-events-api-key>
LUMA_API_SYNC=true  # Feature flag
```

### Outcome

- BLR and Zo Events calendars now have: cover images, exact coordinates, markdown descriptions, RSVP counts
- No more Mapbox geocoding for these events
- iCal parser still handles Discover feeds and external calendars
- No UI changes needed — canonical_events schema already supports all these fields

---

## Phase 2: Push Community Events to Luma

**Goal**: Every approved community event auto-published on Luma. Host gets a lu.ma link.

**Key Decision**: Push to Luma happens **after approval**, not at creation time. This means:
- Founders/admins: auto-approved → push happens immediately (same as before)
- Citizens: pending → push happens when admin approves → `submission_status` changes to `approved`

### Flow

```
Event gets approved (auto or manual)
    │
    ├── For founders/admins: happens immediately after POST /api/events
    ├── For citizens: happens when admin PATCH sets status='approved'
    │
    └── Push to Luma (background, non-blocking)
            │
            ├── Determine which Luma calendar:
            │   ├── Event in Bangalore area → BLR key
            │   ├── Event in SF area → SFO key
            │   └── Other/online → BLR key (default)
            │
            ├── Build Luma event payload:
            │   {
            │     name: event.title,
            │     description_md: event.description,
            │     start_at: event.starts_at,
            │     end_at: event.ends_at,
            │     timezone: event.tz || 'Asia/Kolkata',
            │     geo_latitude: String(event.lat),
            │     geo_longitude: String(event.lng),
            │     geo_address_json: {
            │       full_address: event.location_raw,
            │       description: event.location_name
            │     },
            │     meeting_url: event.meeting_url (if online),
            │     cover_url: event.cover_image_url || cultureStickerUrl,
            │     visibility: 'public'
            │   }
            │
            ├── POST /v1/event/create
            │
            └── On success:
                UPDATE canonical_events SET
                  luma_event_id = response.api_id,
                  external_rsvp_url = response.url,
                  luma_sync_status = 'pushed'
```

### Calendar Assignment Logic

```typescript
function getLumaCalendarForEvent(event): LumaConfig {
  // Bangalore-area events → BLR calendar
  if (event.lat && event.lng) {
    const distToBLR = haversine(event.lat, event.lng, 12.93, 77.63);
    if (distToBLR < 500) return LUMA_CALENDARS.blr;  // Within 500km of Bangalore
  }

  // Everything else → Zo Events (global calendar)
  return LUMA_CALENDARS.zo_events;
}
```

**Calendar assignment rules:**
- Bangalore-area events → **BLRxZo** calendar
- Everything else (other cities, online, no location) → **Zo Events** calendar
- Events with no lat/lng still push to Luma (Zo Events) but do NOT show on the game.zo.xyz map — they appear in the events list only

### Changes to Existing Files

| File | Change |
|------|--------|
| `POST /api/events` route.ts | For auto-approved events (founders/admins): call `pushEventToLuma()` after insert (non-blocking) |
| `PATCH /api/events/[id]` (admin approve) | When `submission_status` changes to `approved`: call `pushEventToLuma()` (non-blocking) |
| `PUT /api/events/[id]` route.ts | After update, call `updateEventOnLuma()` if `luma_event_id` exists (**bidirectional edit sync**) |
| `DELETE /api/events/[id]` route.ts | On cancel, Luma API doesn't have a delete — update event with `visibility: 'private'` |
| `types/events.ts` | Add `meeting_url` to `CommunityEvent` and `CreateEventInput` |

### New Fields in CreateEventInput

```typescript
interface CreateEventInput {
  // ... existing fields ...

  // NEW: Online event URL
  meeting_url?: string;

  // NEW: Visibility (default: public)
  visibility?: 'public' | 'members-only' | 'private';
}
```

### Modal Changes (Step 4: Location)

**Decision**: `meeting_url` is an **optional field** shown in all location modes, not just online:
- IRL events may have a Zoom/Livestream link too (hybrid events)
- Mostly IRL events, so this field will be `null` most of the time
- When `location_type === 'online'`: field is more prominently shown
- When `location_type === 'zo_property'` or `'custom'`: shown as collapsed/optional "Add meeting link"
- This maps to Luma's `meeting_url` field

### Error Handling

Luma push is **non-blocking** — if it fails, the community event is still created. Failure stored as `luma_sync_status: 'push_failed'`. A retry worker picks up failed pushes.

```typescript
// Non-blocking push
try {
  const lumaEvent = await pushEventToLuma(event);
  await updateLumaId(event.id, lumaEvent.api_id, lumaEvent.url);
} catch (error) {
  devLog.error('Luma push failed (will retry):', error);
  await markLumaPushFailed(event.id);
}
```

---

## Phase 3: Two-Way RSVP Sync

**Goal**: RSVPs flow both directions. Hosts manage everything from game.zo.xyz.

### Push: game.zo.xyz → Luma

When a user RSVPs on game.zo.xyz for an event with `luma_event_id`:

```
POST /api/events/[id]/rsvp (existing)
    │
    ├── 1. Upsert event_rsvps (existing)
    │
    └── 2. NEW: Push to Luma (background)
            │
            ├── Lookup user email from users table
            │
            └── POST /v1/event/add-guests
                { event_id: luma_event_id, guests: [{ email, name }] }
```

**Email Requirement — Decision:**
- Luma `add-guests` requires email. Many Zo users have phone-only accounts.
- **Decision**: If user tries to RSVP and has no email on their profile, show a **notification/prompt asking them to add an email to their profile** before the RSVP can proceed.
- This is a **hard requirement** — no email = cannot RSVP. This ensures every RSVP syncs to Luma.
- UX: On the map event popup / event detail, when user taps "RSVP" → check if `user.email` exists → if not, show toast/modal: "Add your email in Profile to RSVP for events" with a link to profile settings.

When host approves/rejects on game.zo.xyz:

```
PATCH /api/events/[id]/rsvp (existing)
    │
    └── NEW: POST /v1/event/update-guest-status
            { event_id, guest_email, status: 'approved'/'declined' }
```

### Pull: Luma → game.zo.xyz

Part of the sync worker (runs every 15 min):

```
For each event with luma_event_id:
    │
    ├── GET /v1/event/get-guests?event_id={luma_event_id}
    │
    ├── For each Luma guest:
    │   ├── Match to users table:
    │   │   ├── By email (users.email = guest.user_email)
    │   │   ├── By phone (users.phone = guest.phone_number)
    │   │   └── No match → store as external in rsvp metadata
    │   │
    │   ├── Map status: approved→going, pending_approval→pending, etc.
    │   │
    │   └── Upsert event_rsvps:
    │       - If exists by (event_id, user_id): update status
    │       - If new: insert with luma_guest_id
    │
    └── Update canonical_events.current_rsvp_count
```

### Conflict Resolution

When same RSVP exists in both systems:
- **Last-write wins**: Compare `updated_at` (our DB) vs `registered_at` (Luma)
- **Luma is source of truth for Luma-originated events** (source_type = 'luma')
- **game.zo.xyz is source of truth for community events** (source_type = 'community')

### New Columns

`event_rsvps` table:
```sql
ALTER TABLE event_rsvps ADD COLUMN luma_guest_id TEXT;
ALTER TABLE event_rsvps ADD COLUMN luma_synced_at TIMESTAMPTZ;
```

---

## Phase 4: Webhooks (Real-Time)

**Goal**: Replace polling with real-time push from Luma.

### Webhook Types

| Luma Webhook | Fires When | Our Action |
|---|---|---|
| `event.created` | New event on Luma calendar | Insert to canonical_events |
| `event.updated` | Event details changed | Update canonical_events |
| `event.canceled` | Event cancelled | Set submission_status='cancelled' |
| `guest.created` | Someone RSVPs on Luma | Upsert event_rsvps |
| `guest.updated` | Guest status changes | Update event_rsvps |
| `ticket.registered` | Ticket purchased | Update rsvp with ticket info |

### New API Route

`/api/webhooks/luma/route.ts`

```typescript
POST /api/webhooks/luma
Headers: { x-luma-webhook-secret: ... }

Body: { type: 'event.created', data: { event: {...} } }

Handler:
  1. Verify webhook signature
  2. Switch on type:
     - event.created → upsert canonical_events
     - event.updated → update canonical_events
     - event.canceled → set cancelled
     - guest.created → upsert event_rsvps
     - guest.updated → update event_rsvps
  3. Return 200
```

### Setup (Programmatic — via API key)

Webhooks are registered via the Luma API using the same API key. No dashboard needed.

```typescript
// One-time setup script (or run once on first deploy)
// POST https://public-api.luma.com/v1/webhooks/create

const webhook = await lumaFetch('https://public-api.luma.com/v1/webhooks/create', {
  method: 'POST',
  headers: {
    'x-luma-api-key': LUMA_BLR_API_KEY,  // Run once per calendar (BLR + Zo Events)
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://game.zo.xyz/api/webhooks/luma',
    event_types: [
      'event.created', 'event.updated', 'event.canceled',
      'guest.registered', 'guest.updated',
      'ticket.registered',
      'calendar.event.added',
    ],
  }),
});

// Response includes:
// {
//   id: 'whk-xxx',
//   url: 'https://game.zo.xyz/api/webhooks/luma',
//   event_types: [...],
//   status: 'active',
//   secret: 'whsec-xxxxxxxx',   ← store this in LUMA_WEBHOOK_SECRET
//   created_at: '2026-...'
// }
```

**Steps:**
1. Run setup script for each API key (BLR + Zo Events = 2 calls)
2. Each returns a `secret` — store as `LUMA_BLR_WEBHOOK_SECRET` and `LUMA_ZO_EVENTS_WEBHOOK_SECRET`
3. Our `/api/webhooks/luma` route verifies incoming requests against the appropriate secret
4. One shared webhook endpoint handles both calendars (Luma includes calendar context in the payload)

**Webhook management endpoints** (all use `x-luma-api-key` header):

| Endpoint | Method | Use |
|----------|--------|-----|
| `/v1/webhooks/create` | POST | Register new webhook |
| `/v1/webhooks/list` | GET | List all registered webhooks |
| `/v1/webhooks/get?id=whk-xxx` | GET | Get single webhook |
| `/v1/webhooks/update` | POST | Update URL or event types |
| `/v1/webhooks/delete` | POST | Remove webhook |

### When to Implement

**Decision**: Real-time sync (webhooks) is **required** for community events and app-created events. Only iCal-only calendars (no API key) can use polling.

- Community events + Luma API calendars (BLR, SFO, Zo World) → **webhooks (real-time)**
- iCal-only feeds (Discover, external) → **polling (15-min cron)**

This means Phase 4 should be implemented alongside Phase 3, not deferred. The polling worker from Phase 1 serves as a fallback if webhooks fail.

---

## Modal Upgrade: New Fields

### Changes to HostEventModal (5-step)

**Step 3 — Details (modify):**
- **Cover image upload becomes mandatory** (was optional before)
- Add validation: cannot proceed to Step 4 without uploading a cover image
- Culture stickers remain as visual selector in Step 2 but are NOT the cover image

**Step 4 — Location (modify):**
- ADD: `meeting_url` text input (Zoom, Google Meet, or custom URL)
  - Label: "Meeting Link (optional)"
  - Shown in all location modes (collapsed for IRL, prominent for online)
  - Validation: if provided, must be a valid URL
  - Can be left empty (`null`) — most events are IRL

**Future considerations (not blocking):**
- Visibility selector (public/members-only/private) — default public for now
- Registration questions — nice-to-have, can add later
- Ticket tiers — enhancement over current boolean `is_ticketed`

### Changes to CreateEventInput Type

```typescript
interface CreateEventInput {
  // ... all existing fields ...

  // NEW
  meeting_url?: string;  // For online events
}
```

### Changes to CommunityEvent Type

```typescript
interface CommunityEvent {
  // ... all existing fields ...

  // NEW
  meeting_url?: string;
  luma_event_id?: string;         // Already exists
  luma_sync_status?: 'pushed' | 'pulled' | 'push_failed' | 'synced' | null;
}
```

---

## Database Changes

### canonical_events — New Columns

```sql
-- Online event meeting link
ALTER TABLE canonical_events ADD COLUMN meeting_url TEXT;

-- Luma sync tracking
ALTER TABLE canonical_events ADD COLUMN luma_sync_status TEXT;
-- Values: 'pushed' (we → Luma), 'pulled' (Luma → us), 'push_failed', 'synced' (both ways), null

ALTER TABLE canonical_events ADD COLUMN luma_synced_at TIMESTAMPTZ;
```

### event_rsvps — New Columns

```sql
-- Track Luma guest ID for dedup
ALTER TABLE event_rsvps ADD COLUMN luma_guest_id TEXT;
ALTER TABLE event_rsvps ADD COLUMN luma_synced_at TIMESTAMPTZ;
```

### calendars — New Columns

```sql
-- Track which calendars have API keys
ALTER TABLE calendars ADD COLUMN has_api_key BOOLEAN DEFAULT false;
ALTER TABLE calendars ADD COLUMN sync_method TEXT DEFAULT 'ical';
-- Values: 'ical', 'luma_api', 'manual'
```

---

## API Keys & Security

### Storage

```bash
# .env.local (NEVER commit)
LUMA_BLR_API_KEY=<your-blr-api-key>
LUMA_ZO_EVENTS_API_KEY=<your-zo-events-api-key>
# LUMA_WEBHOOK_SECRET=  # Auto-generated when registering webhooks via API
```

### Rules

- API keys are **server-side only** — never exposed to client (`lib/lumaApi.ts` runs on server)
- No `NEXT_PUBLIC_` prefix
- Added to Vercel environment variables for deployment
- Rate limit: **300 requests per minute** — hard limit, enforced in code (never exceed)
- All Luma API calls go through a single rate-limited client

### Rate Limiter (Hard Enforcement in Code)

The `lumaApi.ts` client **must** include a built-in rate limiter. This is not optional — every request to Luma flows through it.

```typescript
// Built into lib/lumaApi.ts — all methods use this
class LumaRateLimiter {
  private requests: number[] = [];  // timestamps of recent requests
  private readonly MAX_PER_MINUTE = 280;  // 280 not 300 — 20-request safety buffer

  async acquire(): Promise<void> {
    const now = Date.now();
    // Remove requests older than 60s
    this.requests = this.requests.filter(t => now - t < 60_000);

    if (this.requests.length >= this.MAX_PER_MINUTE) {
      // Wait until the oldest request expires
      const waitMs = 60_000 - (now - this.requests[0]) + 50; // +50ms buffer
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return this.acquire(); // re-check after waiting
    }

    this.requests.push(now);
  }
}

// Every Luma API call:
async function lumaFetch(url, options) {
  await rateLimiter.acquire();  // blocks if at limit
  const res = await fetch(url, options);

  // If Luma returns 429 (rate limited), back off and retry
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('retry-after') || '60');
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return lumaFetch(url, options);  // retry once
  }

  return res;
}
```

**Rules enforced in code:**
- Hard cap at 280 req/min (20-request safety buffer below Luma's 300 limit)
- Single shared `LumaRateLimiter` instance across the entire app
- If limit is reached, requests **queue and wait** — never dropped, never exceeding
- 429 responses trigger automatic backoff using Luma's `retry-after` header
- Sync worker batches requests (e.g., fetches 50 events per page to minimize calls)

```
Budget at 280 req/min:
  - Sync worker (fallback polling): ~20 req per run
  - Event push (on approve): 1 req per event
  - Event update (on edit): 1 req per edit
  - RSVP push (on RSVP): 1 req per RSVP
  - Guest sync (webhook fallback): ~10 req per run
  - Headroom: ~240+ req/min for spikes
```

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `lib/lumaApi.ts` | Luma REST API client (typed, built-in rate limiter at 280 req/min, 429 backoff) |
| `lib/lumaSyncWorker.ts` | Sync worker for pulling Luma events + guests |
| `lib/lumaEventPush.ts` | Push community events to Luma (non-blocking) |
| `api/worker/sync-luma/route.ts` | Manual trigger for Luma sync |
| `api/webhooks/luma/route.ts` | Webhook receiver (Phase 4) |

### Modified Files

| File | Change |
|------|--------|
| `types/events.ts` | Add `meeting_url`, `luma_sync_status` to types |
| `api/events/route.ts` (POST) | Add Luma push after event creation |
| `api/events/[id]/route.ts` (PUT) | Add Luma update on event edit |
| `api/events/[id]/route.ts` (DELETE) | Set Luma event to private on cancel |
| `api/events/[id]/rsvp/route.ts` (POST) | Push RSVP to Luma |
| `api/events/[id]/rsvp/route.ts` (PATCH) | Push status change to Luma |
| `events/HostEventModal.tsx` | Add meeting_url input for online events |
| `events/LocationSelector.tsx` | Add meeting URL field when online selected |
| `lib/featureFlags.ts` | Add `LUMA_API_SYNC` flag |
| `lib/calendarConfig.ts` | Conditional skip for Luma-API calendars |
| `lib/eventCoverDefaults.ts` | Add `getPublicCoverUrl()` for Luma push |

### Unchanged Files

| File | Why |
|------|-----|
| `lib/icalParser.ts` | Stays for non-API calendars |
| `lib/calendarConfig.ts` | iCal fallback URLs stay |
| `api/calendar/route.ts` | iCal proxy stays |
| `api/events/geojson/route.ts` | Reads from canonical_events (no change) |
| `api/events/mine/route.ts` | Reads from canonical_events (no change) |
| `api/events/cultures/route.ts` | Unchanged |
| All display components | Read from same data source |

---

## Implementation Order

```
Phase 1: Read Sync (foundation)
├── lib/lumaApi.ts
├── lib/lumaSyncWorker.ts
├── featureFlags.ts (add LUMA_API_SYNC)
├── api/worker/sync-luma/route.ts
├── DB: canonical_events add luma_sync_status, luma_synced_at
├── DB: calendars add has_api_key, sync_method
└── Test: BLR + SF events appear with cover images and coords

Phase 2: Push to Luma (approved community events)
├── lib/lumaEventPush.ts
├── types/events.ts (add meeting_url)
├── api/events/route.ts (POST — push on auto-approve for founders/admins)
├── api/events/[id]/route.ts (PUT/DELETE — bidirectional edit sync)
├── Admin approval flow: push on status change to 'approved'
├── HostEventModal.tsx (mandatory cover upload + optional meeting_url)
├── LocationSelector.tsx (add meeting URL field in all modes)
├── DB: canonical_events add meeting_url
├── eventCoverDefaults.ts (add getPublicCoverUrl)
├── Email check: RSVP requires email on profile (prompt if missing)
└── Test: Create event → approve → appears on lu.ma

Phase 3: RSVP Sync + Webhooks (real-time for API calendars)
├── api/events/[id]/rsvp/route.ts (POST — add Luma push, require email)
├── api/events/[id]/rsvp/route.ts (PATCH — add Luma status update)
├── api/webhooks/luma/route.ts (real-time for community + Luma events)
├── lumaSyncWorker.ts (add guest sync — fallback for webhook failures)
├── Register webhooks via API for both calendars (BLR + Zo Events)
├── DB: event_rsvps add luma_guest_id, luma_synced_at
├── iCal polling stays for non-API calendars only
└── Test: RSVP on app → appears on Luma, RSVP on Luma → instant in app
```

---

## Decisions Log (Resolved)

All open questions have been resolved. Decisions recorded here for reference.

| # | Question | Decision |
|---|----------|----------|
| 1 | Calendar for non-geo events? | Bangalore-area → BLRxZo. Everything else → **Zo Events** (global calendar, renamed from SFOxZo). Events without location still push to Luma — they just don't show on the map (events list only). |
| 2 | Pending events → push to Luma? | **No.** Push only after approval. Founders/admins are auto-approved so push is immediate. Citizens wait for admin approval. |
| 3 | Edit sync direction? | **Bidirectional.** Edit on app → update on Luma. Edit on Luma → webhook updates app. Source-of-truth per `source_type`: community events = app is primary, luma events = Luma is primary. |
| 4 | Email requirement for RSVP? | **Hard requirement.** If user has no email, show notification: "Add your email in Profile to RSVP for events." No email = cannot RSVP. |
| 5 | New city calendars? | System supports N calendars via `LUMA_CALENDARS` config with geo-fencing. 2 calendars: BLRxZo (Bangalore) + Zo Events (global). SFOxZo renamed to Zo Events — SF calendar was unused for 2 months. |
| 6 | Cover image source? | **Cover upload is mandatory** in the modal. Culture stickers are fallback only. Vercel URLs (`game.zo.xyz/Cultural Stickers/...`) are stable enough for the rare fallback case. |

## Remaining Open Items

None — all API keys available, all decisions made. Ready for implementation.

---

*Plan updated with all decisions. Ready for implementation.*

# Zo World — System Flows

**Version**: 1.0
**Last Updated**: February 2026

---

## Table of Contents

1. [User Authentication (Login)](#1-user-authentication-login)
2. [Event Creation (Current)](#2-event-creation-current-flow)
3. [Event Creation (Proposed — Vibe Check)](#3-event-creation-proposed--vibe-check-governance)
4. [Key Database Tables](#4-key-database-tables)
5. [File Reference](#5-file-reference)

---

## 1. User Authentication (Login)

### Overview

Zo uses **phone-based OTP** authentication via the ZO API. There is no email/password login, no social login, and no wallet-based login. The ZO API is the single source of identity.

### Flow

```
┌──────────────────────────────────────────────────────────┐
│  USER ARRIVES → LandingPage.tsx                          │
│  Sees "Tune into Zo World" button                        │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  PHONE LOGIN MODAL                                       │
│  PhoneLoginModal.tsx                                     │
│                                                          │
│  Step 1: Enter country code + phone number               │
│  Step 2: Click "Send Code"                               │
│           → POST /api/zo/auth/send-otp                   │
│           → ZO API: /auth/login/mobile/otp               │
│                                                          │
│  Step 3: Enter 6-digit OTP                               │
│           → POST /api/zo/auth/verify-otp                 │
│           → ZO API: /auth/login/mobile                   │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  VERIFY-OTP BACKEND (3 steps)                            │
│  /api/zo/auth/verify-otp/route.ts                        │
│                                                          │
│  1. Find or create user in Supabase `users` table        │
│     - Lookup by zo_user_id, then by phone number         │
│     - If not found → INSERT new row (id = zo_user_id)    │
│                                                          │
│  2. Save device credentials to DB                        │
│     - zo_device_id, zo_device_secret (required for all   │
│       future ZO API calls)                               │
│                                                          │
│  3. Save auth tokens to DB                               │
│     - zo_token, zo_refresh_token, expiry timestamps      │
│     - Trigger background profile sync from ZO API        │
│       (avatar, membership, cultures, etc.)               │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  CLIENT-SIDE SESSION                                     │
│                                                          │
│  localStorage keys set:                                  │
│    zo_user_id        ← primary session identifier        │
│    zo_access_token   ← for authenticated API calls       │
│    zo_device_id      ← required header for ZO API        │
│    zo_device_secret  ← required header for ZO API        │
│    zo_avatar_url     ← cached avatar                     │
│                                                          │
│  CustomEvent('zoLoginSuccess') dispatched                │
│  useZoAuth() hook picks up session → loads profile       │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  ROUTING (page.tsx)                                      │
│                                                          │
│  New user (onboarding_completed = false)                 │
│    → UnifiedOnboarding (nickname + avatar)               │
│    → QuestAudio (voice quest)                            │
│    → QuestComplete (results)                             │
│    → Mark onboarding complete → Dashboard                │
│                                                          │
│  Returning user (onboarding_completed = true)            │
│    → Dashboard immediately                               │
└──────────────────────────────────────────────────────────┘
```

### Session Maintenance

- **Hook**: `useZoAuth()` — checks `localStorage.zo_user_id` on mount
- **Auto-sync**: If profile never synced, triggers `/api/zo/sync-profile` in background
- **Token refresh**: Expired access tokens refreshed via refresh token automatically
- **Logout**: Clears all `zo_*` keys from localStorage, shows LandingPage

### User Roles

| Role | How Assigned | Permissions |
|------|-------------|-------------|
| **Citizen** | Default for all new users | Can create events (pending review), RSVP |
| **Member** | Set via admin | Standard access |
| **Founder** | Has founder NFTs or membership=founder | Events auto-approved, elevated trust |
| **Admin** | Manual role assignment | Full access, can approve/reject anything |
| **Vibe Curator** | Manual role assignment | Can approve events, manage vibe checks |

---

## 2. Event Creation (Current Flow)

### Overview

Users create events through a **5-step modal**. Events are either **auto-approved** (Founders/Admins) or **pending review** (Citizens). Currently there is no community voting — pending events just sit until an admin acts.

### Flow

```
┌──────────────────────────────────────────────────────────┐
│  USER CLICKS "Host Event"                                │
│  Opens HostEventModal.tsx (5-step wizard)                │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  STEP 1 — TYPE                                           │
│  EventTypeSelector.tsx                                   │
│  Pick: community | sponsored | ticketed                  │
│                                                          │
│  STEP 2 — VIBE (Culture)                                 │
│  CultureSelector.tsx                                     │
│  Pick from 19 cultures:                                  │
│  science_technology, business, design, food, game,       │
│  health_fitness, music_entertainment, photography,       │
│  spiritual, travel_adventure, sport, etc.                │
│                                                          │
│  STEP 3 — DETAILS                                        │
│  Title (5-100 chars), Description (max 2000),            │
│  Start/End times, Cover image upload (optional)          │
│                                                          │
│  STEP 4 — LOCATION                                       │
│  LocationSelector.tsx                                    │
│  Pick: zo_property (Zo House) | custom (address) |      │
│        online (link)                                     │
│  Mapbox autocomplete for custom addresses                │
│                                                          │
│  STEP 5 — REVIEW                                         │
│  Preview all details, confirm submission                 │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  POST /api/events                                        │
│  /api/events/route.ts                                    │
│                                                          │
│  1. Auth check: x-user-id header                         │
│                                                          │
│  2. Determine host type & auto-approval:                 │
│     ┌─────────────────────────────────────────────┐      │
│     │ Admin / Vibe-Curator → status: 'approved'   │      │
│     │ Founder              → status: 'approved'   │      │
│     │ Citizen              → status: 'pending'    │      │
│     └─────────────────────────────────────────────┘      │
│                                                          │
│  3. Validate: title length, times in future, etc.        │
│                                                          │
│  4. Insert into `canonical_events` table                 │
│     - Generate canonical_uid for deduplication           │
│     - Default timezone: Asia/Kolkata                     │
│                                                          │
│  5. Auto-RSVP host as 'going' in `event_rsvps`          │
└──────────────┬───────────────────────────────────────────┘
               │
               ├── If approved → Event is live immediately
               │
               └── If pending → ??? (no review process exists)
```

### What's Stored

**`canonical_events` table** — one row per event:

```
id                  UUID (PK)
canonical_uid       TEXT (dedup key: "community-{userId}-{timestamp}")
title               TEXT
description         TEXT
category            "community" | "sponsored" | "ticketed"
culture             One of 19 EventCulture values
starts_at           TIMESTAMPTZ
ends_at             TIMESTAMPTZ
tz                  TEXT (timezone)
location_type       "zo_property" | "custom" | "online"
location_name       TEXT
location_raw        TEXT (address string)
lat / lng           coordinates
host_id             TEXT → users.id
host_type           "citizen" | "founder_member" | "admin"
submission_status   "draft" | "pending" | "approved" | "rejected" | "cancelled"
max_capacity        INTEGER (null = unlimited)
current_rsvp_count  INTEGER (auto-updated)
cover_image_url     TEXT
```

### RSVP System

```
User clicks RSVP
       │
       ▼
POST /api/events/[id]/rsvp
       │
       ├── New user → status set to 'interested' (needs host approval)
       │
       ├── Host approves → status changes to 'going'
       │
       ├── At capacity? → auto-downgrade to 'waitlist'
       │
       └── Someone cancels → oldest waitlisted auto-promoted to 'going'
```

### The Problem

When a **Citizen** creates an event, `submission_status` = `'pending'` — but **nothing happens next**. There is no review queue, no notification to admins, and no community input. The event just sits in the database unseen.

---

## 3. Event Creation (Proposed — Vibe Check Governance)

### Concept

Instead of events going into a black hole when pending, they enter a **Vibe Check** — sent directly to the city's **token-gated Telegram group**. Each city has a Telegram group that's gated by Founder NFT ownership. The founders in that group upvote or downvote the proposal via a Telegram bot. They are the gatekeepers of the city's event quality.

### The Pieces

**1. City Founders** — who can vote:
- Hold a Founder NFT (contract `0xf9e6...ba12`) → `founder_nfts_count > 0`
- Or `users.role = 'Founder'` / `zo_membership = 'founder'`
- Scoped to city via `home_city_id`

**2. Token-Gated Telegram Groups** — where voting happens:
- Each city has a Telegram group (e.g. "Zo Founders - Bangalore")
- Entry gated by Founder NFT ownership (verified on join)
- This is where the vibe check bot posts proposals
- Founders vote with inline buttons directly in Telegram

**3. Zo Vibe Check Bot** — the bridge (new component):
- Telegram bot that posts event proposals to the right city group
- Provides inline keyboard: [Upvote] [Downvote] + optional reply for feedback
- Tallies votes and syncs results back to the database
- Resolves the vibe check when threshold is met or window expires

### Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────────┐
│  ZOHM Web   │─────▶│  ZOHM API    │─────▶│  Telegram Bot API   │
│  (Frontend) │      │  (Next.js)   │      │  (Bot posts to TG)  │
└─────────────┘      └──────┬───────┘      └──────────┬──────────┘
                            │                         │
                            ▼                         ▼
                     ┌──────────────┐      ┌─────────────────────┐
                     │  Supabase    │◀─────│  City Founders TG   │
                     │  (DB)        │      │  Group (token-gated) │
                     └──────────────┘      └─────────────────────┘
                                                      │
                                           Founders vote via
                                           inline buttons
```

### Proposed Flow

```
┌──────────────────────────────────────────────────────────┐
│  CITIZEN CREATES EVENT (same 5-step modal)               │
│  submission_status = 'pending'                           │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  VIBE CHECK CREATED                                      │
│                                                          │
│  1. Determine city from event location                   │
│  2. Look up city's Telegram group chat_id                │
│     (stored in `cities` table or config)                 │
│  3. Insert row in `vibe_checks` table                    │
│  4. Bot posts proposal card to Telegram group:           │
│                                                          │
│  ┌────────────────────────────────────────┐              │
│  │  NEW VIBE CHECK                        │              │
│  │                                        │              │
│  │  "Rooftop Yoga at Zo House"            │              │
│  │  Culture: Health & Fitness             │              │
│  │  When: Feb 15, 6:00 PM                │              │
│  │  Where: Zo House Bangalore            │              │
│  │  By: @username                         │              │
│  │                                        │              │
│  │  [  Upvote  ]  [  Downvote  ]         │              │
│  │  0 up / 0 down — needs 3 votes        │              │
│  │  Expires in 48 hours                   │              │
│  └────────────────────────────────────────┘              │
│                                                          │
│  Inline keyboard buttons for voting                      │
│  Bot tracks who voted to enforce 1-vote-per-founder      │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  FOUNDERS VOTE IN TELEGRAM                               │
│                                                          │
│  Founder taps [Upvote] or [Downvote]                     │
│  Bot:                                                    │
│    1. Verify voter is in eligible_founder_ids            │
│    2. Check no duplicate vote                            │
│    3. Record vote in `vibe_check_votes` table            │
│    4. Update tallies on `vibe_checks` row                │
│    5. Edit the Telegram message to show updated count    │
│    6. Founders can also reply to the message as feedback │
│       → bot captures reply as vote comment               │
│                                                          │
│  After each vote, check if resolution triggered:         │
│    - All founders voted? → resolve now                   │
│    - Quorum met + clear majority? → resolve now          │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  RESOLUTION                                              │
│                                                          │
│  Auto-approve if:                                        │
│    - Quorum met (>= 3 founder votes) AND                 │
│    - >= 60% upvotes                                      │
│    → event.submission_status = 'approved'                │
│    → Bot edits TG message: "APPROVED"                   │
│    → Proposer notified in-app                            │
│                                                          │
│  Auto-reject if:                                         │
│    - Quorum met AND < 60% upvotes                        │
│    → event.submission_status = 'rejected'                │
│    → Bot edits TG message: "REJECTED"                   │
│    → Proposer notified with founder feedback             │
│                                                          │
│  Voting window expires without quorum:                   │
│    - Bot posts reminder 12h before expiry                │
│    - If still no quorum → escalate to admin              │
│    - Bot edits TG message: "EXPIRED — sent to admin"    │
│                                                          │
│  Override:                                               │
│    - Admin / Vibe Curator can /approve or /reject        │
│      via bot command in TG, bypassing the vote           │
│    - Or via admin dashboard on web                       │
└──────────────────────────────────────────────────────────┘
```

### Proposed Database Schema

**Add `tg_founders_chat_id` to `cities` table** — maps each city to its Telegram group:

```sql
ALTER TABLE cities
  ADD COLUMN tg_founders_chat_id TEXT,           -- Telegram chat ID for the city's founders group
  ADD COLUMN tg_founders_group_name TEXT;         -- e.g. "Zo Founders - Bangalore"
```

**`vibe_checks` table** — one row per proposal:

```sql
CREATE TABLE vibe_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What's being voted on
  event_id        UUID REFERENCES canonical_events(id) ON DELETE CASCADE,
  city_id         TEXT REFERENCES cities(id),

  -- Who proposed it
  proposer_id     TEXT REFERENCES users(id),

  -- Founders group snapshot (captured at creation time)
  eligible_founder_ids  TEXT[] NOT NULL,          -- array of user IDs
  eligible_founder_count INTEGER NOT NULL,

  -- Telegram integration
  tg_chat_id      TEXT NOT NULL,                  -- Telegram group where proposal was posted
  tg_message_id   INTEGER,                        -- Telegram message ID (for editing vote counts)

  -- Voting rules
  approval_threshold  NUMERIC DEFAULT 0.6,        -- 60% upvotes needed
  min_quorum          INTEGER DEFAULT 3,           -- minimum founder votes required
  voting_window_hours INTEGER DEFAULT 48,

  -- Current tallies (denormalized for fast reads)
  upvotes         INTEGER DEFAULT 0,
  downvotes       INTEGER DEFAULT 0,
  total_votes     INTEGER DEFAULT 0,

  -- Lifecycle
  status          TEXT DEFAULT 'open',            -- open | approved | rejected | expired | overridden
  resolved_at     TIMESTAMPTZ,
  resolved_by     TEXT REFERENCES users(id),      -- null if auto-resolved, set if admin/curator override
  resolution_note TEXT,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ                     -- created_at + voting_window_hours
);
```

**`vibe_check_votes` table** — one row per vote:

```sql
CREATE TABLE vibe_check_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_check_id   UUID REFERENCES vibe_checks(id) ON DELETE CASCADE,
  user_id         TEXT REFERENCES users(id),

  vote            TEXT NOT NULL,                  -- 'up' | 'down'
  comment         TEXT,                           -- optional feedback (captured from TG reply)
  tg_user_id      TEXT,                           -- Telegram user ID (for linking TG identity to Zo user)

  created_at      TIMESTAMPTZ DEFAULT now(),

  UNIQUE(vibe_check_id, user_id)                 -- one vote per founder
);
```

### Telegram Bot — Identity Linking

The bot needs to map **Telegram users → Zo users** to verify founder status. Two approaches:

**Option A: Link on first vote** (lightweight)
```
1. Founder taps [Upvote] in Telegram
2. Bot checks: is this tg_user_id linked to a Zo user?
   - YES → verify founder status, record vote
   - NO  → Bot DMs them a link: "Link your Zo account to vote"
           → Link opens ZOHM web with a one-time token
           → User confirms → tg_user_id saved to users table
```

**Option B: Link on group join** (stricter)
```
1. When founder joins the token-gated TG group, bot verifies NFT
2. Bot asks them to link Zo account at that point
3. All future votes are pre-linked
```

**New column on `users` table**:
```sql
ALTER TABLE users ADD COLUMN tg_user_id TEXT UNIQUE;
```

### Voter Eligibility

Only **Founders in the event's city who are in the Telegram group** can vote:

**At vibe check creation** (snapshot):
```sql
SELECT id FROM users
WHERE home_city_id = :event_city_id
  AND (role = 'Founder' OR founder_nfts_count > 0)
  AND onboarding_completed = true
  AND tg_user_id IS NOT NULL           -- must have linked Telegram
→ stored as eligible_founder_ids[]
```

**At vote time** (bot verifies):
```
1. Map tg_user_id → Zo user_id via users table
2. user_id must be IN vibe_checks.eligible_founder_ids
3. No existing vote on this vibe_check (one vote per founder)
```

### How It Connects to Existing Systems

| Existing System | Role in Vibe Check |
|----------------|-------------------|
| **users.role / founder_nfts_count** | Determines who is in the founders group |
| **users.home_city_id** | Scopes the founders group to the event's city |
| **Host Type** | Founders creating events bypass vibe check (already auto-approved) — only Citizens go through it |
| **City Stages** | Small cities (Stage 1, < 10 users) may have 0-1 founders — fallback to admin review |
| **Reputation** (4 traits) | Not used for vote weight, but visible on voter profiles for context |
| **Admin / Vibe Curator role** | Override power — can approve/reject at any time |

### Edge Cases

| Scenario | Handling |
|----------|---------|
| **City has no TG group configured** | Skip vibe check, escalate to admin queue |
| **City has 0 founders in TG** | Skip vibe check, escalate to admin queue |
| **City has < 3 founders** (below quorum) | Lower quorum to match founder count (min 1), or escalate to admin |
| **Founder votes then loses NFT** | Vote stands — eligibility was locked at snapshot time |
| **TG user not linked to Zo account** | Bot DMs them a link to connect accounts before voting |
| **Proposer withdraws event** | Cancel vibe check, bot edits TG message: "WITHDRAWN", set status = 'withdrawn' |
| **Event start date is < 48 hours away** | Shorten voting window to `starts_at - 2 hours`, or fast-track to admin |
| **Same user proposes multiple events** | Each gets its own vibe check — no rate limiting yet (could add later) |
| **Bot goes down** | Votes in DB are source of truth; bot catches up on restart, edits stale TG messages |

### Telegram Bot Commands

| Command | Who | What |
|---------|-----|------|
| (inline button) **Upvote** | Founders | Vote up on a proposal |
| (inline button) **Downvote** | Founders | Vote down on a proposal |
| (reply to proposal) | Founders | Adds comment/feedback to the vibe check |
| `/approve <event_id>` | Admin / Vibe Curator | Override: instant approve |
| `/reject <event_id>` | Admin / Vibe Curator | Override: instant reject |
| `/status <event_id>` | Anyone in group | Show current vote tally |
| `/link` | Anyone | Link Telegram account to Zo account |

### Updated Event Creation Flow (Complete)

```
User creates event
       │
       ├── Is user Founder/Admin/Vibe-Curator?
       │     YES → auto-approve, skip vibe check, event is live
       │
       │     NO (Citizen) ↓
       │
       ├── Determine city from event location
       │     - zo_property → look up node's city
       │     - custom address → nearest city by lat/lng
       │     - online → proposer's home_city_id
       │
       ├── Find City Founders Group
       │     SELECT * FROM users
       │       WHERE home_city_id = :city AND role/NFT = Founder
       │
       │     ├── 0 founders? → skip vibe check, send to admin queue
       │     └── 1+ founders? ↓
       │
       ├── Create vibe_check row
       │     - Link to event + city
       │     - Snapshot eligible_founder_ids[]
       │     - Set expiry (now + 48h, or sooner if event is soon)
       │     - Set quorum = min(3, founder_count)
       │
       ├── Notify City Founders Group
       │     - Push notification / in-app alert
       │     - "New event proposal in [City] — cast your vibe check"
       │     - Shows: event title, culture, date, location, proposer
       │
       ├── Founders Vote (up to 48 hours)
       │     - Each founder: upvote / downvote + optional comment
       │     - Proposer sees: vote count + comments (not who voted)
       │     - If all founders voted early → resolve immediately
       │     - Proposer can withdraw event during this phase
       │
       └── Resolution
             ├── Quorum met + >= 60% up → APPROVED, event goes live
             ├── Quorum met + < 60% up  → REJECTED, host gets feedback
             ├── No quorum at expiry    → escalate to admin queue
             └── Admin/Curator override → instant approve/reject
```

---

## 4. Key Database Tables

### Existing Tables (Modified)

| Table | Change | Purpose |
|-------|--------|---------|
| `users` | Add `tg_user_id TEXT UNIQUE` | Link Zo identity to Telegram identity |
| `cities` | Add `tg_founders_chat_id TEXT`, `tg_founders_group_name TEXT` | Map city to its token-gated TG group |

### Existing Tables (Unchanged, but involved)

| Table | Role in This System |
|-------|-------------------|
| `users` | Identity, role, home_city_id, founder_nfts_count — determines founders group |
| `canonical_events` | The event being proposed |
| `event_rsvps` | Post-approval attendance tracking |
| `cities` | City identity, stage (affects quorum rules) |
| `nodes` | Zo property locations (for city lookup from zo_property events) |

### New Tables

| Table | Purpose |
|-------|---------|
| `vibe_checks` | One proposal per pending citizen event, tracks TG message ID + founders snapshot + vote tallies |
| `vibe_check_votes` | Individual founder votes with TG user mapping and optional feedback comments |

### New Component

| Component | Tech | Purpose |
|-----------|------|---------|
| **Zo Vibe Check Bot** | Node.js + Telegram Bot API (or `grammy`/`telegraf` library) | Posts proposals to TG, handles inline votes, syncs results to Supabase |

---

## 5. File Reference

### Authentication

| File | Purpose |
|------|---------|
| `components/LandingPage.tsx` | Entry point, "Tune into Zo World" |
| `components/PhoneLoginModal.tsx` | OTP input UI |
| `lib/zo-api/auth.ts` | sendOTP(), verifyOTP() |
| `lib/zo-api/client.ts` | ZO API HTTP client + device headers |
| `app/api/zo/auth/send-otp/route.ts` | Backend: forward OTP request |
| `app/api/zo/auth/verify-otp/route.ts` | Backend: verify + create/find user |
| `app/api/zo/sync-profile/route.ts` | Sync full ZO profile to Supabase |
| `hooks/useZoAuth.ts` | Client auth state management |
| `lib/userDb.ts` | User CRUD operations |

### Event Creation

| File | Purpose |
|------|---------|
| `components/events/HostEventModal.tsx` | 5-step creation wizard |
| `components/events/EventTypeSelector.tsx` | Category picker |
| `components/events/CultureSelector.tsx` | Culture/vibe picker |
| `components/events/LocationSelector.tsx` | Location picker |
| `app/api/events/route.ts` | POST (create) + GET (list) |
| `app/api/events/[id]/route.ts` | PUT (edit) + DELETE (cancel) |
| `app/api/events/[id]/rsvp/route.ts` | RSVP create + host manage |
| `app/api/events/mine/route.ts` | User's hosted + attended events |
| `app/api/events/geojson/route.ts` | Map markers |
| `types/events.ts` | All event TypeScript types |

### Reputation & City (For Vibe Check Eligibility)

| File | Purpose |
|------|---------|
| `lib/reputationService.ts` | 4-trait reputation system |
| `lib/streakService.ts` | Login/quest/event/checkin streaks |
| `lib/cityService.ts` | City CRUD, sync, leaderboard |
| `app/api/vibe-score/route.ts` | Node-level vibe scoring |
| `hooks/useVibeScore.ts` | Frontend vibe score hook |

*All paths relative to `apps/web/src/`*

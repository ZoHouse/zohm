# Zo World — System Flows

**Version**: 1.0
**Last Updated**: February 2026

---

## Table of Contents

1. [User Authentication (Login)](#1-user-authentication-login)
2. [Event Creation](#2-event-creation-current-flow)
3. [Vibe Check — Telegram Event Governance](#3-vibe-check--telegram-event-governance)
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

### What Happens to Pending Events?

When a **Citizen** creates an event, `submission_status` = `'pending'`. If the **Vibe Check** feature flag is enabled (`FEATURE_VIBE_CHECK_TELEGRAM`), the event is automatically sent to the Telegram approval group for community voting. See [Section 3](#3-vibe-check--telegram-event-governance) for the full flow.

---

## 3. Vibe Check — Telegram Event Governance

### Overview

When a **Citizen** or **Member** creates an event, `submission_status` is set to `'pending'`. If the `FEATURE_VIBE_CHECK_TELEGRAM` flag is enabled, the event is automatically sent to a **single Telegram approval group** ("Zo Events Approval") where any group member can vote. After a **24-hour window**, a cron worker resolves the check: **simple majority** (upvotes > downvotes) = approved, otherwise rejected.

This replaces the previous black hole where pending events sat indefinitely.

### Key Design Decisions

| Decision | What Was Built |
|----------|---------------|
| **Single group** | One approval group (env: `TELEGRAM_VIBE_CHECK_CHAT_ID`), not per-city |
| **Any member votes** | Any Telegram group member can vote — not restricted to founders |
| **Simple majority** | `upvotes > downvotes` = approved. No quorum, no 60% threshold |
| **24-hour window** | Fixed expiry, not variable based on event start time |
| **Cron resolution** | Worker runs every 15 min, resolves expired checks in batch |
| **Non-blocking** | `createVibeCheck()` errors are caught and logged, never block event creation |
| **Feature-flagged** | Behind `FEATURE_VIBE_CHECK_TELEGRAM` (default: `false`) |

### Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│  ZOHM Web   │────▶│  POST /api/events    │────▶│  Telegram Bot API   │
│  (Frontend) │     │  (Next.js API route) │     │  (sendMessage /     │
└─────────────┘     └──────────┬───────────┘     │   sendPhoto)        │
                               │                 └──────────┬──────────┘
                               │                            │
                               ▼                            ▼
                        ┌──────────────┐          ┌─────────────────────┐
                        │  Supabase    │◀─────────│  Zo Events Approval │
                        │  (DB)        │          │  TG Group           │
                        └──────┬───────┘          └──────────┬──────────┘
                               │                             │
                               │                  Members vote via
                               │                  inline buttons
                               ▼                             │
                  ┌────────────────────────┐                 │
                  │  Webhook: /api/        │◀────────────────┘
                  │  webhooks/telegram     │   (callback_query)
                  │  → handleVote()        │
                  └────────────────────────┘
                               │
                  ┌────────────────────────┐
                  │  Cron (every 15 min):  │
                  │  /api/worker/          │
                  │  resolve-vibe-checks   │
                  │  → resolveExpired()    │
                  └────────────────────────┘
```

### Flow

```
┌──────────────────────────────────────────────────────────┐
│  CITIZEN/MEMBER CREATES EVENT (same 5-step modal)        │
│  submission_status = 'pending'                           │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  VIBE CHECK CREATED (non-blocking)                       │
│  Condition: FEATURE_VIBE_CHECK_TELEGRAM=true             │
│             AND submission_status='pending'               │
│                                                          │
│  1. Insert row in `vibe_checks` table                    │
│     - event_id, tg_chat_id from env                      │
│     - expires_at = now + 24 hours                        │
│                                                          │
│  2. Bot posts proposal card to TG group:                 │
│                                                          │
│  ┌────────────────────────────────────────┐              │
│  │  🎯 NEW VIBE CHECK                    │              │
│  │                                        │              │
│  │  📌 "Rooftop Yoga at Zo House"        │              │
│  │  🎨 Health & Fitness                  │              │
│  │  📅 Feb 15, 6:00 PM                  │              │
│  │  📍 Zo House Bangalore               │              │
│  │  👤 Hosted by: @username              │              │
│  │                                        │              │
│  │  👍 0  |  👎 0                        │              │
│  │  ⏰ Voting ends: [expires_at]         │              │
│  │                                        │              │
│  │  [👍 Upvote]  [👎 Downvote]           │              │
│  └────────────────────────────────────────┘              │
│                                                          │
│  3. Store tg_message_id back on vibe_checks row          │
│     - If event has cover_image_url → sendPhoto()         │
│     - Otherwise → sendMessage()                          │
│     - tg_message_type tracks which was used              │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  GROUP MEMBERS VOTE IN TELEGRAM                          │
│                                                          │
│  Member taps [👍 Upvote] or [👎 Downvote]               │
│  → POST /api/webhooks/telegram (callback_query)          │
│  → callback_data format: "vibe:{up|down}:{vibeCheckId}"  │
│                                                          │
│  handleVote():                                           │
│    1. Parse callback_data                                │
│    2. Insert vote in `vibe_check_votes`                  │
│       (UNIQUE constraint prevents duplicates)            │
│    3. Recount upvotes/downvotes from votes table         │
│    4. Update tallies on `vibe_checks` row                │
│    5. Edit TG message with updated counts                │
│    6. answerCallbackQuery() to dismiss loading state     │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  RESOLUTION (cron every 15 min)                          │
│  POST /api/worker/resolve-vibe-checks                    │
│  → resolveExpiredVibeChecks()                            │
│                                                          │
│  Finds: all vibe_checks WHERE status='open'              │
│         AND expires_at <= now                             │
│                                                          │
│  For each expired check:                                 │
│    upvotes > downvotes → APPROVED                        │
│    otherwise           → REJECTED                        │
│                                                          │
│  Actions:                                                │
│    1. Update vibe_checks.status + resolved_at            │
│    2. Update canonical_events.submission_status           │
│    3. Edit TG message: "✅ APPROVED" or "❌ REJECTED"    │
│       (inline buttons removed)                           │
│    4. If approved + FEATURE_LUMA_API_SYNC=true:          │
│       → pushEventToLuma() (publish to Luma calendar)     │
└──────────────────────────────────────────────────────────┘
```

### Database Schema

**`vibe_checks` table** — one row per pending event:

```sql
CREATE TABLE vibe_checks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES canonical_events(id) ON DELETE CASCADE,
  tg_chat_id      TEXT NOT NULL,                  -- Telegram group ID (from env)
  tg_message_id   INTEGER,                        -- Telegram message ID (for editing)
  tg_message_type TEXT DEFAULT 'text',            -- 'text' or 'photo'
  upvotes         INTEGER DEFAULT 0,
  downvotes       INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'open'
                  CHECK (status IN ('open', 'approved', 'rejected')),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL            -- created_at + 24 hours
);

CREATE INDEX idx_vibe_checks_status_expires ON vibe_checks(status, expires_at);
```

**`vibe_check_votes` table** — one row per vote:

```sql
CREATE TABLE vibe_check_votes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_check_id   UUID NOT NULL REFERENCES vibe_checks(id) ON DELETE CASCADE,
  tg_user_id      TEXT NOT NULL,                  -- Telegram user ID (string for large IDs)
  vote            TEXT NOT NULL CHECK (vote IN ('up', 'down')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vibe_check_id, tg_user_id)              -- one vote per TG user
);
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `FEATURE_VIBE_CHECK_TELEGRAM` | Enable/disable vibe check system (default: `false`) |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API auth token |
| `TELEGRAM_VIBE_CHECK_CHAT_ID` | Target Telegram group ID |

### Edge Cases

| Scenario | Handling |
|----------|---------|
| **Feature flag disabled** | Pending events sit until manual admin action (pre-vibe-check behavior) |
| **Bot API error on create** | Caught and logged, event still created as pending |
| **Duplicate vote attempt** | UNIQUE constraint on `(vibe_check_id, tg_user_id)` — vote silently rejected |
| **Zero votes at expiry** | 0 > 0 is false → rejected |
| **Tie (equal up/down)** | Not strictly greater → rejected |
| **Event cancelled before resolution** | Vibe check still resolves on schedule (no cascading cancel yet) |

### File Reference

| File | Purpose |
|------|---------|
| `lib/telegram/vibeCheck.ts` | `createVibeCheck()`, `handleVote()`, `resolveExpiredVibeChecks()` |
| `lib/telegram/bot.ts` | Raw Telegram Bot API wrapper (sendMessage, sendPhoto, editMessage, answerCallbackQuery) |
| `lib/telegram/types.ts` | Telegram API + domain types (`VibeCheck`, `VibeCheckVote`, `VibeCheckStatus`) |
| `app/api/webhooks/telegram/route.ts` | Webhook receiver — parses `callback_data` and calls `handleVote()` |
| `app/api/worker/resolve-vibe-checks/route.ts` | Cron endpoint — calls `resolveExpiredVibeChecks()` |
| `lib/featureFlags.ts` | `isVibeCheckEnabled()` — reads `FEATURE_VIBE_CHECK_TELEGRAM` |

*All paths relative to `apps/web/src/`*

---

## 4. Key Database Tables

### Tables Involved in Auth + Events + Vibe Check

| Table | Role |
|-------|------|
| `users` | Identity, role, membership — determines host type and auto-approval |
| `canonical_events` | The event record. `submission_status` drives the vibe check trigger |
| `event_rsvps` | Post-approval attendance tracking |
| `vibe_checks` | One row per pending event sent to Telegram. Tracks message ID, vote tallies, expiry |
| `vibe_check_votes` | Individual votes keyed by Telegram user ID. UNIQUE constraint prevents duplicates |

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

### Vibe Check (Telegram Governance)

| File | Purpose |
|------|---------|
| `lib/telegram/vibeCheck.ts` | `createVibeCheck()`, `handleVote()`, `resolveExpiredVibeChecks()` |
| `lib/telegram/bot.ts` | Raw Telegram Bot API wrapper |
| `lib/telegram/types.ts` | Telegram + domain types |
| `app/api/webhooks/telegram/route.ts` | Webhook receiver for inline button votes |
| `app/api/worker/resolve-vibe-checks/route.ts` | Cron endpoint (every 15 min) |
| `lib/featureFlags.ts` | `isVibeCheckEnabled()` |

### Reputation & City

| File | Purpose |
|------|---------|
| `lib/reputationService.ts` | 4-trait reputation system |
| `lib/streakService.ts` | Login/quest/event/checkin streaks |
| `lib/cityService.ts` | City CRUD, sync, leaderboard |
| `app/api/vibe-score/route.ts` | Node-level vibe scoring |
| `hooks/useVibeScore.ts` | Frontend vibe score hook |

*All paths relative to `apps/web/src/`*

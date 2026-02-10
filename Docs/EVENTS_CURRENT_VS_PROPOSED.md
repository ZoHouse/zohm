# Events System — Current vs Proposed

> Reference doc comparing what's built today with the proposed architecture in ZO_EVENTS_SYSTEM.md.
> Framed around the three event types in the HostEventModal.

---

## The Three Event Types

The HostEventModal (Step 1: EventTypeSelector) offers three paths:

```
User opens "Host an Event"
  │
  ├── [Community-Led]  → 5-step modal → POST /api/events → approve or vibe check → Luma
  │                       BUILT — full flow working
  │
  ├── [Sponsored]      → window.open(Typeform) → modal closes → ???
  │                       HALF-BUILT — Typeform link works, but nothing catches the submission
  │                       ZO_EVENTS_SYSTEM.md Flow 2 = the missing backend for this path
  │
  └── [Ticketed]       → disabled, "Coming Soon" badge
                          NOT BUILT
```

### What's wired today

| Type | UI | Backend | Post-creation |
|------|----|---------|---------------|
| **Community** | 5-step modal (vibe → details → location → review) | `POST /api/events` → `canonical_events` table | Founders/Admins: auto-approved → Luma push. Citizens: `pending` → vibe check → cron resolves → Luma push |
| **Sponsored** | Click opens `https://zostel.typeform.com/to/LgcBfa0M` in new tab | **Nothing** — Typeform submissions are not received by any webhook | **Nothing** — no processing, no matching, no notification |
| **Ticketed** | Disabled button with "Coming Soon" | Nothing | Nothing |

**The Typeform URL is hardcoded** at `HostEventModal.tsx:29`:
```ts
const DEFAULT_SPONSORED_FORM_URL = 'https://zostel.typeform.com/to/LgcBfa0M';
```
This matches the form ID in ZO_EVENTS_SYSTEM.md (`TYPEFORM_FORM_ID=LgcBfa0M`). The front door exists — the back of the house is empty.

---

## Community Events — Current System (Built)

### Flow

```
HostEventModal (5 steps)
  → POST /api/events
  → getHostTypeAndStatus(user):
      admin / vibe-curator  →  host_type: 'admin',          status: 'approved'
      founder / NFT holder  →  host_type: 'founder_member',  status: 'approved'
      citizen               →  host_type: 'citizen',         status: 'pending'
  → Insert into canonical_events
  → Auto-RSVP host as "going"
  → If approved + LUMA_API_SYNC:  pushEventToLuma() (fire-and-forget)
  → If pending + VIBE_CHECK_TG:   createVibeCheck() (fire-and-forget)
```

### Vibe Check (pending events)

```
createVibeCheck()
  → Insert vibe_checks row (expires in 24h)
  → Post card to TG group (photo or text) with [Upvote] [Downvote] buttons
  → Store tg_message_id

TG member taps button → POST /api/webhooks/telegram
  → Parse callback: "vibe:{up|down}:{vibeCheckId}"
  → handleVote() → insert vibe_check_votes (UNIQUE prevents duplicates)
  → Recount votes, update tally on TG message

Cron (every 15 min) → POST /api/worker/resolve-vibe-checks
  → resolveExpiredVibeChecks()
  → upvotes > downvotes = approved, else rejected
  → Update canonical_events.submission_status
  → Edit TG message with result, remove buttons
  → If approved + LUMA_API_SYNC → pushEventToLuma()
```

### Luma Integration

Bidirectional sync, fully built:

| Direction | What | How |
|-----------|------|-----|
| Zo → Luma (push) | Approved events | `pushEventToLuma()` — geo-routes to BLR or Global calendar |
| Zo → Luma (update) | Edited events | `updateEventOnLuma()` |
| Zo → Luma (RSVP) | New RSVPs | `pushRsvpToLuma()` — requires user email |
| Luma → Zo (webhook) | Event + guest updates | `POST /api/webhooks/luma` — upserts canonical_events and event_rsvps |
| Luma → Zo (pull) | Bulk sync | `POST /api/worker/sync-luma` — paginates Luma API |

### RSVP System

Full lifecycle: going → interested → waitlist → check-in. Capacity enforcement, auto-promotion from waitlist, host approval for "going" status. Luma guest sync on each RSVP action.

### Additional Endpoints

- `GET /api/events` — list with filters (category, culture, status, host, date range, pagination)
- `GET /api/events/[id]` — single event with RSVP stats
- `PUT /api/events/[id]` — edit (host or admin)
- `DELETE /api/events/[id]` — soft-delete (sets `cancelled`)
- `GET /api/events/mine` — user's hosted + attended events
- `GET /api/events/geojson` — map markers with bbox filter
- `GET /api/events/cultures` — active culture list from DB
- `POST /api/events/upload-cover` — image upload to Supabase Storage

### Files (30+)

**API Routes:** `events/route.ts`, `events/[id]/route.ts`, `events/[id]/rsvp/route.ts`, `events/cultures/route.ts`, `events/upload-cover/route.ts`, `events/mine/route.ts`, `events/geojson/route.ts`, `events/canonical/route.ts`, `webhooks/telegram/route.ts`, `webhooks/luma/route.ts`, `worker/resolve-vibe-checks/route.ts`, `worker/sync-luma/route.ts`, `luma/setup/route.ts`

**Libraries:** `lib/telegram/` (vibeCheck.ts, bot.ts, types.ts), `lib/luma/` (client.ts, config.ts, eventPush.ts, rsvpSync.ts, syncWorker.ts, types.ts), `lib/featureFlags.ts`, `lib/cultures.ts`

**UI:** `components/events/` (HostEventModal, EditEventModal, EventTypeSelector, CultureSelector, LocationSelector, ImageUpload)

**Types:** `types/events.ts` (413 lines — EventCategory, EventCulture, SubmissionStatus, HostType, etc.)

---

## Sponsored Events — Proposed System (ZO_EVENTS_SYSTEM.md)

### What it proposes

A Python-based backend (`ZoEventsmaster/` repo) that catches the Typeform submission and runs it through a venue matching → team review → quote generation → email pipeline. All orchestrated through the same Telegram group used for vibe checks.

### Flow

```
User clicks [Sponsored] in HostEventModal
  → Opens Typeform (LgcBfa0M) in new tab
  → User fills: name, email, phone, company, event type, location, dates,
    guest count, budget, duration, requirements checklist, notes
  → Typeform sends webhook

webhook.py (Flask server)
  → Validate signature
  → Parse fields → INSERT into event_inquiries (status: 'new')
  → Trigger venue matching

venue_matcher.py
  → Score all venues in Zoeventsmaster against inquiry:
      Location match:     0-40 pts (exact city=40, region=20)
      Capacity match:     0-20 pts (hall capacity >= guests)
      Requirements match: 0-30 pts (6 pts each: projector, music, catering, outdoor, accommodation)
      Operational status: 0-10 pts (active=5, full data=5)
  → Return top 3: best match + 2 alternatives with reasoning

zo_bot.py
  → Post inquiry summary to Telegram group:
      Contact info, event details, requirements
      Best matched venue + score + reasoning
      Alternative venues
      [Generate Quote] button
  → Store telegram_message_id

Team (Boldrin / Samurai) reviews in Telegram
  → Click [Generate Quote]

quote_engine.py (triggered by TG button callback)
  → Pull venue pricing from Zoeventsmaster:
      Venue rate (half-day / full-day / multi-day)
      F&B (buffet per pax × guests × days)
      Additional services (AV, music, cleanup)
      Accommodation (if needed)
      Seasonal adjustment
      GST (18%)
  → Store quote_json in event_inquiries
  → Edit TG message with quote summary

email_sender.py (via Resend)
  → Send professional quote email to user:
      Event summary, venue details, cost breakdown table,
      terms, CTA, Zo Events contact info
  → Update event_inquiries status: 'quoted'
  → Confirm in Telegram: "Quote sent to user@email.com"
```

### Fallback

`cron_typeform_poll.py` (every 10 min) — polls Typeform API for missed webhooks, catches any submissions the webhook missed.

### New Infrastructure Required

| Component | Stack | Purpose |
|-----------|-------|---------|
| `webhook.py` | Python / Flask | Receive Typeform webhooks |
| `venue_matcher.py` | Python | Score venues from Zoeventsmaster |
| `quote_engine.py` | Python | Calculate pricing from venue data |
| `email_sender.py` | Python / Resend SDK | Send quote emails |
| `cron_typeform_poll.py` | Python / cron | Fallback Typeform polling |
| `zo_bot.py` | Python / python-telegram-bot | Post inquiry cards, handle [Generate Quote] callback |
| `event_inquiries` table | Supabase | 25+ columns: contact, event details, requirements, venue match, quote, status |
| Resend account | SaaS | Email delivery (100/day free tier) |
| Flask deployment | Railway / Render | Webhook server hosting |

### Blocker

**Pricing columns in Zoeventsmaster are currently empty.** The quote engine cannot generate automated quotes until ops fills in rates for venues. The proposed doc handles this with a "Request Manual Quote" fallback button that just notifies the team.

---

## Vibe Check — Current vs Proposed Differences

The proposed doc re-describes the vibe check (Flow 1) in Python, but it's already built in TypeScript. Key differences:

| Aspect | Current (TypeScript) | Proposed (Python) |
|--------|---------------------|-------------------|
| Vote changing | Rejected ("You already voted!") | Allowed (UPDATE existing vote) |
| Callback format | `vibe:{up\|down}:{id}` | `vc_up:{id}` / `vc_down:{id}` |
| Card format | HTML, cover photo, culture emoji | Richer: host @username, countdown timer, vibe label |
| Host cancel | Not implemented | Host can cancel before resolution |
| Host DM | Not implemented | Optional DM on approval/rejection |
| Bot error state | Not handled | `error` status if bot removed from group |
| 0-0 tie | Implicitly rejected (0 > 0 is false) | Explicitly documented as rejection |

---

## Database: Current vs Proposed

### Shared Tables

Both systems use Supabase and share: `vibe_checks`, `vibe_check_votes`. Column naming differs (`tg_` vs `telegram_` prefix, text vs bigint for IDs).

### Current-Only Tables

| Table | Purpose |
|-------|---------|
| `canonical_events` | Main events table (UUID PKs, 30+ columns) |
| `event_rsvps` | RSVP lifecycle (going/interested/waitlist/check-in/luma sync) |
| `event_cultures` | 19 culture definitions with emoji, color, assets |

### Proposed-Only Tables

| Table | Purpose |
|-------|---------|
| `events` | Simpler events table (bigint PKs, 20 columns, host contact fields embedded) |
| `event_inquiries` | Typeform submissions, venue match results, quote data, status tracking |

### Key Schema Divergence: Events Table

The proposed `events` table is **not the same** as the current `canonical_events`:

- Current stores `host_id` (FK to users) — proposed embeds `host_name`, `host_email`, `host_phone`, `host_telegram_id`
- Current has `culture` (19 values) — proposed has generic `category` text
- Current has `location_type` (zo_property/custom/online) + lat/lng — proposed has `venue_name` (FK-like to Zoeventsmaster)
- Current tracks Luma sync status granularly — proposed just has `luma_synced` boolean
- Current has `cover_image_url`, `source_type`, `current_rsvp_count` — proposed doesn't

**Recommendation:** Don't create the proposed `events` table. Use the existing `canonical_events` table for community events. The `event_inquiries` table is genuinely new and should be created separately — it serves a different purpose (B2B inquiries, not community events).

---

## Architecture Decision

The proposed doc assumes a **separate Python service** in the `ZoEventsmaster/` repo. But the vibe check is already built in TypeScript within the Next.js monorepo. Three options:

### Option 1: Hybrid (Recommended)

Keep vibe check in Next.js (already working). Build the sponsored/inquiry pipeline in Python as a separate service.

**Pros:** No rework. Python is natural for the venue matching + quote engine (data processing). Separate deployment.
**Cons:** Two systems sharing one Telegram bot token and one Supabase DB. Need to coordinate callback data formats to avoid collisions.

**Shared resources:**
- Supabase DB (both read/write)
- Telegram bot token (vibe check callbacks handled by Next.js webhook, inquiry callbacks handled by Python bot)
- Telegram group (both flows post to same group)

**Collision risk:** The callback data formats must not overlap. Current uses `vibe:up:123` / `vibe:down:123`. Proposed uses `vc_up:123` / `gen_quote:456`. These are distinct — no collision.

### Option 2: All Python

Rebuild vibe check in Python. Single codebase for both flows.

**Pros:** Single system, single deployment, consistent codebase.
**Cons:** Throws away working TypeScript code. Loses the tight integration with Next.js event creation (currently the vibe check is triggered inline in `POST /api/events`). Would need a separate mechanism to detect new pending events (DB polling or webhook from Next.js to Python).

### Option 3: All Next.js

Build the inquiry pipeline as new API routes in the existing monorepo.

**Pros:** Single codebase, single deployment, reuses existing patterns (feature flags, Supabase client, Telegram bot wrapper).
**Cons:** Venue matching and quote generation are data-heavy — TypeScript is less natural for this. Typeform webhook handling needs a new route. The inquiry flow is operationally separate from the community event flow.

---

## Known Issues in Current System

1. **No vote changing** — UNIQUE insert fails; should allow UPDATE to switch vote
2. **Review step always says "Founder Member"** — `HostEventModal.tsx:379` hardcodes the message regardless of user role
3. **Culture slug mismatch** — `EventCulture` (types/events.ts) vs `CultureType` (lib/cultures.ts) have 6 differing slugs
4. **No webhook signature verification** — Telegram and Luma webhooks don't validate authenticity
5. **Luma sync pagination broken** — `syncWorker.ts` never passes cursor to subsequent API calls
6. **PUT endpoint leaks status control** — Host can set `submission_status` to `approved` via PUT
7. **No user email in DB** — Luma RSVP sync needs email but users table may not have it
8. **Geo-radius filtering stub** — `GET /api/events` parses lat/lng/radius but never applies them

---

## Supabase Reality Check (queried Feb 10, 2026)

### Table Inventory

| Table | Rows | Columns | Status |
|-------|------|---------|--------|
| `Zoeventsmaster` | **103** | 239 | Live — 101 active venues, DCF-crawled. **All pricing columns empty (0/103).** |
| `event_inquiries` | **0** | 14 | Created but empty. Simpler than proposed (14 vs 25+ cols). |
| `canonical_events` | **7** | 39 | Community events only. 5 approved, 1 pending, 1 cancelled. No Luma sync yet. |
| `vibe_checks` | **0** | 11 | Ready, FK to canonical_events. No checks triggered yet. |
| `vibe_check_votes` | **0** | 5 | Ready. |
| `event_rsvps` | **15** | ~10 | RSVPs for the 7 community events. |
| `event_registrations` | **587** | 5 | **Legacy table** — uses `evt-*` IDs from ZO API/CAS, not UUIDs. Not referenced in current Next.js code. |
| `event_cultures` | **19** | ~10 | Culture definitions with emoji, color, assets. |

### Zoeventsmaster Venue Breakdown

```
103 venues total (101 active, 2 unknown)

By category:    Zostel: 69, Zostel Homes: 24, Zostel Plus: 8, Zo Houses: 2
By region:      North: 48, South: 28, West: 9, Rajasthan: 7, J&K: 4, East/NE: 3, Central: 2, International: 2
Event capable:  Convention hall: 4, Projector: 11, Speakers: 21
Pricing data:   0/103 venues have any pricing filled in
```

### event_inquiries — Gap Analysis

The table exists with 14 columns but is missing fields needed for the full pipeline:

| Has (14 cols) | Missing for venue matching | Missing for quoting | Missing for TG |
|---------------|---------------------------|--------------------|-----------------
| `id`, `typeform_token`, `host_name`, `host_email`, `host_phone`, `organization`, `event_type`, `venue_preference`, `event_date`, `expected_headcount`, `budget`, `inquiry_status`, `created_at`, `updated_at` | `matched_venue`, `match_score`, `match_reasoning`, `alternative_venues` (jsonb) | `quote_json` (jsonb), `quote_total`, `quote_sent_at` | `telegram_message_id`, `telegram_chat_id` |
| | Also missing: `duration`, `needs_projector`, `needs_music`, `needs_catering`, `needs_accommodation`, `needs_convention_hall`, `needs_outdoor_area`, `additional_notes`, `status_notes` | | |

### canonical_events — Actual Data

```
pickleball tourney          | community | approved  | founder_member  | luma: none
Fortnite                    | community | approved  | founder_member  | luma: none
Futsal                      | community | cancelled | founder_member  | luma: none
Kayaking                    | community | approved  | founder_member  | luma: none
Zo Hackathon                | community | approved  | founder_member  | luma: none
Citizen Declaration Party   | community | pending   | citizen         | luma: none
Design                      | community | approved  | founder_member  | luma: none
```

Note: "Citizen Declaration Party" is pending but has no vibe_check row — it was likely created before the vibe check code was deployed.

### event_registrations — Legacy System

587 registrations using `evt-*` prefixed IDs (e.g., `evt-24daadDGZnwmRB0`). These are from the ZO API/CAS event system, not from `canonical_events`. This table is not referenced anywhere in the current Next.js codebase. Schema is minimal: `id` (UUID), `event_id` (text), `user_id` (text), `registration_status` (text), `updated_at`.

---

## Strategy: Best Way Forward

### What you already have working

1. **Community event flow** — end-to-end: UI → API → auto-approve/pending → RSVP
2. **Vibe Check code** — ready in TypeScript, feature-flagged, just needs a real pending event to trigger
3. **Luma integration** — bidirectional sync code, API keys configured, calendars verified
4. **Zoeventsmaster** — 103 venues with 239 columns of property data (no pricing yet)
5. **event_inquiries table** — exists, just needs columns added
6. **Typeform** — form configured, UI link wired

### What's blocking

| Blocker | Impact | Effort to unblock |
|---------|--------|-------------------|
| **Pricing columns empty (0/103)** | Quote engine can't auto-generate quotes | Manual ops work — not a code problem |
| **event_inquiries missing 15+ columns** | Can't store venue match results, quotes, or TG tracking | Single ALTER TABLE migration |
| **No Typeform webhook receiver** | Sponsored form submissions go nowhere | New API route or Python service |
| **No venue matcher** | Can't auto-match inquiries to venues | New code (~200 lines) |
| **No quote engine** | Can't auto-calculate pricing (also blocked by empty pricing) | New code (~150 lines), blocked by pricing data |
| **No email sender** | Can't send quotes to users | New code (~50 lines) + Resend account |

### Recommended Approach: Build in Next.js (Option 3)

Given what exists, building the sponsored pipeline in Next.js (not Python) makes the most sense:

**Why:**
- Same Supabase client, same auth, same feature flags, same deployment (Vercel)
- Telegram bot wrapper already exists (`lib/telegram/bot.ts`)
- The venue matcher is a Supabase query + scoring logic — TypeScript handles this fine
- Keeps everything in one monorepo, one deploy, one set of env vars
- No need to coordinate two systems sharing a TG bot token

**Implementation order:**

```
Phase 1 — Wire the Typeform (unblocks data flow)
  1. ALTER TABLE event_inquiries — add missing columns
  2. POST /api/webhooks/typeform — receive + parse submissions
  3. POST /api/worker/poll-typeform — fallback cron

Phase 2 — Venue Matching + TG Notification
  4. lib/venue/matcher.ts — score venues from Zoeventsmaster
  5. lib/telegram/inquiryNotification.ts — post inquiry card to TG group
  6. Wire: typeform webhook → match → notify

Phase 3 — Quote + Email (blocked on pricing data)
  7. lib/venue/quoteEngine.ts — calculate from venue pricing
  8. lib/email/quoteSender.ts — Resend integration
  9. TG callback: [Generate Quote] → quote → email
  10. Fallback: [Request Manual Quote] for venues without pricing

Phase 4 — Polish
  11. Fix vibe check vote changing (allow up↔down switch)
  12. Fix HostEventModal review step (role-aware message)
  13. Luma push for approved community events (test with real event)
```

**Phase 1 can ship immediately** — it just catches Typeform submissions and stores them. Even without venue matching or quoting, you'll at least stop losing inquiries.

---

## Summary

| Event Type | Frontend | Backend | DB | Status |
|------------|----------|---------|-----|--------|
| **Community** | 5-step HostEventModal | Full pipeline: create → approve/vibe check → Luma → RSVP | `canonical_events` (7 rows), `vibe_checks`, `event_rsvps` | **Built** |
| **Sponsored** | Opens Typeform in new tab | **Nothing catches it today.** Proposed: webhook → venue match → TG → quote → email | `event_inquiries` (exists, 0 rows, needs columns), `Zoeventsmaster` (103 venues, no pricing) | **DB exists, code not built** |
| **Ticketed** | Disabled button | Nothing | `is_ticketed`/`ticket_price` columns exist on `canonical_events` | **Not started** |

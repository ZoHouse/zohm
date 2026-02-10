# Zo Events System — Complete Architecture

> Single Telegram bot, single group, two flows, two cron jobs.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Flow 1 — Vibe Check (Community Event Governance)](#flow-1--vibe-check-community-event-governance)
3. [Flow 2 — Event Inquiry Pipeline (Typeform → Quote)](#flow-2--event-inquiry-pipeline-typeform--quote)
4. [Telegram Bot — Zo Events Bot](#telegram-bot--zo-events-bot)
5. [Database Schema](#database-schema)
6. [Cron Jobs](#cron-jobs)
7. [Venue Matching Engine](#venue-matching-engine)
8. [Quote Generation Engine](#quote-generation-engine)
9. [Email System](#email-system)
10. [File Structure](#file-structure)
11. [Environment Variables](#environment-variables)
12. [Implementation Phases](#implementation-phases)

---

## System Overview

The Zo Events System handles two distinct event flows through a single Telegram bot operating in a single Telegram group (the Zo Events group with Boldrin and Samurai from the Zo team).

### Existing Infrastructure

| Component | Status | Details |
|-----------|--------|---------|
| **Supabase** | Live | `Zoeventsmaster` table — 103 venues, 235+ columns (DCF-crawled property data + empty ops-fill pricing columns) |
| **Typeform** | Configured | Token + Form ID `LgcBfa0M` — form at `https://zostel.typeform.com/to/LgcBfa0M` |
| **Google Sheets API** | Live | OAuth credentials for DCF crawling |
| **Dashboard** | Live | `dashboard.html` — card-based venue directory reading from Supabase |
| **Luma API** | Configured | BLR calendar (`cal-ZVonmjVxLk7F2oM`) + Zo Events calendar (`cal-3YNnBTToy9fnnjQ`), geo-routed push |

### What Gets Built

| Component | Purpose |
|-----------|---------|
| `zo_bot.py` | Telegram bot — posts proposals, handles votes, sends inquiry summaries, handles quote button |
| `webhook.py` | Flask server — receives Typeform webhooks |
| `cron_vibe_check.py` | Cron job 1 — resolves expired Vibe Check polls every 15 minutes |
| `cron_typeform_poll.py` | Cron job 2 — polls Typeform API for new responses (fallback if webhook fails) |
| `venue_matcher.py` | Matches inquiry preferred location → best Zoeventsmaster venue |
| `quote_engine.py` | Calculates event quote from venue pricing data |
| `email_sender.py` | Sends formatted quote emails to users |
| 4 new Supabase tables | `events`, `vibe_checks`, `vibe_check_votes`, `event_inquiries` |

---

## Flow 1 — Vibe Check (Community Event Governance)

### Purpose

An automated governance layer that allows the Zo community to approve or reject events proposed by Citizens or Members via Telegram voting.

### Actors

| Actor | Role |
|-------|------|
| **Citizen / Member** | Creates an event on the web platform |
| **Zo Events Bot** | Posts the proposal card to Telegram |
| **Community (Telegram group)** | Votes on the proposal |
| **Cron Worker** | Resolves the vote after 24 hours |
| **Luma** | (Optional) Receives approved events for ticketing |

### Step-by-Step Flow

```
Step 1: EVENT CREATION
──────────────────────
Who:    Citizen or Member on the Zo web platform
What:   Creates a new event (title, category, date, venue, description)
Result: Row inserted into `events` table with submission_status = 'pending'
Trigger: If vibe_check feature flag is enabled → proceed to Step 2

Step 2: VIBE CHECK INITIATION
──────────────────────────────
Who:    System (zo_bot.py)
What:   Detects new pending event (via DB polling or direct trigger)
Action:
  1. Creates a row in `vibe_checks` table (status = 'open', expires_at = NOW() + 24h)
  2. Posts proposal card to Telegram group with inline buttons
  3. Stores `telegram_message_id` and `telegram_chat_id` in vibe_checks row
Result: Community can now vote

Step 3: COMMUNITY VOTING
─────────────────────────
Who:    Any member of the Telegram group
What:   Taps [Upvote] or [Downvote] inline button
Rules:
  - One vote per Telegram user per poll (enforced by UNIQUE constraint
    on vibe_check_votes(vibe_check_id, telegram_user_id))
  - Changing vote: allowed — old vote is updated, not duplicated
  - Bot updates the tally on the message in real-time after each vote
  - Countdown timer shows remaining time (e.g., "18h remaining")

Step 4: RESOLUTION (24-Hour Window)
────────────────────────────────────
Who:    cron_vibe_check.py (runs every 15 minutes)
What:   Checks for polls where expires_at < NOW() and status = 'open'
Logic:  Simple majority rule
  - upvotes > downvotes  →  APPROVED
  - upvotes <= downvotes →  REJECTED
  - Tie (including 0-0)  →  REJECTED (no community signal = no approval)

Step 5a: IF APPROVED
────────────────────
Actions:
  1. UPDATE events SET submission_status = 'approved'
  2. UPDATE vibe_checks SET status = 'approved', resolved_at = NOW()
  3. Edit Telegram message:
     - Remove inline buttons
     - Update card to show "APPROVED" banner
     - Show final vote tally
  4. (Optional) If Luma sync enabled:
     - Create event on Luma via API
     - Store luma_event_id in events table
     - Set luma_synced = true
  5. (Optional) Notify host via Telegram DM that their event was approved

Step 5b: IF REJECTED
────────────────────
Actions:
  1. UPDATE events SET submission_status = 'rejected'
  2. UPDATE vibe_checks SET status = 'rejected', resolved_at = NOW()
  3. Edit Telegram message:
     - Remove inline buttons
     - Update card to show "REJECTED" banner
     - Show final vote tally
  4. (Optional) Notify host via Telegram DM with feedback
```

### Telegram Card Format — Vibe Check Proposal

**While voting is open:**

```
VIBE CHECK — New Event Proposal

"Sunset Acoustic Session"
Vibe: Music / Live Performance
An intimate acoustic evening featuring local artists
    performing original compositions on the rooftop.

Sat, March 15, 2026 - 5:00 PM – 8:00 PM
Zo House Vagator, Goa
Host: @rahul_music

7 up  -  2 down  -  14h remaining

[Upvote (7)]  [Downvote (2)]
```

**After approval:**

```
APPROVED — Community Vibe Check Passed

"Sunset Acoustic Session"
Vibe: Music / Live Performance
Sat, March 15, 2026 - 5:00 PM – 8:00 PM
Zo House Vagator, Goa
Host: @rahul_music

Final Tally: 12 up  -  3 down
Resolved: March 11, 2026 at 2:30 PM

Event is now live on the platform.
```

**After rejection:**

```
REJECTED — Community Vibe Check Failed

"Sunset Acoustic Session"
Vibe: Music / Live Performance
Sat, March 15, 2026 - 5:00 PM – 8:00 PM
Zo House Vagator, Goa
Host: @rahul_music

Final Tally: 3 up  -  8 down
Resolved: March 11, 2026 at 2:30 PM
```

### Edge Cases — Vibe Check

| Scenario | Handling |
|----------|----------|
| User votes twice | UNIQUE constraint prevents duplicate; if re-tapping same button, ignore. If switching vote (up→down), update the existing row and adjust tallies. |
| 0 votes after 24h | Treated as rejection (no community interest = no approval) |
| Bot removed from group | Graceful error handling; mark vibe_check as `error` status |
| Event cancelled by host before resolution | Mark event as `cancelled`, edit Telegram message to show "CANCELLED BY HOST", stop accepting votes |
| Message deleted in Telegram | Cron still resolves based on DB vote counts; Telegram edit will fail silently |

---

## Flow 2 — Event Inquiry Pipeline (Typeform → Quote)

### Purpose

External users (corporate clients, wedding planners, event organizers) submit an inquiry via Typeform. The system matches them to the best Zo venue, notifies the Zo team on Telegram with a summary, and provides a one-click quote generation button.

### Actors

| Actor | Role |
|-------|------|
| **External User** | Fills out the Typeform event inquiry |
| **Typeform** | Sends webhook on form submission |
| **Flask Webhook Server** | Receives and processes the submission |
| **Venue Matcher** | Finds best venue from Zoeventsmaster |
| **Zo Events Bot** | Posts summary to Telegram group |
| **Boldrin / Samurai** | Reviews inquiry, clicks "Generate Quote" |
| **Quote Engine** | Calculates pricing from venue data |
| **Email Sender** | Sends quote to the external user |

### Step-by-Step Flow

```
Step 1: FORM SUBMISSION
───────────────────────
Who:    External user (corporate client, event planner, etc.)
What:   Clicks Typeform link → fills out event inquiry form
Fields collected:
  - Full name
  - Email address
  - Phone number
  - Company / Organization (optional)
  - Event type (corporate offsite, wedding, music event, workshop, community gathering, other)
  - Preferred location (city / area — free text or dropdown of Zo cities)
  - Preferred date(s)
  - Expected guest count
  - Budget range (dropdown: <50K, 50K-1L, 1-2L, 2-5L, 5L+)
  - Duration (half day / full day / multi-day)
  - Requirements checklist:
    - Projector / AV setup
    - Music / Sound system
    - Catering / F&B
    - Accommodation for guests
    - Convention hall / Large space
    - Outdoor / Garden area
  - Additional notes (free text)
Result: Typeform sends webhook to our Flask server

Step 2: WEBHOOK PROCESSING
──────────────────────────
Who:    webhook.py (Flask server)
What:   Receives POST from Typeform
Action:
  1. Validate webhook signature (WEBHOOK_SECRET)
  2. Parse Typeform response payload → extract field values
  3. Check for duplicate (typeform_response_id already in DB?)
  4. INSERT into `event_inquiries` table with status = 'new'
  5. Trigger venue matching (Step 3)

Step 3: VENUE MATCHING
──────────────────────
Who:    venue_matcher.py
What:   Finds the best venue from Zoeventsmaster for this inquiry
Input:  preferred_location, guest_count, event_type, requirements
Logic:  (See "Venue Matching Engine" section below)
Output:
  - matched_venue (property_name)
  - match_reasoning (human-readable explanation)
  - match_score (numeric confidence)
  - alternative_venues (up to 2 runner-ups)
Action: UPDATE event_inquiries SET matched_venue, match_reasoning

Step 4: TELEGRAM NOTIFICATION
─────────────────────────────
Who:    zo_bot.py
What:   Posts formatted inquiry summary to Telegram group
Content:
  - Inquiry details (who, what, when, how many, budget)
  - Best matched venue with reasoning
  - Alternative venue suggestions
  - Inline button: [Generate Quote]
Action: Store telegram_message_id in event_inquiries row

Step 5: TEAM REVIEW
───────────────────
Who:    Boldrin or Samurai (in Telegram group)
What:   Reads the inquiry summary
Options:
  a) Click [Generate Quote] → proceeds to Step 6
  b) Ignore / discuss in group chat → manual follow-up

Step 6: QUOTE GENERATION
─────────────────────────
Who:    quote_engine.py (triggered by Telegram button callback)
What:   Calculates a detailed cost breakdown
Input:  event_inquiries row + matched venue's pricing data from Zoeventsmaster
Output: Structured quote with line items (see "Quote Generation Engine" section)
Action:
  1. Generate quote breakdown
  2. Store in event_inquiries.quote_json
  3. UPDATE event_inquiries SET status = 'quoted'
  4. Edit Telegram message to show quote summary + new status
  5. Trigger email (Step 7)

Step 7: EMAIL TO USER
─────────────────────
Who:    email_sender.py
What:   Sends a professional quote email to the inquiring user
Content:
  - Greeting with user's name
  - Event summary (type, date, guests)
  - Venue details (name, location, photos link, key amenities)
  - Cost breakdown table:
    - Venue charges (half-day / full-day rate)
    - F&B package (per pax x guest count)
    - Additional services (AV, music, etc.)
    - Subtotal
    - GST (18%)
    - Grand total
  - Terms & conditions
  - CTA: "Reply to confirm" or "Schedule a call"
  - Zo Events team contact info
Action:
  1. Send email
  2. UPDATE event_inquiries SET status = 'quoted', quote_sent_at = NOW()
  3. Confirm in Telegram: "Quote sent to user@email.com"
```

### Telegram Card Format — Event Inquiry

**Initial summary posted:**

```
NEW EVENT INQUIRY #42

Rahul Sharma - rahul@techcorp.com - +91-98765-43210
TechCorp Solutions

Event Details
   Type: Corporate Team Offsite
   Date: March 15-16, 2026 (2 days)
   Guests: 45 people
   Budget: 2-5L
   Duration: Multi-day

Requirements
   Convention hall: Yes    Projector / AV: Yes
   Catering: Yes           Accommodation: Yes
   Music system: No        Outdoor area: No

Notes: "Looking for a peaceful hill station venue
   for our annual team offsite. Need good WiFi for
   presentations and breakout rooms."

----------------------------------------------

BEST MATCH: Zostel Manali
   Manali, Himachal Pradesh - North
   Hall: Yes (60 pax capacity)
   Projector: Yes (+ backup)
   Catering: In-house
   Rooms: Available
   WiFi: Yes
   Match Score: 92%

   Also consider:
   - Zostel Shimla (85%) — smaller hall, 40 pax
   - Zo House Rishikesh (78%) — no hall, but large common area

----------------------------------------------

[Generate Quote]
```

**After quote is generated:**

```
EVENT INQUIRY #42 — QUOTED

Rahul Sharma - TechCorp Solutions
Corporate Team Offsite - March 15-16 - 45 guests

Venue: Zostel Manali

Quote Summary
   Venue (2 days x 15,000/day)       30,000
   F&B (45 pax x 800/day x 2)       72,000
   AV Setup                           5,000
   ─────────────────────────────
   Subtotal                         1,07,000
   GST (18%)                         19,260
   ─────────────────────────────
   Grand Total                      1,26,260

Quote sent to rahul@techcorp.com
March 10, 2026 at 3:45 PM
```

### Edge Cases — Event Inquiry

| Scenario | Handling |
|----------|----------|
| Duplicate Typeform submission | Check `typeform_response_id` — skip if already exists |
| No venue matches location | Post to Telegram with "No direct match — manual review needed", list closest alternatives |
| Venue has no pricing data | Quote button shows "Pricing not available for this venue — please quote manually" |
| User preferred location is vague ("mountains") | Match against region instead of city; show multiple options |
| Webhook delivery fails | Cron job 2 polls Typeform API as fallback, catches missed submissions |
| Multiple people click "Generate Quote" | Idempotent — if quote_json already exists, just re-display it |

---

## Telegram Bot — Zo Events Bot

### Identity

| Field | Value |
|-------|-------|
| Name | Zo Events Bot |
| Username | TBD (e.g., `@ZoEventsBot`) |
| Group | Zo Events Approval Group |
| Role | Admin (needed to edit messages and pin) |

### Callback Data Format

All inline button presses route through a single callback handler. The callback data string encodes the action:

```
CALLBACK DATA FORMAT:

Vibe Check votes:
  "vc_up:{vibe_check_id}"      →  Upvote on vibe check
  "vc_down:{vibe_check_id}"    →  Downvote on vibe check

Event inquiry actions:
  "gen_quote:{inquiry_id}"     →  Generate quote for inquiry

Future (extensible):
  "approve_manual:{event_id}"  →  Manual override approve
  "reject_manual:{event_id}"   →  Manual override reject
  "change_venue:{inquiry_id}"  →  Pick different venue for inquiry
```

### Bot Behavior

```python
# Callback routing pseudocode

def handle_callback(callback_query):
    data = callback_query.data
    user_id = callback_query.from_user.id

    if data.startswith("vc_up:"):
        vibe_check_id = int(data.split(":")[1])
        record_vote(vibe_check_id, user_id, "up")
        update_tally_on_message(vibe_check_id)

    elif data.startswith("vc_down:"):
        vibe_check_id = int(data.split(":")[1])
        record_vote(vibe_check_id, user_id, "down")
        update_tally_on_message(vibe_check_id)

    elif data.startswith("gen_quote:"):
        inquiry_id = int(data.split(":")[1])
        quote = generate_quote(inquiry_id)
        send_quote_email(inquiry_id, quote)
        update_telegram_message_with_quote(inquiry_id, quote)
```

### Bot Permissions Required

| Permission | Why |
|------------|-----|
| Send messages | Post proposal cards and inquiry summaries |
| Edit messages | Update vote tallies, show resolution results, show quote |
| Read messages | Not strictly needed (bot reacts to callbacks only) |
| Inline buttons | Core interaction mechanism |
| Admin (optional) | Pin important messages, manage group if needed |

---

## Database Schema

### Existing Table

#### `Zoeventsmaster` (103 rows, 235+ columns)

The venue directory. Key columns relevant to the events system:

**Identity & Location:**
- `property_name` (text, UNIQUE, upsert key)
- `category` (text) — Zostel, Zo Houses, Zostel Homes, Zostel Plus
- `region` (text) — North, South, East, West
- `city` (text)
- `operational_status` (text) — Active / Inactive

**Event Space:**
- `convention_hall_available` (text) — Yes/No
- `convention_hall_capacity` (text)
- `events_stage` (text) — Yes/No
- `lounge` (text) — Yes/No
- `has_projector`, `has_backup_projector` (text)
- `has_speakers`, `has_backup_speakers` (text)
- `has_mic` (text)
- `rooftop_access` (text)
- `garden` (text)

**Pricing (ops-filled — currently empty, to be populated):**
- `hourly_rate`, `half_day_rate`, `full_day_rate` (text)
- `min_booking_hours` (text)
- `buffet_veg_per_pax`, `buffet_nonveg_per_pax` (text)
- `appetizer_tier1_price`, `appetizer_tier2_price`, `appetizer_tier3_price` (text)
- `drink_station_non_alc_price`, `drink_station_alc_price` (text)
- `cleanup_fee`, `security_deposit` (text)
- `peak_season_multiplier`, `offseason_discount_pct` (text)

**Music & Policy:**
- `amplified_music_allowed` (text) — Yes/No
- `music_allowed_until` (text) — e.g., "10 PM"
- `live_music_allowed`, `dj_allowed` (text)
- `max_noise_level_db` (text)

**Time Slots:**
- `slot_morning`, `slot_afternoon`, `slot_evening`, `slot_late_night` (text)
- `earliest_start_time`, `latest_end_time` (text)

**Crawled Data (JSON blobs):**
- `raw_dcf_json` (jsonb) — all 170+ DCF fields
- `rooms_json` (jsonb) — room/space data
- `room_details_json` (jsonb) — per-room amenities
- `meals_pricing_json` (jsonb) — meal pricing from DCF
- `team_details_json` (jsonb) — staff info
- `event_space_photos_json` (jsonb) — photos

---

### New Table: `events`

Community-created events that go through Vibe Check.

```sql
CREATE TABLE "events" (
    id              bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Event details
    title           text NOT NULL,
    description     text DEFAULT '',
    category        text DEFAULT '',           -- the "Vibe": music, workshop, film, community, wellness, etc.
    event_date      timestamptz,
    end_date        timestamptz,
    duration_hours  numeric,

    -- Host info
    host_name       text DEFAULT '',
    host_email      text DEFAULT '',
    host_phone      text DEFAULT '',
    host_telegram_id text DEFAULT '',          -- Telegram user ID for DM notifications
    host_telegram_username text DEFAULT '',    -- @username for display

    -- Venue
    venue_name      text DEFAULT '',           -- FK-like ref to Zoeventsmaster.property_name
    venue_city      text DEFAULT '',
    venue_region    text DEFAULT '',

    -- Requirements
    expected_guests int DEFAULT 0,
    needs_projector boolean DEFAULT false,
    needs_music     boolean DEFAULT false,
    needs_catering  boolean DEFAULT false,
    needs_accommodation boolean DEFAULT false,
    special_requirements text DEFAULT '',

    -- Status & governance
    submission_status text DEFAULT 'pending',  -- pending | approved | rejected | cancelled
    vibe_check_enabled boolean DEFAULT true,   -- feature flag per event

    -- Luma integration
    luma_event_id   text DEFAULT '',
    luma_synced     boolean DEFAULT false,

    -- Metadata
    created_at      timestamptz DEFAULT now(),
    updated_at      timestamptz DEFAULT now()
);

-- Index for pending events (bot polls for these)
CREATE INDEX idx_events_submission_status ON "events" (submission_status);
CREATE INDEX idx_events_venue ON "events" (venue_name);
```

---

### New Table: `vibe_checks`

One row per Vibe Check poll. Linked 1:1 to an event.

```sql
CREATE TABLE "vibe_checks" (
    id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Link to event
    event_id              bigint NOT NULL REFERENCES "events"(id) ON DELETE CASCADE,

    -- Telegram message tracking
    telegram_message_id   bigint,              -- message ID in the group (for editing)
    telegram_chat_id      bigint,              -- group chat ID

    -- Vote tallies (denormalized for fast display)
    upvotes               int DEFAULT 0,
    downvotes             int DEFAULT 0,

    -- Lifecycle
    status                text DEFAULT 'open', -- open | approved | rejected | cancelled
    expires_at            timestamptz NOT NULL, -- created_at + 24 hours
    resolved_at           timestamptz,          -- when cron resolved it

    -- Metadata
    created_at            timestamptz DEFAULT now()
);

-- Index for cron job: find expired open polls
CREATE INDEX idx_vibe_checks_resolution
    ON "vibe_checks" (status, expires_at)
    WHERE status = 'open';

-- One vibe check per event
CREATE UNIQUE INDEX idx_vibe_checks_event ON "vibe_checks" (event_id);
```

---

### New Table: `vibe_check_votes`

Individual votes. Enforces one vote per Telegram user per poll.

```sql
CREATE TABLE "vibe_check_votes" (
    id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Link to poll
    vibe_check_id       bigint NOT NULL REFERENCES "vibe_checks"(id) ON DELETE CASCADE,

    -- Voter identity
    telegram_user_id    bigint NOT NULL,        -- Telegram user ID
    telegram_username   text DEFAULT '',        -- @username (for audit/display)
    telegram_first_name text DEFAULT '',        -- display name

    -- The vote
    vote                text NOT NULL CHECK (vote IN ('up', 'down')),

    -- Metadata
    created_at          timestamptz DEFAULT now(),
    updated_at          timestamptz DEFAULT now(),

    -- One vote per user per poll (can UPDATE to change vote)
    UNIQUE (vibe_check_id, telegram_user_id)
);

CREATE INDEX idx_vibe_check_votes_poll ON "vibe_check_votes" (vibe_check_id);
```

---

### New Table: `event_inquiries`

Typeform submissions for external event inquiries.

```sql
CREATE TABLE "event_inquiries" (
    id                      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Typeform tracking
    typeform_response_id    text UNIQUE,        -- deduplication key

    -- Contact info
    name                    text DEFAULT '',
    email                   text DEFAULT '',
    phone                   text DEFAULT '',
    company_org             text DEFAULT '',

    -- Event details
    event_type              text DEFAULT '',     -- corporate, wedding, music, workshop, community, other
    preferred_location      text DEFAULT '',     -- city/area the user wants
    preferred_date          text DEFAULT '',     -- flexible text (could be range)
    guest_count             int DEFAULT 0,
    budget_range            text DEFAULT '',     -- <50K, 50K-1L, 1-2L, 2-5L, 5L+
    duration                text DEFAULT '',     -- half_day, full_day, multi_day

    -- Requirements (from checklist)
    needs_projector         boolean DEFAULT false,
    needs_music             boolean DEFAULT false,
    needs_catering          boolean DEFAULT false,
    needs_accommodation     boolean DEFAULT false,
    needs_convention_hall   boolean DEFAULT false,
    needs_outdoor_area      boolean DEFAULT false,
    additional_notes        text DEFAULT '',

    -- Venue matching
    matched_venue           text DEFAULT '',     -- property_name from Zoeventsmaster
    match_score             numeric,             -- 0-100
    match_reasoning         text DEFAULT '',     -- human-readable why
    alternative_venues      jsonb DEFAULT '[]',  -- [{name, score, reason}, ...]

    -- Quote
    quote_json              jsonb,               -- full breakdown (see Quote Engine section)
    quote_total             numeric,             -- grand total with GST
    quote_sent_at           timestamptz,

    -- Status tracking
    status                  text DEFAULT 'new',  -- new | matched | reviewing | quoted | confirmed | rejected | expired
    status_notes            text DEFAULT '',     -- internal team notes

    -- Telegram tracking
    telegram_message_id     bigint,              -- for editing the message after quote
    telegram_chat_id        bigint,

    -- Metadata
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now()
);

-- Index for status queries
CREATE INDEX idx_event_inquiries_status ON "event_inquiries" (status);

-- Prevent duplicate Typeform submissions
-- (already handled by UNIQUE on typeform_response_id)
```

---

## Cron Jobs

### Cron Job 1: `cron_vibe_check.py`

**Schedule:** Every 15 minutes
**Purpose:** Resolve expired Vibe Check polls

```
PSEUDOCODE:

1. Query: SELECT * FROM vibe_checks
          WHERE status = 'open' AND expires_at < NOW()

2. For each expired poll:

   a. Determine outcome:
      - IF upvotes > downvotes → result = 'approved'
      - ELSE → result = 'rejected'

   b. Update vibe_checks:
      SET status = result, resolved_at = NOW()

   c. Update events:
      SET submission_status = result, updated_at = NOW()

   d. Edit Telegram message:
      - Remove inline keyboard (buttons)
      - Replace card with final result banner
      - Show final vote tally

   e. IF result = 'approved' AND luma_sync_enabled:
      - Create event on Luma via API
      - UPDATE events SET luma_event_id = ..., luma_synced = true

   f. (Optional) Send DM to event host:
      - "Your event 'X' was approved/rejected by the community"

3. Log: "{n} vibe checks resolved ({approved} approved, {rejected} rejected)"
```

### Cron Job 2: `cron_typeform_poll.py`

**Schedule:** Every 10 minutes
**Purpose:** Fallback polling of Typeform API for missed webhooks

```
PSEUDOCODE:

1. GET https://api.typeform.com/forms/{TYPEFORM_FORM_ID}/responses
   ?since={last_poll_timestamp}
   Headers: Authorization: Bearer {TYPEFORM_API_TOKEN}

2. For each response:

   a. Check: Does typeform_response_id already exist in event_inquiries?
      - If yes → skip (already processed via webhook)
      - If no → process as new submission

   b. Parse fields → INSERT into event_inquiries

   c. Run venue matching

   d. Post to Telegram group

3. Update last_poll_timestamp (store in a small config table or file)

4. Log: "Polled Typeform: {n} new responses, {m} already processed"
```

---

## Venue Matching Engine

### `venue_matcher.py`

Matches an inquiry's preferred location and requirements to the best venue in Zoeventsmaster.

### Matching Algorithm

```
INPUT:
  - preferred_location: "Manali" or "mountains" or "Goa"
  - guest_count: 45
  - event_type: "corporate"
  - needs: {projector: true, catering: true, hall: true, ...}

STEP 1: LOCATION FILTER
  - Exact city match: WHERE city ILIKE '%{preferred_location}%'
  - If no results: region match (map "Manali" → "North", "Goa" → "West")
  - If still no results: return all active venues, flag "no direct match"

STEP 2: FEATURE SCORING (per venue)

  Location score (0-40 points):
    - Exact city match:    40
    - Same region:         20
    - Different region:     0

  Capacity score (0-20 points):
    - Has convention_hall AND capacity >= guest_count:  20
    - Has convention_hall but capacity < guest_count:   10
    - Has lounge/common area (may fit):                  5
    - No large space:                                    0

  Requirements score (0-30 points):
    For each requirement (projector, music, catering, outdoor, accommodation):
      - Venue has it:     6 points each (5 requirements x 6 = 30 max)
      - Venue lacks it:   0

  Operational score (0-10 points):
    - operational_status = 'Active':       5
    - crawl_status = 'ok' (full data):     5

STEP 3: RANK
  Total score = location + capacity + requirements + operational (max 100)
  Sort venues by score DESC
  Return top 3: best match + 2 alternatives

STEP 4: GENERATE REASONING
  Human-readable explanation for each match:
  "Zostel Manali — Exact city match, convention hall (60 pax) fits 45 guests,
   has projector and in-house catering. Full data available."

OUTPUT:
  {
    matched_venue: "Zostel Manali",
    match_score: 92,
    match_reasoning: "...",
    alternatives: [
      {name: "Zostel Shimla", score: 78, reason: "..."},
      {name: "Zo House Rishikesh", score: 65, reason: "..."}
    ]
  }
```

---

## Quote Generation Engine

### `quote_engine.py`

Calculates a structured price quote from venue data in Zoeventsmaster.

### Quote Calculation Logic

```
INPUT:
  - venue: Zoeventsmaster row for matched venue
  - inquiry: event_inquiries row (guest count, duration, requirements)

LINE ITEMS:

1. VENUE CHARGES
   - If duration = "half_day"  → venue.half_day_rate
   - If duration = "full_day"  → venue.full_day_rate
   - If duration = "multi_day" → venue.full_day_rate x number_of_days
   - If only hourly available  → venue.hourly_rate x estimated_hours

2. F&B PACKAGE (if needs_catering = true)
   - Buffet: venue.buffet_veg_per_pax x guest_count x days
   - Or non-veg: venue.buffet_nonveg_per_pax x guest_count x days
   - Beverages:
     - Non-alcoholic: venue.drink_station_non_alc_price x guest_count
     - Alcoholic (if requested): venue.drink_station_alc_price x guest_count
   - Appetizers: venue.appetizer_tier2_price x guest_count (default mid-tier)

3. ADDITIONAL SERVICES
   - AV / Projector setup: fixed fee (from venue data or default)
   - Music / Sound: fixed fee (if applicable)
   - Convention hall: venue.convention_hall_charges (if separate)

4. LOGISTICS
   - Cleanup fee: venue.cleanup_fee
   - Security deposit: venue.security_deposit (refundable — noted separately)
   - Parking: venue.parking_charges (if applicable)

5. ACCOMMODATION (if needs_accommodation = true)
   - Estimated from rooms_json: avg room rate x rooms needed x nights
   - (rooms needed ~ guest_count / 2 for shared, guest_count for private)

6. SEASONAL ADJUSTMENT
   - If event_date falls in venue.peak_season_dates:
     multiply subtotal by venue.peak_season_multiplier
   - If offseason: apply venue.offseason_discount_pct

7. TAX
   - GST: 18% on (subtotal - security_deposit)

8. GRAND TOTAL
   - Subtotal + GST + Security Deposit

OUTPUT FORMAT (stored in quote_json):
  {
    venue_name: "Zostel Manali",
    generated_at: "2026-03-10T15:45:00Z",
    currency: "INR",
    line_items: [
      {category: "Venue", description: "Full day rate x 2 days", amount: 30000},
      {category: "F&B", description: "Veg buffet x 45 pax x 2 days", amount: 72000},
      {category: "F&B", description: "Non-alc beverage station x 45 pax", amount: 9000},
      {category: "Services", description: "AV & Projector setup", amount: 5000},
      {category: "Logistics", description: "Cleanup fee", amount: 3000}
    ],
    subtotal: 119000,
    seasonal_adjustment: null,
    gst_rate: 0.18,
    gst_amount: 21420,
    security_deposit: 10000,
    grand_total: 150420,
    notes: [
      "Security deposit of 10,000 is refundable post-event.",
      "Prices are indicative and subject to final confirmation.",
      "Cancellation policy applies as per venue terms."
    ],
    valid_until: "2026-03-20T23:59:59Z"
  }
```

### Handling Missing Pricing Data

If a venue's ops-fill columns are empty (most are currently):

```
- Bot message shows: "Automated quote unavailable — pricing data pending for this venue."
- Telegram message includes: [Request Manual Quote] button instead
- This triggers a simpler notification to the team: "Please prepare a manual quote for inquiry #{id}"
- Status set to 'reviewing' instead of 'quoted'
```

---

## Email System

### `email_sender.py`

Sends quote emails to external users.

### Recommended Service: Resend

| Feature | Detail |
|---------|--------|
| Free tier | 100 emails/day, 3,000/month |
| API | Simple REST — single POST with JSON body |
| Python SDK | `pip install resend` |
| From address | Requires verified domain (e.g., `events@zo.world`) or use Resend's shared domain for testing |

### Email Template Structure

```
Subject: Your Event Quote from Zo Events — {event_type} at {venue_name}

Body:

Hi {name},

Thank you for your interest in hosting your {event_type} at {venue_name}!

Based on your requirements, here is our proposed quote:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EVENT SUMMARY
  Type:     {event_type}
  Date:     {preferred_date}
  Guests:   {guest_count} people
  Duration: {duration}
  Venue:    {venue_name}, {venue_city}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COST BREAKDOWN

  Venue Charges
    {duration} rate x {days}             {venue_cost}

  Food & Beverages
    Buffet ({guest_count} pax x {days})  {fb_cost}
    Beverages ({guest_count} pax)        {bev_cost}

  Additional Services
    AV & Projector setup                 {av_cost}
    Cleanup fee                          {cleanup}

  ─────────────────────────────────────
  Subtotal                               {subtotal}
  GST (18%)                              {gst}
  ─────────────────────────────────────
  Grand Total                            {grand_total}

  Security Deposit (refundable)          {deposit}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NOTES
  - This quote is valid until {valid_until}.
  - Security deposit is fully refundable post-event.
  - Final pricing confirmed upon booking.
  - Cancellation policy applies per venue terms.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To confirm this booking or discuss further, simply reply
to this email or reach out to us at events@zo.world.

We look forward to hosting your event!

Warm regards,
Zo Events Team
```

---

## File Structure

```
ZoEventsmaster/
├── .env                          # All API keys and secrets
├── requirements.txt              # Python dependencies
│
├── db.py                         # Supabase client singleton (EXISTS)
├── fetch_sheet.py                # Google Sheets → Supabase sync (EXISTS)
├── crawl_dcfs.py                 # DCF property crawler (EXISTS)
├── migrate_to_supabase.py        # One-time SQLite migration (EXISTS)
├── dashboard.html                # Venue directory dashboard (EXISTS)
│
├── zo_bot.py                     # NEW — Telegram bot (both flows)
├── webhook.py                    # NEW — Flask server for Typeform webhooks
├── venue_matcher.py              # NEW — Location → venue matching engine
├── quote_engine.py               # NEW — Price quote calculator
├── email_sender.py               # NEW — Send quote emails via Resend
├── cron_vibe_check.py            # NEW — Resolve expired polls (every 15 min)
├── cron_typeform_poll.py         # NEW — Poll Typeform for missed submissions
│
├── zo_events.db                  # Legacy SQLite (can be removed)
├── event_schema.txt              # Workflow documentation
├── ZO_EVENTS_SYSTEM.md           # THIS FILE — system architecture
│
├── client_secret_*.json          # Google OAuth credentials
└── token.json                    # Cached Google auth tokens
```

---

## Environment Variables

### Current `.env` (additions marked with NEW)

```bash
# -- Existing --

# Supabase
SUPABASE_URL=https://elvaqxadfewcsohrswsi.supabase.co
SUPABASE_KEY=<service_role_key>
SUPABASE_ANON_KEY=<anon_key>

# Typeform
TYPEFORM_API_TOKEN=<your_typeform_token>
TYPEFORM_FORM_ID=LgcBfa0M

# Google
GOOGLE_CLIENT_SECRET_PATH=./client_secret_...json
DCF_SHEET_ID=1BTz8Q2bX4n4aU0kK2wnkNPkelyEtklGuw2rkCBVxnEA

# Luma
LUMA_BLR_API_KEY=<your-blr-api-key>
LUMA_ZO_EVENTS_API_KEY=<your-zo-events-api-key>

# -- NEW --

# Telegram Bot
TELEGRAM_BOT_TOKEN=<from_botfather>
TELEGRAM_GROUP_CHAT_ID=<events_approval_group>

# Email (Resend)
RESEND_API_KEY=<from_resend_dashboard>
EMAIL_FROM=events@zo.world

# Webhook Server
WEBHOOK_PORT=5000
WEBHOOK_SECRET=<typeform_webhook_signing_secret>

# Feature Flags
VIBE_CHECK_ENABLED=true
LUMA_SYNC_ENABLED=false
```

---

## Implementation Phases

### Phase A — Foundation (Bot + Tables)

| Step | Task | Depends On |
|------|------|------------|
| A1 | Create Telegram bot via @BotFather, get token | Nothing |
| A2 | Add bot to events group, get chat ID | A1 |
| A3 | Add new env vars to `.env` | A1, A2 |
| A4 | Run SQL to create 4 new tables in Supabase | Nothing |
| A5 | Build `zo_bot.py` — bot connects, listens for callbacks | A3 |
| A6 | Update `requirements.txt` — add `python-telegram-bot`, `resend`, `apscheduler` | Nothing |

### Phase B — Vibe Check (Flow 1)

| Step | Task | Depends On |
|------|------|------------|
| B1 | Build Vibe Check posting: event → Telegram card with vote buttons | A5 |
| B2 | Build vote handler: callback → record vote → update tally on message | A5, A4 |
| B3 | Build `cron_vibe_check.py`: resolve expired polls, edit messages | A4, B1 |
| B4 | Build Luma sync for approved events (optional) | B3 |
| B5 | Test full flow: create test event → vote → resolve | B1-B3 |

### Phase C — Event Inquiry Pipeline (Flow 2)

| Step | Task | Depends On |
|------|------|------------|
| C1 | Build `webhook.py` — Flask server, Typeform webhook parsing | A4 |
| C2 | Build `venue_matcher.py` — location + requirements scoring | Zoeventsmaster data |
| C3 | Build inquiry Telegram card posting with "Generate Quote" button | A5, C2 |
| C4 | Build `cron_typeform_poll.py` — fallback polling | C1 |
| C5 | Test: submit test Typeform → see card in Telegram | C1-C3 |

### Phase D — Quote + Email (Flow 2 completion)

| Step | Task | Depends On |
|------|------|------------|
| D1 | Populate pricing data for 5-10 test venues in Zoeventsmaster | Manual |
| D2 | Build `quote_engine.py` — calculate from venue pricing | D1 |
| D3 | Build `email_sender.py` — Resend integration | Resend account |
| D4 | Wire "Generate Quote" button → quote engine → email | C3, D2, D3 |
| D5 | Test full flow: Typeform → match → Telegram → quote → email | D4 |

### Phase E — Production Hardening

| Step | Task |
|------|------|
| E1 | Error handling & logging across all modules |
| E2 | Supabase RLS policies for new tables |
| E3 | Deploy webhook server (Railway / Render / VPS) |
| E4 | Set up cron jobs (system crontab or APScheduler) |
| E5 | Monitor & iterate |

---

## Quick Reference — Data Flow Diagram

```
                    ┌──────────────────────────────────────────────┐
                    │              SUPABASE                         │
                    │                                              │
                    │  ┌──────────────┐   ┌─────────────────────┐ │
                    │  │ events       │   │ Zoeventsmaster      │ │
                    │  │ (community)  │   │ (103 venues)        │ │
                    │  └──────┬───────┘   └──────────┬──────────┘ │
                    │         │                      │            │
                    │  ┌──────┴───────┐   ┌──────────┴──────────┐ │
                    │  │ vibe_checks  │   │ event_inquiries     │ │
                    │  │ + votes      │   │ (typeform)          │ │
                    │  └──────────────┘   └─────────────────────┘ │
                    └──────────┬──────────────────────┬────────────┘
                               │                      │
              ┌────────────────┼──────────────────────┼────────────┐
              │                │     ZO EVENTS BOT    │            │
              │    ┌───────────▼──────┐    ┌──────────▼─────────┐  │
              │    │ Vibe Check Cards │    │ Inquiry Summaries  │  │
              │    │ [up] [down]      │    │ [Generate Quote]   │  │
              │    └──────────────────┘    └────────────────────┘  │
              └────────────────────────────────────────────────────┘
                               │                      │
              ┌────────────────▼──────────────────────▼────────────┐
              │           TELEGRAM GROUP                            │
              │         (Boldrin + Samurai)                         │
              └────────────────────────────────────────────────────┘
                                                      │
                                              ┌───────▼────────┐
                                              │ Quote Engine   │
                                              │ + Email Sender │
                                              └───────┬────────┘
                                                      │
                                              ┌───────▼────────┐
                                              │  External User │
                                              │  (gets quote)  │
                                              └────────────────┘
```

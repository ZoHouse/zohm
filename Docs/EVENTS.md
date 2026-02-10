# Zo World — Events

> **How events work on game.zo.xyz — from citizen creation to post-event ops.**

---

## Three Event Types

Every event on Zo World falls into one of three categories. Citizens choose their type in Step 1 of the Host Event modal.

| Type | Who It's For | What Happens | Status |
|------|-------------|--------------|--------|
| **Community** | Any citizen or founder | 5-step modal → event created on game.zo.xyz | Live |
| **Sponsored** | Brands, corporates, partners | Opens Typeform → inquiry pipeline → venue match → quote | Live |
| **Ticketed** | Paid entry events | — | Coming Soon |

---

## Community Events

### How Citizens Create Events

Any logged-in user can host a community event via the **Host Event** button on game.zo.xyz.

```
Click "Host Event" → HostEventModal opens (5-step wizard)

  Step 1: TYPE        → Select "Community-Led"
  Step 2: VIBE        → Pick a culture (19 options — food, music, sport, etc.)
  Step 3: DETAILS     → Title, description, start/end times, cover image (required)
  Step 4: LOCATION    → Zo Property, custom address (Mapbox), or online link
  Step 5: REVIEW      → Preview & submit → POST /api/events
```

### What Happens After Submission

Your event's approval depends on your role:

| Role | Result | Why |
|------|--------|-----|
| **Founder** (NFT holder or `zo_membership='founder'`) | Auto-approved, published immediately | Trusted community members |
| **Admin** or **Vibe Curator** | Auto-approved, published immediately | Platform operators |
| **Citizen** (default for new users) | Pending → Vibe Check | Needs community approval first |

### Vibe Check — How Pending Events Get Approved

When a Citizen's event is created with `submission_status='pending'`, the **Vibe Check** system kicks in automatically (if enabled):

1. **Bot posts** the event to the Telegram approval group ("Zo Events Approval")
2. **Any group member** can vote with inline buttons (thumbs up / thumbs down)
3. **After 24 hours**, a cron worker resolves the vote:
   - `upvotes > downvotes` → **Approved** (event goes live on the map)
   - Otherwise → **Rejected**
4. The Telegram message is edited to show the final result

**Key facts:**
- Simple majority — no quorum, no percentage threshold
- One vote per Telegram user (enforced by database constraint)
- Non-blocking — if the bot fails, your event still exists as pending
- Feature flag: `FEATURE_VIBE_CHECK_TELEGRAM` must be `true`

If the vibe check flag is disabled, pending events sit until an admin manually approves them.

### After Approval

Once approved, the event:
- Appears on the **game map** as a GeoJSON marker
- Shows up in the **events list** sidebar
- Gets pushed to **Luma** calendar (if `FEATURE_LUMA_API_SYNC=true`) — geo-routed to BLR or Zo Events calendar
- Is open for **RSVPs** from other citizens

### RSVP Flow

```
Citizen clicks RSVP on an event
  → Status set to "interested" (waiting for host approval)

Host approves → Status changes to "going"
Host rejects  → Status changes to "rejected"

If event is at max capacity → auto-waitlisted
If someone cancels "going" → oldest waitlisted person auto-promoted
```

Hosts can also **check in** attendees at the event via the RSVP management panel.

---

## Sponsored Events

### How It Works for the Submitter

1. User clicks **"Sponsored"** in the event type selector
2. Modal closes → external Typeform opens (`zostel.typeform.com/to/LgcBfa0M`)
3. User fills out the inquiry form (name, email, event type, location preference, headcount, budget, requirements)
4. Typeform submits → webhook or poll worker picks it up

### What Happens Behind the Scenes (Inquiry Pipeline)

```
Typeform submission
       │
       ▼
POST /api/webhooks/typeform (or cron poll every 10-15 min)
       │
       ├── Parse response → insert into `event_inquiries` table
       │
       ├── Venue Matching Engine
       │     Scores all 103 Zoeventsmaster venues:
       │       Location (0-40) + Capacity (0-20) + Requirements (0-30) + Operational (0-10)
       │     Returns: best match + 2 alternatives
       │
       ├── Post inquiry card to Telegram approval group
       │     with [Generate Quote] and [Request Manual Quote] buttons
       │
       └── Team member clicks a button:
             │
             ├── [Generate Quote] → auto-calculate from venue pricing → email quote to host
             │
             └── [Request Manual Quote] → notify team that manual pricing is needed
```

**Feature flag**: `FEATURE_EVENT_INQUIRY_PIPELINE` must be `true`

### Requirements the System Checks

The Typeform asks about specific needs, and the venue matcher scores venues on:
- Projector / AV equipment
- Sound system / music setup
- Catering (in-house buffet or external allowed)
- Accommodation (all Zostel properties have rooms)
- Convention hall
- Outdoor area (garden, rooftop)

---

## Ticketed Events

**Status: Coming Soon** — disabled in the UI with a "Coming Soon" badge. The `EventTypeSelector` component has ticketed defined but `disabled: true`. The database schema supports `is_ticketed`, `ticket_price`, and `ticket_currency` fields but the creation flow is not yet wired up.

---

## Event Lifecycle (Operations)

> The sections below describe the operational workflow for managing events at a Zo Node — primarily relevant to Zo Node staff and vibe curators.

### Pre-Event

| Phase | Actions |
|-------|---------|
| **Inquiry & Qualification** | Respond same business day, gather details (type, date, headcount, F&B), check Luma calendar, assess fit |
| **Quotation & Booking** | Cost breakdown (space + F&B + AV + staffing), send quote, handle negotiation, collect billing info |
| **Vendor Coordination** (1 week before) | Coordinate kitchen, AV, ops staff, create internal brief, confirm vendors |
| **Marketing** | Create Luma event page, publish with Zo-branded cover (1200x630px), distribute to LinkedIn/X/Instagram |
| **RSVP Management** | Monitor registrations, export attendee list 3 days before, share with ops |

### Pre-Event Communications

| Timeline | Action |
|----------|--------|
| Day of confirmation | Booking confirmation email |
| Day +1 | Billing info follow-up |
| Day +2 | Send invoice (bank/crypto options) |
| Days +3-7 | Monitor payment |
| 7 days before | Final details (headcount, F&B, AV, setup) |
| 1 day before | Reminder (time, location, directions) |

### Day-Of Execution

1. Confirm final headcount from Luma export
2. Share with kitchen (finalize F&B quantities)
3. Confirm AV tested and ready
4. Brief ops team with full details
5. Space walkthrough (furniture, signage, equipment)
6. Test all equipment (projector, mics, WiFi, CCTV)
7. Attendee check-in, content capture, live updates

### Post-Event

| Timeline | Action |
|----------|--------|
| Same evening | Thank you message to host |
| Day +1 | Feedback survey |
| Day +2 | Share event photos |
| Day +3-5 | Analytics report |
| Day +7 | Vendor settlement |
| Ongoing | Guest nurturing |

### Metrics Tracked

- Attendance (registered vs. actual)
- Satisfaction scores
- Revenue generated
- Content engagement
- Repeat attendee rate

---

## Event Types at Zo Nodes

| Type | Description | Target Size |
|------|-------------|-------------|
| **Community Events** | Treks, food tours, meetups | 8-15 |
| **Workshops** | Skills, crafts, learning | 10-20 |
| **Corporate Offsites** | Team retreats, planning | 15-50 |
| **Private Celebrations** | Birthdays, milestones | 20-75 |
| **Networking Events** | Industry mixers | 30-100 |

---

## Key Platforms

| Platform | Use |
|----------|-----|
| **game.zo.xyz** | Event creation (Community), browsing, RSVP |
| **Typeform** | Sponsored event inquiry form |
| **Telegram** | Vibe check voting, inquiry notifications |
| **Luma** | Calendar sync (auto-push from game.zo.xyz) |
| **Supabase** | Database (canonical_events, event_rsvps, event_inquiries) |

---

*See [EVENTS_SYSTEM.md](./EVENTS_SYSTEM.md) for full technical documentation (API endpoints, database schema, type system).*
*See [SYSTEM_FLOWS.md](./SYSTEM_FLOWS.md) for detailed flow diagrams (auth, event creation, vibe check).*

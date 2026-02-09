# Zo Node: Events

> **How a Zo Node runs events from inquiry to post-event nurturing.**

---

## Event Lifecycle

Events at a Zo Node follow a **3-phase lifecycle**:

```
PRE-EVENT          DURING-EVENT         POST-EVENT
(Weeks before)  →  (Day of)          →  (Days after)
─────────────────────────────────────────────────────
Planning           Check-in             Thank you sequence
Marketing          Coordination         Feedback collection
RSVP management    Content capture      Analytics
Communications     Live updates         Vendor settlement
                   Problem-solving      Guest nurturing
```

---

## Pre-Event Workflows

### 1. Inquiry & Qualification

**Trigger**: Lead form submission, email inquiry, or referral

1. Respond within same business day
2. Gather event details: type, date, guest count, F&B needs
3. Check availability in Luma calendar
4. Assess fit with Zo Node values
5. Send initial venue information

**Systems**: Email, Google Forms, Luma Calendar

---

### 2. Quotation & Booking

**Trigger**: Qualified inquiry ready for proposal

1. Create cost breakdown quote based on:
   - Space rental
   - F&B package
   - AV/equipment needs
   - Staffing requirements
2. Send quote via email
3. Handle negotiations if needed
4. Upon approval: Send booking confirmation
5. Block calendar in Google Calendar
6. Collect billing information via form

**Systems**: Email, Google Forms, Google Calendar

---

### 3. Vendor & Venue Coordination

**Trigger**: Booking confirmed (1 week before event)

1. Review confirmed booking details
2. Coordinate with kitchen/catering team:
   - Headcount
   - F&B preferences
   - Dietary restrictions
3. Coordinate with AV/tech team:
   - Projector, microphones, speakers
   - Whiteboards, digital screens
4. Coordinate with ops staff:
   - Space setup
   - Furniture arrangement
   - Signage needs
5. Create internal event brief
6. Confirm all vendors 1 week before

**Systems**: Google Sheets, Email, Slack (#property-ops), Google Docs

---

### 4. Marketing & Promotion

**Trigger**: Booking confirmed, host approves marketing

#### Luma Event Setup
1. Check Luma calendar for conflicts
2. Create event with:
   - Title, date, time, timezone
   - Venue address
   - Description (bold tagline, "WHAT IT IS / WHAT IT'S NOT")
   - Agenda (🔹 emoji, bold times, specific activities)
   - Registration options (free/paid, early bird/VIP)
   - Custom questions
   - Zo-branded cover image (1200x630px)
3. Publish event page

#### Social Distribution
- **LinkedIn**: Professional/community angle
- **X/Twitter**: Broader audience
- **Instagram**: Visual/community focus
- **Farcaster**: Web3 community (if applicable)

**Systems**: Luma, LinkedIn, X/Twitter, Instagram, Google Sheets

---

### 5. RSVP & Registration Management

**Trigger**: Luma event page goes live

1. Monitor registrations in Luma dashboard
2. Auto-approve OR manual approval (per event setting)
3. Track headcount growth
4. **3 days before**: Export attendee list
5. Share list with property ops team
6. Follow up on last-minute changes
7. Keep host updated on attendance numbers

**Metrics tracked**:
- Expected vs. confirmed headcount
- Registration conversion rate
- Custom question responses

---

### 6. Pre-Event Communications

| Timeline | Action |
|----------|--------|
| Day of confirmation | Booking confirmation email |
| Day +1 | Billing info follow-up (if needed) |
| Day +2 | Send invoice (Proforma, bank/crypto options) |
| Days +3-7 | Monitor payment status |
| Payment received | Payment confirmation email |
| 7 days before | Final details (headcount, F&B, AV, setup) |
| 1 day before | Reminder (time, location, directions, contact) |
| Day of event | Available for last-minute questions |

---

## During-Event Execution

### Day-Before/Day-Of Prep

1. Confirm final attendee count from Luma export
2. Share headcount with kitchen (finalize F&B quantities)
3. Confirm all AV equipment tested and ready
4. Brief ops team on Slack with full details
5. Final space walkthrough:
   - Furniture placement
   - Signage
   - Equipment placement
6. Test all equipment:
   - Projector
   - Mics, speakers
   - WiFi
   - CCTV
   - Digital signage (PiSignage on Raspberry Pi)
7. Prepare printed materials (name tags, wayfinders)
8. Ensure property cleaning complete
9. Send day-before reminder to host
10. Be available for final check-in

### Real-Time Coordination

- Attendee check-in
- Guest engagement
- Content capture (photos/videos with consent)
- Live updates to WhatsApp
- Problem-solving as issues arise

---

## Post-Event Workflow

| Timeline | Action |
|----------|--------|
| Same evening | Thank you message to host |
| Day +1 | Send feedback survey |
| Day +2 | Share event photos (with permissions) |
| Day +3-5 | Compile analytics report |
| Day +7 | Vendor settlement & invoicing |
| Ongoing | Guest nurturing for future events |

### Analytics Tracked

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
| **Luma** | Event registration & management |
| **Google Calendar** | Space blocking |
| **WhatsApp** | Community announcements |
| **Slack** | Internal coordination |
| **Google Sheets** | Tracking & analytics |

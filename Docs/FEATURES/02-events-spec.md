# Events — Feature Spec

**Version**: 1.0  
**Owner**: Events / Ops  
**Last Updated**: 2025-11-13  
**Status**: 🚧 Partial Implementation

---

## Purpose

Event system to create, discover, RSVP, and record outcomes (rituals, dinners, workshops) in Nodes.

## Key Capabilities

- Create event (host side): title, node_id, start/end, capacity, ticketing/mechanic
- Discover event (map, list, feed)
- RSVP / join / cancel flows
- Post-event outcome: notes, media, attendance list
- Integration with Vibe Score (attendance and participation update features)

## API Contracts

### Create Event (Protected)
```typescript
POST /api/events
Authorization: Bearer <token>

Request:
{
  title: string;
  node_id: string;
  host_id: string;
  starts_at: string; // ISO timestamp
  ends_at: string;
  capacity: number;
  metadata: {
    description: string;
    event_type: 'ritual' | 'dinner' | 'workshop' | 'meetup';
    ticketing?: { price: number; currency: string };
    location_details?: string;
  };
}

Response:
{
  success: true;
  data: {
    event_id: string;
    created_at: string;
  };
}
```

### List Events
```typescript
GET /api/cities/:cityId/events?from=<iso>&to=<iso>

Response:
{
  success: true;
  data: {
    events: Event[];
    total: number;
  };
}
```

### RSVP to Event
```typescript
POST /api/events/:id/rsvp

Request:
{
  user_id: string;
  wallet_address?: string;
  rsvp_status: 'confirmed' | 'maybe' | 'declined';
}

Response:
{
  success: true;
  data: {
    attendance_id: string;
    status: string;
    capacity_remaining: number;
  };
}
```

### Get Attendees (Protected - Host or Admin)
```typescript
GET /api/events/:id/attendees

Response:
{
  success: true;
  data: {
    attendees: Array<{
      user_id: string;
      nickname: string;
      pfp: string;
      rsvp_status: string;
      checked_in: boolean;
      checked_in_at?: string;
    }>;
    capacity: number;
    confirmed_count: number;
  };
}
```

### Post Event Outcome (Protected - Host)
```typescript
POST /api/events/:id/outcome

Request:
{
  host_id: string;
  summary: string;
  media_refs: string[]; // URLs to images/videos
  attendance_notes?: string;
  vibe_rating?: number; // 0-100
}

Response:
{
  success: true;
  data: {
    outcome_id: string;
    published_at: string;
  };
}
```

## DB Surface

### `events` table
```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  node_id UUID REFERENCES nodes(id),
  host_id TEXT REFERENCES users(id),
  starts_at TIMESTAMP NOT NULL,
  ends_at TIMESTAMP NOT NULL,
  capacity INTEGER DEFAULT 50,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_node ON events(node_id);
CREATE INDEX idx_events_time ON events(starts_at, ends_at);
```

### `event_attendance` table
```sql
CREATE TABLE event_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  rsvp_status TEXT NOT NULL, -- 'confirmed', 'maybe', 'declined'
  checked_in_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(event_id, user_id)
);

CREATE INDEX idx_attendance_event ON event_attendance(event_id);
CREATE INDEX idx_attendance_user ON event_attendance(user_id);
```

### `event_outcomes` table
```sql
CREATE TABLE event_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  host_id TEXT REFERENCES users(id),
  summary TEXT,
  media_refs TEXT[], -- Array of media URLs
  vibe_rating INTEGER, -- 0-100
  published_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(event_id)
);
```

## UX Notes

### Event Discovery
- **Map View**: Event pins show on map with date/time
- **List View**: Chronological feed of upcoming events
- **Filter Options**: By date range, event type, node

### Event Detail Page
- Host profile card
- Event details (time, location, capacity)
- RSVP button with capacity indicator
- Attendee avatars (if confirmed)
- Directions to Node

### RSVP Flow
1. User clicks "RSVP"
2. Select: Confirmed / Maybe / Declined
3. Show confirmation message
4. Send email/push reminder 1 hour before event

### Check-in
- **Option A**: Automatic check-in via geofence when user enters Node radius
- **Option B**: Host-initiated QR code scan at Node entry
- **Option C**: Manual check-in by host

### Post-Event
- Host receives prompt to publish outcome
- Host adds summary, photos, vibe rating
- Attendees can view outcome and add comments

## Vibe Score Integration

### Attendance Boost
```typescript
// When user checks in to event
const vibeBoost = {
  social_sync: +0.3,  // Attended event
  node_context: +0.2, // Present at Node
  creative_output: +0.1 // Participated
};
```

### Host Boost
```typescript
// When user hosts event
const vibeBoost = {
  creative_output: +0.5, // Organized event
  social_sync: +0.4,     // Facilitated connection
  builder: +20           // Reputation points
};
```

## Telemetry

Track these events:
- `event_create` - Host creates event
- `event_view` - User views event details
- `event_rsvp` - User RSVPs (include status)
- `event_checkin` - User checks in
- `event_outcome_published` - Host publishes outcome

**Event schema**: `{ ts, userId, eventId, nodeId, cityId, action, metadata }`

## Acceptance Criteria

- [x] Basic calendar integration works (iCal feeds)
- [ ] Hosts can create events via UI
- [ ] Users can RSVP and receive confirmation
- [ ] Capacity enforcement works (no over-booking)
- [ ] Reminders sent 1 hour before event
- [ ] Host can publish outcome
- [ ] Attendees recorded and Vibe Score updated

## Tests

### API Tests
```typescript
describe('Events API', () => {
  it('creates event with valid data', async () => {
    const event = await createEvent({
      title: 'Test Dinner',
      node_id: 'node-123',
      capacity: 20
    });
    expect(event.id).toBeDefined();
  });
  
  it('enforces capacity limits', async () => {
    // Create event with capacity 2
    // RSVP with 2 users
    // Third RSVP should fail
    const result = await rsvpToEvent(eventId, thirdUserId);
    expect(result.success).toBe(false);
    expect(result.error).toContain('capacity');
  });
  
  it('allows host to publish outcome', async () => {
    const outcome = await publishOutcome(eventId, {
      summary: 'Great dinner!',
      vibe_rating: 95
    });
    expect(outcome.success).toBe(true);
  });
});
```

### Integration Tests
```typescript
describe('Event Flow', () => {
  it('completes full RSVP → check-in → outcome flow', async () => {
    // Create event
    // User RSVPs
    // User checks in (simulate geofence)
    // Host publishes outcome
    // Verify Vibe Score updated
  });
});
```

## Current Implementation

**Location**: 
- `apps/web/src/app/api/calendar/route.ts` - iCal feed integration (basic)
- `apps/web/src/app/api/add-calendar/route.ts` - Add calendar source

**Status**:
- ✅ Basic iCal integration (read-only)
- ❌ Event creation UI not built
- ❌ RSVP system not implemented
- ❌ Check-in flow not implemented
- ❌ Outcome publishing not implemented

## Work Order Snippet

```markdown
# WO-XXX: Implement Event RSVP System

## Scope
- Create `/api/events/:id/rsvp` endpoint
- Add `event_attendance` table migration
- Build RSVP UI component
- Add capacity enforcement logic
- Send confirmation emails

## Files to Create
- `apps/web/src/app/api/events/[id]/rsvp/route.ts`
- `migrations/XXX_event_attendance.sql`
- `apps/web/src/components/EventRSVP.tsx`
- `apps/web/src/lib/emailService.ts` (RSVP confirmations)

## Tests
- API tests for RSVP flow
- Capacity limit tests
- Email sending integration test

## Acceptance Criteria
- Users can RSVP to events
- Capacity enforced (no overbooking)
- Confirmation email sent within 1 minute
```

## Related Documentation

- `Docs/API_ENDPOINTS.md` - Existing calendar endpoints
- `Docs/VIBE_SCORE.md` - Vibe Score integration
- `Docs/DATABASE_SCHEMA.md` - Database structure


# Staging Smoke Test Checklist - Canonical Events

**Branch**: `samurai-new/event-canonical`  
**Date**: 2025-11-14  
**Environment**: Staging  
**Tester**: _____________________

---

## Pre-Flight Checks

- [ ] Staging database backup created
- [ ] Migration 006 applied successfully
- [ ] `canonical_events` table exists
- [ ] `canonical_event_changes` table exists
- [ ] All indexes created (9 total)
- [ ] Feature flags set correctly:
  - `CANONICAL_DRY_RUN=true`
  - `FEATURE_CANONICAL_EVENTS_WRITE=false`
  - `FEATURE_CANONICAL_EVENTS_READ=false`

---

## Phase 1: Dry-Run Worker Testing (72 hours)

### Deploy & Start

- [ ] Worker deployed to staging
- [ ] Worker started in dry-run mode
- [ ] No errors in startup logs
- [ ] Worker is fetching calendar URLs successfully

### After 24 Hours

- [ ] Run: `SELECT COUNT(*) FROM canonical_event_changes WHERE change_type='dry-run'`
  - Expected: >0 (events being processed)
  - Actual: _________
  
- [ ] Run: `SELECT COUNT(*) FROM canonical_events`
  - Expected: 0 (dry-run shouldn't write)
  - Actual: _________
  
- [ ] Check dry-run logs for patterns:
  - [ ] `would-insert` actions logged
  - [ ] `would-update` actions logged (if any)
  - [ ] No crashes or exceptions
  
- [ ] Sample 10 random dry-run entries:
  - [ ] All have valid `canonical_uid`
  - [ ] All have `event_name` in payload
  - [ ] All have `action` field

### After 48 Hours

- [ ] Dry-run still running without issues
- [ ] Memory usage stable (no leaks)
- [ ] CPU usage reasonable (<20%)
- [ ] Database connection pool healthy

### After 72 Hours

- [ ] Total dry-run operations: _________
- [ ] Unique events processed (distinct UIDs): _________
- [ ] Any duplicate UIDs found: _________
- [ ] Geocoding success rate estimate: _________
- [ ] Any errors or warnings: _________

**Sign-off for Phase 2**: _____________ (Date/Name)

---

## Phase 2: Enable Writes (24 hours)

### Configuration Change

- [ ] Set `CANONICAL_DRY_RUN=false`
- [ ] Set `FEATURE_CANONICAL_EVENTS_WRITE=true`
- [ ] Worker restarted successfully
- [ ] First events inserted within 5 minutes

### After 1 Hour

- [ ] Run: `SELECT COUNT(*) FROM canonical_events`
  - Expected: >0
  - Actual: _________
  
- [ ] Check for duplicates:
  ```sql
  SELECT canonical_uid, COUNT(*) 
  FROM canonical_events 
  GROUP BY canonical_uid 
  HAVING COUNT(*) > 1
  ```
  - Expected: 0 rows
  - Actual: _________
  
- [ ] Sample 10 events:
  - [ ] All have valid timestamps
  - [ ] All have titles
  - [ ] Geocoding attempted (status not 'pending')

### After 6 Hours

- [ ] Geocoding cache hit rate:
  ```sql
  SELECT geocode_status, COUNT(*) 
  FROM canonical_events 
  GROUP BY geocode_status
  ```
  - `success`: _________
  - `failed`: _________
  - `cached`: _________
  - `pending`: _________ (should be 0)

- [ ] No duplicate events detected
- [ ] Insert rate stable (~X events/hour): _________

### After 24 Hours

- [ ] Total events in DB: _________
- [ ] Unique canonical UIDs: _________
- [ ] Geocoding success rate: _________% (success / (success + failed))
- [ ] No database locks or performance issues
- [ ] Event changes audit trail populated correctly

**Sign-off for Phase 3**: _____________ (Date/Name)

---

## Phase 3: API Testing (READ Flag)

### Enable Read Flag

- [ ] Set `FEATURE_CANONICAL_EVENTS_READ=true` (for 10% users if A/B available)
- [ ] API endpoint responds: `GET /api/events/canonical`
- [ ] Returns valid JSON
- [ ] Events sorted by `starts_at` ascending

### API Tests

#### Test 1: Basic Query
```bash
curl "https://staging.zohm.world/api/events/canonical?limit=10"
```
- [ ] Returns 10 events
- [ ] Each event has: `Event Name`, `Date & Time`, `Location`
- [ ] Response time <500ms

#### Test 2: Location Filter
```bash
curl "https://staging.zohm.world/api/events/canonical?lat=37.7749&lng=-122.4194&radius=100&limit=20"
```
- [ ] Returns events within 100km of SF
- [ ] `meta.filtered_by_location` is true
- [ ] All events have `Latitude` and `Longitude`

#### Test 3: Date Range
```bash
curl "https://staging.zohm.world/api/events/canonical?from=2025-11-01&to=2025-12-01"
```
- [ ] Returns only events in November 2025
- [ ] No events outside date range

#### Test 4: Feature Flag OFF
- [ ] Set `FEATURE_CANONICAL_EVENTS_READ=false`
- [ ] Request returns 503 error
- [ ] Error message directs to `/api/calendar` fallback

### Compare Old vs New

- [ ] Fetch events from old parser: `GET /api/calendar`
- [ ] Fetch events from canonical: `GET /api/events/canonical`
- [ ] Count difference: _________ (should be <5%)
- [ ] Sample 10 events present in both sources
- [ ] Timestamps match (accounting for timezone display)
- [ ] Locations match

**Sign-off for Production Readiness**: _____________ (Date/Name)

---

## Phase 4: Performance & Load Testing

### Response Times

- [ ] p50 response time: _________ ms (target <200ms)
- [ ] p95 response time: _________ ms (target <500ms)
- [ ] p99 response time: _________ ms (target <1000ms)

### Concurrent Requests

- [ ] 10 concurrent requests: _________ avg response time
- [ ] 50 concurrent requests: _________ avg response time
- [ ] 100 concurrent requests: _________ avg response time
- [ ] No 500 errors under load

### Database Performance

- [ ] Index usage confirmed (check `pg_stat_user_indexes`)
- [ ] No slow queries (>1 second)
- [ ] Connection pool healthy (<50% utilization)

**Sign-off for Load Test**: _____________ (Date/Name)

---

## Phase 5: Rollback Drill

### Simulate Production Issue

- [ ] Intentionally break something (e.g., set bad env var)
- [ ] Verify monitoring detects issue
- [ ] Execute rollback plan:
  - [ ] Set `FEATURE_CANONICAL_EVENTS_READ=false`
  - [ ] Set `FEATURE_CANONICAL_EVENTS_WRITE=false`
  - [ ] UI falls back to old parser
  - [ ] Worker stops writing
  
- [ ] Rollback completed in <5 minutes
- [ ] No user-facing errors during rollback
- [ ] Can re-enable flags after fix

**Rollback Drill Passed**: _____________ (Date/Name)

---

## Final Checklist

- [ ] All monitoring queries run successfully
- [ ] Duplicate detection working (0% duplicate rate)
- [ ] Geocoding cache warming (>70% hit rate)
- [ ] API performance acceptable (<500ms p95)
- [ ] Worker stable (no crashes for 96+ hours)
- [ ] Rollback procedure tested and validated
- [ ] DBA sign-off obtained
- [ ] Backend lead sign-off obtained
- [ ] Product sign-off obtained

---

## Issues Found (if any)

| Issue | Severity | Description | Resolution | Status |
|-------|----------|-------------|------------|--------|
| 1     |          |             |            |        |
| 2     |          |             |            |        |
| 3     |          |             |            |        |

---

## Production Readiness: YES / NO

**Decision**: _________________  
**Signed**: _________________  
**Date**: _________________

**Next Step**: Deploy to production with `READ=false, WRITE=true` for cache warming






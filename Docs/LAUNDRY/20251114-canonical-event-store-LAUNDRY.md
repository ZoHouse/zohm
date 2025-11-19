# Laundry List: Canonical Event Store

**Date**: 2025-11-14  
**Work Order**: `20251114-canonical-event-store-WORK_ORDER.md`  
**Branch**: `samurai-new/event-canonical`

---

## 🧺 Quick Wins (Week 1)

### ✅ Task 1: Database Schema
- [ ] Create `006_create_canonical_events.sql` migration
- [ ] Create `006_drop_canonical_events.sql` rollback migration
- [ ] Add indexes for performance (starts_at, location, canonical_uid)
- [ ] Include audit table `canonical_event_changes`
- **Acceptance**: Migrations run cleanly in local dev environment
- **Time**: 2 hours

### ✅ Task 2: Canonical UID Function
- [ ] Create `lib/canonicalUid.ts`
- [ ] Implement SHA256 hashing with normalization
- [ ] Handle edge cases (missing fields, special characters)
- **Acceptance**: Same event from different sources → same UID
- **Time**: 1 hour

### ✅ Task 3: Unit Tests for Deduplication
- [ ] Test: Same event, different punctuation → same UID
- [ ] Test: Same event, different case → same UID
- [ ] Test: Different events → different UIDs
- [ ] Test: Missing fields handled gracefully
- **Acceptance**: All tests pass
- **Time**: 1 hour

### ✅ Task 4: Feature Flag Infrastructure
- [ ] Add `FEATURE_CANONICAL_EVENTS_READ` env var
- [ ] Add `FEATURE_CANONICAL_EVENTS_WRITE` env var
- [ ] Create `lib/featureFlags.ts`
- [ ] Update `.env.example` with new flags
- **Acceptance**: Flags can toggle behavior in local dev
- **Time**: 30 minutes

### ✅ Task 5: Pre-Migration Backup Script
- [ ] Create `scripts/backup-pre-canonical.sh`
- [ ] Test backup/restore locally
- [ ] Document in work order
- **Acceptance**: Can restore from backup successfully
- **Time**: 30 minutes

---

## 🚧 Core Implementation (Week 2)

### ✅ Task 6: Event Worker - Dry Run Mode
- [ ] Create `lib/eventWorker.ts`
- [ ] Implement dry-run logging to `canonical_event_changes`
- [ ] Add rate limiting for geocoding
- [ ] Handle errors gracefully
- **Acceptance**: Runs without writing to `canonical_events` when `DRY_RUN=true`
- **Time**: 4 hours

### ✅ Task 7: Geocoding Cache Layer
- [ ] Check if lat/lng exists in DB before Mapbox call
- [ ] Store geocoded results in `canonical_events`
- [ ] Add `geocode_status` tracking (pending/success/failed/cached)
- **Acceptance**: Second fetch for same location uses cache
- **Time**: 2 hours

### ✅ Task 8: Idempotent Upsert Logic
- [ ] Check for existing event by `canonical_uid`
- [ ] Insert if new, merge-update if exists
- [ ] Don't override authoritative fields unless confidence higher
- [ ] Log all operations to `canonical_event_changes`
- **Acceptance**: Running worker twice produces same result
- **Time**: 3 hours

### ✅ Task 9: Timezone Handling
- [ ] Parse DTSTART timezone from iCal
- [ ] Store original TZ in `tz` column
- [ ] Convert to TIMESTAMPTZ for `starts_at`
- [ ] Test with PST, IST, UTC events
- **Acceptance**: Event times display correctly in user's local timezone
- **Time**: 2 hours

### ✅ Task 10: Worker CLI
- [ ] Add command: `node worker.js --dry-run`
- [ ] Add command: `node worker.js --apply`
- [ ] Add flag: `--calendar-id` to test single source
- [ ] Pretty logging with colors
- **Acceptance**: Can run worker from command line with args
- **Time**: 1 hour

---

## 🔌 API & Integration (Week 2-3)

### ✅ Task 11: Canonical Events API Endpoint
- [ ] Create `/api/events/canonical/route.ts`
- [ ] Accept query params: `?lat=X&lng=Y&radius=100`
- [ ] Return events sorted by `starts_at`
- [ ] Include geocoded coordinates
- **Acceptance**: Returns events from database correctly
- **Time**: 2 hours

### ✅ Task 12: Feature Flag in UI
- [ ] Update `useEvents()` hook to check flag
- [ ] Fetch from `/api/events/canonical` when `READ=true`
- [ ] Fallback to old parser when `READ=false`
- **Acceptance**: Can toggle between old/new flow with env var
- **Time**: 1 hour

### ✅ Task 13: Event Type Alignment
- [ ] Ensure `canonical_events` matches `ParsedEvent` interface
- [ ] Add type: `CanonicalEvent` in `types.ts`
- [ ] Update UI to handle both types gracefully
- **Acceptance**: No TypeScript errors, UI renders both sources
- **Time**: 1 hour

---

## 🧪 Testing & Validation (Week 3)

### ✅ Task 14: Integration Tests
- [ ] Test: Worker fetches → parses → upserts
- [ ] Test: Duplicate detection across sources
- [ ] Test: Geocoding cache hit/miss
- [ ] Test: Timezone conversion accuracy
- **Acceptance**: All integration tests pass
- **Time**: 4 hours

### ✅ Task 15: Staging Deployment
- [ ] Deploy worker to staging with `DRY_RUN=true`
- [ ] Run for 72 hours
- [ ] Monitor logs and `canonical_event_changes` table
- **Acceptance**: No errors, all events logged
- **Time**: 15 minutes deploy + 72 hours monitoring

### ✅ Task 16: Dry-Run Verification Queries
- [ ] Count events processed: `SELECT COUNT(*) FROM canonical_event_changes WHERE change_type='dry-run'`
- [ ] Check duplicates: `SELECT canonical_uid, COUNT(*) ... HAVING COUNT(*) > 1`
- [ ] Verify geocoding attempts
- **Acceptance**: Query results match expected behavior
- **Time**: 1 hour

### ✅ Task 17: Enable Writes in Staging
- [ ] Set `CANONICAL_DRY_RUN=false` in staging
- [ ] Set `FEATURE_CANONICAL_EVENTS_WRITE=true`
- [ ] Run worker for 24 hours
- [ ] Verify `canonical_events` populated correctly
- **Acceptance**: Events written to DB, no duplicates
- **Time**: 15 minutes + 24 hours monitoring

### ✅ Task 18: Compare Old vs New Output
- [ ] Fetch events from old parser
- [ ] Fetch events from canonical store
- [ ] Compare: count, titles, locations, timestamps
- [ ] Document differences
- **Acceptance**: <5% variance, all differences explainable
- **Time**: 2 hours

---

## 📊 Monitoring & Observability (Week 3)

### ✅ Task 19: Monitoring Queries
- [ ] Create `scripts/monitor-canonical-events.sql`
- [ ] Add query: insert rate per hour
- [ ] Add query: geocoding cache hit rate
- [ ] Add query: duplicate detection rate
- [ ] Add query: worker error rate
- **Acceptance**: Can run queries to check system health
- **Time**: 1 hour

### ✅ Task 20: Set Up Alerts (if using monitoring)
- [ ] Alert: Geocoding API calls >100/min
- [ ] Alert: Worker error rate >5%
- [ ] Alert: Duplicate rate >1%
- **Acceptance**: Alerts fire when thresholds breached
- **Time**: 1 hour (skip if no monitoring service)

### ✅ Task 21: Performance Benchmarks
- [ ] Measure: Old flow event load time
- [ ] Measure: New flow event load time
- [ ] Measure: Geocoding cost savings
- [ ] Document in work order
- **Acceptance**: New flow is faster, costs less
- **Time**: 1 hour

---

## 🚀 Production Rollout (Week 4)

### ✅ Task 22: Production Deployment - Writes Only
- [ ] Deploy worker to prod with `WRITE=true, READ=false`
- [ ] Monitor for 48 hours (warm cache)
- [ ] Check logs for errors
- [ ] Verify geocoding cost reduction
- **Acceptance**: Worker runs smoothly, cache warming
- **Time**: 30 minutes deploy + 48 hours monitoring

### ✅ Task 23: A/B Test Preparation
- [ ] Add user bucketing logic (10% → canonical, 90% → old)
- [ ] Add telemetry to track which flow used
- [ ] Set up comparison dashboards
- **Acceptance**: Can track metrics split by flow
- **Time**: 2 hours

### ✅ Task 24: Enable Reads for 10%
- [ ] Set `FEATURE_CANONICAL_EVENTS_READ=true` for 10% users
- [ ] Monitor error rates, load times
- [ ] Check user feedback channels
- **Acceptance**: No user complaints, metrics stable
- **Time**: 15 minutes + 24 hours monitoring

### ✅ Task 25: Gradual Rollout
- [ ] 10% → 50% → 100% over 3 days
- [ ] Monitor at each step
- [ ] Rollback plan ready at each step
- **Acceptance**: Full rollout complete, old flow deprecated
- **Time**: 3 days

---

## 🧹 Cleanup & Documentation (Post-Rollout)

### ✅ Task 26: Generate Final Receipt
- [ ] Run `scripts/generate_receipt.py`
- [ ] Move from drafts to `docs/RECEIPTS/`
- [ ] Update `docs/RECEIPTS/index.json`
- **Acceptance**: Receipt available for audit
- **Time**: 15 minutes

### ✅ Task 27: Update Architecture Docs
- [ ] Update `docs/ARCHITECTURE.md` with canonical store
- [ ] Add data flow diagrams
- [ ] Document API endpoints
- **Acceptance**: Docs reflect current architecture
- **Time**: 1 hour

### ✅ Task 28: Remove Old Code (if fully migrated)
- [ ] Mark old parser as deprecated
- [ ] Remove feature flags once stable
- [ ] Clean up temporary logging
- **Acceptance**: Codebase clean, no dead code
- **Time**: 1 hour

---

## 🎯 Acceptance Criteria Summary

**Must Pass Before Production:**
- [ ] All unit tests pass (deduplication, timezone, normalization)
- [ ] All integration tests pass (worker, API, UI)
- [ ] Staging validation complete (72h dry-run + 24h writes)
- [ ] Duplicate rate <0.5%
- [ ] Geocoding cost reduction >70%
- [ ] DBA sign-off on schema
- [ ] Backend lead sign-off on worker implementation
- [ ] Rollback tested successfully

**Post-Production:**
- [ ] Events display correct local timezone
- [ ] API response time <200ms (p95)
- [ ] Zero data loss
- [ ] User complaints <5 (acceptable UX friction)

---

## ⏱️ Time Estimates

- **Week 1 (Foundation)**: ~5 hours
- **Week 2 (Core Implementation)**: ~12 hours
- **Week 3 (Testing & Monitoring)**: ~10 hours  
- **Week 4 (Rollout)**: ~3 hours active + monitoring
- **Cleanup**: ~2 hours

**Total Active Development**: ~32 hours  
**Total with Monitoring**: 1 month

---

## 🚨 Blockers & Dependencies

- **Blocker**: Need DBA access for production migrations
- **Blocker**: Need staging environment with test calendars
- **Dependency**: Mapbox API key with sufficient quota
- **Dependency**: Feature flag system (or manual env var management)

---

**Next Steps**: Start with Tasks 1-5 (Week 1 Foundation) ✅





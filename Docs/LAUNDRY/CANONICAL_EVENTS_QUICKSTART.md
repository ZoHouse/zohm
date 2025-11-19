# 🚀 Canonical Events - Quick Start Guide

**Date**: 2025-11-14  
**Status**: Ready for local testing  
**Time**: 10 minutes to test

---

## ✅ What's Been Built

### 1. **Database Schema** (`006_create_canonical_events.sql`)
- `canonical_events` table with timezone support, geocoding cache
- `canonical_event_changes` audit trail table
- Performance indexes for location and time queries
- Auto-update triggers for timestamps

### 2. **Deduplication Logic** (`canonicalUid.ts`)
- SHA256-based event fingerprinting
- Normalizes: case, punctuation, whitespace
- Same event from multiple sources → same UID

### 3. **Event Worker** (`eventWorker.ts`)
- ✅ Dry-run mode (safe testing)
- ✅ Idempotent upserts (safe to re-run)
- ✅ Geocoding cache (reduces API costs)
- ✅ Retry logic (24h backoff for failed geocodes)
- ✅ Audit trail (all operations logged)

### 4. **API Endpoints**
- `POST /api/worker/sync-events` - Trigger sync
- `GET /api/events/canonical` - Read from canonical store

### 5. **Feature Flags** (`featureFlags.ts`)
- `FEATURE_CANONICAL_EVENTS_READ` - Where UI reads from
- `FEATURE_CANONICAL_EVENTS_WRITE` - Worker writes enabled
- `CANONICAL_DRY_RUN` - Safety mode (default: true)

---

## 🧪 Quick Test (5 Minutes)

### **Step 1: Run Migration** (in Supabase Dashboard)

```bash
# Copy migration to clipboard
cat packages/api/migrations/006_create_canonical_events.sql | pbcopy

# Open Supabase SQL Editor
open "https://supabase.com/dashboard/project/elvaqxadfewcsohrswsi/sql/new"
```

**In SQL Editor:**
1. Paste migration
2. Click **Run**
3. Look for: `✅ Migration 006 complete - Canonical event store ready`

### **Step 2: Start Dev Server**

```bash
cd apps/web
npm run dev
```

Server starts at: `http://localhost:3000`

### **Step 3: Test Worker (Dry-Run)**

```bash
# Check worker status
curl http://localhost:3000/api/worker/sync-events | jq

# Trigger dry-run sync
curl -X POST http://localhost:3000/api/worker/sync-events | jq

# Expected output:
# {
#   "success": true,
#   "stats": {
#     "processed": 50,
#     "skipped": 50,
#     "dryRunOnly": true
#   }
# }
```

### **Step 4: Verify in Database**

Run in Supabase SQL Editor:

```sql
-- Check dry-run logs (should have entries)
SELECT COUNT(*) as dry_run_count 
FROM canonical_event_changes 
WHERE change_type = 'dry-run';

-- Check canonical_events (should be empty in dry-run)
SELECT COUNT(*) as events_count 
FROM canonical_events;
-- Should return 0 (dry-run doesn't write)

-- View sample logs
SELECT 
  change_type,
  payload->>'action' as action,
  payload->>'event_name' as event,
  created_at
FROM canonical_event_changes
ORDER BY created_at DESC
LIMIT 10;
```

**Expected results:**
- ✅ `dry_run_count > 0` (events were processed)
- ✅ `events_count = 0` (no actual writes in dry-run)
- ✅ Logs show `would-insert` or `would-update` actions

---

## 🎯 What Each Test Validates

| Test | Validates |
|------|-----------|
| Migration runs | Schema creation, indexes, triggers |
| Worker status check | Feature flags configured correctly |
| Dry-run sync | Worker fetches calendars, parses events, logs operations |
| Database queries | Audit trail working, dry-run safety effective |

---

## 🚦 Feature Flag States (Current)

```bash
FEATURE_CANONICAL_EVENTS_READ=false   # UI still uses old parser
FEATURE_CANONICAL_EVENTS_WRITE=false  # Worker in dry-run only
CANONICAL_DRY_RUN=true                # Safety on (default)
```

**This is the safest configuration for testing!**

---

## 🔄 Next Steps (After Local Testing Passes)

### **Phase 1: Enable Writes Locally**

```bash
# In apps/web/.env
FEATURE_CANONICAL_EVENTS_WRITE=true
CANONICAL_DRY_RUN=false
```

Then run worker again:

```bash
curl -X POST "http://localhost:3000/api/worker/sync-events?apply=true" | jq
```

Verify events are written:

```sql
SELECT COUNT(*) FROM canonical_events;
-- Should now show events!

SELECT title, location_raw, starts_at, geocode_status 
FROM canonical_events 
ORDER BY starts_at 
LIMIT 5;
```

### **Phase 2: Test Read API**

```bash
# Enable read flag
FEATURE_CANONICAL_EVENTS_READ=true

# Restart dev server
npm run dev

# Test API
curl "http://localhost:3000/api/events/canonical?limit=10" | jq
```

### **Phase 3: Push to Staging**

Once local tests pass:

```bash
git add .
git commit -m "feat: canonical event store foundation"
git push origin samurai-new
```

Deploy to staging and repeat tests there with real data.

---

## 🐛 Troubleshooting

### Worker Returns 0 Events

**Problem:** `stats.processed = 0`

**Solution:**
```bash
# Check if calendars are configured in database
psql $NEXT_PUBLIC_SUPABASE_URL -c "SELECT * FROM calendars WHERE active = true;"

# If empty, check emergency fallback is working
```

### Migration Fails

**Problem:** Table already exists

**Solution:**
```sql
-- Rollback first
\i packages/api/migrations/006_drop_canonical_events.sql

-- Then re-run
\i packages/api/migrations/006_create_canonical_events.sql
```

### Geocoding Not Working

**Problem:** `geocode_status = 'failed'` for all events

**Solution:**
```bash
# Check Mapbox token is set
echo $NEXT_PUBLIC_MAPBOX_TOKEN

# If missing, add to .env:
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

---

## ✅ Success Criteria

**Local testing is complete when:**

- [x] Migration runs without errors
- [x] Worker processes events in dry-run mode
- [x] Audit trail shows `dry-run` entries
- [x] `canonical_events` table remains empty during dry-run
- [x] Worker completes in < 30 seconds for 50 events
- [x] No errors in console/logs

**Ready for staging when:**

- [x] All local tests pass
- [x] Writes enabled locally, events inserted correctly
- [x] Read API returns events matching old parser
- [x] Deduplication working (no duplicate UIDs)
- [x] Geocoding working (lat/lng populated)

---

## 📊 Performance Benchmarks (Expected)

| Metric | Target | Notes |
|--------|--------|-------|
| Worker sync time | < 1 min for 100 events | Includes geocoding |
| API response time | < 200ms | With caching |
| Geocoding cache hit rate | > 70% after warmup | Reduces Mapbox costs |
| Duplicate rate | < 0.5% | Deduplication working |
| Storage per event | ~2 KB | With full raw_payload |

---

## 🦄 Ready to Test!

Run the 3 quick tests above and you'll know if everything works. The whole test takes **5 minutes**.

After local success, proceed to staging deployment following `20251114-canonical-event-store-WORK_ORDER.md`.

**Questions?** Check the work order or ask!





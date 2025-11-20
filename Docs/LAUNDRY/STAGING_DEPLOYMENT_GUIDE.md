# Staging Deployment Guide - Canonical Events

**Branch**: `feat/canonical-events-store`  
**Date**: 2025-11-14  
**Prerequisites**: Staging environment with Supabase access

---

## 🎯 **Objective**

Deploy canonical event store to staging and validate for 72+ hours before production.

---

## 📋 **Pre-Deployment Checklist**

- [ ] Code committed to `feat/canonical-events-store` branch ✅
- [ ] Work order reviewed by team
- [ ] Staging database access confirmed
- [ ] Backup of staging database created
- [ ] Feature flags documented in `.env.example`

---

## 🗄️ **Step 1: Run Database Migration (5 minutes)**

### **Option A: Supabase Dashboard (Recommended)**

1. **Open Supabase SQL Editor**
   - Go to: https://supabase.com/dashboard
   - Select your **staging** project
   - Click "SQL Editor" in left sidebar

2. **Create Backup First**
   ```sql
   -- Run this to backup (copy output to safe location)
   \copy (SELECT * FROM quests) TO '/tmp/quests_backup.csv' WITH CSV HEADER;
   ```

3. **Run Migration**
   - Open file: `packages/api/migrations/006_create_canonical_events.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **"Run"** (or Cmd/Ctrl + Enter)

4. **Verify Success**
   - Look for: ✅ Messages in output
   - Should see: "canonical_events table created successfully"
   - Should see: "canonical_event_changes table created successfully"

### **Verification Queries**

Run these to confirm migration success:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('canonical_events', 'canonical_event_changes');

-- Expected: 2 rows

-- Check indexes
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('canonical_events', 'canonical_event_changes');

-- Expected: 9 indexes

-- Check structure
\d canonical_events
```

---

## ⚙️ **Step 2: Configure Environment Variables**

### **Staging `.env` Settings**

Add these to your staging environment (Vercel/Railway/etc.):

```bash
# Feature Flags - STAGING INITIAL CONFIG
FEATURE_CANONICAL_EVENTS_READ=false        # Keep old flow for now
FEATURE_CANONICAL_EVENTS_WRITE=false       # Worker won't write yet
CANONICAL_DRY_RUN=true                     # Safety mode

# Existing vars (confirm these are set)
NEXT_PUBLIC_SUPABASE_URL=your-staging-url
SUPABASE_SERVICE_ROLE_KEY=your-staging-key
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token
```

### **Where to Set**

**Vercel**:
```bash
vercel env add FEATURE_CANONICAL_EVENTS_READ production
# Enter: false

vercel env add FEATURE_CANONICAL_EVENTS_WRITE production
# Enter: false

vercel env add CANONICAL_DRY_RUN production
# Enter: true
```

**Railway**:
- Go to project → Variables tab
- Add each variable manually

---

## 🚀 **Step 3: Deploy Code to Staging**

### **If using Vercel**

```bash
# From feat/canonical-events-store branch
vercel --prod
# Or merge to staging branch and auto-deploy
```

### **If using other platform**

```bash
git push origin feat/canonical-events-store
# Trigger staging deployment via your CI/CD
```

### **Verify Deployment**

1. Check deployment logs for errors
2. Visit staging URL
3. Check browser console for errors
4. Verify old event flow still works (READ=false)

---

## 🧪 **Step 4: Run Worker in Dry-Run Mode (72 hours)**

### **Option A: Manual Trigger**

Create a worker endpoint:

```typescript
// apps/web/src/app/api/worker/sync-events/route.ts
import { syncCanonicalEvents } from '@/lib/eventWorker';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const stats = await syncCanonicalEvents({ verbose: true });
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
```

Then trigger:
```bash
curl -X POST https://your-staging-url.vercel.app/api/worker/sync-events
```

### **Option B: Cron Job (Recommended)**

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/worker/sync-events",
    "schedule": "0 */6 * * *"
  }]
}
```

Runs every 6 hours.

### **Monitor Dry-Run Results**

After 24 hours, run in Supabase SQL Editor:

```sql
-- How many events processed?
SELECT COUNT(*) as dry_run_operations
FROM canonical_event_changes
WHERE change_type = 'dry-run';

-- What would be inserted?
SELECT 
  payload->>'event_name' as event,
  payload->>'action' as action,
  COUNT(*) as count
FROM canonical_event_changes
WHERE change_type = 'dry-run'
GROUP BY payload->>'event_name', payload->>'action'
ORDER BY count DESC
LIMIT 20;

-- Any errors?
SELECT *
FROM canonical_event_changes
WHERE payload->>'action' = 'error'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results:**
- `dry_run_operations` > 0 (events being processed)
- Mix of 'would-insert' and 'would-update' actions
- Zero or minimal errors

---

## ✅ **Step 5: Validate Dry-Run (After 72 hours)**

### **Run Full Smoke Test Checklist**

Use: `Docs/LAUNDRY/20251114-staging-smoke-test-checklist.md`

### **Key Checks**

1. **No duplicates detected**
   ```sql
   SELECT canonical_uid, COUNT(*)
   FROM (
     SELECT payload->>'canonical_uid' as canonical_uid
     FROM canonical_event_changes
     WHERE change_type = 'dry-run'
   ) t
   GROUP BY canonical_uid
   HAVING COUNT(*) > 1;
   ```
   **Expected**: 0 rows (no duplicates)

2. **All events have valid UIDs**
   ```sql
   SELECT COUNT(*) as invalid_uids
   FROM canonical_event_changes
   WHERE change_type = 'dry-run'
     AND (payload->>'canonical_uid' IS NULL 
          OR length(payload->>'canonical_uid') != 12);
   ```
   **Expected**: 0

3. **Worker is stable**
   - Check logs for crashes
   - Check memory usage (should be stable)
   - Check error rate (<5%)

---

## 🔓 **Step 6: Enable Writes (After dry-run validation)**

### **Update Environment Variables**

```bash
# Keep reading from old flow for now
FEATURE_CANONICAL_EVENTS_READ=false

# Enable worker writes
FEATURE_CANONICAL_EVENTS_WRITE=true

# Disable dry-run (real writes)
CANONICAL_DRY_RUN=false
```

### **Redeploy or Restart**

```bash
vercel --prod  # Or restart your worker process
```

### **Monitor First Hour**

```sql
-- Events inserted?
SELECT COUNT(*) FROM canonical_events;
-- Expected: >0 within 30 minutes

-- Any duplicates?
SELECT canonical_uid, COUNT(*)
FROM canonical_events
GROUP BY canonical_uid
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Geocoding status?
SELECT geocode_status, COUNT(*)
FROM canonical_events
GROUP BY geocode_status;
-- Expected: mix of 'success', 'failed', 'cached'
```

---

## 📊 **Step 7: Monitor for 24 Hours**

### **Key Metrics**

Run these queries every 6 hours:

```sql
-- 1. Insert rate
SELECT 
  date_trunc('hour', created_at) as hour,
  COUNT(*) as events
FROM canonical_events
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;

-- 2. Geocoding cache hit rate
SELECT 
  geocode_status,
  COUNT(*),
  ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM canonical_events) * 100, 2) as pct
FROM canonical_events
GROUP BY geocode_status;

-- 3. Worker health
SELECT 
  change_type,
  COUNT(*),
  MAX(created_at) as last_run
FROM canonical_event_changes
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY change_type;
```

### **Success Criteria**

- [ ] Events inserting steadily
- [ ] Duplicate rate: 0%
- [ ] Geocoding success rate: >60%
- [ ] Worker error rate: <5%
- [ ] No database locks
- [ ] No crashes

---

## 🎚️ **Step 8: Enable API Reads (A/B Test)**

**Only after 24h of stable writes!**

### **Option A: 100% Rollout (Simpler)**

```bash
FEATURE_CANONICAL_EVENTS_READ=true
```

### **Option B: Gradual Rollout (Safer)**

Implement A/B logic in `apps/web/src/app/page.tsx`:

```typescript
const useCanonicalEvents = () => {
  // 10% rollout
  const bucket = Math.random();
  return bucket < 0.1 && FEATURE_FLAGS.CANONICAL_EVENTS_READ;
};
```

### **Compare Old vs New**

```bash
# Fetch from old parser
curl "https://staging.vercel.app/api/calendar"

# Fetch from canonical store
curl "https://staging.vercel.app/api/events/canonical?limit=50"

# Compare event counts (should be within 5%)
```

---

## 🚨 **Rollback Procedures**

### **If Issues Detected**

**Immediate rollback (<2 minutes):**

```bash
# Set flags back to safe defaults
FEATURE_CANONICAL_EVENTS_READ=false
FEATURE_CANONICAL_EVENTS_WRITE=false
CANONICAL_DRY_RUN=true

# Redeploy
vercel --prod
```

**If database corrupted:**

```sql
-- Run down migration
-- Copy contents of: packages/api/migrations/006_drop_canonical_events.sql
-- Paste into Supabase SQL Editor
-- Click Run
```

**Then restore from backup if needed.**

---

## ✅ **Sign-off Checklist**

Before proceeding to production:

- [ ] Dry-run completed (72h, no errors)
- [ ] Writes enabled (24h, no crashes)
- [ ] Duplicate rate: 0%
- [ ] Geocoding working (>60% success)
- [ ] API responses < 500ms (p95)
- [ ] Old vs new output matches (<5% variance)
- [ ] Rollback tested and works
- [ ] DBA sign-off obtained
- [ ] Backend lead sign-off obtained

---

## 📞 **Troubleshooting**

### **Problem: Worker not processing events**

```sql
-- Check last worker run
SELECT MAX(created_at) FROM canonical_event_changes;

-- Check for errors
SELECT * FROM canonical_event_changes 
WHERE payload->>'error' IS NOT NULL 
ORDER BY created_at DESC LIMIT 10;
```

**Solution**: Check worker logs, verify calendar URLs accessible

### **Problem: High duplicate rate**

```sql
-- Find duplicates
SELECT canonical_uid, array_agg(title) as titles, COUNT(*)
FROM canonical_events
GROUP BY canonical_uid
HAVING COUNT(*) > 1;
```

**Solution**: Check `canonicalUid()` logic, may need normalization adjustment

### **Problem: Geocoding all failing**

```sql
SELECT * FROM canonical_events 
WHERE geocode_status = 'failed' 
LIMIT 10;
```

**Solution**: Check Mapbox API key, rate limits

---

## 📚 **Related Documents**

- Smoke test checklist: `Docs/LAUNDRY/20251114-staging-smoke-test-checklist.md`
- Work order: `Docs/WORK_ORDERS/20251114-canonical-event-store-WORK_ORDER.md`
- Monitoring queries: `scripts/monitor-canonical-events.sql`

---

**Next**: After staging validation passes, proceed to production deployment (Week 4)






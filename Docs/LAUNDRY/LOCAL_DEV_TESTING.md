# Local Dev Testing - Canonical Events

**Before pushing to staging, test everything locally!**

---

## 🎯 **Goal**

Validate canonical event store works in local dev environment before deploying to staging.

---

## 🛠️ **Step 1: Set Up Local Environment**

### **Create/Update `.env.local`**

```bash
cd /Users/samuraizan/zohm/apps/web

# Create or edit .env.local
cat > .env.local << 'EOF'
# Supabase (use your local/dev instance)
NEXT_PUBLIC_SUPABASE_URL=your-dev-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-dev-service-key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your-mapbox-token

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id
PRIVY_APP_SECRET=your-privy-secret

# Feature Flags - LOCAL DEV CONFIG
FEATURE_CANONICAL_EVENTS_READ=false
FEATURE_CANONICAL_EVENTS_WRITE=false
CANONICAL_DRY_RUN=true
EOF
```

**Important**: Use a **development** or **local** Supabase project, not production!

---

## 🗄️ **Step 2: Run Migration Locally**

### **Option A: Supabase CLI (if installed)**

```bash
# Connect to your dev project
supabase link --project-ref your-dev-project

# Run migration
supabase db push
```

### **Option B: Supabase Dashboard**

1. Go to: https://supabase.com/dashboard
2. Select your **DEV** project (not production!)
3. Click "SQL Editor"
4. Copy/paste entire contents of:
   ```
   packages/api/migrations/006_create_canonical_events.sql
   ```
5. Click **Run**

### **Verify Migration**

Run in SQL Editor:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('canonical_events', 'canonical_event_changes');

-- Should return 2 rows

-- Check structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'canonical_events'
ORDER BY ordinal_position;

-- Should return 17 columns
```

---

## 🚀 **Step 3: Start Dev Server**

```bash
cd /Users/samuraizan/zohm/apps/web
npm run dev
```

Server should start on: http://localhost:3000

**Check for errors in startup logs!**

---

## 🧪 **Step 4: Test Worker API**

### **Test 1: Worker Status Check**

```bash
# GET endpoint (should return worker info)
curl http://localhost:3000/api/worker/sync-events
```

**Expected Response:**
```json
{
  "status": "ready",
  "worker": "canonical-events-sync",
  "feature_flags": {
    "read": false,
    "write": false,
    "dryRun": true
  },
  "usage": {...}
}
```

### **Test 2: Trigger Dry-Run Sync**

```bash
# POST to trigger sync (dry-run mode)
curl -X POST http://localhost:3000/api/worker/sync-events
```

**Expected Response:**
```json
{
  "success": true,
  "stats": {
    "processed": 50,
    "inserted": 0,
    "updated": 0,
    "skipped": 50,
    "errors": 0,
    "dryRunOnly": true,
    "duration_ms": 5000
  },
  "config": {
    "dry_run": true,
    "calendar_filter": "all"
  }
}
```

**Check:**
- ✅ `success: true`
- ✅ `processed > 0` (events fetched from calendars)
- ✅ `skipped === processed` (dry-run mode)
- ✅ `errors: 0` or very low

### **Test 3: Verify Dry-Run Logs**

Open Supabase dashboard, run:

```sql
-- Check dry-run operations logged
SELECT COUNT(*) FROM canonical_event_changes WHERE change_type = 'dry-run';
-- Should be > 0

-- View sample logs
SELECT 
  payload->>'event_name' as event,
  payload->>'action' as action,
  created_at
FROM canonical_event_changes 
WHERE change_type = 'dry-run'
ORDER BY created_at DESC 
LIMIT 10;
```

**Should see:**
- Mix of `would-insert` and `would-update` actions
- Real event names from your calendars
- Recent timestamps

---

## 🔓 **Step 5: Test Write Mode (Optional - Careful!)**

**Only do this if you're OK with writing test data to dev DB!**

### **Enable Writes**

Update `.env.local`:
```bash
CANONICAL_DRY_RUN=false
FEATURE_CANONICAL_EVENTS_WRITE=true
```

**Restart dev server:**
```bash
# Ctrl+C to stop
npm run dev
```

### **Trigger Real Sync**

```bash
curl -X POST "http://localhost:3000/api/worker/sync-events?apply=true&verbose=true"
```

### **Verify Events Inserted**

```sql
-- Check events inserted
SELECT COUNT(*) FROM canonical_events;
-- Should be > 0

-- View sample events
SELECT 
  title,
  location_raw,
  starts_at,
  geocode_status,
  created_at
FROM canonical_events
ORDER BY created_at DESC
LIMIT 5;

-- Check for duplicates (should be 0)
SELECT canonical_uid, COUNT(*) 
FROM canonical_events 
GROUP BY canonical_uid 
HAVING COUNT(*) > 1;
```

---

## 🔌 **Step 6: Test API Endpoint**

### **Enable Read Flag**

Update `.env.local`:
```bash
FEATURE_CANONICAL_EVENTS_READ=true
```

**Restart dev server.**

### **Test API**

```bash
# Fetch all events
curl "http://localhost:3000/api/events/canonical?limit=10"

# With location filter
curl "http://localhost:3000/api/events/canonical?lat=37.7749&lng=-122.4194&radius=100&limit=5"
```

**Expected:**
```json
{
  "events": [
    {
      "Event Name": "Blockchain Meetup",
      "Date & Time": "2025-11-15T18:00:00Z",
      "Location": "Zo House SF",
      "Latitude": "37.7817309",
      "Longitude": "-122.401198",
      "_canonical": {
        "id": "uuid-here",
        "uid": "a1b2c3d4e5f6"
      }
    }
  ],
  "meta": {
    "total": 5,
    "source": "canonical_events"
  }
}
```

---

## 🧹 **Step 7: Test Rollback**

### **Disable Canonical System**

Update `.env.local`:
```bash
FEATURE_CANONICAL_EVENTS_READ=false
FEATURE_CANONICAL_EVENTS_WRITE=false
CANONICAL_DRY_RUN=true
```

**Restart dev server.**

### **Verify Old Flow Works**

```bash
# Should use old calendar parser
curl "http://localhost:3000/api/events/canonical"
```

**Expected:**
```json
{
  "error": "Canonical events feature not enabled",
  "fallback": "Use /api/calendar instead"
}
```

UI should still work with old event system!

---

## ✅ **Local Testing Checklist**

Before pushing to staging, verify:

- [ ] Migration runs successfully in dev DB
- [ ] Dev server starts without errors
- [ ] Worker status endpoint returns `200 OK`
- [ ] Dry-run sync completes (`success: true`)
- [ ] Dry-run logs appear in `canonical_event_changes`
- [ ] No TypeScript errors in browser console
- [ ] Feature flags toggle behavior correctly
- [ ] (Optional) Write mode inserts events correctly
- [ ] (Optional) API endpoint returns valid events
- [ ] (Optional) No duplicate events created
- [ ] Rollback works (disable flags → old flow works)

---

## 🐛 **Troubleshooting**

### **Problem: Worker says "Calendar not found"**

**Solution:** Check calendar URLs are accessible:
```sql
SELECT * FROM calendars WHERE is_active = true;
```

### **Problem: All geocoding fails**

**Check:** Mapbox token is valid
```bash
echo $NEXT_PUBLIC_MAPBOX_TOKEN
```

**Test:** Try manual geocode
```bash
curl "https://api.mapbox.com/geocoding/v5/mapbox.places/San%20Francisco.json?access_token=YOUR_TOKEN"
```

### **Problem: TypeScript errors**

**Run:**
```bash
cd apps/web
npx tsc --noEmit
```

Fix any type errors before proceeding.

### **Problem: "Cannot find module"**

**Run:**
```bash
cd apps/web
npm install
```

---

## 🧪 **Quick Validation Commands**

```bash
# 1. Check feature flags
curl http://localhost:3000/api/worker/sync-events | jq '.feature_flags'

# 2. Trigger dry-run
curl -X POST http://localhost:3000/api/worker/sync-events | jq '.stats'

# 3. Check events count
psql $LOCAL_DB -c "SELECT COUNT(*) FROM canonical_events;"

# 4. Check for duplicates
psql $LOCAL_DB -c "SELECT canonical_uid, COUNT(*) FROM canonical_events GROUP BY canonical_uid HAVING COUNT(*) > 1;"
```

---

## ✅ **Ready for Staging When:**

- [ ] All local tests pass
- [ ] No errors in dev server logs
- [ ] No errors in browser console
- [ ] Feature flags work as expected
- [ ] Worker completes successfully
- [ ] API returns valid data
- [ ] TypeScript compiles cleanly
- [ ] Rollback tested and works

---

**Once local testing is complete, you're ready to push to staging!**

Next: Follow `Docs/LAUNDRY/STAGING_DEPLOYMENT_GUIDE.md`


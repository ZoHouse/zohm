# 🚨 Fix Onboarding Issue - Action Required

## Problem
After completing onboarding, you're stuck in a loop with this error:
```
❌ Could not find the 'city' column of 'users' in the schema cache
```

## Root Cause
The `users` table in your Supabase database is missing the `city` column. This column is required by the onboarding flow to save your profile.

---

## 🔧 Solution (3 Steps)

### Step 1: Run SQL Migration in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste this SQL:**
   ```sql
   -- Add city column to users table
   ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;

   -- Create index for city lookups  
   CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);

   -- Verify the column was added
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'users' AND column_name = 'city';
   ```

4. **Click "Run"**
   - You should see: `✅ City column added successfully!`

**OR** run the file `RUN_THIS_IN_SUPABASE.sql` (I just created it for you)

---

### Step 2: Clear Your Browser Data (Important!)

Since your onboarding failed mid-way, you need to reset:

**Option A - Clear Site Data (Recommended):**
1. Open Developer Tools (F12 or Cmd+Option+I)
2. Go to "Application" tab (Chrome) or "Storage" tab (Firefox)
3. Click "Clear site data" or "Clear All"
4. Refresh the page

**Option B - Logout and Login Again:**
1. Logout from the app
2. Clear browser cache
3. Login again
4. Go through onboarding

---

### Step 3: Test the Fix

1. **Refresh the app**
2. **Complete onboarding again**
3. **Watch for these console logs:**
   ```
   ✅ Profile saved successfully!
   💾 Saving MapCanvas location to user profile...
   ✅ Location saved to profile
   🚀 Space animation enabled after location obtained
   🚀 Flying from outer space to user location...
   ```

4. **You should see:**
   - Map starts from outer space (zoom 0)
   - Flies down to your location over 8 seconds
   - 🦄 Unicorn marker appears at your location

---

## What Changed in the Code

### 1. Fixed Database Schema
Added missing `city` column to users table

### 2. Improved Onboarding Handler (`src/app/page.tsx`)
**Before:**
```typescript
lat: location?.lat || 0,  // ❌ Saved 0,0 if no location
lng: location?.lng || 0,
```

**After:**
```typescript
// Only include location if it's actually available
if (location?.lat && location?.lng) {
  profileUpdate.lat = location.lat;
  profileUpdate.lng = location.lng;
}
// Otherwise, MapCanvas will get it later
```

### 3. Better Animation Trigger
**Before:** 
- Animation only played after page reload
- User saw jarring reload experience

**After:**
- Animation triggers immediately when location is obtained
- Page reloads after animation completes (10 seconds)
- Smoother user experience

---

## Expected Flow After Fix

### For New Users (First Time):
1. **Login with Twitter/Wallet**
2. **Onboarding appears** → Answer 3 questions
3. **Profile saves** → No errors!
4. **Map loads** → Requests location permission
5. **Location obtained** → 🚀 Space animation starts
6. **Fly to location** → 8-second dramatic descent
7. **🦄 Marker appears** → You're on the map!
8. **Page reloads** → Updates to "Local" mode (100km radius)

### For Returning Users:
1. **Login**
2. **Map loads** from outer space
3. **🚀 Flies to saved location**
4. **Done!** → No onboarding needed

---

## Troubleshooting

### Issue: Still stuck in onboarding loop
- Make sure you ran the SQL migration
- Clear all site data (Step 2)
- Try incognito/private browsing mode

### Issue: Location not obtained
- Check browser location permissions
- Click the location icon in address bar
- Grant location access

### Issue: Animation not playing
- Check console for `🚀 Flying from outer space...` message
- Make sure `shouldAnimateFromSpace` is true
- Try hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)

### Issue: Map starts zoomed in, not from space
- The animation only plays ONCE per session
- Refresh the page to see it again

---

## Files Modified

1. ✅ `migrations/002_add_city_column.sql` - Migration file (for reference)
2. ✅ `RUN_THIS_IN_SUPABASE.sql` - Quick fix script (run this!)
3. ✅ `src/app/page.tsx` - Improved onboarding & animation logic
4. ✅ `FIX_ONBOARDING_ISSUE.md` - This guide

---

## After You Fix This

Once onboarding works, let me know if you want to:
- Continue with **quest markers on map** 🏆
- Or fix any other issues

Good luck! 🚀


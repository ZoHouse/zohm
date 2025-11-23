# Debug Guide: Founder NFTs Error

**Error**: `Failed to fetch profile: {}`  
**Date**: November 23, 2025

---

## Errors Observed

1. **Primary Error**: `Error: Failed to fetch profile: {}`
   - Source: `getProfile()` in `src/lib/zo-api/profile.ts:46`
   - Called by: `useFounderNFTs` hook

2. **Secondary Error**: `ChunkLoadError`
   - This is a webpack/Next.js hot reload issue
   - Not related to Founder NFTs
   - **Fix**: Hard refresh the browser (Cmd+Shift+R or Ctrl+Shift+R)

---

## Debugging Steps

### Step 1: Check Browser Console Logs

After refreshing the page, look for these specific logs in the console:

```
🔑 Fetching Founder NFTs with device credentials from Supabase
📊 Credentials: { hasAccessToken: true, hasDeviceId: true, hasDeviceSecret: true, userId: '...' }
📡 ZO API Profile Result: { success: true, hasProfile: true, error: undefined, founderTokensCount: X }
✅ Loaded X Founder NFTs
```

### Step 2: Check for Error Logs

If you see any of these, note which one:

| Log | Meaning | Action |
|-----|---------|--------|
| `No user ID, skipping founder NFTs fetch` | `zo_user_id` not in localStorage | Re-login |
| `⚠️ Failed to fetch user data from Supabase: ...` | Supabase query failed | Check Supabase connection |
| `⚠️ No user data found in Supabase for userId: ...` | User doesn't exist in DB | Check user ID |
| `No access token in Supabase, skipping founder NFTs fetch` | `zo_token` is null | Re-login |
| `No device credentials in Supabase, skipping founder NFTs fetch` | `zo_device_id` or `zo_device_secret` is null | Re-login |
| `⚠️ Profile fetch failed: ...` | ZO API call failed | Check API status |

### Step 3: Verify Supabase Data

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id,
  zo_user_id,
  zo_token IS NOT NULL as has_token,
  zo_device_id IS NOT NULL as has_device_id,
  zo_device_secret IS NOT NULL as has_device_secret,
  zo_token_expiry,
  created_at,
  last_seen
FROM users
WHERE id = '<YOUR_USER_ID>';
```

Replace `<YOUR_USER_ID>` with the value from `localStorage.getItem('zo_user_id')`.

**Expected Result**:
- `has_token`: true
- `has_device_id`: true
- `has_device_secret`: true
- `zo_token_expiry`: Future date (not expired)

### Step 4: Check localStorage

Open browser DevTools Console and run:

```javascript
console.log({
  zo_user_id: localStorage.getItem('zo_user_id'),
  zo_access_token: localStorage.getItem('zo_access_token'),
  zo_token: localStorage.getItem('zo_token'),
});
```

**Expected Result**:
- `zo_user_id`: Should be a UUID or user ID string
- `zo_access_token` OR `zo_token`: Should be a JWT token string

### Step 5: Test ZO API Directly

If Supabase data looks good, test the ZO API directly:

```javascript
// In browser console
const userId = localStorage.getItem('zo_user_id');

// Fetch from Supabase
const { data } = await supabase
  .from('users')
  .select('zo_token, zo_device_id, zo_device_secret')
  .eq('id', userId)
  .single();

console.log('Supabase data:', data);

// Test ZO API
const response = await fetch('https://api.io.zo.xyz/api/v1/profile/me/', {
  headers: {
    'Authorization': `Bearer ${data.zo_token}`,
    'client-key': process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB,
    'client-device-id': data.zo_device_id,
    'client-device-secret': data.zo_device_secret,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const profile = await response.json();
console.log('ZO API Response:', profile);
console.log('Founder Tokens:', profile.founder_tokens);
```

---

## Common Issues & Fixes

### Issue 1: ChunkLoadError

**Symptoms**: Page won't load, multiple chunk errors in console

**Fix**:
1. Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. If that doesn't work, clear browser cache
3. If still failing, restart dev server: `pnpm dev`

### Issue 2: Token Expired

**Symptoms**: `401 Unauthorized` or `Token is invalid or expired`

**Fix**:
1. Log out and log back in
2. This will refresh all tokens and device credentials

### Issue 3: Device Credentials Missing

**Symptoms**: `No device credentials in Supabase`

**Fix**:
1. Log out completely
2. Clear localStorage: `localStorage.clear()`
3. Log back in with phone OTP
4. Device credentials will be saved during login

### Issue 4: User Has No Founder NFTs

**Symptoms**: Section not visible, but no errors in console

**Expected Behavior**: This is correct! The section only shows if `founder_tokens.length > 0`

**To Verify**:
- Check console for: `✅ Loaded 0 Founder NFTs`
- This means the API call succeeded, but user has no NFTs

---

## Expected Behavior

### If User Has Founder NFTs:
1. Console shows: `✅ Loaded X Founder NFTs` (where X > 0)
2. Left sidebar shows "FOUNDER NFTS" section
3. Each NFT displays with image and name

### If User Has NO Founder NFTs:
1. Console shows: `✅ Loaded 0 Founder NFTs`
2. Left sidebar does NOT show "FOUNDER NFTS" section
3. This is correct behavior (section is conditionally rendered)

---

## Next Steps

1. **Hard refresh the browser** to clear the ChunkLoadError
2. **Check console logs** for the new detailed logging
3. **Share the console output** if errors persist
4. **Run the Supabase query** to verify data exists

---

## Files Modified

- `apps/web/src/hooks/useFounderNFTs.ts` - Added detailed logging and better error handling
- Now fetches device credentials from Supabase instead of localStorage

---

**Status**: ⏳ Awaiting Debug Info  
**Action Required**: Hard refresh browser and check console logs


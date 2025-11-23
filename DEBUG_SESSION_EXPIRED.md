# Debug: "Session expired" Error

**Date**: November 23, 2025  
**Issue**: API returns `403 Forbidden: "Session expired."` even though token is valid

---

## ✅ What We Know

1. **Token is NOT expired**:
   - Expiry: December 8, 2025
   - Current: November 23, 2025
   - Valid for 15 more days ✅

2. **Device credentials are correct**:
   - `device_id`: `web-1763915028621-pq4zh9` ✅
   - `device_secret`: `cg85ki2na8tbdc9uhived` ✅

3. **Client key is correct**:
   - `1482d843137574f36f74` ✅

4. **Base URL is correct**:
   - `https://api.io.zo.xyz` ✅

---

## 🤔 Possible Causes

### 1. Device Credentials Don't Match Token
The API might be checking if the `device_id` and `device_secret` match the ones used when the token was created.

**Test**: Check if the device credentials in Supabase match the ones from your last login.

```sql
SELECT 
  id,
  zo_token_expiry,
  zo_device_id,
  zo_device_secret,
  updated_at
FROM users
WHERE id = '5fe9695677ff484aa1ad6bbba9828a91';
```

If `updated_at` is much older than your last login, the credentials might be stale.

---

### 2. Token Format Issue
The API might expect a different token format or additional headers.

**Current token**: `13ae81d8462739942a75...` (64 characters)

This looks like a short token, not a JWT. Let me check if there's a different token field.

```sql
SELECT 
  zo_token,
  zo_legacy_token,
  LENGTH(zo_token) as token_length,
  LENGTH(zo_legacy_token) as legacy_token_length
FROM users
WHERE id = '5fe9695677ff484aa1ad6bbba9828a91';
```

---

### 3. API Session Management
The ZO API might have its own session management that's separate from the token expiry.

Possible scenarios:
- API tracks active sessions server-side
- Session was invalidated when you logged in from another device
- Session has a shorter TTL than the token expiry

---

### 4. Token Was Refreshed But Not Updated
If the token was refreshed but the old one is still in localStorage, the API would reject it.

**Check localStorage**:
```javascript
console.log('Token in localStorage:', localStorage.getItem('zo_access_token'));
```

**Check Supabase**:
```sql
SELECT zo_token FROM users WHERE id = '5fe9695677ff484aa1ad6bbba9828a91';
```

If they don't match, that's the problem!

---

## 🧪 Diagnostic Steps

### Step 1: Check Token Match
Run this in browser console on `http://localhost:3005`:

```javascript
const localToken = localStorage.getItem('zo_access_token');
console.log('Token in localStorage:', localToken);
console.log('Token length:', localToken?.length);

// Then compare with Supabase
```

### Step 2: Try Logging Out and Back In
Even though the token isn't expired, the session might be invalid. Try:
1. Logout
2. Login again
3. Test the API call

This will create a fresh session with matching device credentials.

---

### Step 3: Test with curl Using Supabase Token
Get the actual token from Supabase:

```sql
SELECT zo_token FROM users WHERE id = '5fe9695677ff484aa1ad6bbba9828a91';
```

Then test with curl:

```bash
curl -X GET 'https://api.io.zo.xyz/api/v1/profile/me/' \
  -H 'Authorization: Bearer <token_from_supabase>' \
  -H 'client-key: 1482d843137574f36f74' \
  -H 'client-device-id: web-1763915028621-pq4zh9' \
  -H 'client-device-secret: cg85ki2na8tbdc9uhived' \
  -v
```

If this works, the issue is localStorage vs Supabase mismatch.

---

## 💡 Most Likely Cause

**Token Mismatch**: The token in `localStorage` is different from the token in Supabase.

This can happen if:
- You logged in from another device
- Token was refreshed but localStorage wasn't updated
- You manually changed something in localStorage

**Solution**: Logout and login again to sync everything.

---

## 🎯 Quick Fix

Run this in browser console:

```javascript
// Force sync from Supabase
async function syncToken() {
  const userId = localStorage.getItem('zo_user_id');
  const response = await fetch(`/api/zo/sync-profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
  const data = await response.json();
  console.log('Sync result:', data);
  
  // Reload to pick up new token
  window.location.reload();
}

syncToken();
```

Or just **logout and login again** (simpler).


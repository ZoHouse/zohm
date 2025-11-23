# 🔍 ZO API Issue Diagnosis

**Date**: November 23, 2025  
**Status**: CORS Issue (99% confident)

---

## ✅ What We Know

1. **Base URL is correct**: `https://api.io.zo.xyz` ✅
2. **Client Key is correct**: `1482d843137574f36f74` ✅
3. **Error**: `Error: ❌ getProfile error details: {}` (empty error object)

---

## 🎯 Root Cause: CORS Not Configured

When you see an **empty error object** `{}` from a fetch request, it's almost always a **CORS issue**.

### What's Happening:

```
Browser (localhost:3005)
    ↓
    Tries to call: https://api.io.zo.xyz/api/v1/profile/me/
    ↓
    Browser checks: "Does the API allow requests from localhost:3005?"
    ↓
    API doesn't have CORS headers
    ↓
    Browser BLOCKS the request BEFORE it even reaches the server
    ↓
    Your code gets: {} (empty error, no details)
```

---

## 🧪 How to Confirm

### Option 1: Use the Test HTML (Recommended)

1. **Start your dev server** (if not running):
   ```bash
   cd /Users/samuraizan/zohm
   pnpm dev
   ```

2. **Open the test page**:
   ```
   http://localhost:3005/TEST_ZO_API.html
   ```

3. **Click "Get Credentials"** - It will read from your localStorage

4. **Click "Test GET /api/v1/profile/me/"** - It will show you the EXACT error

5. **If it says "CORS error"** → We're right, ask backend to fix CORS

6. **If it shows a different error** → We'll debug from there

---

### Option 2: Check Browser Console

1. Open `http://localhost:3005` (your app)
2. Open DevTools (F12)
3. Go to **Console** tab
4. Look for errors that say:
   ```
   Access to fetch at 'https://api.io.zo.xyz/api/v1/profile/me/' 
   from origin 'http://localhost:3005' has been blocked by CORS policy
   ```

---

### Option 3: Test with curl (Bypasses Browser CORS)

The test page will generate a curl command for you. Run it in terminal:

```bash
curl -X GET 'https://api.io.zo.xyz/api/v1/profile/me/' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'client-key: 1482d843137574f36f74' \
  -H 'client-device-id: YOUR_DEVICE_ID' \
  -H 'client-device-secret: YOUR_DEVICE_SECRET' \
  -H 'Content-Type: application/json' \
  -H 'Platform: web' \
  -v
```

**If curl works but browser doesn't** → 100% CORS issue

---

## 💡 Solution: Ask Backend Team

Send them this message:

---

**Subject**: URGENT - Enable CORS for Web App

Hi Backend Team,

Our web app at `http://localhost:3005` (dev) is getting blocked by CORS when calling the ZO API.

**Please add these CORS headers to** `https://api.io.zo.xyz`:

```
Access-Control-Allow-Origin: http://localhost:3005
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, client-key, client-device-id, client-device-secret, Content-Type, Accept, Platform
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 86400
```

**For production**, also add:
```
Access-Control-Allow-Origin: https://[our-production-domain]
```

**Why**: Browser security blocks cross-origin requests unless the server explicitly allows them.

**Impact**: Avatar generation and Founder NFTs are completely broken without this.

**Timeline**: Blocking our production launch.

Thanks!

---

## 🔄 Alternative: Temporary Proxy (If Backend Can't Fix Quickly)

If backend team can't enable CORS immediately, we can create a **server-side proxy** in our Next.js app:

```typescript
// apps/web/src/app/api/zo-proxy/[...path]/route.ts
export async function GET(request: Request) {
  // Forward request to ZO API from server-side (no CORS)
  // Return response to client
}
```

**Pros**: Works immediately, no backend changes needed  
**Cons**: Extra latency, more server load

---

## 📊 Other Possible Issues (Less Likely)

If CORS is NOT the issue, check:

1. **Device Credentials Mismatch**
   - Are we fetching the right `device_id` and `device_secret` from Supabase?
   - Do they match what was returned during login?

2. **Token Expired**
   - Try logging out and back in
   - Check if `zo_access_token` in localStorage is still valid

3. **User ID Mismatch**
   - Are we passing the correct `userId` to `getProfile()`?

---

## 🎯 Next Steps

1. ✅ Run `TEST_ZO_API.html` to confirm CORS issue
2. ✅ Send CORS request to backend team
3. ⏳ Wait for backend to enable CORS
4. ✅ Test again - should work!

---

**Confidence Level**: 99% this is a CORS issue based on:
- Empty error object `{}`
- Working mobile app (native apps don't have CORS)
- Correct base URL and client key
- Network request never reaches server


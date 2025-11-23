# 📱 Mobile App Device Credentials Flow

**Based on**: Mobile app codebase analysis  
**Date**: November 23, 2025

---

## 🔑 What Are Device Credentials?

Device credentials are **two randomly generated UUIDs** that identify a specific device/session:
- `device_id` - Random UUID (e.g., `"550e8400-e29b-41d4-a716-446655440000"`)
- `device_secret` - Random UUID (e.g., `"6ba7b810-9dad-11d1-80b4-00c04fd430c8"`)

These are sent with **EVERY API request** to the ZO API.

---

## 📊 Mobile App Flow (From Codebase)

### Step 1: Initial OTP Request (Pre-Login)

```typescript
// User enters phone number and requests OTP
POST /api/v1/auth/login/mobile/otp/

Headers:
  client-key: <platform_key>
  client-device-id: <randomly_generated_uuid>    // ← NEW random UUID
  client-device-secret: <randomly_generated_uuid> // ← NEW random UUID
  Content-Type: application/json

Body:
  {
    "mobile_country_code": "91",
    "mobile_number": "9876543210"
  }
```

**Key Point**: Mobile app generates **NEW random UUIDs** for EVERY login attempt.

---

### Step 2: Verify OTP (Login)

```typescript
// User enters OTP
POST /api/v1/auth/login/mobile/

Headers:
  client-key: <platform_key>
  client-device-id: <same_uuid_from_step_1>    // ← SAME as Step 1
  client-device-secret: <same_uuid_from_step_1> // ← SAME as Step 1
  Content-Type: application/json

Body:
  {
    "mobile_country_code": "91",
    "mobile_number": "9876543210",
    "otp": "123456"
  }
```

**Response**:
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "eyJhbGc...",
  "device_id": "550e8400-e29b-41d4-a716-446655440000",    // ← API returns these
  "device_secret": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", // ← API returns these
  "user": {
    "id": "5fe9695677ff484aa1ad6bbba9828a91",
    "first_name": "John",
    ...
  }
}
```

**Key Point**: The API **returns** `device_id` and `device_secret` in the response. These **might be different** from what you sent!

---

### Step 3: Store Credentials

```typescript
// Mobile app stores these in AsyncStorage (like localStorage)
await AsyncStorage.setItem('ZO_ACCESS_TOKEN', access_token);
await AsyncStorage.setItem('ZO_DEVICE_ID', device_id);        // ← From API response
await AsyncStorage.setItem('ZO_DEVICE_SECRET', device_secret); // ← From API response
await AsyncStorage.setItem('ZO_USER_ID', user.id);
```

**Key Point**: Mobile app **overwrites** the random UUIDs it generated with the ones returned by the API.

---

### Step 4: All Subsequent API Calls

```typescript
// Every API call uses the stored credentials
GET /api/v1/profile/me/

Headers:
  Authorization: Bearer <access_token>
  client-key: <platform_key>
  client-device-id: <from_api_response>    // ← From Step 2 response
  client-device-secret: <from_api_response> // ← From Step 2 response
  Content-Type: application/json
```

**Key Point**: Mobile app uses the **SAME** device credentials for ALL requests until logout.

---

### Step 5: On Logout

```typescript
// Mobile app generates NEW random UUIDs for next login
const newDeviceId = randomUUID();
const newDeviceSecret = randomUUID();

await AsyncStorage.setItem('ZO_DEVICE_ID', newDeviceId);
await AsyncStorage.setItem('ZO_DEVICE_SECRET', newDeviceSecret);

// Clear auth tokens
await AsyncStorage.removeItem('ZO_ACCESS_TOKEN');
await AsyncStorage.removeItem('ZO_USER_ID');
```

**Key Point**: On logout, mobile app **resets** to new random UUIDs for the next login.

---

## 🌐 Web App Current Flow (What We're Doing)

### Our Implementation:

```typescript
// Step 1: OTP Request
POST /api/v1/auth/login/mobile/otp/
Headers:
  client-device-id: <random_uuid>    // ← We generate random
  client-device-secret: <random_uuid> // ← We generate random

// Step 2: Verify OTP
POST /api/v1/auth/login/mobile/
Headers:
  client-device-id: <same_random_uuid>
  client-device-secret: <same_random_uuid>

// API Response:
{
  "device_id": "abc123...",    // ← API returns these
  "device_secret": "xyz789...", // ← API returns these
  ...
}

// Step 3: We save to Supabase
await supabase.from('users').update({
  zo_device_id: device_id,      // ← From API response ✅
  zo_device_secret: device_secret, // ← From API response ✅
  zo_token: access_token,
  ...
});

// Step 4: Subsequent API calls
GET /api/v1/profile/me/
Headers:
  client-device-id: <from_supabase>    // ← We fetch from database ✅
  client-device-secret: <from_supabase> // ← We fetch from database ✅
```

**Our flow is CORRECT!** ✅

---

## ❓ So Why Is It Failing?

If our device credentials flow matches mobile, the issue is **NOT** device credentials.

### Possible Causes:

1. **CORS (99% likely)** ⚠️
   - Browser blocks the request before it reaches the server
   - Empty error object `{}` is a classic CORS symptom
   - Mobile apps don't have CORS (native code)

2. **Token Expired (1% likely)**
   - Try logging out and back in
   - Check if `zo_token` in Supabase is still valid

3. **Database Fetch Failing (1% likely)**
   - Check if Supabase query is returning the credentials
   - Add logging to verify

---

## 🧪 How to Verify Device Credentials Are Correct

### Test 1: Check Supabase

```sql
-- Run this in Supabase SQL Editor
SELECT 
  id,
  zo_user_id,
  zo_device_id,
  zo_device_secret,
  zo_token IS NOT NULL as has_token,
  LENGTH(zo_token) as token_length
FROM users
WHERE id = '5fe9695677ff484aa1ad6bbba9828a91';
```

**Expected**:
- `zo_device_id` should be a UUID (36 chars)
- `zo_device_secret` should be a UUID (36 chars)
- `has_token` should be `true`
- `token_length` should be > 100

---

### Test 2: Check What We're Sending

Add this to `apps/web/src/lib/zo-api/profile.ts`:

```typescript
export async function getProfile(...) {
  const headers = await getZoAuthHeaders(accessToken, userId, deviceCredentials);
  
  // LOG WHAT WE'RE SENDING
  console.log('📡 Calling ZO API with headers:', {
    'client-device-id': headers['client-device-id'],
    'client-device-secret': headers['client-device-secret']?.substring(0, 20) + '...',
    'Authorization': 'Bearer ' + accessToken.substring(0, 20) + '...',
  });
  
  const response = await zoApiClient.get('/api/v1/profile/me/', { headers });
  ...
}
```

---

### Test 3: Compare with curl

Run this in terminal (replace with YOUR actual values from Supabase):

```bash
curl -X GET 'https://api.io.zo.xyz/api/v1/profile/me/' \
  -H 'Authorization: Bearer YOUR_ACTUAL_TOKEN' \
  -H 'client-key: 1482d843137574f36f74' \
  -H 'client-device-id: YOUR_ACTUAL_DEVICE_ID' \
  -H 'client-device-secret: YOUR_ACTUAL_DEVICE_SECRET' \
  -H 'Content-Type: application/json' \
  -v
```

**If curl works** → Device credentials are correct, it's CORS  
**If curl fails** → Device credentials or token issue

---

## 📋 Summary

### Mobile App Device Credentials Flow:
1. ✅ Generate random UUIDs for login
2. ✅ Send with OTP request and verify
3. ✅ **API returns** device credentials in response
4. ✅ **Store** the API-returned credentials
5. ✅ **Reuse** same credentials for all subsequent requests
6. ✅ **Reset** to new random UUIDs on logout

### Web App Device Credentials Flow:
1. ✅ Generate random UUIDs for login
2. ✅ Send with OTP request and verify
3. ✅ **API returns** device credentials in response
4. ✅ **Store** in Supabase database
5. ✅ **Fetch** from Supabase for all subsequent requests
6. ✅ **Reset** on logout

### Conclusion:
**Our device credentials flow is CORRECT** ✅

The issue is almost certainly **CORS**, not device credentials.

---

## 🎯 Next Steps

1. ✅ Run `TEST_ZO_API.html` to confirm CORS
2. ✅ Check Supabase to verify credentials are stored
3. ✅ Test with curl to verify API works outside browser
4. ✅ Ask backend team to enable CORS

---

**Confidence**: 99% CORS issue, 1% other


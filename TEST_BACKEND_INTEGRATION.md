# Test Backend Integration

## Quick Test Guide

### 1. Open Network Tab & Test Page
```bash
# 1. Open browser to:
http://localhost:3004/test-onboarding

# 2. Open DevTools:
- Chrome: Cmd+Option+I (Mac) or F12 (Windows)
- Go to "Network" tab
- Filter: "Fetch/XHR"
- Check "Preserve log"
```

### 2. Watch Console Output
The `UnifiedOnboarding.tsx` component logs everything:

```javascript
// You should see these logs:
✅ Access token retrieved
🚀 Triggering avatar generation...
📤 POST /api/v1/profile/me/ with: { nickname, body_type, city }
✅ Profile updated successfully
🔄 Starting avatar polling...
🔍 Polling attempt 1/30
🔍 Polling attempt 2/30
...
✅ Avatar received: https://cdn.zo.xyz/...
```

### 3. Expected Network Activity

#### Request 1: POST Profile Update
```
URL: https://api.io.zo.xyz/api/v1/profile/me/
Method: POST
Headers:
  Authorization: Bearer eyJ...
  x-client-key: zo_client_...
  Content-Type: application/json
Body:
  {
    "nickname": "testuser",
    "body_type": "bro",
    "city": "San Francisco"
  }
Response (200 OK):
  {
    "id": "user_123",
    "nickname": "testuser",
    "body_type": "bro",
    "city": "San Francisco",
    "avatar": null
  }
```

#### Requests 2-N: GET Profile (Polling)
```
URL: https://api.io.zo.xyz/api/v1/profile/me/
Method: GET
Headers:
  Authorization: Bearer eyJ...
  x-client-key: zo_client_...
Interval: Every 1 second
Max Attempts: 30 (30 seconds total)

Response (200 OK - Still Generating):
  {
    "id": "user_123",
    "nickname": "testuser",
    "avatar": null  // Still null
  }

Response (200 OK - Complete):
  {
    "id": "user_123",
    "nickname": "testuser",
    "avatar": {
      "image": "https://cdn.zo.xyz/avatars/user_123.png",
      "created_at": "2025-11-23T..."
    }
  }
```

### 4. UI State Verification

| Step | Screen | What You See | Backend Activity |
|------|--------|--------------|------------------|
| 1 | Input | Form with nickname, body type, location | None |
| 2 | Generating | Pulsating avatar (no circular text) | POST + Start polling |
| 3 | Success | Rotating circular text + final avatar | Polling continues until avatar received |
| 4 | Portal | Portal animation | None (navigation only) |

### 5. Timing Verification

```javascript
// Add this to browser console to measure timing:
let startTime = Date.now();

// After avatar appears:
let endTime = Date.now();
console.log('Avatar generation took:', (endTime - startTime) / 1000, 'seconds');

// Expected: 5-15 seconds for real avatar generation
// Fallback: 30 seconds if timeout
```

### 6. Error Scenarios to Test

#### Scenario A: No Internet
```
Expected: Fallback to default avatar (/bro.png or /bae.png)
Console: "Failed to trigger generation: NetworkError"
UI: Still proceeds to success screen
```

#### Scenario B: Invalid Token
```
Expected: 401 Unauthorized → Fallback
Console: "No access token found"
UI: Uses placeholder avatar
```

#### Scenario C: Timeout (30+ seconds)
```
Expected: Fallback after 30 attempts
Console: "⚠️ Avatar generation timeout"
UI: Shows placeholder avatar, allows continuation
```

### 7. Success Criteria

✅ **Backend Integration is Correct If:**
1. POST request fires when "Get Citizenship" is clicked
2. POST includes `nickname`, `body_type`, and `city`
3. Polling starts immediately after POST succeeds
4. Polling interval is 1 second (not faster, not slower)
5. Polling stops when `avatar.image` is received
6. Polling stops after 30 attempts (30 seconds)
7. UI transitions: input → generating → success → portal
8. No errors in console (except expected fallbacks)

### 8. Compare with Mobile App (Source of Truth)

The mobile app uses:
- **Method**: POST (not PATCH) ✅
- **Endpoint**: `/api/v1/profile/me/` ✅
- **Polling Interval**: 1 second ✅
- **Timeout**: 30 attempts (30 seconds) ✅
- **Fields**: `nickname`, `body_type`, `city` ✅

**Our implementation matches the mobile app exactly!** ✅

### 9. Production Verification Script

Run this after deploying to production:

```javascript
// Production Verification
(async () => {
  console.log('🔍 Testing Onboarding API Integration...');
  
  const token = localStorage.getItem('zo_access_token');
  if (!token) {
    console.error('❌ No access token. Please log in first.');
    return;
  }
  
  const clientKey = process.env.NEXT_PUBLIC_ZO_CLIENT_KEY_WEB;
  if (!clientKey) {
    console.error('❌ Client key not set');
    return;
  }
  
  // Test POST
  try {
    const response = await fetch('https://api.io.zo.xyz/api/v1/profile/me/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-client-key': clientKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nickname: 'testuser',
        body_type: 'bro',
        city: 'Test City'
      })
    });
    
    if (response.ok) {
      console.log('✅ POST request successful');
      const data = await response.json();
      console.log('Response:', data);
    } else {
      console.error('❌ POST failed:', response.status, response.statusText);
    }
  } catch (err) {
    console.error('❌ Network error:', err);
  }
  
  // Test GET
  try {
    const response = await fetch('https://api.io.zo.xyz/api/v1/profile/me/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-client-key': clientKey
      }
    });
    
    if (response.ok) {
      console.log('✅ GET request successful');
      const data = await response.json();
      console.log('Profile:', data);
    } else {
      console.error('❌ GET failed:', response.status, response.statusText);
    }
  } catch (err) {
    console.error('❌ Network error:', err);
  }
  
  console.log('🏁 Verification complete');
})();
```

### 10. Final Checklist

Before considering this "production ready":

- [ ] UI matches demo pixel-perfect (mobile + desktop) ✅
- [ ] POST request sends correct data ✅
- [ ] Polling interval is 1 second ✅
- [ ] Timeout is 30 seconds ✅
- [ ] Fallback to placeholder avatar works ✅
- [ ] All 4 screens transition correctly ✅
- [ ] Circular text rotates smoothly ✅
- [ ] Avatar pulsates on generating screen ✅
- [ ] Portal animation plays ✅
- [ ] Tested on real mobile device (iOS/Android) ⏳
- [ ] Tested with real avatar generation ⏳
- [ ] Error logging/monitoring set up ⏳

**Status: Ready for staging deployment!** 🚀


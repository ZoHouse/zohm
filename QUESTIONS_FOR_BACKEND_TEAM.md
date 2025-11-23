# Questions for Backend Team - ZO API Integration

**Date**: November 23, 2025  
**From**: Web Team  
**Issue**: Avatar generation and Founder NFTs API calls failing

---

## 🔴 CRITICAL - Blocking Issues

### ✅ 1. Base URL - CONFIRMED
**Base URL**: `https://api.io.zo.xyz` ✅ CORRECT

---

### ✅ 2. Web Client Key - CONFIRMED
**Client Key**: `1482d843137574f36f74` ✅ CORRECT

---

### 3. CORS Configuration ⚠️ LIKELY THE ISSUE
**Current Issue**: `getProfile()` calls failing with empty error object (likely CORS).

**Request**: Please enable CORS for:
- **Dev**: `http://localhost:3005`
- **Prod**: [our production domain]

**Required CORS Headers**:
```
Access-Control-Allow-Origin: http://localhost:3005, https://[our-domain]
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, client-key, client-device-id, client-device-secret, Content-Type, Accept, Platform
Access-Control-Allow-Credentials: true
```

---

### 4. Device Credentials Behavior
**Current Issue**: Not sure if we're using device credentials correctly.

**Questions**:
- After login, we get `device_id` and `device_secret` in the response
- Can we save these to our database and reuse them for ALL subsequent API calls?
- What happens if we send **different** device credentials than what was used during login?
- What error code/message do we get?

**Our Current Flow**:
```
1. User logs in via OTP
2. API returns: access_token, device_id, device_secret
3. We save to Supabase database
4. For ALL API calls, we fetch from database and send:
   - Authorization: Bearer <access_token>
   - client-device-id: <from_database>
   - client-device-secret: <from_database>
```

Is this correct?

---

## 🟡 IMPORTANT - Avatar Generation

### 5. Avatar Generation Endpoint
**Question**: To trigger avatar generation, do we:
- `POST /api/v1/profile/me/` with `{ "body_type": "bro" }` ✅ (mobile app does this)
- OR is there a separate `/api/v1/avatar/generate/` endpoint?

**For new users**, should we send:
```json
{
  "first_name": "John",
  "body_type": "bro",
  "place_name": "Mumbai"
}
```
in one request?

---

### 6. Avatar Status Checking
**Question**: To check if avatar is ready, do we:
- Poll `GET /api/v1/profile/me/` and check if `profile.avatar.image` exists? ✅ (mobile does this)
- OR is there an `avatar.status` field with values like `pending`, `processing`, `completed`?

**Mobile app** only checks if `avatar.image` is non-empty. Is this the correct approach?

---

### 7. Avatar Generation Time
**Question**: How long does avatar generation typically take?
- Mobile app polls for **10 seconds** (10 attempts × 1 second)
- We're polling for **30 seconds** (30 attempts × 1 second)

What's the expected completion time? Should we adjust our timeout?

---

## 🟢 NICE TO HAVE - Founder NFTs

### 8. Founder Tokens Format
**Question**: The profile response includes `founder_tokens`. What format is it?

Is it:
```json
{
  "founder_tokens": ["123", "456"]  // Token IDs?
}
```

OR:
```json
{
  "founder_tokens": [
    { "token_id": "123", "name": "Founder #123" }
  ]
}
```

---

## 🧪 Testing & Debugging

### 9. Check Backend Logs
**Request**: Can you check backend logs for failed requests?

**User ID**: `5fe9695677ff484aa1ad6bbba9828a91`  
**Endpoint**: `GET /api/v1/profile/me/`  
**Error**: Empty error object (suggests network/CORS issue)

What errors are you seeing on the backend?

---

### 10. Sample curl Command
**Request**: Can you provide a working `curl` command that successfully calls the API?

Example:
```bash
curl -X GET 'https://api.zo.xyz/api/v1/profile/me/' \
  -H 'Authorization: Bearer <token>' \
  -H 'client-key: <key>' \
  -H 'client-device-id: <id>' \
  -H 'client-device-secret: <secret>' \
  -H 'Platform: web'
```

With real (test) values so we can verify our setup.

---

### 11. Staging Environment
**Question**: Is there a staging/test environment we can use?
- Staging API URL?
- Test credentials?
- Any differences from production?

---

## 📊 Current Web App Headers

For reference, here's what we're currently sending:

```typescript
{
  "Authorization": "Bearer <access_token>",
  "client-key": "1482d843137574f36f74",  // ← Need to confirm this
  "client-device-id": "<from_supabase>",
  "client-device-secret": "<from_supabase>",
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

---

## 🎯 Summary

**Blocking Issues**:
1. Need correct base URL
2. Need web client key
3. Need CORS enabled
4. Need to confirm device credentials usage

**Once Resolved**: Avatar generation and Founder NFTs should work.

**Timeline**: These are blocking our production launch. Can we get answers this week?

---

**Contact**: [Your Name/Email]  
**Slack**: [Your Slack Handle]


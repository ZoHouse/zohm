# ZO API Documentation

**Version**: 1.0
**Last Updated**: February 2026
**Authentication**: Phone-based OTP (SMS)

### Two APIs, One System

| API | Base URL | Who Uses It |
|-----|----------|-------------|
| **ZOHM API** | `https://zohm-api.up.railway.app/api/v1` | Community devs, game.zo.xyz, all client-facing code. This is the API you should use. |
| **ZO API** | `https://api.io.zo.xyz` | Main identity database (CAS). Admin/internal only. Never call directly from client code. |

The ZOHM API proxies auth, profile, and avatar requests to the ZO API. Community developers should always use the ZOHM API. The endpoints documented below are available through both, but **use `ZOHM_API_BASE_URL` in your code**.

---

## Table of Contents

1. [Overview](#overview)
2. [Interactive API Documentation (Swagger UI)](#interactive-api-documentation-swagger-ui)
3. [Authentication Flow](#authentication-flow)
4. [Required Headers](#required-headers)
5. [Endpoints](#endpoints)
   - [Authentication](#authentication-endpoints)
   - [Profile](#profile-endpoints)
   - [Avatar](#avatar-endpoints)
6. [Response Formats](#response-formats)
7. [Error Handling](#error-handling)
8. [Code Examples](#code-examples)
9. [Session Management](#session-management)
10. [TypeScript Types](#typescript-types)

---

## Overview

The ZO API is a RESTful API for user authentication, profile management, and avatar generation. It uses phone-based OTP authentication and returns JWT tokens for subsequent requests.

### Key Features

- 📱 **Phone-based authentication** - No passwords, just phone + OTP
- 🔄 **Token refresh** - Automatic token renewal
- 👤 **Profile management** - User profiles with cultures, locations, and metadata
- 🎨 **Avatar generation** - Zo backend generated avatars (bro/bae body types)
- 🔐 **Device credentials** - Session-based device tracking

### Base URL

```
https://api.io.zo.xyz
```

**Environment Variable**: `ZO_API_BASE_URL` or `NEXT_PUBLIC_ZO_API_BASE_URL`

---

## Interactive API Documentation (Swagger UI)

The ZO House project includes interactive API documentation powered by Swagger UI, making it easy to test endpoints directly from your browser.

### Accessing Swagger UI

#### Internal APIs
- **URL**: http://localhost:3000/api-docs (development)
- **Specification**: `/public/openapi-internal.yaml`
- **Endpoints**: NFT verification, user inventory, quests, leaderboards, calendar events, city data

#### External ZO Backend APIs
- **URL**: http://localhost:3000/api-docs/zo (development)
- **Specification**: `/public/openapi-external.yaml`
- **Endpoints**: Authentication, profile management, avatar generation

### Using Swagger UI

**Features:**
- **Try It Out**: Click "Try it out" on any endpoint to make test requests
- **Search**: Use the search bar to filter endpoints
- **Deep Linking**: Share direct links to specific endpoints
- **Persistent Authorization**: Saved tokens persist across page reloads
- **Response Duration**: See how long each request takes

**Testing External ZO APIs:**

⚠️ **Important**: External ZO APIs require authentication credentials.

1. Navigate to http://localhost:3000/api-docs/zo
2. Click "Authorize" in the top right
3. Enter your credentials:
   - Bearer token (from login response)
   - client-key header
   - client-device-id header
   - client-device-secret header
4. Test endpoints using "Try it out"

### Updating OpenAPI Specifications

**When to Update:**
- Add a new API endpoint
- Modify request/response schemas
- Change endpoint parameters
- Update authentication requirements

**How to Update:**

1. For Internal APIs: Edit `/public/openapi-internal.yaml`
2. For External ZO APIs: Edit `/public/openapi-external.yaml`
3. Validate at https://editor.swagger.io/
4. Reload the Swagger UI page to see changes

**Best Practices:**
- Keep specs in sync with actual implementations
- Use `$ref` for reusable schemas
- Include realistic example values
- Document all possible error responses
- Update the `version` field when making breaking changes

---

## Authentication Flow

```
1. User enters phone number
         ↓
2. POST /api/v1/auth/login/mobile/otp/
   → Sends OTP via SMS
         ↓
3. User enters OTP code
         ↓
4. POST /api/v1/auth/login/mobile/
   → Returns: access_token, refresh_token, user, device_id, device_secret
         ↓
5. Store session in localStorage
         ↓
6. GET /api/v1/profile/me/
   → Fetch full profile using access_token
         ↓
7. Token expires? → POST /api/v1/auth/token/refresh/
   → Get new access_token
```

---

## Required Headers

**All requests** to ZO API must include these headers:

```http
client-key: <YOUR_CLIENT_KEY>
client-device-id: <DEVICE_ID>
client-device-secret: <DEVICE_SECRET>
Content-Type: application/json
Accept: */*
Accept-Encoding: gzip, deflate
Connection: keep-alive
```

> ⚠️ **CRITICAL**: The `Accept` header MUST be `*/*` (not `application/json`). Using `Accept: application/json` will result in a captcha error. This is a known quirk of the ZO API.

**Authenticated requests** also require:

```http
Authorization: Bearer <ACCESS_TOKEN>
```

### Header Descriptions

| Header | Required | Description |
|--------|----------|-------------|
| `client-key` | ✅ Always | Platform-specific API key (from ZO team) |
| `client-device-id` | ✅ Always | Unique device identifier (generated per session) |
| `client-device-secret` | ✅ Always | Device secret (generated per session) |
| `Authorization` | For authenticated endpoints | Bearer token with access_token |
| `Content-Type` | For POST/PATCH | `application/json` |
| `Accept` | ✅ Always | `*/*` (NOT `application/json`) |
| `Accept-Encoding` | Recommended | `gzip, deflate` |
| `Connection` | Recommended | `keep-alive` |

### Device Credentials

Device credentials are:
1. **Generated** randomly on first request (format: `web-{timestamp}-{random}`)
2. **Returned** in the verify-otp response (`device_id`, `device_secret`)
3. **Stored** in localStorage and Supabase database
4. **Reused** for all subsequent requests by that user

**Note**: Device credentials are NOT the same as user credentials. They identify the device/session, not the user.

---

## Endpoints

### Authentication Endpoints

#### 1. Send OTP

**POST** `/api/v1/auth/login/mobile/otp/`

Send OTP code to user's phone number via SMS.

**Request Body**:
```json
{
  "mobile_country_code": "+1",
  "mobile_number": "5551234567",
  "message_channel": ""
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Response** (Error):
```json
{
  "success": false,
  "errors": ["Invalid phone number"]
}
```

**Notes**:
- `message_channel` should be empty string `""`
- Phone number format: country code + number (no spaces, dashes, or parentheses)
- OTP expires in 5 minutes

---

#### 2. Verify OTP

**POST** `/api/v1/auth/login/mobile/`

Verify OTP code and authenticate user.

**Request Body**:
```json
{
  "mobile_country_code": "+1",
  "mobile_number": "5551234567",
  "otp": "123456"
}
```

**Response** (Success):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_token_expiry": "2025-11-23T12:00:00Z",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token_expiry": "2025-12-22T12:00:00Z",
  "client_key": "your_client_key",
  "device_id": "web-1732291200-abc123",
  "device_secret": "def456ghi789",
  "device_info": {},
  "user": {
    "id": "uuid-here",
    "pid": "PID123",
    "first_name": "John",
    "last_name": "Doe",
    "mobile_number": "5551234567",
    "email_address": "john@example.com",
    "date_of_birth": null,
    "bio": "Living consciously",
    "pfp_image": "https://cdn.zo.xyz/avatars/...",
    "wallet_address": "0x1234...",
    "membership": "founder",
    "body_type": "bro",
    "place_name": "San Francisco",
    "home_location": {
      "lat": 37.7749,
      "lng": -122.4194
    },
    "cultures": [
      {
        "key": "tech",
        "name": "Technology",
        "icon": "🖥️",
        "description": "Building the future"
      }
    ],
    "founder_tokens": [
      {
        "token_id": "123",
        "name": "Founder #123"
      }
    ],
    "avatar": {
      "image": "https://cdn.zo.xyz/avatars/...",
      "status": "completed"
    }
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "valid_till": "2025-11-23T12:00:00Z"
}
```

**Response** (Error):
```json
{
  "success": false,
  "errors": ["Invalid OTP"]
}
```

**Important**:
- Store `access_token`, `refresh_token`, `device_id`, `device_secret` for future requests
- `token` and `valid_till` are legacy fields (same as `access_token` and `access_token_expiry`)
- Access token typically expires in 24 hours
- Refresh token typically expires in 30 days

---

#### 3. Refresh Token

**POST** `/api/v1/auth/token/refresh/`

Refresh expired access token using refresh token.

**Request Body**:
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (Success):
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access_expiry": "2025-11-23T12:00:00Z",
  "refresh_expiry": "2025-12-22T12:00:00Z"
}
```

**Response** (Error):
```json
{
  "detail": "Token is invalid or expired"
}
```

**Notes**:
- Call this when `access_token` expires (before making API calls)
- If refresh token is also expired, user must re-authenticate with OTP

---

#### 4. Check Login Status

**GET** `/api/v1/auth/login/check/`

Validate if user is currently authenticated.

**Headers**:
```http
Authorization: Bearer <ACCESS_TOKEN>
```

**Response** (Success):
```json
{
  "authenticated": true
}
```

**Response** (Expired):
```json
{
  "authenticated": false
}
```

---

### Profile Endpoints

#### 1. Get Profile

**GET** `/api/v1/profile/me/`

Fetch authenticated user's full profile.

**Headers**:
```http
Authorization: Bearer <ACCESS_TOKEN>
client-key: <YOUR_CLIENT_KEY>
client-device-id: <DEVICE_ID>
client-device-secret: <DEVICE_SECRET>
```

**Response** (Success):
```json
{
  "id": "uuid-here",
  "pid": "PID123",
  "first_name": "John",
  "last_name": "Doe",
  "mobile_country_code": "+1",
  "mobile_number": "5551234567",
  "email_address": "john@example.com",
  "date_of_birth": "1990-01-01",
  "bio": "Living consciously",
  "pfp_image": "https://cdn.zo.xyz/avatars/...",
  "wallet_address": "0x1234...",
  "membership": "founder",
  "body_type": "bro",
  "place_name": "San Francisco",
  "home_location": {
    "lat": 37.7749,
    "lng": -122.4194
  },
  "cultures": [
    {
      "key": "tech",
      "name": "Technology",
      "icon": "🖥️",
      "description": "Building the future"
    }
  ],
  "founder_tokens": [
    {
      "token_id": "123",
      "name": "Founder #123"
    }
  ],
  "avatar": {
    "image": "https://cdn.zo.xyz/avatars/...",
    "status": "completed"
  }
}
```

**Notes**:
- This returns the most up-to-date profile data
- Use this to sync profile changes from other devices
- Avatar URL is included if avatar generation is complete

---

#### 2. Update Profile

**PATCH** `/api/v1/profile/me/`

Update authenticated user's profile (partial updates supported).

**Headers**:
```http
Authorization: Bearer <ACCESS_TOKEN>
client-key: <YOUR_CLIENT_KEY>
client-device-id: <DEVICE_ID>
client-device-secret: <DEVICE_SECRET>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "bio": "Living consciously and building the future",
  "date_of_birth": "1990-01-01",
  "place_name": "San Francisco, CA",
  "body_type": "bro"
}
```

**Response** (Success):
```json
{
  "id": "uuid-here",
  "pid": "PID123",
  "first_name": "John",
  "last_name": "Doe",
  ...
}
```

**Notes**:
- Only send fields you want to update
- Returns full profile after update
- `body_type` can only be changed before avatar generation

---

### Avatar Endpoints

#### 1. Generate Avatar

**POST** `/api/v1/avatar/generate/`

Start avatar generation for authenticated user.

**Headers**:
```http
Authorization: Bearer <ACCESS_TOKEN>
client-key: <YOUR_CLIENT_KEY>
client-device-id: <DEVICE_ID>
client-device-secret: <DEVICE_SECRET>
Content-Type: application/json
```

**Request Body**:
```json
{
  "body_type": "bro"
}
```

**Response** (Success):
```json
{
  "task_id": "abc123def456",
  "status": "pending",
  "message": "Avatar generation started"
}
```

**Notes**:
- `body_type` must be `"bro"` or `"bae"`
- Avatar generation takes 10-60 seconds
- Use `task_id` to poll for status
- User can only generate avatar once (or regenerate with new body_type)

---

#### 2. Check Avatar Status

**GET** `/api/v1/avatar/status/{task_id}/`

Check avatar generation status.

**Headers**:
```http
Authorization: Bearer <ACCESS_TOKEN>
client-key: <YOUR_CLIENT_KEY>
client-device-id: <DEVICE_ID>
client-device-secret: <DEVICE_SECRET>
```

**Response** (Pending):
```json
{
  "task_id": "abc123def456",
  "status": "pending"
}
```

**Response** (Processing):
```json
{
  "task_id": "abc123def456",
  "status": "processing"
}
```

**Response** (Completed):
```json
{
  "task_id": "abc123def456",
  "status": "completed",
  "result": {
    "avatar_url": "https://cdn.zo.xyz/avatars/user-123.png"
  }
}
```

**Response** (Failed):
```json
{
  "task_id": "abc123def456",
  "status": "failed",
  "error": "Generation failed"
}
```

**Polling Strategy**:
- Poll every 2 seconds
- Max 30 attempts (60 seconds total)
- Stop when status is `"completed"` or `"failed"`

---

## Response Formats

### Success Response

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

### Error Response

ZO API can return errors in multiple formats:

**Format 1** (Array of errors):
```json
{
  "success": false,
  "errors": ["Error message here"]
}
```

**Format 2** (Detail field):
```json
{
  "detail": "Error message here"
}
```

**Format 3** (Message field):
```json
{
  "message": "Error message here"
}
```

**Format 4** (Error field):
```json
{
  "error": "Error message here"
}
```

---

## Error Handling

### Common Error Codes

| HTTP Code | Meaning | Common Causes |
|-----------|---------|---------------|
| 400 | Bad Request | Invalid phone number, missing fields |
| 401 | Unauthorized | Invalid/expired access token |
| 403 | Forbidden | Invalid client-key or device credentials |
| 404 | Not Found | Invalid endpoint or resource |
| 429 | Too Many Requests | Rate limit exceeded (OTP requests) |
| 500 | Internal Server Error | Server issue, retry later |

### Handling Expired Tokens

```typescript
// Pseudo-code
try {
  const response = await getProfile(accessToken);
} catch (error) {
  if (error.status === 401) {
    // Token expired - refresh it
    const newTokens = await refreshAccessToken(refreshToken);
    if (newTokens.success) {
      // Retry with new token
      const response = await getProfile(newTokens.tokens.access);
    } else {
      // Refresh token also expired - re-authenticate
      redirectToLogin();
    }
  }
}
```

---

## Code Examples

### 1. Complete Authentication Flow

```typescript
import { sendOTP, verifyOTP } from '@/lib/zo-api/auth';

// Step 1: Send OTP
async function handleSendOTP(phone: string) {
  const result = await sendOTP('+1', phone);
  
  if (result.success) {
    console.log('OTP sent! Check your SMS.');
  } else {
    console.error('Failed:', result.message);
  }
}

// Step 2: Verify OTP
async function handleVerifyOTP(phone: string, otp: string) {
  const result = await verifyOTP('+1', phone, otp);
  
  if (result.success && result.data) {
    // Save session
    localStorage.setItem('zo_auth_session', JSON.stringify({
      accessToken: result.data.access_token,
      refreshToken: result.data.refresh_token,
      deviceId: result.data.device_id,
      deviceSecret: result.data.device_secret,
      user: result.data.user,
    }));
    
    console.log('Logged in!', result.data.user);
  } else {
    console.error('Failed:', result.error);
  }
}
```

---

### 2. Fetch User Profile

```typescript
import { getProfile } from '@/lib/zo-api/profile';

async function loadUserProfile() {
  const session = JSON.parse(localStorage.getItem('zo_auth_session') || '{}');
  
  const result = await getProfile(
    session.accessToken,
    session.user.id,
    {
      deviceId: session.deviceId,
      deviceSecret: session.deviceSecret,
    }
  );
  
  if (result.success && result.profile) {
    console.log('Profile:', result.profile);
    return result.profile;
  } else {
    console.error('Failed:', result.error);
  }
}
```

---

### 3. Generate Avatar with Polling

```typescript
import { generateAvatar, pollAvatarStatus } from '@/lib/zo-api/avatar';

async function createAvatar(bodyType: 'bro' | 'bae') {
  const session = JSON.parse(localStorage.getItem('zo_auth_session') || '{}');
  
  // Step 1: Start generation
  const result = await generateAvatar(session.accessToken, bodyType);
  
  if (!result.success || !result.task_id) {
    console.error('Failed:', result.error);
    return;
  }
  
  console.log('Avatar generation started:', result.task_id);
  
  // Step 2: Poll for completion
  await pollAvatarStatus(session.accessToken, result.task_id, {
    onProgress: (status) => {
      console.log('Status:', status);
    },
    onComplete: (avatarUrl) => {
      console.log('Avatar ready!', avatarUrl);
    },
    onError: (error) => {
      console.error('Failed:', error);
    },
    maxAttempts: 30,  // 60 seconds max
    interval: 2000,   // Poll every 2 seconds
  });
}
```

---

### 4. Refresh Token

```typescript
import { refreshAccessToken } from '@/lib/zo-api/auth';

async function ensureFreshToken() {
  const session = JSON.parse(localStorage.getItem('zo_auth_session') || '{}');
  
  // Check if token is expired (or will expire soon)
  const expiry = new Date(session.accessTokenExpiry);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;
  
  if (expiry.getTime() - now.getTime() < fiveMinutes) {
    console.log('Token expired, refreshing...');
    
    const result = await refreshAccessToken(session.refreshToken);
    
    if (result.success && result.tokens) {
      // Update session
      session.accessToken = result.tokens.access;
      session.refreshToken = result.tokens.refresh;
      session.accessTokenExpiry = result.tokens.access_expiry;
      
      localStorage.setItem('zo_auth_session', JSON.stringify(session));
      
      return session.accessToken;
    } else {
      // Refresh failed - user must re-authenticate
      console.error('Token refresh failed:', result.error);
      localStorage.removeItem('zo_auth_session');
      window.location.href = '/login';
      return null;
    }
  }
  
  return session.accessToken;
}
```

---

## Session Management

### Session Storage Structure

Store in `localStorage` as `zo_auth_session`:

```typescript
interface ZoAuthSession {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;  // ISO 8601 timestamp
  refreshTokenExpiry: string; // ISO 8601 timestamp
  deviceId: string;
  deviceSecret: string;
  user: {
    id: string;
    pid: string;
    first_name: string;
    mobile_number: string;
    email_address: string;
    membership: 'founder' | 'citizen' | 'none';
    // ... other user fields
  };
}
```

### Session Lifecycle

1. **Login** → Save session to localStorage
2. **API Calls** → Use `accessToken` from session
3. **Token Expires** → Refresh using `refreshToken`
4. **Refresh Expires** → Clear session, redirect to login
5. **Logout** → Clear localStorage

### Security Best Practices

- ✅ Store tokens in `localStorage` (not cookies for this API)
- ✅ Always use HTTPS in production
- ✅ Validate token expiry before making requests
- ✅ Clear session on logout
- ❌ Never expose `client-key` in public repos
- ❌ Never log `access_token` or `device_secret` in production

---

## TypeScript Types

Full type definitions are in `apps/web/src/lib/zo-api/types.ts`.

### Key Types

```typescript
// Auth OTP Request
interface ZoAuthOTPRequest {
  mobile_country_code: string;
  mobile_number: string;
  message_channel?: string;
}

// Auth OTP Verify Request
interface ZoAuthOTPVerifyRequest {
  mobile_country_code: string;
  mobile_number: string;
  otp: string;
}

// Auth Response (from verify-otp)
interface ZoAuthResponse {
  access_token: string;
  access_token_expiry: string;
  refresh_token: string;
  refresh_token_expiry: string;
  client_key: string;
  device_id: string;
  device_secret: string;
  device_info: Record<string, any>;
  user: ZoUser;
  token: string;  // Legacy field (same as access_token)
  valid_till: string;  // Legacy field (same as access_token_expiry)
}

// User Object
interface ZoUser {
  id: string;
  pid: string;
  first_name: string;
  last_name: string;
  mobile_number: string;
  email_address: string;
  date_of_birth: string | null;
  bio: string;
  pfp_image: string;
  wallet_address: string;
  membership: 'founder' | 'citizen' | 'none';
  body_type: 'bro' | 'bae';
  place_name: string;
  home_location: {
    lat: number;
    lng: number;
  } | null;
  cultures: Array<{
    key: string;
    name: string;
    icon: string;
    description: string;
  }>;
  founder_tokens: Array<{
    token_id: string;
    name: string;
  }>;
  avatar?: {
    image: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
  };
}

// Profile Response
interface ZoProfileResponse {
  // Same as ZoUser, with additional fields:
  mobile_country_code: string;
}

// Profile Update Payload
interface ZoProfileUpdatePayload {
  first_name?: string;
  last_name?: string;
  bio?: string;
  date_of_birth?: string;
  place_name?: string;
  body_type?: 'bro' | 'bae';
}

// Avatar Generate Request
interface ZoAvatarGenerateRequest {
  body_type: 'bro' | 'bae';
}

// Avatar Generate Response
interface ZoAvatarGenerateResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

// Avatar Status Response
interface ZoAvatarStatusResponse {
  task_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: {
    avatar_url: string;
  };
  error?: string;
}

// Error Response
interface ZoErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
  errors?: string[];
}
```

---

## Client Library Reference

The ZO API client library is located at `/apps/web/src/lib/zo-api/`.

### Files

| File | Purpose |
|------|---------|
| `client.ts` | Axios instance, interceptors, device credential management |
| `auth.ts` | Authentication functions (OTP, verify, refresh, check) |
| `profile.ts` | Profile functions (get, update) |
| `avatar.ts` | Avatar functions (generate, status, polling) |
| `sync.ts` | Profile sync with Supabase |
| `types.ts` | TypeScript type definitions |
| `index.ts` | Public API exports |

### Usage

```typescript
// Import from library
import { sendOTP, verifyOTP } from '@/lib/zo-api/auth';
import { getProfile, updateProfile } from '@/lib/zo-api/profile';
import { generateAvatar, pollAvatarStatus } from '@/lib/zo-api/avatar';
```

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Send OTP | 5 requests | 15 minutes |
| Verify OTP | 10 attempts | 15 minutes |
| Other endpoints | Unspecified | Contact ZO team |

**Note**: Rate limits are enforced per phone number for OTP endpoints.

---

## Support

**For API Issues**:
- Email: dev@zo.xyz
- Discord: [Join Zo Community](https://discord.gg/zo)

**For Integration Help**:
- Check `apps/web/src/lib/zo-api/` for reference implementation
- Review code examples in this doc
- See `ARCHITECTURE.md` for system design

---

**Document Version**: 1.1  
**Last Updated**: January 28, 2026  
**Maintained By**: Zo World Development Team  
**Status**: ✅ Production Ready

---

## Additional Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/)
- [Swagger Editor](https://editor.swagger.io/) - Online spec editor/validator
- Internal APIs: http://localhost:3000/api-docs
- External ZO APIs: http://localhost:3000/api-docs/zo


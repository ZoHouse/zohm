# API Testing Manual - Step by Step

Complete guide for testing all ZO House API endpoints, both internal and external, using Swagger UI.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Testing Internal APIs](#testing-internal-apis)
   - [NFT Endpoints](#1-nft-endpoints)
   - [Leaderboard Endpoints](#2-leaderboard-endpoints)
   - [Quest Endpoints](#3-quest-endpoints)
   - [User Endpoints](#4-user-endpoints)
   - [Calendar Endpoints](#5-calendar-endpoints)
   - [Cities Endpoints](#6-cities-endpoints)
3. [Testing External ZO APIs](#testing-external-zo-apis)
   - [Authentication Endpoints](#1-authentication-endpoints)
   - [Profile Endpoints](#2-profile-endpoints)
   - [Avatar Endpoints](#3-avatar-endpoints)
4. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Start the Development Server

```bash
cd /home/manish/Desktop/ZO/zohm
pnpm run dev
```

**Expected Output**:
```
✓ Ready in 2s
- Local:   http://localhost:3000
```

### 2. Verify Database Connection

Ensure your Supabase database is running and accessible. Check `.env.local` for:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Open Swagger UI

- **Internal APIs**: http://localhost:3000/api-docs
- **External ZO APIs**: http://localhost:3000/api-docs/zo

---

## Testing Internal APIs

Navigate to: **http://localhost:3000/api-docs**

### 1. NFT Endpoints

#### GET `/check-nft` - Check NFT Ownership

**Purpose**: Verify if an Ethereum address owns a Zo House Founder NFT.

**Step-by-Step**:

1. **Locate the endpoint**
   - Look for the **NFT** section (green tag)
   - Find `GET /check-nft`
   - Click to expand

2. **Click "Try it out"**
   - Button appears in the top-right of the endpoint section

3. **Fill in parameters**
   - **address** (required): Enter an Ethereum wallet address
   - Example: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

4. **Click "Execute"**

5. **Review Response**

**Expected Success Response (200)**:
```json
{
  "hasNFT": true,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "contract": "0xf9e631014ce1759d9b76ce074d496c3da633ba12"
}
```

**Expected Error Response (400) - Missing address**:
```json
{
  "error": "Address is required"
}
```

**What to verify**:
- ✅ Response status is 200
- ✅ `hasNFT` is boolean (true/false)
- ✅ `address` matches input
- ✅ `contract` is the Founder NFT contract address

---

### 2. Leaderboard Endpoints

#### GET `/leaderboard` - Get Rankings

**Purpose**: Fetch global or local leaderboard rankings.

**Step-by-Step**:

1. **Locate the endpoint**
   - Look for the **Leaderboard** section
   - Find `GET /leaderboard`
   - Click to expand

2. **Click "Try it out"**

3. **Fill in parameters** (all optional)
   - **scope**: Choose from dropdown
     - `global` (default) - All users worldwide
     - `local` - Users from specific city
   - **cityId**: UUID of city (required if scope=local)
     - Example: Leave empty for global
   - **limit**: Number of entries (default: 10, max: 100)
     - Example: `10`

4. **Click "Execute"**

5. **Review Response**

**Expected Success Response (200)**:
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "uuid-here",
      "nickname": "CryptoWarrior",
      "avatar": "https://...",
      "zo_points": 2500,
      "total_quests_completed": 42,
      "home_city": {
        "id": "city-uuid",
        "name": "San Francisco",
        "country": "USA"
      }
    }
  ],
  "scope": "global",
  "city_id": null,
  "total": 10
}
```

**Test Scenarios**:

**Scenario 1: Global Leaderboard (Top 5)**
- scope: `global`
- limit: `5`
- ✅ Verify: Returns 5 users ranked by zo_points

**Scenario 2: Local Leaderboard** (if you have a city ID)
- scope: `local`
- cityId: `<valid-city-uuid>` (get from cities endpoint)
- limit: `10`
- ✅ Verify: Returns users from that specific city

---

### 3. Quest Endpoints

#### POST `/quests/complete` - Complete a Quest

**Purpose**: Record quest completion and award rewards.

**Step-by-Step**:

1. **Locate the endpoint**
   - Look for the **Quests** section
   - Find `POST /quests/complete`
   - Click to expand

2. **Click "Try it out"**

3. **Fill in Request Body**

```json
{
  "user_id": "your-user-uuid-here",
  "quest_id": "morning-meditation",
  "score": 100,
  "location": "San Francisco",
  "latitude": 37.7749,
  "longitude": -122.4194,
  "metadata": {
    "duration_minutes": 15
  }
}
```

**Required Fields**:
- `user_id`: UUID of the user (must exist in database)
- `quest_id`: Quest slug (e.g., "morning-meditation")

**Optional Fields**:
- `score`, `location`, `latitude`, `longitude`, `metadata`

4. **Click "Execute"**

**Expected Success Response (200)**:
```json
{
  "success": true,
  "completion_id": "completion-uuid",
  "rewards": {
    "zo_tokens": 50,
    "reputation": {
      "explorer": 10,
      "wellness": 5
    },
    "items": ["badge-morning-warrior"]
  },
  "next_available_at": "2025-11-24T08:00:00Z"
}
```

**Expected Error Responses**:
- **400** - Missing required fields
- **404** - Quest or user not found
- **429** - Quest on cooldown

---

### 4. User Endpoints

#### GET `/users/{id}/inventory` - Get User Inventory

**Step-by-Step**:

1. **Find `GET /users/{id}/inventory`** and click to expand
2. **Click "Try it out"**
3. **Fill in parameters**:
   - **id** (required): User UUID
   - **type** (optional): `badge`, `nft`, `collectible`, or `item`
4. **Click "Execute"**

**Expected Response (200)**:
```json
{
  "user_id": "uuid",
  "summary": {
    "total_items": 15,
    "badges": 5,
    "nfts": 3,
    "collectibles": 4,
    "items": 3
  },
  "items": [
    {
      "item_id": "founder-badge-1",
      "item_type": "badge",
      "quantity": 1,
      "display": {
        "name": "Founder Badge",
        "icon": "🏆"
      }
    }
  ]
}
```

---

#### GET `/users/{id}/progress` - Get User Progress

**Purpose**: Comprehensive user stats including quests, reputations, streaks.

**Step-by-Step**:
1. Find endpoint and click "Try it out"
2. Enter **id**: User UUID
3. Click "Execute"

**Expected Response**: Full progress object with user, quests, reputations, streaks, and inventory data.

---

#### GET `/users/{id}/reputations` - Get User Reputations

**Purpose**: Reputation scores across different traits.

**Expected Response (200)**:
```json
{
  "user_id": "uuid",
  "reputations": [
    {
      "trait": "explorer",
      "score": 750,
      "level": 3,
      "progress": 0.75,
      "description": "Discovers new places",
      "icon": "🗺️"
    }
  ],
  "total_score": 2500
}
```

---

#### GET `/users/{id}/streaks` - Get User Streaks

**Purpose**: Activity streak tracking.

**Expected Response**: Array of streaks with type, current count, longest count, and last action timestamp.

---

### 5. Calendar Endpoints

#### GET `/calendar` - Get Calendar Events

**Purpose**: Fetch iCal data from Luma or external sources.

**Step-by-Step**:
1. Find `GET /calendar`
2. Click "Try it out"
3. Provide **ONE** of:
   - **id**: Luma calendar ID
   - **url**: Direct iCal feed URL
4. Click "Execute"

**Expected Response**: iCal format data (text/calendar)

---

### 6. Cities Endpoints

#### GET `/cities` - Get All Cities

**Step-by-Step**:
1. Find `GET /cities`
2. Click "Try it out"
3. Click "Execute" (no parameters needed)

**Expected Response (200)**:
```json
{
  "cities": [
    {
      "id": "city-uuid",
      "name": "San Francisco",
      "country": "USA",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "stage": 1
    }
  ]
}
```

---

## Testing External ZO APIs

Navigate to: **http://localhost:3000/api-docs/zo**

> ⚠️ **Important**: Requires authentication credentials from ZO team:
> - `client-key`
> - `client-device-id`
> - `client-device-secret`

### Setting Up Authentication

1. **Click "Authorize"** (top-right)
2. **Enter credentials** provided by ZO team
3. For authenticated endpoints, also provide **Bearer token**

---

### 1. Authentication Endpoints

#### POST `/api/v1/auth/login/mobile/otp/` - Send OTP

**Purpose**: Send OTP to phone number.

**Request Body**:
```json
{
  "mobile_country_code": "+1",
  "mobile_number": "5551234567",
  "message_channel": ""
}
```

**Expected Success (200)**:
```json
{
  "success": true,
  "message": "OTP sent successfully"
}
```

**Rate Limit**: 5 requests per 15 minutes

---

#### POST `/api/v1/auth/login/mobile/` - Verify OTP

**Purpose**: Verify OTP and login.

**Request Body**:
```json
{
  "mobile_country_code": "+1",
  "mobile_number": "5551234567",
  "otp": "123456"
}
```

**Expected Success (200)**: Returns `access_token`, `refresh_token`, `device_id`, `device_secret`, and full `user` object.

**Save these for subsequent requests!**

---

#### POST `/api/v1/auth/token/refresh/` - Refresh Token

**Purpose**: Get new access token when expired.

**Request Body**:
```json
{
  "refresh_token": "your-refresh-token"
}
```

**Expected Success (200)**: Returns new `access` and `refresh` tokens.

---

#### GET `/api/v1/auth/login/check/` - Check Login Status

**Purpose**: Verify token validity.

**Prerequisites**: Set Authorization header with Bearer token

**Expected Response (200)**:
```json
{
  "authenticated": true
}
```

---

### 2. Profile Endpoints

> **Prerequisites**: Must be authenticated with valid access_token

#### GET `/api/v1/profile/me/` - Get Profile

**Step-by-Step**:
1. Ensure Authorization is set (Bearer token + device credentials)
2. Find `GET /api/v1/profile/me/`
3. Click "Try it out"
4. Click "Execute"

**Expected Response**: Full user profile with all fields

---

#### PATCH `/api/v1/profile/me/` - Update Profile

**Purpose**: Update user profile (partial updates supported).

**Request Body Example**:
```json
{
  "first_name": "NewName",
  "bio": "Updated bio text"
}
```

**Updatable Fields**:
- `first_name`, `last_name`, `bio`, `date_of_birth`, `place_name`
- `body_type` (only before avatar generated)

**Expected Response**: Full updated profile

---

### 3. Avatar Endpoints

#### POST `/api/v1/avatar/generate/` - Generate Avatar

**Request Body**:
```json
{
  "body_type": "bro"
}
```

**Options**: `"bro"` or `"bae"`

**Expected Success (200)**:
```json
{
  "task_id": "abc123",
  "status": "pending",
  "message": "Avatar generation started"
}
```

**Save the task_id!**

---

#### GET `/api/v1/avatar/status/{task_id}/` - Check Avatar Status

**Purpose**: Poll for avatar generation completion.

**Step-by-Step**:
1. Enter **task_id** from generate response
2. Click "Execute"
3. Check status

**Possible Statuses**:
- `"pending"` - Just started
- `"processing"` - In progress
- `"completed"` - Done! (includes `result.avatar_url`)
- `"failed"` - Error occurred

**Polling Strategy**: Check every 2 seconds for max 60 seconds.

---

## Troubleshooting

### Common Issues

**"Failed to fetch"**
- Solution: Ensure dev server is running (`pnpm run dev`)

**"500 Internal Server Error" (Internal APIs)**
- Check database connection
- Verify user/quest/city exists in database
- Review console logs

**"403 Forbidden" (External ZO APIs)**
- Verify credentials are set in "Authorize" dialog
- Contact dev@zo.xyz for valid credentials

**"401 Unauthorized" (Profile/Avatar)**
- Get new access token via login
- Or refresh using `/api/v1/auth/token/refresh/`

**"429 Too Many Requests" (Send OTP)**
- Wait 15 minutes (rate limit: 5 per 15 mins)

**OpenAPI YAML Not Loading**
- Verify files exist in `/public/`
- Validate YAML syntax at https://www.yamllint.com/
- Clear browser cache

---

## Summary

✅ **Internal APIs**: 9 endpoints across NFT, Leaderboard, Quests, Users, Calendar, Cities  
✅ **External ZO APIs**: 8 endpoints across Authentication, Profile, Avatar  
✅ **Interactive Testing**: All endpoints support "Try it out"  
✅ **Step-by-step instructions** for each endpoint

**Quick Start**:
1. `pnpm run dev`
2. Open http://localhost:3000/api-docs (internal) or /api-docs/zo (external)
3. Follow instructions above for each endpoint

For more details, see [README_API_DOCS.md](file:///home/manish/Desktop/ZO/zohm/README_API_DOCS.md) and [ZO_API.md](file:///home/manish/Desktop/ZO/zohm/ZO_API.md).

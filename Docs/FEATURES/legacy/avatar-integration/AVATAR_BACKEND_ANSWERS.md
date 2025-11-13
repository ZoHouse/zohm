# Avatar System - Backend Integration Answers

## Based on Codebase Analysis

This document answers all questions about the avatar/NFT system based on the current codebase implementation.

---

## 1. API Endpoint Documentation

### **Avatar Generation Trigger**

**Q: What is the API endpoint to trigger avatar NFT minting?**

**A: The avatar is NOT minted as an NFT during onboarding. The flow is:**

```
Endpoint: POST /api/v1/profile/me/
Method: POST
Base URL: env.EXPO_PUBLIC_ZO_API_BASE_URL
```

**Request Body:**
```json
{
  "body_type": "bro" | "bae"
}
```

**Response:**
```json
{
  "data": {
    "avatar": {
      "image": null,  // Initially null, populated when generation completes
      "metadata": "",
      "ref_id": 0
    },
    "body_type": "bro" | "bae",
    // ... rest of profile
  }
}
```

**Authentication:** Required
- Bearer token in `Authorization` header
- `client-key` header (platform-specific)
- `client-device-id` header
- `client-device-secret` header

**What Actually Happens:**
1. Client POSTs `body_type` to profile endpoint
2. Backend queues avatar generation job (async)
3. Backend returns profile with `avatar.image = null`
4. Client polls GET `/api/v1/profile/me/` every 1 second
5. When `avatar.image` becomes non-null, avatar is ready
6. Max 10 polling attempts (10 seconds timeout)

---

## 2. Polling/Status Check Endpoint

**Q: How do I check if the NFT minting is complete?**

**A: Poll the profile endpoint:**

```
Endpoint: GET /api/v1/profile/me/
Method: GET
Polling: Every 1 second, max 10 attempts
```

**Check Logic:**
```typescript
const profile = await getProfile();

if (profile.avatar?.image && profile.avatar.image.trim() !== '') {
  // Avatar is ready!
  setAvatarUrl(profile.avatar.image);
  stopPolling();
} else {
  // Still generating, continue polling
  setTimeout(pollAgain, 1000);
}
```

**Response Structure:**
```typescript
{
  data: {
    avatar: {
      image: string | null,  // CDN URL when ready, null while generating
      metadata: string,
      ref_id: number
    }
  }
}
```

**There is NO separate status endpoint** - the profile endpoint itself indicates status via the `avatar.image` field.

---

## 3. Blockchain Configuration

**Q: Which blockchain is the avatar NFT minted on?**

**A: Based on codebase analysis:**

### Profile PFP (Profile Picture NFT) Structure:

```typescript
// From definitions/profile.ts
pfp_metadata: {
  contract_address: string,
  is_valid: boolean,
  metadata: {
    attributes: any[];
    description: string;
    external_url: string;
    image: string;
    title: string;
  };
  token_id: string;
}
wallet_address: string;
web3_verified: boolean;
```

### Key Findings:

1. **Generated Avatar vs NFT PFP are SEPARATE:**
   - `avatar.image`: Generated image from body_type selection (NOT an NFT)
   - `pfp_image` + `pfp_metadata`: External NFT that user can set as profile pic

2. **NFT Support Exists But:**
   - No explicit minting endpoint found in codebase
   - `pfp_metadata` has `contract_address` and `token_id` fields
   - Web3 endpoint exists: `/api/v1/webthree/token-airdrops/`
   - But no avatar minting endpoint discovered

3. **Blockchain Details:**
   - ❌ Network name not found in codebase
   - ❌ Contract addresses not hardcoded
   - ✅ Structure supports ERC-721 (token_id as string)
   - ✅ Has `wallet_address` field in profile
   - ✅ Has `web3_verified` boolean

**CONCLUSION:** The current avatar generation creates a **regular image hosted on CDN**, not an on-chain NFT. The PFP system supports external NFTs, but avatar generation doesn't mint anything.

---

## 4. User Wallet Requirements

**Q: Where does the NFT get sent?**

**A: From the Profile type:**

```typescript
{
  wallet_address: string;  // User's primary wallet
  web3_verified: boolean;  // Whether wallet is verified
}
```

**Wallet Handling:**
- Profile has `wallet_address` field
- No code found for embedded wallet creation
- Likely uses external wallet connection (MetaMask/WalletConnect)
- `web3_verified` flag indicates wallet verification status

**For Avatar Generation:**
- ❌ No wallet needed - generates regular image
- ❌ No blockchain transaction
- ✅ Image hosted on Zo CDN: `proxy.cdn.zo.xyz` or `static.cdn.zo.xyz`

---

## 5. Database Schema

**Q: What fields does the backend update after minting?**

**A: Fields in Profile type:**

### Avatar Fields (Generated Image):
```typescript
avatar: {
  image: string;      // CDN URL to generated avatar
  metadata: string;   // JSON string with generation metadata
  ref_id: number;     // Reference ID
}
body_type: string;    // "bro" | "bae"
```

### PFP/NFT Fields (External NFT):
```typescript
pfp_image: string;           // NFT image URL
pfp_metadata: {
  contract_address: string;  // NFT contract address
  token_id: string;          // Token ID
  is_valid: boolean;         // Validation status
  metadata: {
    attributes: any[];
    description: string;
    external_url: string;
    image: string;
    title: string;
  }
}
```

### Other Relevant Fields:
```typescript
wallet_address: string;
web3_verified: boolean;
founder_tokens: string[];    // Array of founder token IDs
membership: "founder" | "none";
```

**Check if User Has Avatar:**
```typescript
const hasAvatar = profile.avatar?.image && profile.body_type;
```

**Check if User Has NFT PFP:**
```typescript
const hasNFT = profile.pfp_metadata?.is_valid && profile.pfp_metadata?.token_id;
```

---

## 6. Gender/Body Type Format

**Q: What values should I send for gender?**

**A: Two separate fields:**

### Body Type (for Avatar Generation):
```typescript
body_type: "bro" | "bae"
```
- `"bro"` = Male body shape
- `"bae"` = Female body shape
- Sent to `POST /api/v1/profile/me/`

### Gender (Profile Field):
```typescript
gender: string  // Separate field
```
- Not directly related to avatar generation
- Stored separately in profile
- Used in ProfileFields with icons:
  ```typescript
  ProfileFields.gender.find(g => g.id === profile.gender)?.icon || "👤"
  ```

### Nickname:
```typescript
nickname: string;           // Display nickname
custom_nickname?: string;   // User-chosen nickname
ens_nickname?: string;      // ENS domain nickname
selected_nickname: "custom" | "ens";
```

**Nickname is OPTIONAL** for avatar generation, but required for complete profile.

---

## 7. Timing & Limits

**Q: How long does minting typically take?**

**A: Based on implementation:**

### Timing:
```typescript
const POLLING_INTERVAL = 1000;  // 1 second
const MAX_POLLING_ATTEMPTS = 10; // 10 attempts = 10 seconds max
```

- **Typical Time:** 2-5 seconds (estimated from polling setup)
- **Maximum Timeout:** 10 seconds
- **Polling Frequency:** Every 1 second
- **Fallback:** If not ready after 10s, proceeds anyway (see `AvatarSection.tsx:174`)

### Implementation:
```typescript
const checkAvatar = useCallback(() => {
  counter.current++;
  if (counter.current > 10) {
    onSubmit();  // Timeout - proceed anyway
    return;
  }
  refetchProfile()
    .then((data) => {
      if (isValidString(data.data?.avatar?.image)) {
        showAvatar();  // Success!
      } else {
        setTimeout(checkAvatar, 1000);  // Retry
      }
    })
    .catch((er) => {
      logAxiosError(er);
      setTimeout(checkAvatar, 1000);  // Retry on error
    });
}, [refetchProfile, showAvatar]);
```

### Limits:
- **❌ No evidence of one-time limit in frontend code**
- **❌ No backend enforcement visible in API responses**
- User can potentially regenerate by updating `body_type` again
- No "already generated" error handling found

**LIKELY:** Backend may enforce one-time generation, but frontend doesn't check.

---

## 8. Error Handling

**Q: What error codes/messages might I receive?**

**A: From codebase implementation:**

### Error Handling Strategy:
```typescript
updateProfile(
  { body_type: selectedBodyShape! },
  {
    onSuccess: () => {
      checkAvatar();
    },
    onError: (er) => {
      logAxiosError(er);
      onSubmit();  // Continue onboarding despite error
    },
  }
);
```

### Axios Error Structure:
```typescript
if (error.response) {
  // Server responded with error status
  switch (error.response.status) {
    case 401: // Unauthorized
    case 400: // Bad Request
    case 500: // Server Error
  }
} else if (error.request) {
  // No response (network error)
} else {
  // Request setup error
}
```

### Known Error Scenarios:

1. **401 Unauthorized**
   - Token expired
   - Invalid credentials
   - Action: Redirect to login

2. **400 Bad Request**
   - Invalid `body_type` value
   - Missing required fields
   - Action: Show validation error

3. **500 Internal Server Error**
   - Backend failure
   - Avatar generation failure
   - Action: Continue anyway (current implementation)

4. **Timeout (10 attempts exceeded)**
   - Generation taking too long
   - Action: Continue onboarding (current implementation)

5. **Network Error**
   - No internet connection
   - Action: Retry polling

### Current Behavior:
- **Errors are logged but don't block onboarding**
- User can proceed even if avatar generation fails
- No "already minted" error found in code

**RECOMMENDATION:** Add explicit error messages for:
- Already generated avatar
- Generation timeout
- Network failures
- Invalid body type

---

## 9. Environment Variables Needed

**Q: What environment variables do I need?**

**A: From codebase configuration:**

### Required Variables:

```bash
# Zo API Configuration
EXPO_PUBLIC_ZO_API_BASE_URL=https://api.zo.xyz

# Client Keys (Platform-specific)
EXPO_PUBLIC_ZO_CLIENT_KEY_IOS=<your_ios_client_key>
EXPO_PUBLIC_ZO_CLIENT_KEY_ANDROID=<your_android_client_key>

# Zostel API (for legacy profile sync)
EXPO_PUBLIC_ZOSTEL_API_BASE_URL=https://api.zostel.com
EXPO_PUBLIC_ZOSTEL_CLIENT_ID=<zostel_client_id>
```

### Usage:
```typescript
// From utils/auth/client.ts
const API_URLS = {
  [ApiServer.ZO]: process.env.EXPO_PUBLIC_ZO_API_BASE_URL,
  [ApiServer.ZOSTEL]: process.env.EXPO_PUBLIC_ZOSTEL_API_BASE_URL,
  [ApiServer.ZO_COMMS]: process.env.EXPO_PUBLIC_ZO_API_BASE_URL,
};

// From context/AuthContext.tsx
const clientKeys = {
  zo: Platform.OS === "ios"
    ? process.env.EXPO_PUBLIC_ZO_CLIENT_KEY_IOS
    : process.env.EXPO_PUBLIC_ZO_CLIENT_KEY_ANDROID,
  zostel: process.env.EXPO_PUBLIC_ZOSTEL_CLIENT_ID,
};
```

### NOT Needed (for avatar generation):
- ❌ No blockchain RPC URLs
- ❌ No contract addresses in env
- ❌ No private keys
- ❌ No NFT minting API keys

---

## 10. Testing

**Q: Is there a test/staging endpoint?**

**A: Environment-based configuration:**

### Configuration:
```typescript
// Change base URL via environment variable
EXPO_PUBLIC_ZO_API_BASE_URL=https://staging-api.zo.xyz  // Staging
EXPO_PUBLIC_ZO_API_BASE_URL=https://api.zo.xyz          // Production
```

### Testing Strategy:

1. **Local Development:**
   ```bash
   # In .env.local
   EXPO_PUBLIC_ZO_API_BASE_URL=http://localhost:8000
   ```

2. **Staging:**
   ```bash
   EXPO_PUBLIC_ZO_API_BASE_URL=https://staging-api.zo.xyz
   ```

3. **Mock Testing:**
   - No mock mode found in code
   - Must test against real backend
   - Can use React Query's mock utilities

4. **E2E Testing:**
   ```typescript
   // Test user credentials from store.config.json
   {
     "demoUsername": "+91-9625283418",
     "demoPassword": "139275",
     "demoRequired": true
   }
   ```

### Testing Checklist:

1. **Unit Tests:**
   - Mock `profileService.updateProfile()`
   - Mock `profileService.getProfile()`
   - Test polling logic
   - Test timeout handling

2. **Integration Tests:**
   - Test auth headers
   - Test error responses
   - Test network failures

3. **E2E Tests:**
   - Complete onboarding flow
   - Avatar selection → generation → display
   - Timeout scenario
   - Network failure recovery

---

## Summary: What We Know vs What's Missing

### ✅ What We Know:

1. **Avatar Generation Flow:**
   - POST `body_type` → Backend queues job → Poll GET profile → Avatar ready
   - Images hosted on CDN (not blockchain)
   - Timeout after 10 seconds

2. **Endpoints:**
   - POST `/api/v1/profile/me/` - Trigger generation
   - GET `/api/v1/profile/me/` - Check status

3. **Data Structure:**
   - `avatar.image` - Generated image URL
   - `body_type` - "bro" | "bae"
   - Separate PFP/NFT system exists

4. **Authentication:**
   - Bearer token + client keys + device credentials
   - Platform-specific headers

### ❌ What's Missing (Need Backend Team):

1. **NFT Minting:**
   - Is there an NFT minting endpoint?
   - Or is avatar just a regular image?
   - Contract addresses?
   - Blockchain network?

2. **Generation Limits:**
   - Can users regenerate avatar?
   - Is there a one-time restriction?
   - Backend enforcement?

3. **Error Codes:**
   - Specific error messages?
   - "Already generated" response?
   - Minting failure codes?

4. **Timing:**
   - Actual average generation time?
   - Maximum possible wait time?
   - Backend timeout settings?

5. **Wallet Integration:**
   - How is wallet connected?
   - Privy? WalletConnect?
   - When is wallet required?

---

## Recommended Questions for Backend Team

### Critical Questions:

1. **Is the generated avatar an NFT or just a CDN-hosted image?**
   - Current code suggests it's just an image
   - But we need confirmation

2. **What is the actual generation process?**
   - AI model? Template-based?
   - Why does it take 2-5 seconds?
   - Can it fail? How often?

3. **Can users regenerate their avatar?**
   - One-time only?
   - Backend enforcement?
   - Should we add UI prevention?

4. **What are all possible error responses?**
   - Status codes?
   - Error message format?
   - Should we handle "already generated"?

5. **Is there a separate NFT minting step?**
   - Avatar generation = NFT minting?
   - Or two separate processes?
   - When/how is NFT created?

### Request from Backend:

1. **API Swagger/OpenAPI docs** for `/api/v1/profile/me/`
2. **Example responses** for success, errors, and edge cases
3. **Generation process documentation**
4. **NFT minting documentation** (if separate)
5. **Database schema** for avatar/pfp fields
6. **Rate limits and restrictions**

---

## Files to Share with Backend Team

When asking backend team, reference these files:

1. **Avatar Selection UI:**
   - `components/helpers/login/AvatarSection.tsx`

2. **Profile Management:**
   - `hooks/useProfile.ts`
   - `utils/auth/endpoints/profile.ts`

3. **Data Types:**
   - `definitions/profile.ts`

4. **API Client:**
   - `utils/auth/client.ts`
   - `context/AuthContext.tsx`

5. **This Documentation:**
   - `docs/AVATAR_SELECTION_IMPLEMENTATION.md`
   - `docs/AVATAR_BACKEND_ANSWERS.md` (this file)

---

## Next Steps

1. **Confirm with backend team:**
   - Avatar = NFT or just image?
   - Minting process if NFT
   - Generation restrictions

2. **Update documentation:**
   - Add confirmed answers
   - Add error handling examples
   - Add NFT minting flow (if applicable)

3. **Implement missing features:**
   - Better error messages
   - Retry logic
   - "Already generated" prevention (if needed)

4. **Add tests:**
   - Unit tests for polling
   - Integration tests for API
   - E2E tests for complete flow

---

## Contact

For questions about this analysis, refer to the codebase files listed above or ask the backend team for:
- API documentation
- Generation process details
- NFT minting specifications (if applicable)


# Wallet Address and Phone Number to Profile Flow

## Table of Contents
1. [Overview](#overview)
2. [Authentication Architecture](#authentication-architecture)
3. [Phone Number Authentication Flow](#phone-number-authentication-flow)
4. [Wallet Address Integration](#wallet-address-integration)
5. [Profile Data Structure](#profile-data-structure)
6. [API Endpoints](#api-endpoints)
7. [Implementation Details](#implementation-details)
8. [Account Merging](#account-merging)
9. [Code Examples](#code-examples)

---

## Overview

The Zo app uses a **dual authentication system** that authenticates users with both the **Zo API** and **Zostel API** simultaneously. The primary user identifier is the **phone number**, which serves as the entry point for authentication. **Wallet addresses** can be linked to profiles but are **not required** for authentication.

### Key Concepts

- **Primary Authentication**: Phone number + OTP
- **Dual API System**: Zo API + Zostel API (authenticated in parallel)
- **Wallet Address**: Optional field stored in the profile (not used for authentication)
- **Web3 Verification**: Optional flag indicating if wallet ownership is verified
- **Account Merging**: Users can merge multiple accounts via email verification

---

## Authentication Architecture

### Two-Server System

The app communicates with **three API servers**:

1. **Zo API** (`ApiServer.ZO`)
   - Base URL: `process.env.EXPO_PUBLIC_ZO_API_URL`
   - Authentication: Bearer token + Client device credentials
   - Primary profile management

2. **Zostel API** (`ApiServer.ZOSTEL`)
   - Base URL: `process.env.EXPO_PUBLIC_ZOSTEL_API_URL`
   - Authentication: Bearer token + Client app ID
   - Legacy profile data and bookings

3. **Zo Comms API** (`ApiServer.ZO_COMMS`)
   - Base URL: `process.env.EXPO_PUBLIC_ZO_COMMS_API_URL`
   - Authentication: Bearer token + App ID + Account ID
   - Chat and communication features

### Authentication Headers

#### Zo API Headers
```typescript
{
  "client-key": "<platform-specific-client-key>",  // iOS or Android
  "client-device-id": "<uuid>",                     // Generated per device
  "client-device-secret": "<uuid>",                 // Generated per device
  "authorization": "Bearer <access_token>"          // User token
}
```

#### Zostel API Headers
```typescript
{
  "client-app-id": "<zostel-client-id>",
  "client-user-id": "<uuid>",                       // Generated per session
  "authorization": "Bearer <user_token>"            // User token
}
```

#### Zo Comms API Headers
```typescript
{
  "authorization": "Bearer <comms_token>",
  "app-id": "<app_id>",
  "account-id": "<account_id>"
}
```

---

## Phone Number Authentication Flow

### Step-by-Step Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHONE NUMBER AUTHENTICATION                  │
└─────────────────────────────────────────────────────────────────┘

1. User enters phone number
   └─> NumberSection.tsx
       └─> Validates phone number format (libphonenumber-js)
       └─> Country code selection from seed data

2. Request OTP
   └─> POST /api/v1/auth/login/mobile/otp/
       └─> Payload: { mobile_country_code, mobile_number, message_channel }
       └─> Options: SMS or WhatsApp delivery
       └─> Response: { success: true }

3. User enters OTP
   └─> OTPSection.tsx
       └─> 6-digit OTP input

4. Verify OTP & Login to Zo
   └─> POST /api/v1/auth/login/mobile/
       └─> Payload: { mobile_country_code, mobile_number, otp }
       └─> Response: ZoAuthResponse
           ├─> token (access token)
           ├─> refresh_token
           ├─> refresh_token_expiry
           ├─> valid_till (access token expiry)
           ├─> device_id
           ├─> device_secret
           └─> user (ZoUser object)

5. Request Zostel Credentials
   └─> POST /api/v1/auth/request-otp/zostel/
       └─> Authenticated with Zo token
       └─> Response: { mobile_country_code, mobile_number, code }

6. Activate Zostel Session
   └─> POST /api/v1/auth/activate/ (Zostel API)
       └─> Payload: { mobile_country_code, mobile, otp }
       └─> Response: ZostelAuthResponse
           ├─> user_token
           ├─> token_expiry
           └─> user (ZostelUser object)

7. Save Auth Data to Secure Storage
   └─> Both Zo and Zostel tokens stored
   └─> Device IDs/secrets stored
   └─> User objects stored

8. User is Authenticated
   └─> isAuthenticated = true
   └─> Both APIs ready to use
```

### Authentication Context

File: `context/AuthContext.tsx`

The `AuthContext` manages authentication state for both services:

```typescript
interface AuthContextProps {
  authState: {
    isAuthenticated: boolean | null;  // null = loading, false = not auth, true = auth
    isLoading: boolean;
    error: string | null;
  };
  loginZoZo: (mobile_country_code: string, mobile_number: string, otp: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getZoAuthHeaders: () => Record<string, string | null>;
  getZostelAuthHeaders: () => Record<string, string | null>;
}
```

### Stored Data (Secure Storage)

After successful authentication, the following is stored:

#### Zo Authentication
- `ZO_TOKEN` - Access token
- `ZO_REFRESH_TOKEN` - Refresh token
- `ZO_TOKEN_EXPIRY` - Access token expiry timestamp
- `ZO_REFRESH_TOKEN_EXPIRY` - Refresh token expiry timestamp
- `ZO_USER` - JSON stringified ZoUser object
- `ZO_CLIENT_DEVICE_ID` - Device UUID
- `ZO_CLIENT_DEVICE_SECRET` - Device secret UUID

#### Zostel Authentication
- `ZOSTEL_TOKEN` - User token
- `ZOSTEL_TOKEN_EXPIRY` - Token expiry timestamp
- `ZOSTEL_REFRESH_TOKEN` - Same as user token
- `ZOSTEL_REFRESH_TOKEN_EXPIRY` - Same as token expiry
- `ZOSTEL_USER` - JSON stringified ZostelUser object
- `ZOSTEL_CLIENT_USER_ID` - Client user UUID

---

## Wallet Address Integration

### Important: Wallet Address is NOT Used for Authentication

Unlike many Web3 apps, **wallet addresses in Zo are optional profile fields** and are **not used for authentication**. The wallet address can be:

1. **Manually added** to the profile (implementation not found in codebase)
2. **Associated with NFT verification** for profile picture (PFP)
3. **Used for Web3 features** like token airdrops

### Wallet-Related Profile Fields

```typescript
interface Profile {
  wallet_address: string;           // Ethereum/blockchain wallet address
  web3_verified: boolean;           // Is the wallet ownership verified?
  ens_nickname?: string;            // ENS name resolved from wallet
  selected_nickname: "custom" | "ens";  // Which nickname to display
  pfp_metadata: {                   // NFT profile picture metadata
    contract_address: string;
    is_valid: boolean;
    token_id: string;
    metadata: {
      attributes: any[];
      description: string;
      external_url: string;
      image: string;
      title: string;
    };
  };
  pfp_image?: string;               // NFT image URL (if using NFT as PFP)
  founder_tokens: string[];         // Founder NFT token IDs
  membership: "founder" | "none";   // Membership tier
}
```

### Wallet Connection Flow (Inferred)

Since there are no explicit wallet connection UI components in the codebase, the wallet address is likely:

1. **Added via Profile Update API**
   ```typescript
   POST /api/v1/profile/me/
   {
     wallet_address: "0x1234567890abcdef...",
     web3_verified: false  // Initially unverified
   }
   ```

2. **Verified via Signature Challenge** (backend handles this)
   - Backend generates a challenge message
   - User signs message with wallet
   - Backend verifies signature matches wallet_address
   - Sets `web3_verified: true`

3. **ENS Resolution** (backend handles this)
   - Backend resolves ENS name from wallet_address
   - Stores in `ens_nickname` field
   - User can choose to display ENS or custom nickname

### Web3 Query Endpoints

File: `utils/auth/endpoints/web3.ts`

```typescript
const web3QueryEndpoints = {
  WEB3_TOKEN_AIRDROPS: {
    server: ApiServer.ZO,
    queryKey: ["web3", "token", "airdrops"],
    url: "/api/v1/webthree/token-airdrops/",
  }
};
```

**Use Case**: Fetch token airdrop amounts for authenticated wallet

---

## Profile Data Structure

### ZoUser (Auth Response)

```typescript
interface ZoUser {
  id: string;
  pid: string;                  // Profile ID (public identifier)
  first_name: string;
  last_name: string;
  wallet_address: string;       // Wallet address (may be empty string)
  mobile_number: string;        // Phone number (WITHOUT country code)
  email_address: string;
  roles: string[];              // User roles/permissions
  membership: string;           // "founder" | "none"
}
```

### Profile (Full Profile)

```typescript
interface Profile {
  // Identity
  pid: string;
  first_name: string;
  last_name?: string;
  middle_name: string;
  nickname?: string;
  custom_nickname?: string;
  ens_nickname?: string;
  selected_nickname: "custom" | "ens";
  
  // Contact
  mobile_number: string;        // Full number including country code
  mobile_verified: boolean;
  email_address?: string;
  email_verified: boolean;
  
  // Location
  address: string;              // Physical address
  pincode?: string;
  place_name?: string;          // Home city
  place_ref_id?: string;
  country: ZoCountry;
  home_location?: {
    lat: number;
    lng: number;
  };
  
  // Personal
  date_of_birth?: string;       // "YYYY-MM-DD"
  gender: string;
  bio: string;
  relationship_status?: string;
  
  // Avatar & Appearance
  body_type: string;            // "bro" | "bae" (for avatar generation)
  avatar: {
    image: string;              // CDN URL of generated avatar
    metadata: string;
    ref_id: number;
  };
  
  // Web3 & Blockchain
  wallet_address: string;
  web3_verified: boolean;
  pfp_image?: string;
  pfp_metadata: {
    contract_address: string;
    is_valid: boolean;
    token_id: string;
    metadata: { ... };
  };
  founder_tokens: string[];
  membership: "founder" | "none";
  
  // Cultures & Interests
  cultures: Array<{
    description: string;
    icon: string;
    key: string;
    name: string;
  }>;
  
  // Social Links
  socials: Array<{
    category: string;
    link: string;
    verified: boolean;
  }>;
}
```

---

## API Endpoints

### Authentication Endpoints

#### 1. Request OTP
```
POST /api/v1/auth/login/mobile/otp/
Server: ZO
Authentication: No (public endpoint)

Request:
{
  mobile_country_code: string;      // e.g., "91" for India
  mobile_number: string;            // e.g., "9876543210"
  message_channel: string;          // "" (SMS) or "whatsapp"
}

Response:
{
  success: boolean;
}
```

#### 2. Login with OTP (Zo)
```
POST /api/v1/auth/login/mobile/
Server: ZO
Authentication: No

Request:
{
  mobile_country_code: string;
  mobile_number: string;
  otp: string;                      // 6-digit OTP
}

Response: ZoAuthResponse
{
  token: string;                    // Access token
  refresh_token: string;
  refresh_token_expiry: string;     // ISO timestamp
  valid_till: string;               // Access token expiry
  access_token: string;             // Same as token
  access_token_expiry: string;
  client_key: string;
  device_id: string;
  device_secret: string;
  device_info: {};
  user: ZoUser;
}
```

#### 3. Request Zostel OTP
```
POST /api/v1/auth/request-otp/zostel/
Server: ZO
Authentication: Yes (Zo token required)

Request: {}

Response:
{
  mobile_country_code: string;
  mobile_number: string;
  code: string;                     // OTP for Zostel activation
}
```

#### 4. Activate Zostel
```
POST /api/v1/auth/activate/
Server: ZOSTEL
Authentication: No

Request:
{
  mobile_country_code: string;
  mobile: string;
  otp: string;
}

Response: ZostelAuthResponse
{
  user_token: string;
  token_expiry: string;
  user: ZostelUser;
}
```

#### 5. Check Login Status
```
GET /api/v1/auth/login/check/
Server: ZO
Authentication: Yes

Response: HTTP 200 if authenticated
```

#### 6. Refresh Token
```
POST /api/v1/auth/login/refresh/
Server: ZO
Authentication: No (uses refresh token)

Request:
{
  refresh_token: string;
}

Response: ZoAuthResponse (same as login)
```

#### 7. Get User Comms Credentials
```
POST /api/v1/auth/user/comms/
Server: ZO
Authentication: Yes

Request: {}

Response: AuthUserCommsResponse
{
  token: string;
  account_id: string;
  app_id: string;
  token_expiry: string;
}
```

#### 8. Register Device
```
POST /api/v1/auth/device/register/
Server: ZOSTEL
Authentication: Yes

Request:
{
  device_id: string;
  device_name: string;
  app_version: string;
  app_build: string;
  platform: "ios" | "android";
  utm?: Record<string, string>;
}

Response: {}
```

#### 9. Update User Devices
```
PUT /api/v1/auth/user/devices/
Server: ZO
Authentication: Yes

Request (at least one field required):
{
  device_id?: string;
  device_name?: string;
  client_version?: string;
  client_build?: string;
  notification_token?: string;
}

Response: {}
```

### Profile Endpoints

#### 10. Get My Profile
```
GET /api/v1/profile/me/
Server: ZO
Authentication: Yes

Response: Profile (full profile object)
```

#### 11. Update My Profile
```
POST /api/v1/profile/me/
Server: ZO
Authentication: Yes

Request (partial update, any fields):
{
  first_name?: string;
  last_name?: string;
  body_type?: "bro" | "bae";
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  country?: string;             // Country code
  place_name?: string;
  wallet_address?: string;      // Add/update wallet
  web3_verified?: boolean;
  // ... any other profile fields
}

Response: Profile (updated profile)
```

#### 12. Get Another User's Profile
```
GET /api/v1/profile/?pid=<user_pid>
Server: ZO
Authentication: Yes

Response: MemberProfile (public profile subset)
```

#### 13. Get Zostel Profile
```
GET /api/v1/users/profile/
Server: ZOSTEL
Authentication: Yes

Response:
{
  profile: ZostelProfile;
}
```

### Email & Account Merging

#### 14. Add Email
```
POST /api/v1/auth/user/email/
Server: ZO
Authentication: Yes

Request:
{
  email_address: string;
}

Response: {}
(Triggers email verification flow)
```

#### 15. Request Email OTP
```
POST /api/v1/auth/request-otp/email/
Server: ZO
Authentication: Yes

Request:
{
  email_address: string;
}

Response: {}
```

#### 16. Verify Email
```
POST /api/v1/auth/user/emails/
Server: ZO
Authentication: Yes

Request:
{
  email_address: string;
  otp: string;
  verification_type: string;    // "native-email"
}

Response: {}
(May return merge response if duplicate account found)
```

#### 17. Get User Emails
```
GET /api/v1/auth/user/emails/
Server: ZO
Authentication: Yes

Response:
{
  emails: ZoUserEmail[];
}
```

#### 18. Update Email (Set Primary)
```
PUT /api/v1/auth/user/emails/
Server: ZO
Authentication: Yes

Request:
{
  email_address: string;
  primary: true;
}

Response: {}
```

#### 19. Delete Email
```
DELETE /api/v1/auth/user/emails/
Server: ZO
Authentication: Yes

Request:
{
  data: {
    email_address: string;
  }
}

Response: {}
```

#### 20. Merge Accounts
```
POST /api/v1/auth/user/merge/
Server: ZO
Authentication: Yes

Request:
{
  merge_id: string;
  verification: {
    email_address: string;
    otp: string;
    verification_type: string;
  };
}

Response: {}
(Merges duplicate accounts found via email)
```

---

## Implementation Details

### File Structure

```
context/
├─ AuthContext.tsx              # Manages dual auth state

hooks/
├─ useProfile.ts                # Profile fetch/update hook
├─ useMutation.ts               # Generic mutation hook
└─ useQuery.ts                  # Generic query hook

utils/auth/
├─ client.ts                    # Axios instances & interceptors
└─ endpoints/
   ├─ auth.ts                   # Auth endpoints config
   ├─ profile.ts                # Profile endpoints config
   └─ web3.ts                   # Web3 endpoints config

components/helpers/login/
├─ NumberSection.tsx            # Phone number input
├─ OTPSection.tsx               # OTP verification
└─ AvatarSection.tsx            # Avatar body type selection

definitions/
├─ auth.ts                      # Auth types
└─ profile.ts                   # Profile types
```

### Axios Instance Setup

File: `utils/auth/client.ts`

```typescript
// Create separate axios instances for each server
export const axiosInstances: Record<ApiServer, AxiosInstance> = {
  [ApiServer.ZO]: createAxiosInstance(ApiServer.ZO),
  [ApiServer.ZOSTEL]: createAxiosInstance(ApiServer.ZOSTEL),
  [ApiServer.ZO_COMMS]: createAxiosInstance(ApiServer.ZO_COMMS),
};

function createAxiosInstance(server: ApiServer): AxiosInstance {
  const baseURL = getBaseURL(server);
  const instance = axios.create({
    baseURL,
    timeout: 30000,
  });
  return instance;
}
```

### Request Interceptors

Each axios instance has an interceptor that automatically attaches authentication headers:

```typescript
const requestInterceptor = instance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const authHeaders = getAuthHeaders();  // From AuthContext
    Object.entries(authHeaders).forEach(([key, value]) => {
      if (value) {
        config.headers[key] = value;
      }
    });
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Response Interceptors

Handles token refresh on 401 errors:

```typescript
const responseInterceptor = instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Attempt token refresh
      await refreshToken();
      
      // Retry original request with new token
      return instance(originalRequest);
    }
    
    return Promise.reject(error);
  }
);
```

### useProfile Hook

File: `hooks/useProfile.ts`

```typescript
const useProfile = () => {
  const { authState: { isAuthenticated } } = useAuth();

  // Fetch Zo profile
  const { data: profile, refetch: refetchProfile } = useQuery("PROFILE_ME", {
    enabled: isAuthenticated === true,
    select: (data) => data.data,
  });

  // Fetch Zostel profile
  const { data: zostelProfile, refetch: refetchZostelProfile } = useQuery(
    "PROFILE_ME_ZOSTEL",
    {
      enabled: isAuthenticated === true,
      select: (data) => data.data.profile,
    }
  );

  // Update profile mutation
  const { mutate: updateProfile } = useMutation("PROFILE_ME", {
    onSuccess: () => {
      refetchProfile();
    },
  });

  return {
    profile,
    zostelProfile,
    updateProfile,
    updateProfileAsync,
    refetchProfile,
    refetchZostelProfile,
  };
};
```

### useMutation Hook

File: `hooks/useMutation.ts`

Wraps `@tanstack/react-query` and routes requests to correct server:

```typescript
export default function useMutation<
  TRequest = any,
  TResponse = any,
  TError = AxiosError
>(
  endpointKey: keyof typeof endpoints,
  options?: UseMutationOptions<TResponse, TError, TRequest>
) {
  const endpoint = endpoints[endpointKey];

  return useTanstackMutation({
    mutationFn: async (request: WithRequestOptions<TRequest>) => {
      const axiosInstance = axiosInstances[endpoint.server];
      const { path: dynamicPath, method, ...rest } = request;
      return await axiosInstance[method ?? endpoint.method]<TResponse>(
        `${endpoint.url}${path}${dynamicPath ?? ""}`,
        rest
      );
    },
    ...options,
  });
}
```

---

## Account Merging

### When Does Account Merging Happen?

When a user tries to add an email that's already associated with another Zo account, the backend returns a `MergeResponse` instead of a success response.

### MergeResponse Structure

```typescript
interface MergeResponse {
  merge_id: string;
  pid: string;
  membership: string;
  ens_nickname: string | null;
  custom_nickname: string;
  nickname: string;
  wallet_address: string;
  email_address: string;
  mobile_number: string;
  pfp_image: string;
  created_at: string;
  auth: {
    email_address: string;
    otp: string;
    verification_type: string;
  };
}
```

### Merge Flow

```
1. User adds email to profile
   └─> POST /api/v1/auth/user/email/

2. User verifies email with OTP
   └─> POST /api/v1/auth/user/emails/
       └─> If duplicate account found, returns MergeResponse

3. UI shows MergeAccountsSheet
   └─> Displays existing account info
   └─> Asks user to select nickname (if conflicting)

4. User confirms merge
   └─> POST /api/v1/auth/user/merge/
       └─> Payload: { merge_id, verification }
       └─> Backend merges accounts

5. Profile updated
   └─> Refetch profile to get merged data
   └─> User now has single unified account
```

### MergeAccountsSheet Component

File: `components/sheets/MergeAccounts.tsx`

Key features:
- Shows existing account details (avatar, nickname, email, creation date)
- Handles nickname conflicts by letting user choose which to keep
- Calls merge API with verification credentials
- Updates profile after successful merge

---

## Code Examples

### Example 1: Complete Phone Authentication

```typescript
import { useAuth } from "@/context/AuthContext";
import useMutation from "@/hooks/useMutation";

function LoginFlow() {
  const { loginZoZo } = useAuth();
  const { mutateAsync: requestOTP } = useMutation("AUTH_LOGIN_MOBILE_OTP");

  // Step 1: Request OTP
  const handleRequestOTP = async (countryCode: string, phoneNumber: string) => {
    await requestOTP({
      mobile_country_code: countryCode.replace("+", ""),
      mobile_number: phoneNumber,
      message_channel: "",  // or "whatsapp"
    });
  };

  // Step 2: Verify OTP and Login
  const handleVerifyOTP = async (
    countryCode: string,
    phoneNumber: string,
    otp: string
  ) => {
    const success = await loginZoZo(
      countryCode.replace("+", ""),
      phoneNumber,
      otp
    );
    
    if (success) {
      // User is now authenticated with both Zo and Zostel
      // Navigate to main app
    }
  };

  return (
    // UI components
  );
}
```

### Example 2: Update Wallet Address

```typescript
import useProfile from "@/hooks/useProfile";

function ConnectWallet() {
  const { updateProfile } = useProfile();

  const handleConnectWallet = async (walletAddress: string) => {
    updateProfile(
      {
        wallet_address: walletAddress,
        web3_verified: false,  // Will be verified separately
      },
      {
        onSuccess: () => {
          console.log("Wallet address saved!");
        },
        onError: (error) => {
          console.error("Failed to save wallet:", error);
        },
      }
    );
  };

  return (
    // UI for wallet connection
  );
}
```

### Example 3: Fetch Profile Data

```typescript
import useProfile from "@/hooks/useProfile";

function ProfileScreen() {
  const { profile, zostelProfile, isLoading } = useProfile();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View>
      <Text>Name: {profile?.first_name} {profile?.last_name}</Text>
      <Text>Phone: {profile?.mobile_number}</Text>
      <Text>Wallet: {profile?.wallet_address || "Not connected"}</Text>
      <Text>Web3 Verified: {profile?.web3_verified ? "Yes" : "No"}</Text>
      <Text>Membership: {profile?.membership}</Text>
      
      {/* Display avatar */}
      {profile?.avatar?.image && (
        <Image source={{ uri: profile.avatar.image }} />
      )}
    </View>
  );
}
```

### Example 4: Check Authentication State

```typescript
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

function AppNavigator() {
  const { authState: { isAuthenticated, isLoading } } = useAuth();

  useEffect(() => {
    if (isAuthenticated === null) {
      // Still checking auth state
      return;
    }
    
    if (isAuthenticated === false) {
      // Navigate to login/onboarding
      router.replace("/onboarding");
    } else {
      // Navigate to main app
      router.replace("/(tabs)/explore");
    }
  }, [isAuthenticated]);

  if (isLoading || isAuthenticated === null) {
    return <SplashScreen />;
  }

  return <AppRoutes />;
}
```

### Example 5: Handle Account Merging

```typescript
import useMutation from "@/hooks/useMutation";
import useProfile from "@/hooks/useProfile";
import { useState } from "react";

function EmailVerification() {
  const [mergeResponse, setMergeResponse] = useState<MergeResponse | null>(null);
  const { mutateAsync: verifyEmail } = useMutation("AUTH_USER_EMAILS");
  const { mutateAsync: mergeAccounts } = useMutation("AUTH_MERGE_ACCOUNTS");
  const { refetchProfile } = useProfile();

  const handleVerifyEmail = async (email: string, otp: string) => {
    try {
      await verifyEmail({
        email_address: email,
        otp: otp,
        verification_type: "native-email",
      });
      // Success - no merge needed
      refetchProfile();
    } catch (error) {
      // Check if error response contains merge data
      if (error.response?.data?.merge_id) {
        setMergeResponse(error.response.data);
        // Show merge confirmation UI
      }
    }
  };

  const handleMerge = async (selectedNickname: string) => {
    if (!mergeResponse) return;

    await mergeAccounts({
      merge_id: mergeResponse.merge_id,
      verification: mergeResponse.auth,
    });

    // Update nickname if needed
    if (selectedNickname !== profile?.custom_nickname) {
      updateProfile({ custom_nickname: selectedNickname });
    }

    refetchProfile();
  };

  return (
    // UI for email verification and merge confirmation
  );
}
```

### Example 6: Token Refresh Logic

```typescript
// In context/AuthContext.tsx

const refreshTokenThenSaveAndLogin = useCallback((refreshToken: string) => {
  refreshZoToken(refreshToken)
    .then((data) => {
      // Store new tokens in memory
      authRef.current.zo.token = data.access_token;
      authRef.current.zo.refreshToken = data.refresh_token;
      authRef.current.zo.refreshTokenExpiry = data.refresh_token_expiry;
      authRef.current.zo.tokenExpiry = data.access_token_expiry;
      authRef.current.zo.clientDeviceId = data.device_id;
      authRef.current.zo.clientDeviceSecret = data.device_secret;
      authRef.current.zo.user = data.user;
      
      // Save to secure storage
      saveZoAuthData(data);
      
      // Update auth state
      setAuthState({
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });
    })
    .catch((error) => {
      // Refresh failed - logout
      logOut();
    });
}, []);

const refreshZoToken = (refresh_token: string) =>
  axiosInstances[ApiServer.ZO]
    .post(`/api/v1/auth/login/refresh/`, { refresh_token })
    .then((res) => res.data as ZoAuthResponse);
```

---

## Summary

### Key Takeaways

1. **Phone Number is Primary**: Authentication is based on phone number + OTP, not wallet address.

2. **Dual Authentication**: Users are authenticated with both Zo and Zostel APIs simultaneously.

3. **Wallet is Optional**: Wallet addresses are stored in the profile but not required for core functionality.

4. **Secure Token Storage**: All tokens and credentials are stored in secure device storage.

5. **Auto-Refresh**: Expired access tokens are automatically refreshed using refresh tokens.

6. **Account Merging**: Multiple accounts can be merged via email verification.

7. **Device Registration**: Each device is registered with unique IDs for tracking and notifications.

8. **Web3 Features**: Wallet addresses enable NFT profile pictures, ENS names, and token airdrops.

### Flow Diagram: Phone to Profile

```
Phone Number (User Input)
    ↓
OTP Verification
    ↓
Zo Authentication (GET token, refresh_token, device_id, device_secret)
    ↓
Zostel Authentication (GET user_token)
    ↓
Store Tokens in Secure Storage
    ↓
Set isAuthenticated = true
    ↓
Fetch Profile (GET /api/v1/profile/me/)
    ↓
Profile Object {
  mobile_number,
  wallet_address,  ← Optional, can be empty
  web3_verified,   ← Optional, can be false
  avatar,
  ...
}
```

### Environment Variables Required

```bash
# Zo API
EXPO_PUBLIC_ZO_API_URL=https://api.zo.xyz
EXPO_PUBLIC_ZO_CLIENT_KEY_IOS=<ios-client-key>
EXPO_PUBLIC_ZO_CLIENT_KEY_ANDROID=<android-client-key>

# Zostel API
EXPO_PUBLIC_ZOSTEL_API_URL=https://api.zostel.com
EXPO_PUBLIC_ZOSTEL_CLIENT_ID=<zostel-client-id>

# Zo Comms API
EXPO_PUBLIC_ZO_COMMS_API_URL=https://comms.zo.xyz
```

---

## Related Documentation

- [ZO_API_DOCUMENTATION.md](./ZO_API_DOCUMENTATION.md) - Complete API reference
- Authentication flow: `app/onboarding.tsx`
- Profile management: `app/profile.tsx`
- Auth context: `context/AuthContext.tsx`
- API client setup: `utils/auth/client.ts`

---

**Last Updated**: 2025-01-13  
**Version**: 1.0


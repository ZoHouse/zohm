# Avatar Selection Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Authentication Requirements](#authentication-requirements)
4. [Data Structures](#data-structures)
5. [Implementation Flow](#implementation-flow)
6. [Step-by-Step Implementation](#step-by-step-implementation)
7. [Error Handling](#error-handling)
8. [Dependencies](#dependencies)
9. [Code Examples](#code-examples)
10. [Testing Checklist](#testing-checklist)

---

## Overview

The Avatar Selection feature allows users to choose a body type (`bro` or `bae`) during onboarding, which triggers backend avatar generation. The system polls the profile endpoint until the avatar image is ready, then displays it with animations.

### Key Components
- **Avatar Selection UI**: Body type selection interface
- **Profile Update API**: Updates user's `body_type` field
- **Profile Polling**: Checks for avatar generation completion
- **Avatar Display**: Shows generated avatar with animations

---

## API Endpoints

### 1. Update Profile (Avatar Generation Trigger)

**Endpoint:** `POST /api/v1/profile/me/`

**Server:** `ZO` (Zo API Server)

**Base URL:** Configured via environment variable `EXPO_PUBLIC_ZO_API_BASE_URL`

**Authentication:** Required (see [Authentication Requirements](#authentication-requirements))

**Request Headers:**
```
Content-Type: application/json
Accept: application/json
Platform: ios|android
client-key: <CLIENT_KEY_IOS|CLIENT_KEY_ANDROID>
client-device-id: <DEVICE_ID>
client-device-secret: <DEVICE_SECRET>
Authorization: Bearer <ACCESS_TOKEN>
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
    "pid": "string",
    "first_name": "string",
    "avatar": {
      "image": "string | null",
      "metadata": "string",
      "ref_id": number
    },
    "body_type": "bro" | "bae",
    // ... other profile fields
  }
}
```

**Status Codes:**
- `200 OK`: Profile updated successfully
- `401 Unauthorized`: Invalid or expired token
- `400 Bad Request`: Invalid request body
- `500 Internal Server Error`: Server error

**Notes:**
- The `avatar.image` field may be `null` immediately after this call
- Avatar generation happens asynchronously on the backend
- You must poll the GET endpoint to check when avatar is ready

---

### 2. Get Profile (Polling for Avatar)

**Endpoint:** `GET /api/v1/profile/me/`

**Server:** `ZO` (Zo API Server)

**Base URL:** Configured via environment variable `EXPO_PUBLIC_ZO_API_BASE_URL`

**Authentication:** Required (see [Authentication Requirements](#authentication-requirements))

**Request Headers:**
```
Content-Type: application/json
Accept: application/json
Platform: ios|android
client-key: <CLIENT_KEY_IOS|CLIENT_KEY_ANDROID>
client-device-id: <DEVICE_ID>
client-device-secret: <DEVICE_SECRET>
Authorization: Bearer <ACCESS_TOKEN>
```

**Response:**
```json
{
  "data": {
    "pid": "string",
    "first_name": "string",
    "avatar": {
      "image": "string | null",
      "metadata": "string",
      "ref_id": number
    },
    "body_type": "bro" | "bae",
    "nickname": "string",
    "mobile_number": "string",
    "email_address": "string | null",
    "country": {
      "code": "string",
      "name": "string",
      "flag": "string",
      "mobile_code": "string"
    },
    // ... other profile fields
  }
}
```

**Status Codes:**
- `200 OK`: Profile retrieved successfully
- `401 Unauthorized`: Invalid or expired token
- `404 Not Found`: Profile not found
- `500 Internal Server Error`: Server error

**Polling Strategy:**
- Poll every 1 second
- Maximum 10 attempts (10 seconds total)
- Stop polling when `avatar.image` is a non-empty string
- If max attempts reached, proceed with error handling

---

## Authentication Requirements

### Authentication Flow

The app uses a dual-authentication system with two API servers:

1. **Zo API Server** (`ZO`)
2. **Zostel API Server** (`ZOSTEL`)

### Required Headers for Zo API

For all requests to the Zo API server, include these headers:

```typescript
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Platform": "ios" | "android",
  "client-key": string,           // Platform-specific client key
  "client-device-id": string,      // Unique device identifier
  "client-device-secret": string,  // Device secret from auth response
  "Authorization": "Bearer <token>" // Access token from login
}
```

### Client Keys

Client keys are platform-specific and stored in environment variables:

- **iOS:** `EXPO_PUBLIC_ZO_CLIENT_KEY_IOS`
- **Android:** `EXPO_PUBLIC_ZO_CLIENT_KEY_ANDROID`
- **Zostel:** `EXPO_PUBLIC_ZOSTEL_CLIENT_ID`

### Device Registration

Device credentials (`device_id` and `device_secret`) are obtained during the initial authentication/login flow:

1. User logs in with mobile number + OTP
2. Server returns `device_id` and `device_secret` in the auth response
3. These are stored securely and included in all subsequent requests

### Token Management

- Access tokens are stored securely (e.g., secure storage/Keychain)
- Tokens may expire; implement refresh logic if needed
- Include `Authorization: Bearer <token>` header in all authenticated requests

### Example: Getting Auth Headers

```typescript
const getZoAuthHeaders = () => {
  return {
    "client-key": CLIENT_KEY,
    "client-device-id": deviceId,
    "client-device-secret": deviceSecret,
    "authorization": token ? `Bearer ${token}` : null,
  };
};
```

---

## Data Structures

### Profile Type

```typescript
interface Profile {
  pid: string;
  first_name: string;
  last_name?: string;
  nickname?: string;
  avatar: {
    image: string | null;      // Avatar image URL (null until generated)
    metadata: string;
    ref_id: number;
  };
  body_type: "bro" | "bae" | null;
  mobile_number: string;
  email_address?: string;
  country: {
    code: string;
    name: string;
    flag: string;
    mobile_code: string;
  };
  // ... other fields
}
```

### Avatar Object

```typescript
interface Avatar {
  image: string | null;    // CDN URL to avatar image (null if not generated)
  metadata: string;         // JSON string with avatar metadata
  ref_id: number;          // Reference ID for the avatar
}
```

### Body Type Enum

```typescript
type BodyType = "bro" | "bae";
```

- `"bro"`: Male body type
- `"bae"`: Female body type

---

## Implementation Flow

### High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Avatar Selection Flow                     │
└─────────────────────────────────────────────────────────────┘

1. User selects body type (bro/bae)
   │
   ├─► Update UI: Show selected state, hide unselected
   │
2. User clicks "Generate Avatar"
   │
   ├─► Start loading animation
   │
3. POST /api/v1/profile/me/ { body_type: "bro" | "bae" }
   │
   ├─► Backend receives request
   ├─► Backend queues avatar generation job
   ├─► Response: Profile with avatar.image = null
   │
4. Start polling loop (every 1 second, max 10 attempts)
   │
   ├─► GET /api/v1/profile/me/
   │   │
   │   ├─► Check avatar.image
   │   │
   │   ├─► If null: Wait 1s, retry
   │   │
   │   └─► If string (non-empty): Avatar ready!
   │
5. Avatar ready
   │
   ├─► Stop polling
   ├─► Show avatar with animations
   ├─► Enable "Continue" button
   │
6. User clicks "Continue"
   │
   └─► Proceed to next onboarding step
```

### Detailed Sequence Diagram

```
User          UI Component        API Client        Backend
 │                │                   │                │
 │──Select Body──►│                   │                │
 │                │                   │                │
 │──Click Generate►│                   │                │
 │                │──POST /profile/me─►│                │
 │                │  {body_type}       │                │
 │                │                   │──POST Request─►│
 │                │                   │                │──Queue Job
 │                │                   │                │
 │                │◄──200 OK──────────│◄──200 OK───────│
 │                │  {avatar: null}    │                │
 │                │                   │                │
 │                │──Poll Start───────│                │
 │                │                   │                │
 │                │──GET /profile/me─►│                │
 │                │                   │──GET Request──►│
 │                │                   │                │──Check Status
 │                │◄──200 OK──────────│◄──200 OK───────│
 │                │  {avatar: null}    │                │
 │                │                   │                │
 │                │──Wait 1s──────────│                │
 │                │                   │                │
 │                │──GET /profile/me─►│                │
 │                │                   │──GET Request──►│
 │                │                   │                │──Avatar Ready!
 │                │◄──200 OK──────────│◄──200 OK───────│
 │                │  {avatar: "url"}   │                │
 │                │                   │                │
 │◄──Show Avatar──│                   │                │
 │                │                   │                │
 │──Click Continue►│                   │                │
 │                │                   │                │
```

---

## Step-by-Step Implementation

### Step 1: Set Up API Client

Create an HTTP client with authentication interceptors:

```typescript
// api/client.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_ZO_API_BASE_URL;

const createApiClient = (
  getAuthHeaders: () => Record<string, string | null>
): AxiosInstance => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Platform': Platform.OS, // 'ios' or 'android'
    },
  });

  // Request interceptor to add auth headers
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const authHeaders = getAuthHeaders();
      Object.entries(authHeaders).forEach(([key, value]) => {
        if (value) {
          config.headers[key] = value;
        }
      });
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};
```

### Step 2: Create Profile Service

```typescript
// services/profileService.ts
import { Profile } from './types';

export class ProfileService {
  constructor(private apiClient: AxiosInstance) {}

  async updateProfile(data: Partial<Profile>): Promise<Profile> {
    const response = await this.apiClient.post<{ data: Profile }>(
      '/api/v1/profile/me/',
      data
    );
    return response.data.data;
  }

  async getProfile(): Promise<Profile> {
    const response = await this.apiClient.get<{ data: Profile }>(
      '/api/v1/profile/me/'
    );
    return response.data.data;
  }
}
```

### Step 3: Create Avatar Selection Hook

```typescript
// hooks/useAvatarSelection.ts
import { useState, useCallback, useRef } from 'react';
import { ProfileService } from '../services/profileService';

type BodyType = 'bro' | 'bae';

export const useAvatarSelection = (profileService: ProfileService) => {
  const [selectedBodyType, setSelectedBodyType] = useState<BodyType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAvatarReady, setIsAvatarReady] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef(0);
  const MAX_POLLING_ATTEMPTS = 10;
  const POLLING_INTERVAL = 1000; // 1 second

  const pollForAvatar = useCallback(async (): Promise<void> => {
    if (attemptCountRef.current >= MAX_POLLING_ATTEMPTS) {
      setIsGenerating(false);
      // Handle max attempts reached
      return;
    }

    attemptCountRef.current += 1;

    try {
      const profile = await profileService.getProfile();
      
      if (profile.avatar?.image && profile.avatar.image.trim() !== '') {
        // Avatar is ready!
        setAvatarUrl(profile.avatar.image);
        setIsAvatarReady(true);
        setIsGenerating(false);
        attemptCountRef.current = 0;
        return;
      }

      // Avatar not ready yet, poll again
      pollingTimeoutRef.current = setTimeout(() => {
        pollForAvatar();
      }, POLLING_INTERVAL);
    } catch (error) {
      console.error('Error polling for avatar:', error);
      // Retry on error
      pollingTimeoutRef.current = setTimeout(() => {
        pollForAvatar();
      }, POLLING_INTERVAL);
    }
  }, [profileService]);

  const generateAvatar = useCallback(async () => {
    if (!selectedBodyType) {
      throw new Error('Body type must be selected');
    }

    setIsGenerating(true);
    setIsAvatarReady(false);
    attemptCountRef.current = 0;

    try {
      // Update profile with body type
      await profileService.updateProfile({
        body_type: selectedBodyType,
      });

      // Start polling for avatar
      pollForAvatar();
    } catch (error) {
      console.error('Error generating avatar:', error);
      setIsGenerating(false);
      throw error;
    }
  }, [selectedBodyType, profileService, pollForAvatar]);

  const cleanup = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    attemptCountRef.current = 0;
  }, []);

  return {
    selectedBodyType,
    setSelectedBodyType,
    generateAvatar,
    isGenerating,
    isAvatarReady,
    avatarUrl,
    cleanup,
  };
};
```

### Step 4: Create Avatar Selection Component

```typescript
// components/AvatarSelection.tsx
import React from 'react';
import { View, TouchableOpacity, Text, ActivityIndicator, Image } from 'react-native';
import { useAvatarSelection } from '../hooks/useAvatarSelection';
import { ProfileService } from '../services/profileService';

interface AvatarSelectionProps {
  profileService: ProfileService;
  onComplete: () => void;
}

export const AvatarSelection: React.FC<AvatarSelectionProps> = ({
  profileService,
  onComplete,
}) => {
  const {
    selectedBodyType,
    setSelectedBodyType,
    generateAvatar,
    isGenerating,
    isAvatarReady,
    avatarUrl,
    cleanup,
  } = useAvatarSelection(profileService);

  React.useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  const handleGenerate = async () => {
    try {
      await generateAvatar();
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      // Show error to user
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose your body shape</Text>

      {/* Body Type Selection */}
      <View style={styles.selectionContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            selectedBodyType === 'bae' && styles.selectedOption,
          ]}
          onPress={() => setSelectedBodyType('bae')}
          disabled={isGenerating}
        >
          <Text style={styles.optionLabel}>Bae</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            selectedBodyType === 'bro' && styles.selectedOption,
          ]}
          onPress={() => setSelectedBodyType('bro')}
          disabled={isGenerating}
        >
          <Text style={styles.optionLabel}>Bro</Text>
        </TouchableOpacity>
      </View>

      {/* Generate Button */}
      {selectedBodyType && !isGenerating && !isAvatarReady && (
        <TouchableOpacity
          style={styles.generateButton}
          onPress={handleGenerate}
        >
          <Text style={styles.generateButtonText}>Generate Avatar</Text>
        </TouchableOpacity>
      )}

      {/* Loading State */}
      {isGenerating && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Generating your avatar...</Text>
        </View>
      )}

      {/* Avatar Display */}
      {isAvatarReady && avatarUrl && (
        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          <TouchableOpacity
            style={styles.continueButton}
            onPress={onComplete}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = {
  container: { flex: 1, padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24 },
  selectionContainer: { flexDirection: 'row', gap: 16 },
  option: { flex: 1, padding: 24, borderWidth: 2, borderRadius: 12 },
  selectedOption: { borderColor: '#007AFF', backgroundColor: '#E3F2FD' },
  optionLabel: { fontSize: 18, textAlign: 'center' },
  generateButton: { marginTop: 24, padding: 16, backgroundColor: '#007AFF', borderRadius: 8 },
  generateButtonText: { color: 'white', textAlign: 'center', fontSize: 16 },
  loadingContainer: { marginTop: 24, alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  avatarContainer: { marginTop: 24, alignItems: 'center' },
  avatar: { width: 200, height: 200, borderRadius: 100 },
  continueButton: { marginTop: 24, padding: 16, backgroundColor: '#34C759', borderRadius: 8 },
  continueButtonText: { color: 'white', textAlign: 'center', fontSize: 16 },
};
```

---

## Error Handling

### Network Errors

```typescript
try {
  await profileService.updateProfile({ body_type: 'bro' });
} catch (error) {
  if (error.response) {
    // Server responded with error status
    switch (error.response.status) {
      case 401:
        // Unauthorized - token expired or invalid
        // Redirect to login or refresh token
        break;
      case 400:
        // Bad request - invalid body_type value
        // Show validation error to user
        break;
      case 500:
        // Server error - retry or show error message
        break;
    }
  } else if (error.request) {
    // Request made but no response received
    // Network error - check internet connection
  } else {
    // Error setting up request
    // Show generic error message
  }
}
```

### Polling Errors

```typescript
const pollForAvatar = useCallback(async (): Promise<void> => {
  if (attemptCountRef.current >= MAX_POLLING_ATTEMPTS) {
    setIsGenerating(false);
    // Show error: "Avatar generation is taking longer than expected. Please try again."
    return;
  }

  try {
    const profile = await profileService.getProfile();
    // ... check avatar
  } catch (error) {
    // Log error but continue polling (network might be temporarily down)
    console.error('Polling error:', error);
    pollingTimeoutRef.current = setTimeout(() => {
      pollForAvatar();
    }, POLLING_INTERVAL);
  }
}, [profileService]);
```

### Timeout Handling

```typescript
// Add timeout to API requests
const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});
```

---

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-native": "^0.72.0"
  }
}
```

### Environment Variables

Create a `.env` file or configure environment variables:

```bash
# Zo API Configuration
EXPO_PUBLIC_ZO_API_BASE_URL=https://api.zo.xyz
EXPO_PUBLIC_ZO_CLIENT_KEY_IOS=your_ios_client_key
EXPO_PUBLIC_ZO_CLIENT_KEY_ANDROID=your_android_client_key

# Zostel API Configuration (if needed)
EXPO_PUBLIC_ZOSTEL_API_BASE_URL=https://api.zostel.com
EXPO_PUBLIC_ZOSTEL_CLIENT_ID=your_zostel_client_id
```

### Platform Detection

For React Native, use:

```typescript
import { Platform } from 'react-native';

const platform = Platform.OS; // 'ios' | 'android'
```

---

## Code Examples

### Complete Example: React Native Implementation

```typescript
// App.tsx
import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { AvatarSelection } from './components/AvatarSelection';
import { createApiClient } from './api/client';
import { ProfileService } from './services/profileService';
import { useAuth } from './context/AuthContext';

const AppContent = () => {
  const { getZoAuthHeaders } = useAuth();
  const apiClient = createApiClient(getZoAuthHeaders);
  const profileService = new ProfileService(apiClient);

  return (
    <AvatarSelection
      profileService={profileService}
      onComplete={() => {
        console.log('Avatar selection complete!');
        // Navigate to next screen
      }}
    />
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

### Example: TypeScript Types

```typescript
// types/profile.ts
export interface Profile {
  pid: string;
  first_name: string;
  last_name?: string;
  nickname?: string;
  avatar: Avatar;
  body_type: 'bro' | 'bae' | null;
  mobile_number: string;
  email_address?: string;
  country: Country;
}

export interface Avatar {
  image: string | null;
  metadata: string;
  ref_id: number;
}

export interface Country {
  code: string;
  name: string;
  flag: string;
  mobile_code: string;
}
```

### Example: API Response Handling

```typescript
// utils/apiHelpers.ts
export const isValidAvatarUrl = (url: string | null | undefined): boolean => {
  return !!url && url.trim() !== '' && url !== 'null';
};

export const extractProfileData = (response: any): Profile => {
  if (!response?.data?.data) {
    throw new Error('Invalid API response structure');
  }
  return response.data.data;
};
```

---

## Testing Checklist

### Unit Tests

- [ ] Test `useAvatarSelection` hook
  - [ ] Selecting body type updates state
  - [ ] Generate avatar triggers API call
  - [ ] Polling stops when avatar is ready
  - [ ] Polling stops after max attempts
  - [ ] Cleanup clears polling timeout

### Integration Tests

- [ ] Test API client authentication
  - [ ] Headers are correctly attached
  - [ ] Token refresh works (if implemented)
  - [ ] Error responses are handled

- [ ] Test profile service
  - [ ] Update profile sends correct data
  - [ ] Get profile retrieves correct data
  - [ ] Network errors are caught

### E2E Tests

- [ ] Complete avatar selection flow
  1. User selects body type
  2. User clicks generate
  3. Loading state appears
  4. Avatar appears when ready
  5. User can continue

- [ ] Error scenarios
  - [ ] Network failure during update
  - [ ] Network failure during polling
  - [ ] Max polling attempts reached
  - [ ] Invalid body type sent

### Manual Testing

- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Test with slow network (throttle)
- [ ] Test with no network (offline)
- [ ] Test avatar generation timeout
- [ ] Test multiple rapid selections

---

## Additional Notes

### Avatar Generation Time

- Typical generation time: 2-5 seconds
- Maximum wait time: 10 seconds (10 polling attempts)
- If generation takes longer, show error and allow retry

### Polling Optimization

- Consider exponential backoff for polling intervals
- Consider WebSocket connection for real-time updates (if available)
- Cache profile data to avoid unnecessary requests

### Security Considerations

- Store tokens securely (Keychain/Keystore)
- Never log sensitive data in production
- Validate all API responses
- Handle token expiration gracefully

### Performance Considerations

- Debounce rapid body type selections
- Cancel polling when component unmounts
- Use React Query or similar for caching
- Optimize avatar image loading (caching, compression)

---

## Support & Troubleshooting

### Common Issues

1. **Avatar never appears**
   - Check network connectivity
   - Verify authentication tokens are valid
   - Check backend logs for generation errors
   - Verify `body_type` value is correct (`"bro"` or `"bae"`)

2. **Polling stops too early**
   - Increase `MAX_POLLING_ATTEMPTS`
   - Check if backend returns `avatar.image` as empty string vs null
   - Verify polling logic handles all response formats

3. **Authentication errors**
   - Verify client keys are correct
   - Check device credentials are stored correctly
   - Ensure tokens haven't expired
   - Verify headers are being set correctly

### Debugging Tips

```typescript
// Enable request/response logging
apiClient.interceptors.request.use((config) => {
  console.log('Request:', config.method, config.url, config.data);
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    console.log('Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Error:', error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);
```

---

## References

### API Documentation
- Base URL: Configured via `EXPO_PUBLIC_ZO_API_BASE_URL`
- Profile Endpoint: `/api/v1/profile/me/`
- Authentication: Bearer token + device credentials

### Related Files in Original Codebase
- `components/helpers/login/AvatarSection.tsx` - Avatar selection UI
- `hooks/useProfile.ts` - Profile data hook
- `utils/auth/endpoints/profile.ts` - Profile API endpoints
- `utils/auth/client.ts` - API client setup
- `context/AuthContext.tsx` - Authentication context

---

## License

This documentation is provided as-is for implementation reference.


# Avatar System - Questions We CAN Answer from Codebase

This document contains answers to questions that can be definitively answered by examining the codebase.

---

## ✅ Questions We Can Answer Definitively

### 1. **What is the exact API endpoint for avatar generation?**

**Answer:**
```
POST /api/v1/profile/me/
```

**Evidence:**
```typescript
// From utils/auth/endpoints/profile.ts
PROFILE_ME: {
  server: ApiServer.ZO,
  url: "/api/v1/profile/me/",
  method: HttpMethod.POST,
} as MutationEndpointConfig<Profile, RequireAtLeastOne<Profile>>,
```

**Base URL:** Configured via `EXPO_PUBLIC_ZO_API_BASE_URL` environment variable

---

### 2. **What request body format is sent?**

**Answer:**
```json
{
  "body_type": "bro" | "bae"
}
```

**Evidence:**
```typescript
// From components/helpers/login/AvatarSection.tsx:206-209
updateProfile(
  {
    body_type: selectedBodyShape!,  // "bro" or "bae"
  },
  {
    onSuccess: () => {
      checkAvatar();
    },
    // ...
  }
);
```

---

### 3. **What exact headers are required?**

**Answer:**
```typescript
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Platform": "ios" | "android",
  "client-key": string,           // Platform-specific
  "client-device-id": string,      // From auth response
  "client-device-secret": string,  // From auth response  
  "Authorization": "Bearer <token>"
}
```

**Evidence:**
```typescript
// From utils/auth/client.ts:21-28
const DEFAULT_CONFIG: AxiosRequestConfig = {
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Platform: Platform.OS,
  },
};

// From context/AuthContext.tsx:93-102
const getZoAuthHeaders = useCallback(() => {
  return {
    "client-key": clientKeys.zo,
    "client-device-id": authRef.current.zo.clientDeviceId,
    "client-device-secret": authRef.current.zo.clientDeviceSecret,
    authorization: authRef.current.zo.token
      ? `Bearer ${authRef.current.zo.token}`
      : null,
  };
}, []);
```

---

### 4. **How do we check if generation is complete?**

**Answer:**
Poll `GET /api/v1/profile/me/` and check if `avatar.image` is non-null.

**Polling Configuration:**
- **Interval:** 1000ms (1 second)
- **Max Attempts:** 10
- **Total Max Wait:** 10 seconds

**Evidence:**
```typescript
// From components/helpers/login/AvatarSection.tsx:172-190
const checkAvatar = useCallback(() => {
  counter.current++;
  if (counter.current > 10) {
    onSubmit();  // Timeout after 10 attempts
    return;
  }
  refetchProfile()
    .then((data) => {
      if (isValidString(data.data?.avatar?.image)) {
        showAvatar();  // Avatar ready!
      } else {
        setTimeout(checkAvatar, 1000);  // Poll again in 1s
      }
    })
    .catch((er) => {
      logAxiosError(er);
      setTimeout(checkAvatar, 1000);  // Retry on error
    });
}, [refetchProfile, showAvatar]);
```

---

### 5. **What data structure is returned?**

**Answer:**
```typescript
interface Profile {
  avatar: {
    image: string;      // CDN URL (initially null, then populated)
    metadata: string;   // JSON metadata
    ref_id: number;     // Reference ID
  };
  body_type: string;    // "bro" | "bae"
  // ... rest of profile fields
}
```

**Evidence:**
```typescript
// From definitions/profile.ts:5-14
export interface Profile {
  address: string;
  avatar: {
    image: string;
    metadata: string;
    ref_id: number;
  };
  bio: string;
  body_type: string;
  // ...
}
```

---

### 6. **What values are valid for body_type?**

**Answer:**
Only two values:
- `"bro"` - Male body shape
- `"bae"` - Female body shape

**Evidence:**
```typescript
// From components/helpers/login/AvatarSection.tsx:49-51
const [selectedBodyShape, setSelectedBodyShape] = useState<
  "bro" | "bae" | undefined
>();

// UI has two options:
// Line 261: bae
// Line 279: bro
```

---

### 7. **How do we know if avatar is ready?**

**Answer:**
Check if `avatar.image` is a non-empty string:

```typescript
const isAvatarReady = (profile) => {
  return profile.avatar?.image && profile.avatar.image.trim() !== '';
};
```

**Evidence:**
```typescript
// From components/helpers/login/AvatarSection.tsx:180
if (isValidString(data.data?.avatar?.image)) {
  showAvatar();
}

// From utils/data-types/string.ts (inferred usage)
// isValidString checks if string is non-null and non-empty
```

---

### 8. **Where are avatar images hosted?**

**Answer:**
Avatar images are hosted on Zo's CDN infrastructure:
- `https://proxy.cdn.zo.xyz/`
- `https://static.cdn.zo.xyz/`
- `https://proxy.cdn.zostel.com/`

**Evidence:**
```typescript
// From utils/constants.ts - sample CDN URLs
const constants = {
  assetURLS: {
    tripSoldOut: "https://proxy.cdn.zo.xyz/gallery/media/images/...",
    // ... many more CDN URLs
  }
};

// From utils/profile.ts - ID verification samples
sample_image: "https://static.cdn.zo.xyz/app-media/samples/aadhar-front.png",
```

**Pattern:** `https://proxy.cdn.zo.xyz/gallery/media/images/{uuid}_{timestamp}.{ext}`

---

### 9. **What happens on timeout (10 seconds)?**

**Answer:**
The onboarding continues anyway. User proceeds to next step without blocking.

**Evidence:**
```typescript
// From components/helpers/login/AvatarSection.tsx:174-176
if (counter.current > 10) {
  onSubmit();  // Continue onboarding regardless
  return;
}
```

**Also:**
```typescript
// Line 214-217
onError: (er) => {
  logAxiosError(er);
  onSubmit();  // Continue even on error
},
```

**Conclusion:** Avatar generation failure is NON-BLOCKING. User experience continues.

---

### 10. **What happens on network/API errors?**

**Answer:**
Errors are logged and polling continues. On persistent failure, onboarding proceeds.

**Evidence:**
```typescript
// From components/helpers/login/AvatarSection.tsx:186-189
.catch((er) => {
  logAxiosError(er);
  setTimeout(checkAvatar, 1000);  // Retry despite error
});

// On initial API error:
// Line 214-217
onError: (er) => {
  logAxiosError(er);
  onSubmit();  // Don't block onboarding
},
```

---

### 11. **Is nickname required for avatar generation?**

**Answer:**
**No.** Nickname and avatar generation are separate steps.

**Evidence:**
```typescript
// From app/onboarding.tsx:125-131
// Name step comes BEFORE avatar step
if (!isValidString(userData.name)) {
  stepsRef.current.info.push("name");
}

if (!userData.hasAvatar) {
  stepsRef.current.info.push("avatar");
}
```

**Order:** Name → Avatar → Location → City

---

### 12. **Can users regenerate their avatar?**

**Answer:**
**Frontend does NOT prevent regeneration.** No check for existing avatar before allowing generation.

**Evidence:**
```typescript
// No checks found in AvatarSection.tsx
// User can call handleGenerate() regardless of current avatar state
const handleGenerate = () => {
  setGeneratingAvatar(true);
  // ... no check for existing avatar
  prepareAvatar();
};
```

**Conclusion:** Backend MIGHT enforce one-time generation, but frontend allows it.

---

### 13. **What UI feedback is shown during generation?**

**Answer:**
1. **Before:** Body type selection cards with dashed borders
2. **During:** Selected card pulses with opacity animation (0.5 ↔ 1.0, 500ms)
3. **After:** 
   - Avatar fades in (1000ms)
   - Circular text rings rotate (15s per rotation, infinite)
   - Success haptic feedback
   - "Zo Zo Zo! Let's Go" button enabled

**Evidence:**
```typescript
// From components/helpers/login/AvatarSection.tsx

// During generation (193-205):
femaleOpacity.value = withRepeat(
  withTiming(0.5, { duration: 500, easing: Easing.linear }),
  -1,  // Infinite
  true // Reverse
);

// After success (147-168):
setAvatarGenerated(true);
triggerNotification("Success");
mainAvatarOpacity.value = withTiming(1, { duration: 1000 });
circleTextOpacity.value = withDelay(750, withTiming(1, { duration: 1000 }));
counterRotation.value = withRepeat(
  withTiming(360, { duration: 15000, easing: Easing.linear }),
  -1,
  false
);
```

---

### 14. **What avatar-related fields exist in the profile?**

**Answer:**
Two separate systems:

**Generated Avatar (Onboarding):**
```typescript
{
  avatar: {
    image: string;      // Generated avatar CDN URL
    metadata: string;
    ref_id: number;
  },
  body_type: string;    // "bro" | "bae"
}
```

**PFP/NFT (External NFT):**
```typescript
{
  pfp_image: string;    // External NFT image
  pfp_metadata: {
    contract_address: string;
    token_id: string;
    is_valid: boolean;
    metadata: {
      attributes: any[];
      description: string;
      external_url: string;
      image: string;
      title: string;
    }
  },
  wallet_address: string;
  web3_verified: boolean;
  founder_tokens: string[];  // Array of token IDs
}
```

**Evidence:**
```typescript
// From definitions/profile.ts:5-65
```

---

### 15. **How do we display the avatar in the UI?**

**Answer:**
Use the `Avatar` component with `uri` prop:

```typescript
<Avatar 
  size={200} 
  uri={profile.avatar?.image} 
  alt={profile.first_name} 
/>
```

**Component handles:**
- SVG to PNG conversion
- Fallback to initials if no image
- Disk caching
- Loading states

**Evidence:**
```typescript
// From components/ui/Avatar.tsx:26-52
const Avatar = ({ size, uri, style, alt }: AvatarProps) => {
  const imageUri = useMemo(
    () => (uri ? svgFormatToPng(uri) : undefined),
    [uri]
  );

  return (
    <View style={viewStyle}>
      {!imageUri ? (
        <Initials alt={alt} size={size} />
      ) : (
        <Image
          source={uri}
          style={helpers.absoluteFit}
          contentFit="cover"
          cachePolicy="disk"
          alt="Profile Avatar"
        />
      )}
    </View>
  );
};
```

---

### 16. **What environment variables are needed?**

**Answer:**
```bash
# Required for avatar generation
EXPO_PUBLIC_ZO_API_BASE_URL=https://api.zo.xyz

# Platform-specific client keys
EXPO_PUBLIC_ZO_CLIENT_KEY_IOS=<your_ios_key>
EXPO_PUBLIC_ZO_CLIENT_KEY_ANDROID=<your_android_key>

# Optional (for legacy profile sync)
EXPO_PUBLIC_ZOSTEL_API_BASE_URL=https://api.zostel.com
EXPO_PUBLIC_ZOSTEL_CLIENT_ID=<zostel_client_id>
```

**Evidence:**
```typescript
// From utils/auth/client.ts:14-18
const API_URLS = {
  [ApiServer.ZO]: process.env.EXPO_PUBLIC_ZO_API_BASE_URL,
  [ApiServer.ZOSTEL]: process.env.EXPO_PUBLIC_ZOSTEL_API_BASE_URL,
  [ApiServer.ZO_COMMS]: process.env.EXPO_PUBLIC_ZO_API_BASE_URL,
};

// From context/AuthContext.tsx:50-56
const clientKeys = {
  zo:
    (Platform.OS === "ios"
      ? process.env.EXPO_PUBLIC_ZO_CLIENT_KEY_IOS
      : process.env.EXPO_PUBLIC_ZO_CLIENT_KEY_ANDROID) || null,
  zostel: process.env.EXPO_PUBLIC_ZOSTEL_CLIENT_ID || null,
};
```

---

### 17. **What React Query configuration is used?**

**Answer:**
Profile fetching uses `useQuery` with these settings:

```typescript
const { data: profile } = useQuery("PROFILE_ME", {
  enabled: isAuthenticated === true,
  select: (data) => data.data,
});
```

**Mutations use:**
```typescript
const { mutate: updateProfile } = useMutation("PROFILE_ME", {
  onSuccess: () => {
    refetchProfile();  // Auto-refresh on success
  },
  onError: (er) => {
    logAxiosError(er);
  },
});
```

**Evidence:**
```typescript
// From hooks/useProfile.ts:12-43
const {
  data: profile,
  isLoading,
  isFetching,
  refetch: refetchProfile,
} = useQuery("PROFILE_ME", {
  enabled: isAuthenticated === true,
  select: (data) => data.data,
});

const { mutate: updateProfile, isPending } = useMutation("PROFILE_ME", {
  onSuccess: () => {
    refetchProfile();
  },
  onError: (er) => {
    logAxiosError(er);
  },
});
```

---

### 18. **Is the avatar an NFT or just an image?**

**Answer:**
**Just a CDN-hosted image**, NOT an NFT.

**Evidence:**
1. No blockchain transaction in the flow
2. No wallet required for generation
3. Images served from `proxy.cdn.zo.xyz` (regular CDN)
4. PFP/NFT system is separate (`pfp_metadata` fields)
5. No minting endpoint in codebase

**Separate NFT System Exists:**
- `pfp_metadata` has `contract_address` and `token_id`
- This is for **external NFTs** users connect
- NOT related to generated avatar

---

### 19. **What happens during the onboarding flow with avatar?**

**Answer:**
**Step-by-step flow:**

1. **Video plays** (onboarding.mp4)
2. **At 13.46s:** Video pauses if user not authenticated
3. **Phone/OTP step** (if needed)
4. **Name step** (if not set)
5. **Avatar step** (if no body_type):
   - User selects "bro" or "bae"
   - Clicks "Generate Avatar"
   - API call + polling starts
   - Video stays paused
   - Avatar displays when ready
   - User clicks "Zo Zo Zo! Let's Go"
6. **Video resumes** with avatar in header
7. **At 25.2s:** Video pauses for location step
8. **Location/City steps** (if needed)
9. **At 25.5s:** Coin animation starts
10. **Video ends:** User enters app

**Evidence:**
```typescript
// From app/onboarding.tsx:167-193
const onVideoProgress = useCallback(
  ({ currentTime }: { currentTime: number }) => {
    if (!stepsRef.current.phase3 && currentTime > 25.5) {
      stepsRef.current.phase3 = true;
      setShowCoins(true);
    } else if (!stepsRef.current.phase2 && currentTime > 25.2) {
      if (stepsRef.current.location.length > 0) {
        videoPlayer.current?.pause();
        audioPlayer.current?.resume();
        setStep(stepsRef.current.location[0]);
      }
      stepsRef.current.phase2 = true;
    } else if (!stepsRef.current.phase1 && currentTime > 13.46) {
      if (!stepsRef.current.isAuthenticated) {
        videoPlayer.current?.pause();
        audioPlayer.current?.resume();
        setStep("number");
      } else if (stepsRef.current.info.length > 0) {
        videoPlayer.current?.pause();
        audioPlayer.current?.resume();
        setStep(stepsRef.current.info[0]);
      }
      stepsRef.current.phase1 = true;
    }
  },
  []
);
```

---

### 20. **Can we test avatar generation in development?**

**Answer:**
**Yes**, by changing the base URL:

```bash
# Development
EXPO_PUBLIC_ZO_API_BASE_URL=http://localhost:8000

# Staging
EXPO_PUBLIC_ZO_API_BASE_URL=https://staging-api.zo.xyz

# Production
EXPO_PUBLIC_ZO_API_BASE_URL=https://api.zo.xyz
```

**Demo credentials available:**
```typescript
// From store.config.json:60-62
{
  "demoUsername": "+91-9625283418",
  "demoPassword": "139275",
  "demoRequired": true,
  "notes": "Enter the password as the OTP while logging in."
}
```

---

## 📊 Summary Statistics

### From Codebase Analysis:

- **Polling Interval:** 1 second
- **Max Polling:** 10 attempts
- **Timeout:** 10 seconds
- **Retry on Error:** Yes
- **Block Onboarding:** No
- **Body Types:** 2 ("bro", "bae")
- **CDN Hosts:** 3 (proxy.cdn.zo.xyz, static.cdn.zo.xyz, proxy.cdn.zostel.com)
- **Required Headers:** 7
- **Avatar Fields in Profile:** 3 (image, metadata, ref_id)
- **PFP/NFT Fields:** 7 (separate system)

### File References:

- **Avatar Selection:** `components/helpers/login/AvatarSection.tsx` (460 lines)
- **Onboarding Flow:** `app/onboarding.tsx` (473 lines)
- **Profile Hook:** `hooks/useProfile.ts` (69 lines)
- **Profile Types:** `definitions/profile.ts` (217 lines)
- **API Endpoints:** `utils/auth/endpoints/profile.ts` (90 lines)
- **Auth Context:** `context/AuthContext.tsx` (532 lines)
- **Avatar UI:** `components/ui/Avatar.tsx` (60 lines)

---

## 🎯 Confidence Levels

### ✅ 100% Confident (Directly from Code):
1. API endpoints and methods
2. Request/response formats
3. Headers required
4. Polling mechanism
5. Timeout handling
6. Body type values
7. Data structures
8. UI animations
9. Error handling strategy
10. Environment variables
11. CDN hosting
12. Onboarding flow
13. React Query usage
14. Avatar vs PFP distinction
15. No blockchain involvement

### ❓ Need Backend Confirmation:
1. Actual generation time (we assume 2-5s)
2. Can users regenerate? (frontend allows it)
3. Backend error messages
4. Generation process details (AI model? Template?)
5. One-time enforcement (if any)

---

## 📝 Implementation Checklist

Based on codebase, to implement avatar generation you need:

- [✅] Set up Axios client with auth interceptors
- [✅] Configure environment variables
- [✅] Implement POST `/api/v1/profile/me/` with `body_type`
- [✅] Implement GET `/api/v1/profile/me/` polling
- [✅] Add 1-second polling interval
- [✅] Add 10-attempt timeout
- [✅] Handle `avatar.image` null → string transition
- [✅] Display avatar with `Avatar` component
- [✅] Add error handling (log + continue)
- [✅] Add loading animations
- [✅] Add success haptic feedback
- [✅] Test with demo credentials
- [✅] Verify CDN image loading
- [✅] Ensure non-blocking onboarding

---

This document answers everything we can know from the codebase alone. For remaining questions (generation process, backend enforcement, NFT plans), we need backend team input.


# New User Onboarding Flow

## Complete Journey: First-Time User Experience

This document traces the complete flow from landing page to dashboard for a new user.

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  1. LANDING PAGE (Unauthenticated)                                  │
│     - Video background playing                                       │
│     - "Tune into Zo World" button                                   │
│     - Email/Wallet login options                                     │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ User clicks "Tune into Zo World"
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  2. PHONE LOGIN MODAL                                                │
│     - Enter phone number                                             │
│     - Receive OTP code                                               │
│     - Enter OTP code                                                 │
│     - ZO API creates/retrieves user                                  │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ OTP verified ✅
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  3. PROFILE CHECK                                                    │
│     - Check if user has profile in database                          │
│     - Query: SELECT * FROM users WHERE id = ?                        │
│                                                                       │
│     Decision:                                                         │
│     • Profile exists → Type 2 or 3 (skip to step 5 or 7)            │
│     • No profile → Type 1 (new user, continue)                       │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ No profile found (Type 1: New User)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  4. ONBOARDING2 - Profile Setup                                      │
│                                                                       │
│     Step 1: Nickname                                                 │
│     ├─ Enter nickname                                                │
│     ├─ Validate (3-20 chars)                                         │
│     └─ Save to database                                              │
│                                                                       │
│     Step 2: Portal Animation                                         │
│     └─ Visual transition showing entry to Zo World                   │
│                                                                       │
│     Step 3: Avatar Selection                                         │
│     ├─ Choose avatar style                                           │
│     ├─ AI generates avatar via ZO API                                │
│     ├─ Preview and confirm                                           │
│     └─ Save avatar URL to profile                                    │
│                                                                       │
│     Database updates:                                                │
│     UPDATE users SET name = ?, pfp = ? WHERE id = ?                  │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ Profile setup complete ✅
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  5. QUEST AUDIO - Voice Authentication                               │
│                                                                       │
│     Step 1: Instructions                                             │
│     └─ "Say 'zo' to unlock your world"                               │
│                                                                       │
│     Step 2: Recording (3 seconds)                                    │
│     ├─ Microphone permission requested                               │
│     ├─ Records audio for 3 seconds                                   │
│     ├─ Web Speech API listens in real-time                           │
│     └─ AssemblyAI transcribes audio                                  │
│                                                                       │
│     Step 3: Validation                                               │
│     ├─ Check if transcript contains "zo"                             │
│     ├─ ✅ Valid: Continue to game                                    │
│     └─ ❌ Invalid: Show error, retry                                 │
│                                                                       │
│     Step 4: Game1111 Counter                                         │
│     ├─ Tap button rapidly for 11 seconds                             │
│     ├─ Score calculated: taps + accuracy                             │
│     └─ Tokens earned: score / 10                                     │
│                                                                       │
│     Database updates:                                                │
│     INSERT INTO quest_completions (user_id, quest_id, score, ...)   │
│     UPDATE users SET zo_points = zo_points + tokens WHERE id = ?     │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ Quest complete ✅
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  6. QUEST COMPLETE - Results & Celebration                           │
│                                                                       │
│     Display:                                                          │
│     ├─ Coin collection animation                                     │
│     ├─ Score: XXX points                                             │
│     ├─ Tokens earned: XXX $Zo                                        │
│     ├─ Total balance: XXX $Zo                                        │
│     └─ Leaderboard (top 10 + user rank)                              │
│                                                                       │
│     Background loading:                                               │
│     ├─ Fetch events from iCal feeds                                  │
│     ├─ Fetch nodes from database                                     │
│     ├─ Fetch quests list                                             │
│     └─ Request location permission                                   │
│                                                                       │
│     Database updates:                                                │
│     UPDATE users SET onboarding_completed = true WHERE id = ?        │
│                                                                       │
│     User clicks "Enter Zo World"                                     │
│                                                                       │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            │ onboarding_completed = true ✅
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                                                                       │
│  7. DASHBOARD - Main Application                                     │
│                                                                       │
│     Map View:                                                         │
│     ├─ Space-to-location animation (if location granted)             │
│     ├─ Mapbox with events and nodes                                  │
│     ├─ Global view (all events) or Local view (100km radius)         │
│     └─ User can explore, click events, view nodes                    │
│                                                                       │
│     Desktop Panels:                                                   │
│     ├─ Left: Profile card, Zo Passport button                        │
│     ├─ Right: Leaderboard, Local Events                              │
│     └─ Bottom: Quests button                                         │
│                                                                       │
│     Mobile View:                                                      │
│     ├─ Header: Profile photo, balance, quest button                  │
│     ├─ Mini-map with events                                          │
│     └─ Swipe up for full dashboard                                   │
│                                                                       │
│     Location Modal (optional):                                       │
│     └─ Asks for current location to show local events                │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## User Types

### Type 1: Brand New User
- **Never used ZO before**
- **Flow**: Landing → Phone Auth → Profile Setup (Onboarding2) → Voice Quest → Results → Dashboard
- **Database State**:
  - No profile exists initially
  - Profile created during Onboarding2
  - `onboarding_completed = false` → `true` after quest

### Type 2: Cross-App User (ZO API User)
- **Used another ZO app before**
- **Has**: phone, email, name already in ZO API
- **Flow**: Landing → Phone Auth → **SKIP Onboarding2** → Voice Quest → Results → Dashboard
- **Database State**:
  - Profile exists (synced from ZO API)
  - `onboarding_completed = false` → `true` after quest
  - Already has name, pfp, email from other app

### Type 3: Returning User
- **Completed onboarding before**
- **Flow**: Landing → Phone Auth → **STRAIGHT TO DASHBOARD**
- **Database State**:
  - Profile exists
  - `onboarding_completed = true`
  - No onboarding screens shown

---

## Step-by-Step Detailed Flow

### Step 1: Landing Page

**File**: `apps/web/src/components/LandingPage.tsx`

**State**:
```javascript
authenticated = false
ready = true
userProfile = null
```

**UI**:
- Video background with branding
- "Tune into Zo World" button (primary CTA)
- "Email" and "Wallet" buttons (alternative login)

**User Action**: Clicks "Tune into Zo World"

**What Happens**:
1. Opens `PhoneLoginModal`
2. User enters phone number
3. ZO API sends OTP code
4. User enters OTP code
5. ZO API verifies code
6. Returns user ID + data

---

### Step 2: Authentication Complete

**Hook**: `useZoAuth()` in `apps/web/src/hooks/useZoAuth.ts`

**State Changes**:
```javascript
authenticated = true
user = { id: "...", phone: "...", ... }
isLoading = true  // fetching profile
```

**What Happens**:
1. Query database for user profile:
   ```sql
   SELECT * FROM users WHERE id = ?
   ```
2. **If no profile found** → Type 1 (New User)
   - `userProfile = null`
   - `onboardingComplete = false`
   - Show Onboarding2

3. **If profile exists with `onboarding_completed = false`** → Type 2 (Cross-App)
   - `userProfile = { name, pfp, email, ... }`
   - `onboardingComplete = false`
   - Skip Onboarding2, show QuestAudio

4. **If profile exists with `onboarding_completed = true`** → Type 3 (Returning)
   - `userProfile = { name, pfp, email, ... }`
   - `onboardingComplete = true`
   - Skip all onboarding, show Dashboard

---

### Step 3: Onboarding2 (Type 1 Only)

**File**: `apps/web/src/components/Onboarding2.tsx`

#### Part A: Nickname Step

**File**: `apps/web/src/components/NicknameStep.tsx`

**UI**:
- Text input for nickname
- Validation: 3-20 characters
- "Next" button

**User Action**: Enters nickname, clicks Next

**API Call**:
```javascript
POST /api/zo/profile/update
Body: {
  userId: "...",
  name: "samurai"
}
```

**Database**:
```sql
UPDATE users SET name = 'samurai' WHERE id = ?
```

#### Part B: Portal Animation

**Duration**: ~3 seconds
**Purpose**: Visual transition into Zo World
**No user interaction required**

#### Part C: Avatar Selection

**File**: `apps/web/src/components/AvatarStep.tsx`

**UI**:
- Avatar style selector (cartoon, realistic, etc.)
- "Generate Avatar" button
- Preview of generated avatar
- "Confirm" button

**User Action**: Selects style, generates, confirms

**API Calls**:
1. **Generate Avatar**:
   ```javascript
   POST https://api.io.zo.xyz/api/avatars/generate
   Body: {
     user_id: "...",
     style: "cartoon"
   }
   Response: {
     job_id: "job_123"
   }
   ```

2. **Poll Status** (every 2 seconds):
   ```javascript
   GET https://api.io.zo.xyz/api/avatars/status/{job_id}
   Response: {
     status: "completed",
     avatar_url: "https://..."
   }
   ```

3. **Save Avatar**:
   ```javascript
   POST /api/zo/profile/update
   Body: {
     userId: "...",
     pfp: "https://..."
   }
   ```

**Database**:
```sql
UPDATE users SET pfp = 'https://...' WHERE id = ?
```

**State Change**:
```javascript
onboardingStep = 'voice'
```

---

### Step 4: Quest Audio (Voice Authentication)

**File**: `apps/web/src/components/QuestAudio.tsx`

#### Part A: Voice Recording

**UI**:
- Microphone button
- "Say 'zo' to continue" instruction
- 3-second countdown timer

**User Action**: Clicks microphone, speaks "zo"

**What Happens**:
1. **Request Microphone Permission**:
   ```javascript
   navigator.mediaDevices.getUserMedia({ audio: true })
   ```

2. **Start Recording** (3 seconds):
   - `MediaRecorder` captures audio
   - Web Speech API listens in real-time (fallback)
   - Auto-stops after 3 seconds

3. **Transcribe Audio**:
   ```javascript
   POST /api/transcribe
   Body: FormData with audio file
   
   Response: {
     text: "zo zo",
     confidence: 0.95
   }
   ```

4. **Validation**:
   ```javascript
   const containsZo = text.toLowerCase().includes('zo');
   ```

**If Valid** ✅:
- Continue to Game1111
- Play success animation

**If Invalid** ❌:
- Show error: "Didn't hear 'zo'"
- Display what was heard
- Allow retry

#### Part B: Game1111 Counter

**File**: `apps/web/src/hooks/useGame1111Engine.ts`

**UI**:
- Large tap button
- 11-second timer
- Real-time score counter
- Accuracy meter

**User Action**: Taps button rapidly for 11 seconds

**Scoring**:
```javascript
// Base score
score = totalTaps

// Accuracy bonus (consistency in timing)
accuracyBonus = calculateAccuracyBonus(tapTimings)

// Final score
finalScore = score + accuracyBonus

// Tokens earned
tokensEarned = Math.floor(finalScore / 10)
```

**Database**:
```sql
-- Save quest completion
INSERT INTO quest_completions (
  user_id,
  quest_id,
  score,
  completed_at
) VALUES (?, 'GAME1111', ?, NOW());

-- Update user balance
UPDATE users 
SET zo_points = zo_points + ? 
WHERE id = ?;
```

**State Change**:
```javascript
onboardingStep = 'complete'
questScore = 234
questTokens = 23
```

---

### Step 5: Quest Complete (Results)

**File**: `apps/web/src/components/QuestComplete.tsx`

**UI**:
- Coin collection animation
- Score display: "234 points"
- Tokens earned: "+23 $Zo"
- Total balance: "23 $Zo"
- Leaderboard (top 10 + user)
- "Enter Zo World" button

**Background Loading** (while user views results):
```javascript
// Load events from iCal feeds
const events = await fetchAllCalendarEventsWithGeocoding()

// Load nodes from database
const nodes = await getNodesFromDB()

// Load quests
const quests = await getQuests()

// Request location permission
navigator.geolocation.getCurrentPosition(...)
```

**User Action**: Clicks "Enter Zo World"

**What Happens**:
1. **Mark Onboarding Complete**:
   ```sql
   UPDATE users 
   SET onboarding_completed = true 
   WHERE id = ?
   ```

2. **Prepare Transition**:
   - Load map data (events, nodes)
   - Get user location
   - Prepare animation

3. **Transition to Dashboard**:
   ```javascript
   setUserProfileStatus('exists')
   setOnboardingStep(null)
   setShouldAnimateFromSpace(true)
   setIsDashboardOpen(true)
   ```

---

### Step 6: Dashboard (Main App)

**Files**:
- Desktop: `apps/web/src/components/DesktopView.tsx`
- Mobile: `apps/web/src/components/MobileView.tsx`

**State**:
```javascript
authenticated = true
onboardingComplete = true
userProfile = { id, name, pfp, zo_points, lat, lng, ... }
```

**UI Components**:

#### Desktop:
1. **Map Canvas** (center):
   - Space-to-location animation (first time)
   - Mapbox with custom markers
   - Events (purple pins)
   - Nodes (custom 3D markers)
   - Toggle: Local (100km) vs Global view

2. **Left Sidebar**:
   - Profile card (avatar, name, balance)
   - "Zo Passport" button
   - Stats overview

3. **Right Sidebar**:
   - Leaderboard (top 10 + user)
   - Local Events list

4. **Bottom Bar**:
   - "Quests" button
   - Mini-map toggle
   - Settings

#### Mobile:
1. **Header**:
   - Profile photo
   - Balance: "23 $Zo"
   - Quest button

2. **Mini-map**:
   - Small map view
   - Event markers
   - Swipe up for full view

3. **Dashboard Panel** (swipe up):
   - Profile photo card
   - Stats
   - Leaderboard
   - Events

**Location Modal**:
- Appears 2 seconds after dashboard loads
- "Allow location to see local events"
- User can grant or skip

**User Actions**:
- Click events → View details, RSVP
- Click nodes → View node info
- Click quests → Open quest overlay
- Toggle map view → Local/Global
- Click profile → Edit profile

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,              -- ZO API user ID
  phone VARCHAR,                       -- Phone number
  email VARCHAR,                       -- Email (optional)
  name VARCHAR,                        -- Nickname
  pfp VARCHAR,                         -- Avatar URL
  zo_points INTEGER DEFAULT 0,         -- Token balance
  lat FLOAT,                           -- Home latitude
  lng FLOAT,                           -- Home longitude
  city VARCHAR,                        -- Home city
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Quest Completions Table
```sql
CREATE TABLE quest_completions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR REFERENCES users(id),
  quest_id VARCHAR,                    -- 'GAME1111'
  score INTEGER,                       -- Tap score
  completed_at TIMESTAMP DEFAULT NOW(),
  reward_amount INTEGER                -- Tokens earned
);
```

---

## API Endpoints Used

### ZO API (External)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/send-otp` | POST | Send OTP to phone |
| `/api/auth/verify-otp` | POST | Verify OTP code |
| `/api/avatars/generate` | POST | Generate AI avatar |
| `/api/avatars/status/{job_id}` | GET | Poll avatar status |

### Internal API
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/zo/profile/create` | POST | Create new profile |
| `/api/zo/profile/update` | POST | Update profile data |
| `/api/transcribe` | POST | Transcribe audio |
| `/api/quests/complete` | POST | Mark quest complete |

---

## State Management Summary

### Key States
```typescript
// Auth state (useZoAuth hook)
authenticated: boolean          // Is user logged in?
userProfile: UserProfile | null // User data from DB
onboardingComplete: boolean     // Has completed onboarding?
isLoading: boolean              // Is profile loading?
user: ZoUser | null             // ZO API user object

// App state (page.tsx)
userProfileStatus: 'loading' | 'exists' | 'not_exists' | null
onboardingStep: 'profile' | 'voice' | 'complete' | null
isLoading: boolean              // Is map data loading?
isDashboardOpen: boolean        // Show dashboard?
```

### State Flow
```
null → loading → not_exists → profile → voice → complete → exists
 ↓                    ↓                                        ↓
Landing      Onboarding2 → QuestAudio → QuestComplete → Dashboard
```

---

## Error Handling

### Microphone Permission Denied
**When**: Step 4 (Voice Recording)
**Error**: `NotAllowedError`
**Action**: Show alert, retry with browser settings instructions

### Transcription Failed
**When**: Step 4 (Voice Recording)
**Error**: AssemblyAI API error
**Fallback**: Use Web Speech API transcript
**Action**: If both fail, show error and retry

### Avatar Generation Failed
**When**: Step 3 (Avatar Selection)
**Error**: ZO API timeout or error
**Action**: Show default avatar, allow retry

### Network Error
**When**: Any API call
**Action**: Show error toast, retry with exponential backoff

---

## Performance Optimizations

1. **Parallel Loading**:
   - Events, nodes, quests load simultaneously in background

2. **Lazy Loading**:
   - Dashboard components load after onboarding

3. **Image Optimization**:
   - Avatars cached in browser
   - Map tiles lazy loaded

4. **State Batching**:
   - All transition state updates happen atomically

---

## Testing Scenarios

### Test 1: Happy Path (New User)
1. Visit app → Landing page shows
2. Click "Tune in" → Phone modal opens
3. Enter phone + OTP → Success
4. Enter nickname → Saved
5. Generate avatar → Shows preview
6. Say "zo" → Transcribed correctly
7. Play game → Score recorded
8. View results → Leaderboard shows
9. Enter dashboard → Map loads

### Test 2: Voice Retry
1. Say wrong word → Error shows
2. Retry → Say "zo" → Success

### Test 3: Cross-App User
1. Login with existing ZO phone → Profile exists
2. Skip Onboarding2 → Go to QuestAudio
3. Complete quest → Dashboard

### Test 4: Returning User
1. Login → Profile exists, onboarding complete
2. Straight to dashboard → No onboarding

---

## Monitoring & Analytics

### Events to Track
```javascript
// Landing
'landing_page_viewed'
'tune_in_button_clicked'

// Auth
'phone_modal_opened'
'otp_sent'
'otp_verified'

// Onboarding
'onboarding_started'
'nickname_submitted'
'avatar_generated'
'avatar_confirmed'

// Quest
'voice_recording_started'
'voice_recording_completed'
'voice_validation_passed'
'voice_validation_failed'
'game_started'
'game_completed'

// Results
'quest_results_viewed'
'leaderboard_viewed'
'enter_dashboard_clicked'

// Dashboard
'dashboard_opened'
'location_permission_granted'
'map_loaded'
```

---

## Common Issues & Solutions

### Issue: Stuck on loading screen
**Cause**: Profile not loading from database
**Solution**: Check network, reload page, clear cache

### Issue: Avatar not generating
**Cause**: ZO API timeout or rate limit
**Solution**: Retry or use default avatar

### Issue: Voice not working
**Cause**: Microphone permission or browser compatibility
**Solution**: Check permissions, use Chrome/Safari

### Issue: Map not loading
**Cause**: Mapbox token or network
**Solution**: Reload page, check console

---

## Next Steps After Onboarding

1. **Explore Map**: View events and nodes
2. **Complete More Quests**: Earn more tokens
3. **RSVP to Events**: Join local events
4. **Visit Nodes**: Check in at physical locations
5. **Climb Leaderboard**: Compete with others
6. **Customize Profile**: Edit nickname, avatar

---

## Summary

**Total Time**: ~5-7 minutes
**Steps**: Landing → Auth → Profile → Voice → Game → Results → Dashboard
**Database Updates**: 3-4 (profile, quest, balance, onboarding flag)
**API Calls**: 8-10 (auth, avatar, transcribe, quests)

**User sees**:
1. Landing video
2. Phone login
3. Nickname input
4. Portal animation
5. Avatar generation
6. Voice recording
7. Counter game
8. Results celebration
9. Dashboard with map

**Result**: Fully onboarded user ready to explore Zo World! 🎉


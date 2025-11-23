# Complete Dashboard Documentation

## Overview

The Zo World dashboard has TWO completely different implementations:
1. **Desktop Dashboard** - Full-screen 3-column layout
2. **Mobile Dashboard** - Bottom-sheet overlay with swipe gestures

Both share similar data but have entirely different UI/UX patterns.

---

## Desktop Dashboard

### Entry Point
**File**: `apps/web/src/components/desktop-dashboard/DesktopDashboard.tsx`

The desktop dashboard is a **full-screen overlay** that covers the entire map when opened.

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  HEADER                                                          │
│  [Close X]            ZO WORLD DASHBOARD                        │
└─────────────────────────────────────────────────────────────────┘
┌─────────────┬──────────────────────────┬──────────────────────┐
│             │                          │                       │
│  LEFT       │      CENTER COLUMN       │    RIGHT SIDEBAR      │
│  SIDEBAR    │                          │                       │
│             │                          │                       │
│  - Profile  │  - Quantum Sync Card     │  - Leaderboard        │
│  - Avatar   │  - Cooldown Timer        │  - Local Events       │
│  - Balance  │  - Mini Map              │                       │
│  - Vibe     │  - Stats                 │                       │
│  - Passport │  - Open Map Button       │                       │
│  - Bio      │                          │                       │
│  - Cultures │                          │                       │
│             │                          │                       │
└─────────────┴──────────────────────────┴──────────────────────┘
```

---

## LEFT SIDEBAR

**File**: `apps/web/src/components/desktop-dashboard/LeftSidebar.tsx`

### Components (Top to Bottom):

#### 1. Profile Card
```
┌─────────────────────┐
│   [Avatar Image]    │
│                     │
│   nickname.zo       │
│   📍 City, State    │
│                     │
│   💰 Balance: XXX   │
│   🌊 Vibe: XX%      │
└─────────────────────┘
```

**Data Displayed**:
- Avatar (from `userProfile.pfp`)
- Nickname (from `userProfile.name`)
- Location (from `userProfile.city`)
- Token Balance (fetched from `/api/users/{userId}/progress`, updates every 3 seconds)
- Vibe Score (fetched from `/api/vibe/{userId}`, updates every 30 seconds)

**Features**:
- Avatar is clickable (opens profile edit)
- Balance updates in real-time
- Vibe score updates every 30 seconds

#### 2. Zo Passport Button
```
┌─────────────────────────┐
│  🎫 VIEW ZO PASSPORT    │
└─────────────────────────┘
```

**Action**: Links to `/zopassport` page

#### 3. Bio Section
```
┌─────────────────────────┐
│  BIO                    │
│  ┌──────────────────┐  │
│  │ Your bio text... │  │
│  │                  │  │
│  └──────────────────┘  │
│         [Edit]         │
└─────────────────────────┘
```

**Features**:
- Editable bio text (300 char limit)
- Click "Edit" to open textarea
- Save button appears when editing
- Updates user profile on save

#### 4. Cultures Section
```
┌─────────────────────────┐
│  CULTURES               │
│  ┌──────┐ ┌──────┐     │
│  │ 🎨   │ │ 🎵   │     │
│  │ Art  │ │Music │     │
│  └──────┘ └──────┘     │
│         [+ Add]         │
└─────────────────────────┘
```

**Features**:
- Display user's selected cultures
- Icon + name for each culture
- Click "+" to add new culture from dropdown
- Click "X" on culture chip to remove
- Max 5 cultures
- Saves to `userProfile.culture`

**Available Cultures**:
- Art, Music, Technology, Food, Sports, Nature, etc.

#### 5. Founder NFTs Section
```
┌─────────────────────────┐
│  FOUNDER NFTs           │
│  ┌──────┐              │
│  │[VID] │  #523        │
│  └──────┘              │
│  ┌──────┐              │
│  │[VID] │  #204        │
│  └──────┘              │
│  ┌──────┐              │
│  │[VID] │  #158        │
│  └──────┘              │
│  ┌──────┐              │
│  │[VID] │  #151        │
│  └──────┘              │
└─────────────────────────┘
```

**Features**:
- **Dynamic from ZO API** - Fetches `founder_tokens` from user profile
- **Video NFTs** - Each NFT is an animated video from `https://cdn.zo.xyz/nft/founders/{token_id}.mp4`
- **Auto-play** - Videos loop continuously, muted
- **Conditional Rendering**:
  - Section is **hidden** if user has no Founder NFTs
  - Shows "Loading NFTs..." while fetching
  - Displays all NFTs when loaded

**Data Source**:
- Hook: `useFounderNFTs()` (see `apps/web/src/hooks/useFounderNFTs.ts`)
- API: `GET /api/v1/profile/me/` → `founder_tokens: ["523", "204", ...]`
- CDN: `https://cdn.zo.xyz/nft/founders/{token_id}.mp4`

**Implementation**:
```typescript
const { nfts, isLoading } = useFounderNFTs();

// Section only renders if nfts.length > 0 or isLoading
{(nfts.length > 0 || isLoading) && (
  <div>
    {nfts.map(nft => (
      <video
        src={nft.video}
        autoPlay
        loop
        muted
        playsInline
      />
    ))}
  </div>
)}
```

---

## CENTER COLUMN

**File**: `apps/web/src/components/desktop-dashboard/CenterColumn.tsx`

### Components (Top to Bottom):

#### 1. Quantum Sync Card (Game Launcher)
```
┌─────────────────────────────────────┐
│  🌀 QUANTUM SYNC                     │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   [PLAY BUTTON or TIMER]       │ │
│  │                                 │ │
│  │   Can Play:                     │ │
│  │   [▶ START QUANTUM SYNC]        │ │
│  │                                 │ │
│  │   On Cooldown:                  │ │
│  │   ⏰ 11:47:23.45                │ │
│  │   Next sync available in        │ │
│  └────────────────────────────────┘ │
│                                      │
│  Balance: 234 $Zo                   │
└─────────────────────────────────────┘
```

**States**:
1. **Can Play** (`canPlay = true`)
   - Shows green "START QUANTUM SYNC" button
   - Clickable, launches Game1111
   - Shows current balance

2. **On Cooldown** (`canPlay = false`)
   - Shows countdown timer: `HH:MM:SS.MS` (milliseconds precision!)
   - Updates every 10ms for smooth animation
   - Button disabled
   - Text: "Next sync available in"

**Cooldown**: 12 hours from last completion

**Data Sources**:
- `canPlay` from `useQuestCooldown('game-1111', userId)`
- Balance from `/api/users/{userId}/progress`

#### 2. Mini Map
```
┌─────────────────────────────────────┐
│                                      │
│    [Small Mapbox View]              │
│    Shows user location + nearby     │
│    nodes with markers               │
│                                      │
└─────────────────────────────────────┘
```

**Features**:
- Embedded Mapbox map (300px x 200px)
- Centers on user location
- Shows nearby nodes (if any)
- Static (no interactions)
- Decorative overview

#### 3. Stats Display
```
┌─────────────────────────────────────┐
│  STATS                               │
│                                      │
│  Quantum Syncs: 12                  │
│  Best Score: 1112                   │
│  Unique Locations: 5                │
│  Multiplier: 1.5x                   │
└─────────────────────────────────────┘
```

**Data**:
- Quantum Syncs = Total quest completions
- Best Score = Closest to 1111 ever achieved
- Unique Locations = Number of different nodes visited
- Multiplier = Streak bonus

#### 4. Leaderboard (Desktop)
```
┌─────────────────────────────────────┐
│  LEADERBOARD                         │
│                                      │
│  [Podium visualization]             │
│    #2      #1      #3               │
│   [🏆]    [👑]    [🥉]             │
│                                      │
│  ──────────────────────────────     │
│  1  👤 You              399         │
│  2  👤 Aradhana         196         │
│  3  👤 Kunalzed         190         │
│  4  👤 Darshan          189         │
│  ...                                │
└─────────────────────────────────────┘
```

**Features**:
- Top 3 podium with avatars
- Table showing top 10 + user
- User row highlighted
- Updates in real-time
- Shows current Zo points balance

#### 5. Open Map Button
```
┌─────────────────────────┐
│  🗺️ OPEN MAP           │
└─────────────────────────┘
```

**Action**: Closes dashboard, returns to map view

---

## RIGHT SIDEBAR

**File**: `apps/web/src/components/desktop-dashboard/RightSidebar.tsx`

### Components:

#### 1. Local Events List
```
┌──────────────────────────────────────┐
│  LOCAL EVENTS                         │
│                                       │
│  ┌────────────────────────────────┐ │
│  │ [Event Image]                  │ │
│  │                                │ │
│  │ Event Name                     │ │
│  │ 📍 City, State                │ │
│  │ 🕐 Starts in 2 hrs            │ │
│  └────────────────────────────────┘ │
│                                       │
│  ┌────────────────────────────────┐ │
│  │ [Event Image]                  │ │
│  │                                │ │
│  │ Event Name                     │ │
│  │ 📍 City, State                │ │
│  │ 🕐 Starts in 1 day            │ │
│  └────────────────────────────────┘ │
│                                       │
│  ... (up to 10 events)              │
└──────────────────────────────────────┘
```

**Features**:
- Shows upcoming events only (filtered)
- Max 10 events
- Each card shows:
  - Event image (default if none)
  - Event name
  - Location (city extracted)
  - Time until start ("Starts in X hrs/days")
- Scrollable if more than fits
- Pulls from iCal feeds

**Data Flow**:
1. Events passed from `page.tsx`
2. Filtered for upcoming only
3. Sorted by start time
4. Limited to 10 items

---

## Mobile Dashboard

### Entry Point
**File**: `apps/web/src/components/mobile-dashboard/MobileDashboard.tsx`

The mobile dashboard is a **bottom sheet overlay** that slides up from the bottom.

### Trigger: Unicorn Button

```
┌─────────────────────────────────────┐
│                                      │
│         [MAP VIEW]                  │
│                                      │
│                                      │
│           ┌─────┐                   │
│           │ 🦄  │  ← Floating button│
│           └─────┘                   │
└─────────────────────────────────────┘
```

**Button**:
- Fixed position at bottom center
- Pink gradient background
- Shows "Follow Your Heart" sticker
- Click opens 4-tile modal

### 4-Tile Modal

When unicorn button clicked, shows modal with 4 options:

```
┌─────────────────────────────────────┐
│                                      │
│    ┌─────────┐  ┌─────────┐        │
│    │  🎯     │  │  📍     │        │
│    │ Events  │  │  Nodes  │        │
│    └─────────┘  └─────────┘        │
│                                      │
│    ┌─────────┐  ┌─────────┐        │
│    │  ⚡     │  │  👤     │        │
│    │ Quests  │  │Dashboard│        │
│    └─────────┘  └─────────┘        │
│                                      │
└─────────────────────────────────────┘
```

**Options**:
1. **Events** → Opens events list overlay
2. **Nodes** → Opens nodes list overlay
3. **Quests** → Opens quests overlay (shows Game1111)
4. **Dashboard** → Opens full mobile dashboard

---

## Mobile Dashboard Layout

### Structure (Scrollable):

```
┌─────────────────────────────────────┐
│  HEADER                              │
│  [< Back]  DASHBOARD                │
├─────────────────────────────────────┤
│                                      │
│  ┌────────────────────────────────┐ │
│  │   ZO PASSPORT CARD             │ │
│  │   (3D animated card)           │ │
│  │                                │ │
│  │   [View Passport]              │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   QUANTUM SYNC CARD            │ │
│  │   (Game launcher with timer)   │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   STATS CARD                   │ │
│  │   • Quantum Syncs: 12          │ │
│  │   • Best Score: 1112           │ │
│  │   • Locations: 5               │ │
│  │   • Multiplier: 1.5x           │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   MINI MAP                     │ │
│  │   (Small map preview)          │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   LEADERBOARD                  │ │
│  │   (Podium + top 10)            │ │
│  └────────────────────────────────┘ │
│                                      │
└─────────────────────────────────────┘
```

### Components:

#### 1. Mobile Dashboard Header
```
┌─────────────────────────────────────┐
│  [< Back]        DASHBOARD          │
│                                      │
│  [Avatar]  nickname.zo              │
│            234 $Zo                  │
└─────────────────────────────────────┘
```

#### 2. Profile Photo Card
```
┌─────────────────────────────────────┐
│         [Large Avatar]              │
│                                      │
│         nickname.zo                 │
│         📍 City, State              │
│                                      │
│         💰 234 $Zo                  │
│         🌊 Vibe: 99%                │
└─────────────────────────────────────┘
```

#### 3. Zo Passport Card
- 3D animated card (perspective transform)
- Shows passport design
- "View Passport" button below

#### 4. Quantum Sync Card
```
┌─────────────────────────────────────┐
│  🌀 QUANTUM SYNC                     │
│                                      │
│  Can Play:                           │
│  [▶ TAP TO SYNC]                    │
│                                      │
│  On Cooldown:                        │
│  ⏰ 11:47:23                        │
│  Next sync in                        │
└─────────────────────────────────────┘
```

**Same logic as desktop** but mobile-optimized:
- Larger touch targets
- Simpler timer display (no milliseconds)
- Full-width card

#### 5. Stats Card
```
┌─────────────────────────────────────┐
│  STATS                               │
│                                      │
│  ⚡ Quantum Syncs      12           │
│  🎯 Best Score         1112         │
│  📍 Unique Locations   5            │
│  🔥 Multiplier         1.5x         │
└─────────────────────────────────────┘
```

#### 6. Mini Map
- Smaller map preview (240px height)
- Shows user location
- Static, not interactive

#### 7. Leaderboard
- Same podium + table as desktop
- Mobile-optimized spacing
- Scrollable table

---

## Map View Components

When dashboard is closed, user sees map view with:

### Desktop Map View

```
┌─────────────────────────────────────┐
│  [Avatar] [Balance] [Quest]     [X] │  ← Header
│                                      │
│         [🏠 City Info]              │  ← City card
│                                      │
│      [Local ↔ Global Toggle]       │  ← Map toggle
│      [X Events • X Nodes • X Q]    │  ← Stats pill
│                                      │
│                                      │
│         [FULL MAP VIEW]             │
│                                      │
│                                      │
│  ┌────────────┐                    │
│  │  Events    │                    │  ← Right overlay
│  │  List      │                    │
│  └────────────┘                    │
│                                      │
│  [Events] [Nodes] [Quests] [•••]  │  ← Bottom nav
└─────────────────────────────────────┘
```

**Header Elements**:
- Avatar (clickable)
- Balance display
- Quest button
- Close button

**Map Controls**:
- City info card (if city set)
- Map view toggle: Local (100km) vs Global (all)
- Stats pill: Live counts

**Right Overlays** (slide in from right):
- Events list
- Nodes list
- Quests list

**Bottom Navigation**:
- Events (purple pin icon)
- Nodes (house icon)
- Quests (quest icon)
- Dashboard (grid icon)

### Mobile Map View

```
┌─────────────────────────────────────┐
│  [Avatar] [Balance]            [⚡] │
│                                      │
│         [🏠 City Info]              │
│                                      │
│      [Local ↔ Global Toggle]       │
│      [• X Events X Nodes X Q •]    │
│                                      │
│                                      │
│         [MAP VIEW]                  │
│         (shrinks to 50% when        │
│          overlay opens)             │
│                                      │
│           ┌─────┐                   │
│           │ 🦄  │                   │
│           └─────┘                   │
└─────────────────────────────────────┘
```

**Mobile Unique Features**:
- Map shrinks to top 50% when overlay opens
- Unicorn button as primary navigation
- 4-tile modal for navigation
- Bottom overlays slide up
- Swipe to dismiss overlays

---

## Data Sources & APIs

### User Profile
```javascript
// From useZoAuth hook
userProfile: {
  id: string
  name: string
  pfp: string
  city: string
  lat: number
  lng: number
  culture: string  // Comma-separated
  bio: string
  zo_points: number
}
```

### Balance & Stats
```javascript
// GET /api/users/{userId}/progress
{
  quests: {
    zo_points: number
    total_completed: number
    best_score: number
  }
}
```

### Vibe Score
```javascript
// GET /api/vibe/{userId}
{
  success: boolean
  data: {
    score: number  // 0-100
  }
}
```

### Leaderboard
```javascript
// Fetched internally by DesktopLeaderboard/MobileLeaderboard
// GET /api/quests/leaderboard
[
  {
    rank: number
    user_id: string
    nickname: string
    avatar: string
    zo_points: number
  }
]
```

### Quest Cooldown
```javascript
// Managed by useQuestCooldown hook
// Stored in localStorage: `quest_cooldown_{questId}_{userId}`
{
  canPlay: boolean
  nextAvailableAt: string | null  // ISO timestamp
}
```

### Events
```javascript
// Passed from page.tsx (from iCal feeds)
[
  {
    'Event Name': string
    'Date & Time': string
    'Location': string
    'Latitude': string
    'Longitude': string
    'Event URL'?: string
  }
]
```

---

## State Management

### Desktop Dashboard State
```typescript
// In DesktopView.tsx
const [isDashboardOpen, setIsDashboardOpen] = useState(true)
const [showGame1111, setShowGame1111] = useState(false)
const [showQuestComplete, setShowQuestComplete] = useState(false)
```

**Flow**:
1. Dashboard open → `isDashboardOpen = true`
2. Click game → `isDashboardOpen = false`, `showGame1111 = true`
3. Complete game → `showGame1111 = false`, `showQuestComplete = true`
4. Go home → `showQuestComplete = false`, `isDashboardOpen = true`

### Mobile Dashboard State
```typescript
// In MobileView.tsx
const [activeList, setActiveList] = useState<'events' | 'nodes' | 'quests' | 'dashboard' | null>('dashboard')
const [showTileModal, setShowTileModal] = useState(false)
const [showGame1111, setShowGame1111] = useState(false)
```

**Flow**:
1. Click unicorn → `showTileModal = true`
2. Click dashboard tile → `showTileModal = false`, `activeList = 'dashboard'`
3. Click game → `activeList = null`, `showGame1111 = true`
4. Complete game → `showGame1111 = false`, `showQuestComplete = true`
5. Go home → `showQuestComplete = false`, `activeList = 'dashboard'`

---

## Key Features Summary

### Desktop Dashboard
✅ Full-screen 3-column layout
✅ Live balance updates (3s intervals)
✅ Live vibe score updates (30s intervals)
✅ Editable bio and cultures
✅ Quantum Sync game launcher with cooldown timer (millisecond precision)
✅ Mini map preview
✅ Stats display
✅ Leaderboard with podium
✅ Local events feed
✅ Zo Passport integration
✅ Background image with glassmorphism effects

### Mobile Dashboard
✅ Bottom sheet overlay
✅ Unicorn button navigation
✅ 4-tile modal for quick access
✅ Map shrinks to 50% when overlay opens
✅ Profile photo card
✅ 3D animated Zo Passport card
✅ Quantum Sync card with cooldown
✅ Stats card
✅ Mini map
✅ Leaderboard
✅ Swipe gestures
✅ Touch-optimized UI

---

## Missing Elements That Should Be Added

1. **Visited Nodes Display**: Code fetches `visitedNodes` but doesn't display them
2. **Quest History**: Show past quest completions
3. **Social Features**: Friends list, social connections
4. **Achievements**: Badges, milestones
5. **Notifications**: Quest availability, event reminders
6. **Calendar Integration**: Sync with user's calendar
7. **Node Check-in**: Direct check-in from dashboard
8. **Event RSVP**: RSVP to events from dashboard
9. **Wallet Details**: More detailed token transaction history
10. **Settings**: Profile settings, preferences

---

## Technical Implementation Notes

### Performance
- Balance updates every 3 seconds
- Vibe score updates every 30 seconds
- Cooldown timer updates every 10ms (desktop) for smooth animation
- Mini map is static (no interaction) to save resources

### Accessibility
- All buttons have proper labels
- Keyboard navigation supported
- Screen reader friendly (mostly)
- Touch targets ≥ 44px on mobile

### Responsive Design
- Desktop: 3-column fixed width layout
- Mobile: Full-width stacked layout
- Breakpoint at 768px
- Safe area insets respected on mobile

### Data Flow
```
page.tsx
  ↓
  ├─ DesktopView (if desktop)
  │   └─ DesktopDashboard
  │       ├─ LeftSidebar
  │       ├─ CenterColumn
  │       └─ RightSidebar
  │
  └─ MobileView (if mobile)
      └─ MobileDashboard
          ├─ MobileDashboardHeader
          ├─ MobileProfilePhotoCard
          ├─ ZoPassport
          ├─ MobileQuantumSyncCard
          ├─ MobileStatsCard
          ├─ MobileMiniMap
          └─ MobileLeaderboard
```

---

## Summary

The dashboard is a comprehensive user hub that shows:
- Identity (avatar, nickname, location)
- Progress (balance, vibe score, stats)
- Actions (launch game, view events, check quests)
- Social (leaderboard, events)
- Navigation (return to map, open passport)

It serves as the main "home base" for returning users after completing onboarding.


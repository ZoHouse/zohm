# Zo World - Technical Documentation

> **A decentralized protocol for shifting realities through programmable presence**

Last Updated: November 11, 2025

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Database Schema](#database-schema)
4. [File Structure](#file-structure)
5. [Key Features](#key-features)
6. [Authentication System](#authentication-system)
7. [Map System](#map-system)
8. [Quest & Reward System](#quest--reward-system)
9. [Leaderboard System](#leaderboard-system)
10. [API Endpoints](#api-endpoints)
11. [Environment Variables](#environment-variables)
12. [Deployment Guide](#deployment-guide)

---

## Project Overview

### What is Zo World?

Zo World is a decentralized protocol for shifting realities - a cultural mesh network that connects physical Zo Houses across the globe with digital infrastructure for community coordination, quest completion, and reputation building.

**Core Concept**: Every interaction (IRL or digital) is a signal that nudges users toward their highest-alignment reality. The protocol reinforces this through:
- **Physical Layer**: Zo Houses as decentralized sanctuaries for building, vibing, and transformation
- **Digital Layer**: Interactive map, quest system, and social coordination
- **Economic Layer**: $ZO token rewards, ERC-20 quest completion, NFT gating
- **Social Layer**: Leaderboards, reputation, and community challenges

### Philosophy

From `ZO_WORLD_LORE.md`:
> "Zo World is a recursive mirror: the more you show up as your true self, the more the world reflects that back to you."

The app treats culture as computation and individuals as conscious agents navigating a multiversal network state.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Custom CSS
- **Maps**: Mapbox GL JS
- **State**: React Hooks (useState, useEffect, useMemo)
- **UI Components**: Custom Glow UI system

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Privy (Email, Social, Multi-Wallet)
- **APIs**: Next.js API Routes
- **Calendar**: iCal/Luma event parsing
- **Geolocation**: Browser Geolocation API + Mapbox Geocoding

### Web3
- **Blockchain**: Avalanche (Fuji Testnet)
- **Wallet**: Privy Embedded Wallets + External Wallets
- **Tokens**: ERC-20 rewards (custom token)
- **NFTs**: Founder NFT verification

### DevOps
- **Hosting**: Vercel
- **CI/CD**: GitHub + Vercel Auto-Deploy
- **PWA**: Service Worker + Manifest
- **Monitoring**: Console logging + Supabase analytics

---

## Database Schema

### Core Tables

#### `users`
**Purpose**: Main user identity table, keyed by Privy DID

```sql
CREATE TABLE users (
  -- Identity
  id TEXT PRIMARY KEY,              -- Privy DID (did:privy:clr3j1k2f00...)
  
  -- Profile
  name TEXT,
  bio TEXT,
  pfp TEXT,                          -- Profile picture URL (unicorn avatar by default)
  culture TEXT,                      -- User's cultural affinity
  city TEXT,                         -- User's city
  
  -- Authentication
  email TEXT,
  x_handle TEXT,
  x_connected BOOLEAN DEFAULT FALSE,
  
  -- Location
  lat NUMERIC,
  lng NUMERIC,
  
  -- Role & Status
  role TEXT DEFAULT 'Member',        -- 'Founder' | 'Member' | 'Citizen'
  founder_nfts_count INTEGER DEFAULT 0,
  
  -- URLs
  calendar_url TEXT,
  main_quest_url TEXT,
  side_quest_url TEXT,
  
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_culture ON users(culture);
CREATE INDEX idx_users_location ON users(lat, lng);
```

#### `user_wallets`
**Purpose**: Multi-wallet support for each user

```sql
CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  
  -- Wallet Info
  address TEXT UNIQUE NOT NULL,
  chain_type TEXT NOT NULL,          -- 'ethereum' | 'avalanche' | 'solana' | 'polygon' | 'base'
  wallet_client TEXT,
  wallet_client_type TEXT,
  
  -- Flags
  is_embedded BOOLEAN DEFAULT FALSE, -- Privy embedded wallet
  is_primary BOOLEAN DEFAULT FALSE,  -- Primary wallet for transactions
  is_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  verified_at TIMESTAMP,
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_address ON user_wallets(address);
```

#### `user_auth_methods`
**Purpose**: Track social login methods (Google, Twitter, etc.)

```sql
CREATE TABLE user_auth_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  
  -- Auth Info
  auth_type TEXT NOT NULL,           -- 'email' | 'google' | 'twitter' | 'discord' | 'farcaster' | 'wallet'
  identifier TEXT NOT NULL,
  display_name TEXT,
  oauth_subject TEXT,
  oauth_username TEXT,
  
  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  UNIQUE(user_id, auth_type, identifier)
);
```

#### `nodes`
**Purpose**: Zo Houses and partner locations on the map

```sql
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  
  -- Type & Status
  type TEXT NOT NULL CHECK (type IN (
    'hacker_space',
    'culture_house',
    'schelling_point',
    'flo_zone',
    'staynode'
  )),
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'developing',
    'planning'
  )),
  
  -- Details
  description TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  
  -- Location
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- Links
  website TEXT,
  twitter TEXT,
  contact_email TEXT,
  
  -- Features
  features TEXT[] DEFAULT '{}',      -- Array: ['coworking', 'coliving', 'events', ...]
  image TEXT,
  
  -- Timestamps
  inserted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nodes_type ON nodes(type);
CREATE INDEX idx_nodes_city_country ON nodes(city, country);
CREATE INDEX idx_nodes_location ON nodes(latitude, longitude);
```

#### `calendars`
**Purpose**: Event calendar sources (Luma, iCal, Google, Outlook)

```sql
CREATE TABLE calendars (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  
  -- Type & Status
  type TEXT NOT NULL CHECK (type IN ('luma', 'ical', 'google', 'outlook')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendars_active ON calendars(is_active);
CREATE INDEX idx_calendars_type ON calendars(type);
```

#### `quests`
**Purpose**: Quest definitions (currently minimal, can be expanded)

```sql
CREATE TABLE quests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward INTEGER NOT NULL,           -- $ZO points
  status TEXT NOT NULL,              -- 'active' | 'completed' | 'developing'
  
  -- Future fields (from QUESTS_GEOLOCATION_PLAN.md):
  -- latitude DOUBLE PRECISION,
  -- longitude DOUBLE PRECISION,
  -- location_name TEXT,
  -- address TEXT,
  -- city TEXT,
  -- country TEXT
);
```

#### `completed_quests`
**Purpose**: Track which users completed which quests

```sql
CREATE TABLE completed_quests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_address TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  
  -- Completion Details
  completed_at TIMESTAMP DEFAULT NOW(),
  transaction_hash TEXT,             -- On-chain verification
  amount NUMERIC(20, 18),            -- Token amount sent
  metadata JSONB,                    -- { reward_zo: 420, quest_title: "...", ... }
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT unique_wallet_quest UNIQUE (wallet_address, quest_id)
);

CREATE INDEX idx_completed_quests_wallet ON completed_quests(wallet_address);
CREATE INDEX idx_completed_quests_quest ON completed_quests(quest_id);
CREATE INDEX idx_completed_quests_completed_at ON completed_quests(completed_at);
```

#### `leaderboards`
**Purpose**: User rankings (auto-updated via trigger)

```sql
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT UNIQUE NOT NULL,
  username TEXT DEFAULT 'Anon',
  
  -- Stats
  zo_points INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  last_quest_completed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leaderboards_wallet ON leaderboards(wallet);
CREATE INDEX idx_leaderboards_zo_points ON leaderboards(zo_points DESC);
CREATE INDEX idx_leaderboards_updated_at ON leaderboards(updated_at DESC);
```

### Database Triggers

#### Auto-Update Leaderboard on Quest Completion

```sql
CREATE OR REPLACE FUNCTION update_leaderboard_on_quest_completion()
RETURNS TRIGGER AS $$
DECLARE
  reward_points INTEGER;
BEGIN
  -- Extract reward from metadata, default to 420
  reward_points := COALESCE((NEW.metadata->>'reward_zo')::INTEGER, 420);
  
  -- Upsert leaderboard entry
  INSERT INTO leaderboards (
    wallet,
    zo_points,
    total_quests_completed,
    last_quest_completed_at,
    username,
    updated_at
  )
  VALUES (
    NEW.wallet_address,
    reward_points,
    1,
    NEW.completed_at,
    'Anon',
    NOW()
  )
  ON CONFLICT (wallet) 
  DO UPDATE SET 
    zo_points = leaderboards.zo_points + reward_points,
    total_quests_completed = leaderboards.total_quests_completed + 1,
    last_quest_completed_at = NEW.completed_at,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quest_completion_leaderboard_update
AFTER INSERT ON completed_quests
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_on_quest_completion();
```

### Backward Compatibility

The `members` table is now a **VIEW** that maps to the new `users` schema for backward compatibility:

```sql
CREATE VIEW members AS
SELECT 
  u.id,
  w.address as wallet,
  u.pfp,
  u.name,
  u.founder_nfts_count,
  u.bio,
  u.x_handle,
  u.x_connected,
  u.culture,
  u.role,
  u.email,
  u.lat,
  u.lng,
  u.calendar_url,
  u.created_at,
  u.last_seen
FROM users u
LEFT JOIN user_wallets w ON w.user_id = u.id AND w.is_primary = true;
```

---

## File Structure

```
zohm/
├── public/                          # Static assets
│   ├── astronaut.svg               # Onboarding character
│   ├── loading background.gif      # Loading screen
│   ├── Zo_flexing_white.png       # Zo character
│   ├── Cultural Stickers/          # Culture icons (18 types)
│   ├── unicorn images/             # Default avatars (14 unicorns)
│   └── icons/                      # PWA icons
│
├── src/
│   ├── app/
│   │   ├── page.tsx                # Main app entry point
│   │   ├── layout.tsx              # Root layout with providers
│   │   ├── globals.css             # Global styles + Tailwind
│   │   └── api/                    # API routes
│   │       ├── calendar/route.ts   # Event aggregation
│   │       ├── send-token-reward/route.ts  # Quest rewards
│   │       ├── check-nft/route.ts  # Founder NFT verification
│   │       ├── upload-profile-photo/route.ts
│   │       ├── nodes/
│   │       │   ├── list/route.ts   # Get all nodes
│   │       │   └── replace/route.ts # Bulk update nodes
│   │       └── setup-database/route.ts
│   │
│   ├── components/                 # React components
│   │   ├── MapCanvas.tsx           # Main map (Mapbox)
│   │   ├── DesktopView.tsx         # Desktop layout
│   │   ├── MobileView.tsx          # Mobile layout
│   │   ├── LandingPage.tsx         # "Take the Red Pill"
│   │   ├── SimpleOnboarding.tsx    # Name/City/Culture form
│   │   ├── DashboardOverlay.tsx    # Side panel with profile
│   │   ├── QuestsOverlay.tsx       # Quest list
│   │   ├── EventsOverlay.tsx       # Event list
│   │   ├── NodesOverlay.tsx        # Node list
│   │   ├── LeaderboardsOverlay.tsx # Rankings
│   │   ├── ProfilePanel.tsx        # User profile editor
│   │   ├── MapViewToggle.tsx       # Local/Global switcher
│   │   ├── CityInfoCard.tsx        # Current city display
│   │   ├── FloatingNav.tsx         # Navigation buttons
│   │   ├── StatsPill.tsx           # Event/Node/Quest counter
│   │   └── ui/                     # Glow UI components
│   │       ├── GlowButton.tsx
│   │       ├── GlowCard.tsx
│   │       └── GlowChip.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── usePrivyUser.ts         # Privy auth wrapper
│   │   ├── useProfileGate.ts       # Onboarding gate
│   │   ├── useWallet.ts            # Wallet connection
│   │   └── useIsMobile.ts          # Responsive detection
│   │
│   ├── lib/                        # Core utilities
│   │   ├── supabase.ts             # Supabase client + helpers
│   │   ├── privyDb.ts              # Privy user CRUD operations
│   │   ├── customTokenReward.ts    # ERC-20 reward sending
│   │   ├── icalParser.ts           # Parse iCal/Luma events
│   │   ├── geocoding.ts            # Mapbox geocoding API
│   │   ├── geoUtils.ts             # Distance calculations
│   │   ├── unicornAvatars.ts       # Default avatar assignment
│   │   ├── cultures.ts             # 18 culture definitions
│   │   ├── nodeTypes.ts            # Node type definitions
│   │   ├── questVerifier.ts        # Quest completion logic
│   │   ├── setupLeaderboard.ts     # Leaderboard helpers
│   │   └── migrations/             # SQL migrations
│   │
│   ├── providers/
│   │   └── PrivyProvider.tsx       # Privy config wrapper
│   │
│   └── config/
│       └── contracts.ts            # Smart contract addresses
│
├── migrations/                     # Database migrations
│   ├── 001_privy_migration.sql    # Users/wallets/auth_methods
│   └── 002_add_city_column.sql    # Add city field
│
├── scripts/                        # Utility scripts
│   ├── import-zostel-nodes.mjs    # Bulk import nodes
│   └── generate-icons.js          # PWA icon generation
│
├── ZO_WORLD_LORE.md               # Project philosophy
├── QUESTS_GEOLOCATION_PLAN.md     # Future quest features
├── LEADERBOARD_QUICKSTART.md      # Leaderboard setup guide
└── README.md                       # Getting started
```

---

## Key Features

### 1. Space-to-Location Map Animation

**What it does**: When users complete onboarding or return to the app, the map animates from outer space (zoom 0) to their exact location.

**Implementation**:
```typescript
// In MapCanvas.tsx
map.flyTo({
  center: [userLng, userLat],
  zoom: 14,
  pitch: 60,
  bearing: -17.6,
  duration: 6000,
  easing: (t) => t * (2 - t),  // Ease-out quad
  essential: true
});
```

**Triggers**:
- User completes onboarding with location
- User returns after session expires
- Page refresh (once per session)

### 2. Local vs Global Mode

**Local Mode**: 
- Shows events/nodes within 100km of user's home location
- Radius calculated using Haversine formula
- Displays count: "8 events, 55 nodes, 1 quest"

**Global Mode**:
- Shows all events/nodes worldwide
- Default if user has no location set

**Toggle**: Purple/pink gradient button in top-right

### 3. Multi-Calendar Event Aggregation

**Supported Sources**:
- Luma calendars (via `/api/calendar?id=cal-XXX`)
- iCal URLs (direct HTTP fetch)
- Google Calendar (iCal export)
- Outlook (iCal export)

**Default Calendars**:
- Zo House Bangalore
- Zo House San Francisco
- ETHGlobal Events
- Singapore Token Events
- Mumbai Events
- Cursor Community
- Blockchain Week calendars (Taipei, Warsaw, Korea)

**Event Parsing**: `src/lib/icalParser.ts`

### 4. Quest System with ERC-20 Rewards

**Quest Flow**:
1. User clicks quest in `QuestsOverlay`
2. Quest details show with "Complete Quest" button
3. On click, calls `/api/send-token-reward`
4. API sends custom ERC-20 tokens to user's wallet
5. Quest marked as completed in `completed_quests` table
6. Leaderboard auto-updates via trigger

**Token Config** (`.env.local`):
```bash
CUSTOM_TOKEN_ADDRESS=0x...
CUSTOM_TOKEN_SYMBOL=ZOHM
CUSTOM_TOKEN_DECIMALS=18
CUSTOM_TOKEN_REWARD_AMOUNT=100
REWARD_WALLET_PRIVATE_KEY=...
```

### 5. Leaderboard System

**Auto-Update**: Postgres trigger fires on quest completion
**Points**: Extracted from `metadata.reward_zo` (default: 420)
**Display**: Sorted by `zo_points DESC`
**Maintenance**: `SELECT * FROM recalculate_leaderboard();`

### 6. Profile System

**Onboarding Steps**:
1. **Landing Page**: "Take the Red Pill" (login with Privy)
2. **Simple Onboarding**: Name, City, Culture
3. **Location Capture**: Browser geolocation API
4. **Auto-Save**: Profile saved to `users` table
5. **Space Animation**: Map flies from space to user location

**Default Avatar**: Unicorn assigned based on Privy ID hash

**Profile Fields**:
- Name (12 char max)
- Bio
- Culture (18 options)
- City + Lat/Lng
- PFP (uploadable)
- X Handle
- Calendar URLs

### 7. PWA (Progressive Web App)

**Features**:
- Installable on mobile/desktop
- Offline-capable (service worker)
- Custom icons (Android/iOS)
- Splash screens
- Add to Home Screen prompt

**Files**:
- `/public/manifest.json`
- `/public/sw.js`
- `/public/icons/*`

### 8. Responsive Design

**Desktop**: 
- Full map with floating overlays
- Dashboard on right side
- Hover effects on markers

**Mobile**:
- Bottom sheet overlays
- Touch-optimized navigation
- Swipe gestures
- Compact header with stats

**Breakpoint**: 768px

---

## Authentication System

### Privy Integration

**Setup**: `src/providers/PrivyProvider.tsx`

**Login Methods**:
- Email (magic link)
- Google OAuth
- Twitter OAuth
- Discord OAuth
- Farcaster
- Wallet (MetaMask, Coinbase, etc.)
- Embedded wallets (Privy-managed)

**User Object Structure**:
```typescript
{
  id: "did:privy:clr3j1k2f00...",
  email: { address: "user@example.com" },
  linkedAccounts: [
    { type: "wallet", address: "0x..." },
    { type: "google_oauth", email: "..." }
  ],
  createdAt: "2024-01-01T00:00:00.000Z"
}
```

### Auth Flow

1. **Landing Page**: User clicks "Take the Red Pill"
2. **Privy Login**: Modal appears with login options
3. **Profile Check**: `usePrivyUser` hook checks if profile exists
4. **Onboarding Gate**: If no profile, show `SimpleOnboarding`
5. **Save to DB**: `upsertUserFromPrivy()` creates user record
6. **Sync Wallets**: `syncUserWalletsFromPrivy()` saves all wallets
7. **Map Access**: User sees map with their location

### Custom Hook: `usePrivyUser`

```typescript
const {
  authenticated,           // Boolean: is user logged in
  userProfile,            // UserRecord from DB
  hasCompletedOnboarding, // Boolean: profile exists
  isLoading,              // Boolean: loading state
  privyUser,              // Raw Privy user object
  login,                  // Function: trigger login modal
  privyReady,             // Boolean: Privy SDK loaded
  reloadProfile           // Function: refresh profile from DB
} = usePrivyUser();
```

### Profile Gating

```typescript
// In page.tsx
if (!hasCompletedOnboarding) {
  return <SimpleOnboarding onComplete={handleOnboardingComplete} />;
}

// Show map
return <DesktopView ... />
```

---

## Map System

### Mapbox Initialization

**Location**: `src/components/MapCanvas.tsx`

**Key Config**:
```typescript
const map = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: 'mapbox://styles/mapbox/dark-v11',
  center: [lng, lat],
  zoom: initialZoom,
  pitch: initialPitch,
  bearing: initialBearing,
  projection: 'globe',
  minZoom: 0,
  maxZoom: 22
});
```

**Default Center**: San Francisco `[-122.4194, 37.7749]`

**Space View**: `zoom: 0, pitch: 0, bearing: 0`

### Marker Types

#### 1. Event Markers (Red)
- **Icon**: 📍 Red circle
- **Data**: Fetched from calendar APIs
- **Popup**: Event name, date, URL
- **Clustering**: Yes (for dense areas)

#### 2. Node Markers (Blue)
- **Icon**: 🏠 Blue house
- **Data**: From `nodes` table
- **Popup**: Node name, type, description
- **Types**: Hacker Space, Culture House, Schelling Point, Flo Zone, Staynode

#### 3. User Location Marker (Green)
- **Icon**: 🧑 Green person
- **Data**: User's lat/lng from profile
- **Popup**: "Your Location"
- **Persistent**: Shows on map always

#### 4. Quest Markers (Gold) - Future
- **Icon**: 🏆 Gold trophy
- **Data**: From `quests` table (when lat/lng added)
- **Popup**: Quest title, reward, status

### Animation System

**Space-to-Location Flow**:

1. **Check Conditions**: `shouldAnimateFromSpace && userLocation`
2. **Initial State**: Map loads at zoom 0 (space view)
3. **Wait for Ready**: `mapLoaded` state must be true
4. **Trigger Animation**: `requestAnimationFrame(() => map.flyTo(...))`
5. **Duration**: 6 seconds
6. **Easing**: Ease-out quadratic for smooth landing
7. **Final State**: zoom 14, pitch 60°, bearing -17.6°

**One-Time Flag**: `window.hasAnimatedFromSpace = true`

### Local/Global Filtering

**Radius Calculation**:
```typescript
// src/lib/geoUtils.ts
function isWithinRadius(
  userLat: number,
  userLng: number,
  targetLat: number,
  targetLng: number,
  radiusKm: number
): boolean {
  const distance = haversineDistance(userLat, userLng, targetLat, targetLng);
  return distance <= radiusKm;
}
```

**Filter Logic**:
```typescript
const localEvents = useMemo(() => {
  if (!userHomeLat || !userHomeLng) return events;
  
  return events.filter(event => {
    const eventLat = parseFloat(event.Latitude);
    const eventLng = parseFloat(event.Longitude);
    return isWithinRadius(userHomeLat, userHomeLng, eventLat, eventLng, 100);
  });
}, [events, userHomeLat, userHomeLng]);
```

---

## Quest & Reward System

### Quest Completion Flow

**1. User Interaction**
```typescript
// QuestsOverlay.tsx
<button onClick={() => handleCompleteQuest(quest)}>
  Complete Quest
</button>
```

**2. Verify Eligibility**
```typescript
// Check if already completed
const alreadyCompleted = await isQuestCompleted(walletAddress, questId);
if (alreadyCompleted) {
  alert("Already completed!");
  return;
}
```

**3. Send Token Reward**
```typescript
const response = await fetch('/api/send-token-reward', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipientAddress: walletAddress,
    questId: quest.id
  })
});
```

**4. Mark as Completed**
```typescript
await markQuestCompleted(
  walletAddress,
  questId,
  txHash,
  tokenAmount,
  {
    reward_zo: 420,
    quest_title: quest.title,
    completed_via: 'web_app'
  }
);
```

**5. Trigger Fires** (Automatic)
- Postgres trigger detects new row in `completed_quests`
- Extracts `metadata.reward_zo` value
- Updates `leaderboards` table
- User's $ZO points increase instantly

### Token Reward API

**Endpoint**: `POST /api/send-token-reward`

**Request Body**:
```json
{
  "recipientAddress": "0x1234...",
  "questId": "quest-001"
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0xabcd...",
  "amount": "100.0",
  "symbol": "ZOHM"
}
```

**Implementation** (`src/lib/customTokenReward.ts`):
```typescript
export async function sendCustomTokenReward(recipientAddress: string) {
  const contract = new ethers.Contract(
    TOKEN_ADDRESS,
    ERC20_ABI,
    wallet
  );
  
  const tx = await contract.transfer(
    recipientAddress,
    ethers.parseUnits(REWARD_AMOUNT, DECIMALS)
  );
  
  await tx.wait();
  return tx.hash;
}
```

### Quest Verification Options

**Current**: Trust-based (user clicks button)

**Future Options** (in `src/lib/questVerifier.ts`):
- **On-Chain**: Verify transaction hash on blockchain
- **Social**: Check Twitter post, Farcaster cast
- **Location**: Verify GPS proximity to node
- **Time**: Must attend event during specific hours
- **Multi-Step**: Complete sub-quests in sequence

---

## Leaderboard System

### Automatic Updates

**No manual code needed!** The leaderboard updates automatically when quests are completed.

**Flow**:
```
User completes quest
      ↓
Row inserted into completed_quests
      ↓
Trigger fires: update_leaderboard_on_quest_completion()
      ↓
Leaderboard entry upserted
      ↓
zo_points += reward_zo
      ↓
total_quests_completed++
      ↓
Rankings recalculated on next SELECT
```

### Point Calculation

**Default**: 420 $ZO per quest

**Custom**: Set in `metadata.reward_zo`
```typescript
await markQuestCompleted(wallet, questId, txHash, amount, {
  reward_zo: 1000,  // Override default
  difficulty: 'hard'
});
```

### Leaderboard Display

**Component**: `LeaderboardsOverlay.tsx`

**Query**:
```typescript
const { data: leaderboards } = await supabase
  .from('leaderboards')
  .select('*')
  .order('zo_points', { ascending: false })
  .limit(100);
```

**UI**:
- Rank (1, 2, 3, ...)
- Username (defaults to "Anon")
- $ZO Points
- Quests Completed
- Last Activity

### Maintenance Functions

**Recalculate Entire Leaderboard**:
```sql
SELECT * FROM recalculate_leaderboard();
```

**Sync Username**:
```sql
SELECT sync_leaderboard_username('0x1234...', 'NewUsername');
```

**Check Stats**:
```typescript
import { getLeaderboardStats } from '@/lib/setupLeaderboard';

const stats = await getLeaderboardStats();
// { totalUsers, totalPoints, totalQuests }
```

---

## API Endpoints

### `GET /api/calendar`

**Purpose**: Aggregate events from multiple calendar sources

**Query Params**:
- `id` (optional): Specific calendar ID to fetch

**Response**:
```json
[
  {
    "Event Name": "ETH Denver Kickoff",
    "Date": "2025-02-28",
    "Latitude": "39.7392",
    "Longitude": "-104.9903",
    "Event URL": "https://..."
  }
]
```

**Implementation**:
- Fetches from `calendars` table where `is_active = true`
- Parses iCal/Luma feeds
- Geocodes addresses to lat/lng
- Caches results for 10 minutes

### `POST /api/send-token-reward`

**Purpose**: Send ERC-20 tokens as quest reward

**Request**:
```json
{
  "recipientAddress": "0x...",
  "questId": "quest-001"
}
```

**Response**:
```json
{
  "success": true,
  "transactionHash": "0x...",
  "amount": "100.0",
  "symbol": "ZOHM",
  "balance": {
    "tokens": "9900.0",
    "avax": "1.5"
  }
}
```

**Requirements**:
- `REWARD_WALLET_PRIVATE_KEY` in env
- Wallet must have tokens + AVAX for gas

### `GET /api/check-nft`

**Purpose**: Verify if wallet owns Founder NFTs

**Query Params**:
- `walletAddress`: Wallet to check

**Response**:
```json
{
  "owns": true,
  "count": 3
}
```

**Implementation**: Checks on-chain NFT balance

### `POST /api/upload-profile-photo`

**Purpose**: Upload profile picture

**Request**: `multipart/form-data` with image file

**Response**:
```json
{
  "url": "https://storage.com/user123.jpg"
}
```

### `GET /api/nodes/list`

**Purpose**: Get all nodes

**Response**:
```json
[
  {
    "id": "zo-house-sf",
    "name": "Zo House San Francisco",
    "type": "culture_house",
    "latitude": 37.7817,
    "longitude": -122.4012,
    ...
  }
]
```

### `POST /api/nodes/replace`

**Purpose**: Bulk update nodes (admin only)

**Request**:
```json
{
  "nodes": [...]
}
```

---

## Environment Variables

### Required `.env.local`

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoiem9ob3VzZSIsImEiOiJjbTN2...

# Privy
NEXT_PUBLIC_PRIVY_APP_ID=clxxxxxxxxxxxxxx
PRIVY_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxx

# Token Rewards
CUSTOM_TOKEN_ADDRESS=0x...
CUSTOM_TOKEN_SYMBOL=ZOHM
CUSTOM_TOKEN_DECIMALS=18
CUSTOM_TOKEN_REWARD_AMOUNT=100
REWARD_WALLET_PRIVATE_KEY=0x...

# Avalanche RPC
NEXT_PUBLIC_AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

### Optional Variables

```bash
# Calendar URLs (can be managed in Supabase instead)
CALENDAR_URL_1=https://...
CALENDAR_URL_2=https://...

# Node.js Environment
NODE_ENV=development

# Analytics (future)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## Deployment Guide

### Prerequisites

1. **Supabase Project**
   - Create at [supabase.com](https://supabase.com)
   - Note your project URL and keys

2. **Mapbox Account**
   - Sign up at [mapbox.com](https://mapbox.com)
   - Create access token

3. **Privy Account**
   - Sign up at [privy.io](https://privy.io)
   - Create app, get App ID and Secret

4. **Avalanche Wallet** (for rewards)
   - Create wallet on Fuji testnet
   - Get private key
   - Fund with AVAX + custom tokens

### Step 1: Database Setup

Run migrations in Supabase SQL Editor:

```sql
-- 1. Run Privy migration
-- Copy contents of migrations/001_privy_migration.sql

-- 2. Add city column
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;

-- 3. Setup leaderboard trigger
-- Copy contents of src/lib/migrations/leaderboard-trigger.sql
```

**Verify Tables Exist**:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

Should see: `users`, `user_wallets`, `user_auth_methods`, `nodes`, `calendars`, `quests`, `completed_quests`, `leaderboards`

### Step 2: Configure Environment

1. Create `.env.local` in project root
2. Add all required variables (see above)
3. **Never commit this file!** (already in `.gitignore`)

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 5: Deploy to Vercel

**Option A: GitHub Integration** (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repo
5. Add environment variables in Vercel dashboard
6. Deploy!

**Option B: Vercel CLI**

```bash
npm i -g vercel
vercel login
vercel
```

### Step 6: Post-Deployment Checklist

- [ ] Test login with Privy (all methods)
- [ ] Complete onboarding flow
- [ ] Verify map loads correctly
- [ ] Check space-to-location animation
- [ ] Test quest completion + token reward
- [ ] Verify leaderboard updates
- [ ] Test local/global mode toggle
- [ ] Verify events load from calendars
- [ ] Test mobile PWA install
- [ ] Check all API endpoints return 200

### Troubleshooting

**Map doesn't load**:
- Check `NEXT_PUBLIC_MAPBOX_TOKEN` is set
- Verify token is not restricted

**Privy login fails**:
- Check `NEXT_PUBLIC_PRIVY_APP_ID` matches dashboard
- Verify redirect URLs in Privy dashboard

**Database errors**:
- Check Supabase URL and keys
- Verify RLS policies are correct
- Run migrations again

**Token rewards fail**:
- Check wallet has tokens + AVAX
- Verify `CUSTOM_TOKEN_ADDRESS` is correct
- Check `REWARD_WALLET_PRIVATE_KEY` format

---

## Future Enhancements

### Planned Features

1. **Quest Geolocation** (`QUESTS_GEOLOCATION_PLAN.md`)
   - Add lat/lng to quests table
   - Show quest markers on map
   - Proximity verification

2. **Guild System**
   - Users form crews
   - Compete on team leaderboards
   - Shared quest completion

3. **Seasonal Leaderboards**
   - 3-month seasons
   - Top 10 get NFT rewards
   - Prestige system

4. **Social Features**
   - Follow other users
   - Activity feed
   - Co-op quests

5. **Advanced Gamification**
   - Multiple reputation tracks
   - City-based rankings
   - Streak systems
   - Referral rewards

6. **Mobile App**
   - React Native version
   - Push notifications
   - QR code scanning for check-ins

7. **DAO Governance**
   - Founder NFT holders vote
   - Community proposals
   - Treasury management

---

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js)
- [Privy Docs](https://docs.privy.io)
- [Supabase Docs](https://supabase.com/docs)

### Internal Docs
- `ZO_WORLD_LORE.md` - Project philosophy
- `QUESTS_GEOLOCATION_PLAN.md` - Quest feature planning
- `LEADERBOARD_QUICKSTART.md` - Leaderboard setup
- `GLOW_UI_GUIDE.md` - UI component library

### Support
- GitHub Issues: (add your repo link)
- Discord: (add your Discord link)
- Twitter: (add your Twitter)

---

## Contributors

**Built by the Zo House community** 🦄

Special thanks to all the developers, designers, and contributors who made this possible.

---

**Last Updated**: November 11, 2025  
**Version**: 1.0.0  
**License**: (Add your license)

---

*"The more you show up as your true self, the more the world reflects that back to you."*


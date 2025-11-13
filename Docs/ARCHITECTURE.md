# Zo World Architecture

**Version**: 1.0  
**Last Updated**: 2025-11-13  
**Platform**: Webapp (Next.js 15 + Supabase)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Layers](#architecture-layers)
3. [Technology Stack](#technology-stack)
4. [Data Flow](#data-flow)
5. [Component Architecture](#component-architecture)
6. [API Architecture](#api-architecture)
7. [Database Architecture](#database-architecture)
8. [Authentication & Identity](#authentication--identity)
9. [Real-time Systems](#real-time-systems)
10. [Deployment Architecture](#deployment-architecture)
11. [Security Model](#security-model)
12. [Constraints & Boundaries](#constraints--boundaries)
13. [Related Documentation](#related-documentation)

---

## System Overview

### What is Zo World?

Zo World is a **decentralized protocol for conscious reality design**. It functions as a programmable layer that overlays default reality and transforms everyday life into an intentional simulation.

The webapp is the **primary interface** for:
- **Citizens** navigating the Zo Network
- **Quest completion** and reputation building
- **Node discovery** via interactive map
- **Community coordination** across cities
- **Reality measurement** via Vibe Score

### Core Philosophy

> "Zo World treats reality as programmable. Every action is a signal. Every signal shapes the field. The field responds with new opportunities."

The architecture reflects this by:
1. **Observing** user behavior (quests, location, engagement)
2. **Modeling** user state (vibe score, reputation, alignment)
3. **Simulating** personalized experiences (quest recommendations, node suggestions)
4. **Reinforcing** aligned patterns (rewards, narrative forks, synchronicities)

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│  (Next.js 15 App Router + React 19 + Tailwind CSS)         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Map Canvas  │  │  Onboarding  │  │  Quest Flow  │     │
│  │  (Mapbox GL) │  │  Components  │  │  Components  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                     APPLICATION LAYER                         │
│        (Next.js API Routes + Server Components)              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Auth API    │  │  Quest API   │  │  City API    │     │
│  │  (Privy)     │  │  (Supabase)  │  │  (Supabase)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└───────────────────────────┬──────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                       DATA LAYER                              │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐ │
│  │   Supabase      │  │   Privy Auth    │  │  ZO API    │ │
│  │  (PostgreSQL)   │  │   (DID-based)   │  │  (Avatar)  │ │
│  └─────────────────┘  └─────────────────┘  └────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────┐
│                    BLOCKCHAIN LAYER                           │
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐                  │
│  │   Base Network  │  │   IPFS Storage  │                  │
│  │  (ERC-20/721)   │  │  (Future)       │                  │
│  └─────────────────┘  └─────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (Presentation Layer)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15.4.2 | React framework with App Router |
| **React** | 19.1.0 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Utility-first styling |
| **Mapbox GL JS** | 3.13.0 | Interactive maps |
| **Framer Motion** | 12.x | Animations |
| **AR.js** | 2.2.2 | WebAR (marker-based) |
| **A-Frame** | 1.6.0 | WebAR scene management |

### Backend (Application Layer)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15.4.2 | Serverless API endpoints |
| **Privy** | 3.3.0 | Auth (Email, Social, Wallets) |
| **Supabase JS** | 2.52.0 | Database client |
| **Ethers.js** | 6.15.0 | Blockchain interactions |

### Data Layer

| Technology | Purpose |
|------------|---------|
| **Supabase (PostgreSQL)** | Primary database |
| **Privy Identity** | User authentication & DID management |
| **ZO API** | External profile & avatar generation |
| **IPFS** | Decentralized file storage (future) |

### Blockchain Layer

| Network | Purpose |
|---------|---------|
| **Base (Mainnet)** | $ZO token, Citizen NFTs |
| **Base Sepolia** | Testnet for development |

---

## Data Flow

### 1. User Authentication Flow

```
User Opens App
     │
     ▼
┌─────────────────────┐
│  Check Privy Auth   │ ──No──> Login Screen
└─────────────────────┘         (Email/Social/Wallet)
     │ Yes                              │
     ▼                                  │
┌─────────────────────┐                │
│  Fetch User Profile │ <──────────────┘
│  from Supabase      │
└─────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Check Onboarding   │ ──No──> Onboarding Flow
│  Completed?         │         (Nickname→Portal→Avatar→Quest)
└─────────────────────┘
     │ Yes
     ▼
┌─────────────────────┐
│  Load Map Interface │
└─────────────────────┘
```

### 2. Quest Completion Flow

```
User Starts Quest (e.g., Game1111)
     │
     ▼
┌──────────────────────────┐
│  Quest Logic Runs        │
│  (Frontend Component)    │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Calculate Score/Reward  │
│  (Proximity Formula)     │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  POST /api/quests/complete│
│  (Quest ID, Score, User)  │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Supabase Updates:       │
│  - completed_quests      │
│  - leaderboards          │
│  - user.zo_balance       │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Return Rewards to UI    │
│  (Tokens, XP, Badges)    │
└──────────────────────────┘
```

### 3. Avatar Generation Flow (Phase 2)

```
User Selects Body Type ("bro" | "bae")
     │
     ▼
┌──────────────────────────┐
│  POST /api/avatar/generate│
│  (userId, bodyType)       │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Proxy to ZO API          │
│  POST /api/v1/profile/me/ │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Poll /api/avatar/status  │
│  (Every 1s, max 10 times) │
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Avatar Ready?            │ ──No──> Keep Polling
└──────────────────────────┘
     │ Yes
     ▼
┌──────────────────────────┐
│  Cache to Supabase:       │
│  - users.pfp              │
│  - users.body_type        │
│  - users.profile_synced_at│
└──────────────────────────┘
     │
     ▼
┌──────────────────────────┐
│  Display Avatar in UI     │
└──────────────────────────┘
```

---

## Component Architecture

### Folder Structure

```
apps/web/src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Main map page
│   ├── layout.tsx          # Root layout
│   ├── not-found.tsx       # 404 page
│   └── api/                # API routes
│       ├── users/
│       ├── quests/
│       ├── cities/
│       ├── leaderboard/
│       └── avatar/
│
├── components/             # React components
│   ├── MapCanvas.tsx       # Mapbox map (1,587 lines)
│   ├── OnboardingPage.tsx  # Onboarding flow
│   ├── NicknameStep.tsx    # Step 1: Name entry
│   ├── AvatarStep.tsx      # Step 2: Avatar select
│   ├── QuestAudio.tsx      # Game1111 component
│   ├── QuestComplete.tsx   # Quest completion modal
│   ├── QuantumSyncHeader.tsx # User balance header
│   ├── DesktopView.tsx     # Desktop layout
│   ├── MobileView.tsx      # Mobile layout
│   └── ui/                 # Reusable UI components
│
├── lib/                    # Utility libraries
│   ├── supabase.ts         # Supabase client
│   ├── privy.ts            # Privy config
│   ├── cityService.ts      # City data logic
│   ├── geocoding.ts        # Location services
│   └── migrations/         # SQL migration scripts
│
├── hooks/                  # Custom React hooks
│   └── useAvatarGeneration.ts
│
└── providers/              # Context providers
    └── PrivyProvider.tsx   # Auth provider wrapper
```

### Component Hierarchy

```
page.tsx (Home)
│
├── PrivyProvider
│   │
│   ├── OnboardingPage (if !onboarding_completed)
│   │   ├── NicknameStep
│   │   ├── Portal Animation
│   │   ├── AvatarStep
│   │   ├── QuestAudio (Game1111)
│   │   └── QuestComplete
│   │
│   └── DesktopView | MobileView (if onboarding_completed)
│       │
│       ├── MapCanvas (Mapbox GL)
│       │   ├── Event Markers
│       │   ├── Node Markers
│       │   └── User Location Marker
│       │
│       ├── QuantumSyncHeader (Balance + Avatar)
│       ├── CityInfoCard
│       ├── MapViewToggle (Local/Global)
│       ├── StatsPill (Events/Nodes/Quests count)
│       │
│       └── Overlays
│           ├── EventsOverlay
│           ├── NodesOverlay
│           ├── QuestsOverlay
│           └── LeaderboardsOverlay
```

---

## API Architecture

### API Routes Structure

```
/api/
├── users/
│   ├── [id]/
│   │   ├── route.ts          # GET user profile
│   │   └── progress/
│   │       └── route.ts       # GET user progress
│   └── sync/
│       └── route.ts           # POST sync Privy → Supabase
│
├── quests/
│   ├── complete/
│   │   └── route.ts           # POST complete quest
│   └── route.ts               # GET available quests
│
├── cities/
│   ├── route.ts               # GET cities list
│   └── sync/
│       └── route.ts           # POST sync user's home city
│
├── leaderboard/
│   └── route.ts               # GET leaderboard data
│
├── avatar/
│   ├── generate/
│   │   └── route.ts           # POST start avatar generation
│   └── status/
│       └── route.ts           # GET avatar generation status
│
└── sync-home-city/
    └── route.ts               # POST sync city from location
```

### API Response Format

All API responses follow this structure:

```typescript
// Success Response
{
  success: true,
  data: { ... },
  message?: string
}

// Error Response
{
  success: false,
  error: string,
  details?: any
}
```

---

## Database Architecture

### Primary Database: Supabase (PostgreSQL)

**Connection**: Direct from API routes via `@supabase/supabase-js`

### Key Tables

1. **`users`** - User identity & profile (Privy DID as primary key)
2. **`user_wallets`** - Multi-wallet support
3. **`quests`** - Quest definitions
4. **`completed_quests`** - Quest completion records
5. **`leaderboards`** - Global/city leaderboards
6. **`cities`** - City data & progression
7. **`city_progress`** - User contributions per city
8. **`community_goals`** - City-level challenges
9. **`user_reputations`** - Reputation traits (Builder, Connector, Explorer, Pioneer)
10. **`user_streaks`** - Login/quest/event streaks

### Database Access Pattern

```typescript
// From API Routes
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only
)

// Query example
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId)
  .single()
```

**Security**: Row Level Security (RLS) enabled on all tables

---

## Authentication & Identity

### Current: Privy Authentication (v1.0 - Temporary)

**Status**: ⚠️ **Planned for Migration to ZO API Auth**

**DID Format**: `did:privy:clr3j1k2f00...` (stored as `users.id`)

**Supported Auth Methods**:
- Email (magic link)
- Social (Google, Twitter, Discord)
- Crypto Wallets (MetaMask, WalletConnect, Coinbase Wallet)
- Embedded Wallets (Privy-managed)

### Current Auth Flow (Privy)

```typescript
// Client-side (PrivyProvider.tsx)
import { PrivyProvider } from '@privy-io/react-auth'

<PrivyProvider
  appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
  config={{
    loginMethods: ['email', 'wallet', 'google', 'twitter'],
    appearance: {
      theme: 'dark',
      accentColor: '#00FF00'
    }
  }}
>
  {children}
</PrivyProvider>

// Server-side (API routes)
import { PrivyClient } from '@privy-io/server-auth'

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
)

// Verify token
const user = await privy.verifyAuthToken(authToken)
```

---

### Future: ZO API Authentication (v2.0 - Roadmap)

**Status**: 🔄 **Planned Migration**

**Rationale**: ZO API provides native phone-based auth with abstracted wallet creation, eliminating the need for Privy and simplifying the architecture.

**Primary Auth**: Phone Number + OTP  
**Identifier**: ZO Profile ID (`pid`) instead of Privy DID  
**Wallet Strategy**: Backend-managed wallet abstraction (created automatically on signup)

#### Future Auth Flow (ZO API)

```typescript
// 1. Request OTP
POST /api/v1/auth/login/mobile/otp/
{
  mobile_country_code: "+1",
  mobile_number: "5551234567",
  message_channel: "sms"
}

// 2. Verify OTP & Login
POST /api/v1/auth/login/mobile/
{
  mobile_country_code: "+1",
  mobile_number: "5551234567",
  otp: "123456"
}

// Response includes:
{
  token: string,              // Auth token for subsequent requests
  device_id: string,          // Device identifier
  device_secret: string,      // Device secret
  user: {
    id: string,
    pid: string,              // Profile ID (use as primary identifier)
    wallet_address: string,   // Backend-created wallet!
    mobile_number: string,
    membership: "founder" | "none"
  }
}

// 3. Fetch Full Profile
GET /api/v1/profile/me/
Headers: {
  Authorization: "Bearer <token>",
  "client-device-id": "<device_id>",
  "client-device-secret": "<device_secret>"
}

// Response includes ALL profile data:
{
  pid: string,
  first_name: string,
  avatar: { image, metadata, ref_id },
  body_type: "bro" | "bae",
  wallet_address: string,        // Already included!
  web3_verified: boolean,
  pfp_metadata: { ... },         // NFT profile pic
  founder_tokens: string[],      // Owned NFTs
  membership: "founder" | "none"
  // ... full profile
}
```

#### Migration Benefits

| Aspect | Current (Privy) | Future (ZO API) |
|--------|----------------|-----------------|
| **Dependencies** | +2 npm packages | Native API calls |
| **Auth Method** | Email/Social/Wallet | Phone OTP |
| **Identity** | Privy DID | ZO Profile ID (`pid`) |
| **Wallet** | Multi-wallet support | Backend-managed (abstracted) |
| **Profile Source** | Split (Privy + ZO API) | Single source (ZO API) |
| **Data Sync** | Manual sync needed | Automatic (single API) |
| **Latency** | ~800ms (2 systems) | ~400ms (1 system) |
| **Cost** | Privy subscription | $0 |
| **Complexity** | High (DID management) | Low (phone-based) |

#### Migration Plan

**Phase 1: Preparation**
- [ ] Document ZO API auth endpoints
- [ ] Create `lib/zoAuth.ts` service
- [ ] Test phone OTP flow in dev environment

**Phase 2: Database Schema Update**
- [ ] Add `zo_pid` column to `users` table
- [ ] Add `zo_token_hash` for session validation
- [ ] Create migration to preserve existing users

**Phase 3: Dual Auth (Temporary)**
- [ ] Support both Privy DID and ZO PID
- [ ] Allow existing users to migrate accounts
- [ ] New users use ZO API auth only

**Phase 4: Complete Migration**
- [ ] Remove Privy dependencies
- [ ] Update all auth flows to ZO API
- [ ] Deprecate Privy DID column

**Timeline**: TBD (dependent on ZO API access for webapp)

**Reference Documentation**:
- `Docs/ZO_API_DOCUMENTATION.md` - Complete ZO API reference
- `Docs/WALLET_AND_PHONE_TO_PROFILE_FLOW.md` - Phone to wallet abstraction flow

---

### Wallet Abstraction Strategy

The ZO API implements **backend-managed wallet abstraction**:

1. **Automatic Wallet Creation**: When user signs up via phone, backend creates a wallet
2. **Profile Field**: `wallet_address` is just another profile field (not auth method)
3. **Verification**: Optional signature verification sets `web3_verified: true`
4. **NFT Integration**: `founder_tokens` and `pfp_metadata` track NFT ownership
5. **Membership Detection**: `membership` field auto-updates based on NFT holdings

This eliminates the need for complex multi-wallet management while still providing blockchain functionality.

---

## Real-time Systems

### Current State: Polling

- **Avatar Status**: Poll every 1s (max 10 attempts)
- **Leaderboard**: Refresh on page load
- **Quest Status**: Check on component mount

### Future: Supabase Realtime

```typescript
// Example future implementation
const subscription = supabase
  .channel('leaderboard_changes')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'leaderboards' },
    (payload) => {
      console.log('Leaderboard updated:', payload)
      // Update UI
    }
  )
  .subscribe()
```

---

## Deployment Architecture

### Hosting: Vercel

**Build Command**: `npm run build`  
**Output Directory**: `.next`  
**Framework**: Next.js  
**Node Version**: 18.x

### Environment Variables

**Required**:
- `NEXT_PUBLIC_PRIVY_APP_ID`
- `PRIVY_APP_SECRET`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_MAPBOX_TOKEN`

**Optional** (Phase 2):
- `ZO_API_BASE_URL`
- `ZO_CLIENT_KEY_WEB`
- `ZO_CLIENT_DEVICE_ID`
- `ZO_CLIENT_DEVICE_SECRET`

### CDN & Assets

- **Static Files**: `/apps/web/public/` → Vercel CDN
- **Images**: Next.js Image Optimization
- **Videos**: Direct serve from `/public/videos/`

---

## Security Model

### Authentication Security

1. **Privy DID** as primary identity (blockchain-backed)
2. **Server-side token verification** for all API routes
3. **Multi-wallet support** with wallet ownership verification
4. **Session management** via Privy SDK

### Database Security

1. **Row Level Security (RLS)** enabled on all tables
2. **Service role key** used only in API routes (never exposed to client)
3. **Prepared statements** (SQL injection prevention)
4. **Input validation** on all API endpoints

### API Security

1. **CORS** configured for Vercel deployment only
2. **Rate limiting** (future: implement via Vercel Edge Config)
3. **Auth token required** for all protected routes
4. **No sensitive data** in client-side code

---

## Constraints & Boundaries

### ✅ AI Can Edit Safely

- `/apps/web/src/components/` - React components
- `/apps/web/src/hooks/` - Custom hooks
- `/apps/web/src/lib/` utilities (NOT supabase.ts)
- `/Docs/` - Documentation
- `/design/` - Design system

### ⚠️ Requires Human Review

- `/apps/web/src/app/api/` - API routes (security impact)
- `/apps/web/src/lib/supabase.ts` - Database client
- `/apps/web/src/lib/privy.ts` - Auth config
- `/packages/api/migrations/` - Database migrations
- `.env` files - Environment variables

### ❌ AI Must NOT Edit

- `/apps/web/package.json` - Dependencies (breaking changes)
- `/apps/web/next.config.ts` - Build config (deployment impact)
- `/.github/workflows/` - CI/CD (security risk)
- `/packages/contracts/` - Smart contracts (financial risk)

### File Size Limits

- **Components**: Keep under 500 lines (split if larger)
- **API Routes**: Keep under 200 lines
- **Utilities**: Keep under 300 lines
- **Exception**: `MapCanvas.tsx` (1,587 lines - can be refactored)

---

## Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| **First Contentful Paint** | < 1.5s | ~1.2s |
| **Time to Interactive** | < 3s | ~2.5s |
| **Mapbox Load Time** | < 2s | ~1.8s |
| **API Response Time** | < 500ms | ~300ms |
| **Database Query Time** | < 100ms | ~50ms |

---

## Next Steps (Roadmap)

### Phase 2 (Current)
- [ ] Avatar generation UI (ZO API integration)
- [ ] Game1111 data persistence
- [ ] Leaderboard real-time updates

### Phase 3 (Future)
- [ ] Vibe Score implementation
- [ ] Quest Engine v2 (dynamic quests)
- [ ] Node activation system
- [ ] City progression tracking

### Phase 4 (Future)
- [ ] Mobile app (React Native) - separate repo
- [ ] Real-time chat (Supabase Realtime)
- [ ] NFT gating for founder perks
- [ ] Token staking & rewards

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-13  
**Maintained By**: Development Team  
**Status**: ✅ Active & Complete


# Zo World Map (ZOHM) - Database Schema Documentation

**Database**: Supabase (PostgreSQL 15)  
**Last Updated**: November 22, 2025  
**Version**: 4.0 (ZO API Auth, Privy Removed)

---

## Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Tables Reference](#tables-reference)
4. [Relationships & Foreign Keys](#relationships--foreign-keys)
5. [Indexes](#indexes)
6. [Triggers & Functions](#triggers--functions)
7. [RLS Policies](#rls-policies)
8. [Data Flow](#data-flow)
9. [Sample Queries](#sample-queries)

---

## Overview

### Technology Stack
- **Database**: PostgreSQL 15 (hosted on Supabase)
- **ORM/Client**: `@supabase/supabase-js` v2.52.0
- **Authentication**: ZO API (phone-based authentication)
- **Migrations**: Managed via Supabase Dashboard (not committed to git)

### Key Features
- **ZO API authentication**: Phone-based OTP authentication (Privy removed Nov 2024)
- **Multi-wallet support**: Users can link Ethereum/Base wallets (optional for web3 features)
- **Auto-updating leaderboards**: PostgreSQL triggers update rankings automatically
- **Quest system**: Repeatable quests with cooldowns and rewards
- **City progression**: Gamified city-level growth system (5 stages)
- **Individual progression**: Reputation (4 traits), streaks (4 types), inventory tracking
- **Canonical events**: Deduplicated event storage with geocoding cache (reduces Mapbox API costs by ~70%)
- **Row-Level Security (RLS)**: User-level access control (enabled on auth tables)

### Migration History
**Note**: Migrations are managed via Supabase Dashboard, not committed to git [[memory:11179047]].

Major schema changes:
1. **Foundation** - Initial tables (users, quests, completed_quests, leaderboards)
2. **Individual Progression** - Quest repeatability, reputation (4 traits), streaks (4 types), inventory
3. **City Progression** - 5-stage city growth, community goals, city sync
4. **Canonical Events** - Deduplicated event store with geocoding cache
5. **ZO API Auth** (Nov 2024) - Replaced Privy with ZO API authentication, simplified user table

---

## Database Architecture

### Entity Relationship Diagram (Conceptual)

```
┌─────────────┐
│   users     │ (Primary identity, keyed by Privy DID)
└──────┬──────┘
       │
       ├─── 1:N ───> user_wallets (Multiple wallets per user)
       │
       ├─── 1:N ───> user_auth_methods (Multiple auth methods per user)
       │
       ├─── 1:N ───> completed_quests (Quest completion history)
       │
       ├─── 1:1 ───> leaderboards (Ranking entry)
       │
       ├─── 1:N ───> user_reputations (4 reputation traits: Builder, Connector, Explorer, Pioneer)
       │
       ├─── 1:N ───> user_streaks (4 streak types: login, quest, event, checkin)
       │
       ├─── 1:N ───> user_inventory (Badges, NFTs, collectibles)
       │
       └─── N:1 ───> cities (Home city reference)
                        │
                        ├─── 1:N ───> city_progress (User contributions to city)
                        │
                        └─── 1:N ───> community_goals (City-level quests)

┌─────────────┐
│   quests    │
└──────┬──────┘
       │
       └─── 1:N ───> completed_quests

┌─────────────┐
│   nodes     │ (Zo Houses & partner locations)
└─────────────┘

┌─────────────┐
│ calendars   │ (Event calendar sources)
└─────────────┘
```

---

## Tables Reference

### 1. `users`
**Purpose**: Main user identity table, keyed by ZO User ID

```sql
CREATE TABLE users (
  -- Identity
  id TEXT PRIMARY KEY,                      -- ZO User ID (phone-based)
  
  -- Profile
  name TEXT,                                -- Display name (format: "ishaan.zo")
  bio TEXT,
  pfp TEXT,                                 -- Profile picture URL
  culture TEXT,                             -- Cultural affinity (18 types)
  
  -- Authentication & Contact
  email TEXT,                               -- Primary email from ZO profile
  x_handle TEXT,                            -- Twitter handle
  x_connected BOOLEAN DEFAULT FALSE,
  
  -- Location
  lat NUMERIC,                              -- Latitude
  lng NUMERIC,                              -- Longitude
  city TEXT,                                -- City name (deprecated, use home_city_id)
  home_city_id TEXT REFERENCES cities(id), -- FK to cities table
  city_synced_at TIMESTAMP,                -- When user synced home city
  city_sync_count INTEGER DEFAULT 0,       -- Number of times synced
  
  -- Role & Status
  role TEXT DEFAULT 'Member',               -- 'Founder' | 'Member' | 'Citizen'
  founder_nfts_count INTEGER DEFAULT 0,
  user_tier TEXT DEFAULT 'prospect',        -- 'prospect' | 'settler' | 'pioneer' | 'elder' | 'legend'
  
  -- Gamification
  zo_balance NUMERIC DEFAULT 0,             -- User's $ZO token balance
  total_reputation_score INTEGER DEFAULT 0, -- Sum of all reputation traits
  last_streak_at TIMESTAMP,                 -- Last streak activity
  
  -- URLs & Links
  calendar_url TEXT,
  main_quest_url TEXT,
  side_quest_url TEXT,
  
  -- Onboarding State
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_users_email` ON `(email)`
- `idx_users_role` ON `(role)`
- `idx_users_culture` ON `(culture)`
- `idx_users_x_handle` ON `(x_handle)`
- `idx_users_location` ON `(lat, lng)`
- `idx_users_last_seen` ON `(last_seen)`
- `idx_users_home_city` ON `(home_city_id)`
- `idx_users_tier` ON `(user_tier)`
- `idx_users_zo_balance` ON `(zo_balance DESC)`

**Constraints**:
- `user_tier` CHECK: Must be in ('prospect', 'settler', 'pioneer', 'elder', 'legend')

---

### 2. `user_wallets`
**Purpose**: Multiple wallets per user (optional, for web3 features)

```sql
CREATE TABLE user_wallets (
  -- Identity
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Foreign Key
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Wallet Information
  address TEXT NOT NULL UNIQUE,             -- Ethereum address (0x...)
  chain_type TEXT DEFAULT 'ethereum',       -- 'ethereum' | 'base' | 'polygon' | 'avalanche' | 'solana'
  
  -- Wallet Source
  wallet_client TEXT,                       -- 'metamask' | 'coinbase_wallet' | 'walletconnect' | 'rainbow'
  wallet_client_type TEXT,                  -- 'metamask.io.snap' | 'coinbase.wallet' | etc.
  is_embedded BOOLEAN DEFAULT FALSE,        -- Reserved for future use
  
  -- Primary Wallet Flag
  is_primary BOOLEAN DEFAULT FALSE,         -- One primary wallet per user for transactions
  
  -- Verification
  is_verified BOOLEAN DEFAULT TRUE,         -- Has user proven ownership?
  verified_at TIMESTAMP,
  
  -- Timestamps
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, address)
);
```

**Indexes**:
- `idx_user_wallets_user_id` ON `(user_id)`
- `idx_user_wallets_address` ON `(address)`
- `idx_user_wallets_primary` ON `(user_id, is_primary)` WHERE `is_primary = true`
- `idx_user_wallets_chain` ON `(chain_type)`

---

### 3. `user_auth_methods`
**Purpose**: Track authentication methods (legacy table, may be deprecated)

**Note**: This table is from the Privy era and may not be actively used with ZO API authentication.

```sql
CREATE TABLE user_auth_methods (
  -- Identity
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Foreign Key
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Auth Method Type
  auth_type TEXT NOT NULL,                  -- 'phone' | 'email' | 'twitter' | 'wallet'
  
  -- Auth Method Details
  identifier TEXT NOT NULL,                 -- Phone number, email, or wallet address
  display_name TEXT,                        -- Display name
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  
  -- Timestamps
  linked_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP,
  
  -- Constraints
  UNIQUE(user_id, auth_type, identifier)
);
```

**Indexes**:
- `idx_user_auth_user_id` ON `(user_id)`
- `idx_user_auth_type` ON `(auth_type)`
- `idx_user_auth_identifier` ON `(identifier)`

**Status**: ⚠️ Legacy table from Privy era, may be removed in future cleanup

---

### 4. `quests`
**Purpose**: Quest definitions (repeatable and one-time)

```sql
CREATE TABLE quests (
  -- Identity
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE,                         -- Human-readable identifier (e.g., 'voice-sync-quest')
  
  -- Quest Details
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reward INTEGER NOT NULL,                  -- Default $ZO points
  status TEXT,                              -- 'active' | 'completed' | 'developing'
  
  -- Categorization
  category TEXT DEFAULT 'one-time',         -- 'daily' | 'weekly' | 'seasonal' | 'one-time' | 'node' | 'pioneer' | 'city'
  cooldown_hours INTEGER DEFAULT 0,         -- Hours before quest can be repeated (0 = not repeatable)
  
  -- Requirements & Rewards
  requirements JSONB DEFAULT '{}',          -- { "min_level": 5, "required_items": [] }
  rewards_breakdown JSONB DEFAULT '{}',     -- { "zo_tokens": 200, "reputation": {"Explorer": 10}, "items": [] }
  
  -- Availability
  active_from TIMESTAMP,                    -- Quest becomes available
  active_until TIMESTAMP,                   -- Quest expires
  max_completions INTEGER,                  -- Max times quest can be completed (NULL = unlimited)
  
  -- Future: Geolocation (from QUESTS_GEOLOCATION_PLAN.md)
  -- latitude DOUBLE PRECISION,
  -- longitude DOUBLE PRECISION,
  -- location_name TEXT,
  -- address TEXT,
  -- city TEXT,
  -- country TEXT
);
```

**Indexes**:
- `idx_quests_slug` ON `(slug)`
- `idx_quests_category` ON `(category)`
- `idx_quests_active` ON `(active_from, active_until)`

**Sample Data**:
```sql
INSERT INTO quests (slug, title, description, reward, category, cooldown_hours, rewards_breakdown)
VALUES (
  'voice-sync-quest',
  'Quantum Voice Sync',
  'Sync your voice frequency with the quantum field. Stop the counter at 1111 to win maximum rewards!',
  200,
  'daily',
  12,
  '{"zo_tokens": 200, "reputation": {"Explorer": 10}, "items": [{"type": "badge", "id": "voice-sync-winner"}]}'::jsonb
);
```

---

### 5. `completed_quests`
**Purpose**: Quest completion history (repeatable allowed)

```sql
CREATE TABLE completed_quests (
  -- Identity
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- References
  user_id TEXT REFERENCES users(id),        -- FK to users (new)
  wallet_address TEXT NOT NULL,             -- Wallet that completed quest (for backward compatibility)
  quest_id TEXT NOT NULL,
  
  -- Completion Details
  completed_at TIMESTAMP DEFAULT NOW(),
  transaction_hash TEXT,                    -- On-chain verification (if applicable)
  amount NUMERIC,                           -- Token amount awarded (large number, not GPS coords!)
  score INTEGER,                            -- Quest score (e.g., 1111 for voice-sync-quest)
  
  -- Location (where quest was completed)
  location TEXT,                            -- Location name
  latitude NUMERIC(20,18),                  -- GPS latitude (high precision for coords)
  longitude NUMERIC(20,18),                 -- GPS longitude (high precision for coords)
  
  -- Metadata
  metadata JSONB,                           -- { "reward_zo": 420, "reputation_delta": {...}, "items_awarded": [...] }
  
  created_at TIMESTAMP DEFAULT NOW()
  
  -- NOTE: NO unique constraint - allows repeatable quests!
);
```

**Indexes**:
- `idx_completed_quests_user_id` ON `(user_id)`
- `idx_completed_quests_wallet` ON `(wallet_address)`
- `idx_completed_quests_quest` ON `(quest_id)`
- `idx_completed_quests_quest_user` ON `(quest_id, user_id)`
- `idx_completed_quests_completed_at` ON `(completed_at DESC)`

**Important**: The unique constraint `unique_wallet_quest` was **removed** in migration 002 to allow repeatable quests with cooldowns.

---

### 6. `leaderboards`
**Purpose**: User rankings (auto-updated via trigger)

```sql
CREATE TABLE leaderboards (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User References (both for backward compatibility)
  user_id TEXT REFERENCES users(id) UNIQUE, -- Primary key for lookups
  wallet TEXT,                              -- Nullable (for backward compatibility)
  username TEXT DEFAULT 'Anon',
  
  -- Stats (auto-calculated)
  zo_points INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  last_quest_completed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_leaderboards_user_id` ON `(user_id)`
- `idx_leaderboards_wallet` ON `(wallet)`
- `idx_leaderboards_zo_points` ON `(zo_points DESC)`
- `idx_leaderboards_updated_at` ON `(updated_at DESC)`

**Constraints**:
- `leaderboards_user_id_unique` UNIQUE `(user_id)`

---

### 7. `user_reputations`
**Purpose**: Multi-track reputation system (4 traits)

```sql
CREATE TABLE user_reputations (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Reputation Track
  trait TEXT NOT NULL,                      -- 'Builder' | 'Connector' | 'Explorer' | 'Pioneer'
  score INTEGER DEFAULT 0 CHECK (score >= 0),
  
  -- Timestamp
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, trait)
);
```

**Indexes**:
- `idx_user_reputations_user_id` ON `(user_id)`
- `idx_user_reputations_trait` ON `(trait)`
- `idx_user_reputations_score` ON `(score DESC)`

**Constraints**:
- `trait` CHECK: Must be in ('Builder', 'Connector', 'Explorer', 'Pioneer')
- `score` CHECK: Must be >= 0

**Reputation System**:
- **Builder**: Awarded for completing node quests, contributing to Zo Houses
- **Connector**: Awarded for attending events, inviting friends
- **Explorer**: Awarded for completing exploration quests, visiting new nodes
- **Pioneer**: Awarded for being early adopter, completing seasonal quests

---

### 8. `user_streaks`
**Purpose**: Activity streak tracking (4 types)

```sql
CREATE TABLE user_streaks (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Streak Type
  streak_type TEXT NOT NULL,                -- 'login' | 'quest' | 'event' | 'checkin'
  
  -- Streak Stats
  count INTEGER DEFAULT 0 CHECK (count >= 0),
  longest_streak INTEGER DEFAULT 0 CHECK (longest_streak >= 0),
  last_action_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, streak_type)
);
```

**Indexes**:
- `idx_user_streaks_user_id` ON `(user_id)`
- `idx_user_streaks_type` ON `(streak_type)`

**Constraints**:
- `streak_type` CHECK: Must be in ('login', 'quest', 'event', 'checkin')
- `count` CHECK: Must be >= 0
- `longest_streak` CHECK: Must be >= 0

**Streak Logic**:
- **Consecutive Days**: If last action was yesterday, increment count
- **Same Day**: If last action was today, keep current count
- **Broken Streak**: If last action was > 1 day ago, reset count to 1

---

### 9. `user_inventory`
**Purpose**: User's collected items (badges, NFTs, collectibles)

```sql
CREATE TABLE user_inventory (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Item Details
  item_type TEXT NOT NULL,                  -- 'badge' | 'nft' | 'collectible' | 'item'
  item_id TEXT NOT NULL,                    -- Unique item identifier (e.g., 'voice-sync-winner')
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',              -- { "rarity": "legendary", "image_url": "...", "attributes": [] }
  
  -- Timestamp
  acquired_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, item_type, item_id)
);
```

**Indexes**:
- `idx_user_inventory_user_id` ON `(user_id)`
- `idx_user_inventory_type` ON `(item_type)`

**Constraints**:
- `item_type` CHECK: Must be in ('badge', 'nft', 'collectible', 'item')
- `quantity` CHECK: Must be >= 0

---

### 10. `cities`
**Purpose**: City definitions and progression tracking

```sql
CREATE TABLE cities (
  -- Identity
  id TEXT PRIMARY KEY,                      -- Format: "san-francisco-us" (slug)
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  state_province TEXT,
  
  -- Location
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  timezone TEXT,
  
  -- City Progression (5 stages)
  stage INTEGER DEFAULT 1 CHECK (stage >= 1 AND stage <= 5),
  -- Stages:
  -- 1 = Prospect (0-10 active users)
  -- 2 = Outpost (11-50 active users, 1+ node)
  -- 3 = District (51-200 active users, 3+ nodes)
  -- 4 = City Center (201-1000 active users, 10+ nodes)
  -- 5 = Network Hub (1000+ active users, 20+ nodes)
  
  -- Metrics (auto-updated via triggers)
  population_total INTEGER DEFAULT 0,       -- Total users with this as home city
  population_active INTEGER DEFAULT 0,      -- Users active in last 30 days
  node_count INTEGER DEFAULT 0,             -- Zo Houses in this city
  total_quests_completed INTEGER DEFAULT 0,
  total_zo_earned NUMERIC DEFAULT 0,
  
  -- Economy (future blockchain integration)
  token_address TEXT,                       -- City token contract address
  treasury_balance NUMERIC DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,       -- { "landmarks": [], "featured_events": [], "climate": "" }
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_cities_stage` ON `(stage)`
- `idx_cities_country` ON `(country)`
- `idx_cities_location` ON `(latitude, longitude)`
- `idx_cities_population` ON `(population_total DESC)`

**Constraints**:
- `stage` CHECK: Must be between 1 and 5

**Seed Data** (8 major cities):
- San Francisco, US (Stage 4, 2 nodes)
- Bangalore, India (Stage 4, 3 nodes)
- Singapore (Stage 3, 1 node)
- Mumbai, India (Stage 3, 1 node)
- Taipei, Taiwan (Stage 2, 1 node)
- Dubai, UAE (Stage 2, 1 node)
- London, UK (Stage 2, 1 node)
- New York, US (Stage 2, 1 node)

---

### 11. `city_progress`
**Purpose**: Track user contributions to specific cities

```sql
CREATE TABLE city_progress (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contribution Tracking
  quests_completed INTEGER DEFAULT 0,
  zo_earned INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  nodes_visited INTEGER DEFAULT 0,
  
  -- Timestamps
  first_contribution_at TIMESTAMP DEFAULT NOW(),
  last_contribution_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(city_id, user_id)
);
```

**Indexes**:
- `idx_city_progress_city` ON `(city_id)`
- `idx_city_progress_user` ON `(user_id)`
- `idx_city_progress_contributions` ON `(city_id, zo_earned DESC)`

---

### 12. `community_goals`
**Purpose**: City-level quests and community challenges

```sql
CREATE TABLE community_goals (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  
  -- Goal Definition
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_type TEXT NOT NULL,                  -- 'quests' | 'events' | 'nodes' | 'users' | 'custom'
  
  -- Progress Tracking
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  current_value INTEGER DEFAULT 0 CHECK (current_value >= 0),
  
  -- Rewards
  rewards_breakdown JSONB DEFAULT '{}',     -- { "zo_per_contributor": 500, "city_treasury": 10000 }
  
  -- Status
  status TEXT DEFAULT 'active',             -- 'active' | 'completed' | 'expired'
  active_from TIMESTAMP DEFAULT NOW(),
  active_until TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_community_goals_city` ON `(city_id)`
- `idx_community_goals_status` ON `(status)`
- `idx_community_goals_active` ON `(city_id, status, active_until)`

**Constraints**:
- `goal_type` CHECK: Must be in ('quests', 'events', 'nodes', 'users', 'custom')
- `status` CHECK: Must be in ('active', 'completed', 'expired')
- `target_value` CHECK: Must be > 0
- `current_value` CHECK: Must be >= 0

---

### 13. `nodes`
**Purpose**: Zo Houses and partner locations

```sql
CREATE TABLE nodes (
  -- Identity
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  
  -- Type & Status
  type TEXT NOT NULL,                       -- 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone' | 'staynode'
  status TEXT NOT NULL,                     -- 'active' | 'developing' | 'planning'
  
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
  features TEXT[] DEFAULT '{}',             -- Array: ['coworking', 'coliving', 'events', 'cafe', ...]
  image TEXT,
  
  -- Timestamps
  inserted_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_nodes_type` ON `(type)`
- `idx_nodes_city_country` ON `(city, country)`
- `idx_nodes_location` ON `(latitude, longitude)`

**Constraints**:
- `type` CHECK: Must be in ('hacker_space', 'culture_house', 'schelling_point', 'flo_zone', 'staynode')
- `status` CHECK: Must be in ('active', 'developing', 'planning')

---

### 14. `calendars`
**Purpose**: Event calendar sources (Luma, iCal, Google, Outlook)

```sql
CREATE TABLE calendars (
  -- Identity
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Calendar Details
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,                       -- 'luma' | 'ical' | 'google' | 'outlook'
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadata
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes**:
- `idx_calendars_active` ON `(is_active)`
- `idx_calendars_type` ON `(type)`

**Constraints**:
- `type` CHECK: Must be in ('luma', 'ical', 'google', 'outlook')

---

### 15. `canonical_events`
**Purpose**: Deduplicated event storage with geocoding cache

```sql
CREATE TABLE canonical_events (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Deduplication key (SHA256 hash of normalized event data)
  canonical_uid TEXT NOT NULL UNIQUE,
  
  -- Event metadata
  title TEXT NOT NULL,
  description TEXT,
  location_raw TEXT,
  
  -- Geocoded coordinates (cached to reduce API costs)
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  geocode_status TEXT DEFAULT 'pending',  -- 'pending' | 'success' | 'failed' | 'cached'
  geocode_attempted_at TIMESTAMPTZ,
  
  -- Timezone-aware timestamps
  starts_at TIMESTAMPTZ NOT NULL,
  tz TEXT DEFAULT 'UTC',                  -- Original timezone from iCal
  ends_at TIMESTAMPTZ,
  
  -- Source tracking (array of {calendar_id, event_url, fetched_at})
  source_refs JSONB NOT NULL DEFAULT '[]',
  
  -- Raw iCal data for debugging/re-processing
  raw_payload JSONB,
  
  -- Versioning for audit trail
  event_version INTEGER DEFAULT 1,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**:
- `idx_canonical_events_starts_at` ON `(starts_at)` - For chronological queries
- `idx_canonical_events_location` ON `(lat, lng)` WHERE lat IS NOT NULL - For location queries
- `idx_canonical_events_uid` ON `(canonical_uid)` - For deduplication lookups
- `idx_canonical_events_geocode_status` ON `(geocode_status)` - For filtering by geocoding status

**Constraints**:
- `geocode_status` CHECK: Must be in ('pending', 'success', 'failed', 'cached')

**Triggers**:
- `trigger_update_canonical_events_updated_at` - Auto-update `updated_at` on row changes

**Purpose**:
- Consolidates events from multiple calendar sources
- Caches geocoding results to reduce Mapbox API costs (~70% reduction)
- Deduplicates events using canonical UID (SHA256 hash)
- Stores timezone information for accurate display
- Enables fast queries for map interface

**Typical Query**:
```sql
-- Get upcoming events near San Francisco
SELECT title, location_raw, starts_at, geocode_status
FROM canonical_events
WHERE starts_at >= NOW()
  AND lat IS NOT NULL
  AND lng IS NOT NULL
  AND ST_Distance(
      ST_MakePoint(lng, lat)::geography,
      ST_MakePoint(-122.4194, 37.7749)::geography
    ) < 100000  -- 100km radius
ORDER BY starts_at
LIMIT 50;
```

---

### 16. `canonical_event_changes`
**Purpose**: Audit trail for all event operations

```sql
CREATE TABLE canonical_event_changes (
  -- Identity
  id BIGSERIAL PRIMARY KEY,
  
  -- Reference to canonical event (nullable for dry-run logs)
  canonical_event_id UUID REFERENCES canonical_events(id) ON DELETE CASCADE,
  
  -- Change type: 'dry-run', 'insert', 'update', 'delete', 'merge'
  change_type TEXT NOT NULL,
  
  -- Full payload of the change (for audit and rollback)
  payload JSONB,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Indexes**:
- `idx_event_changes_type` ON `(change_type)` - For filtering by operation type
- `idx_event_changes_created` ON `(created_at)` - For chronological queries
- `idx_event_changes_event_id` ON `(canonical_event_id)` - For event history

**Constraints**:
- `change_type` CHECK: Must be in ('dry-run', 'insert', 'update', 'delete', 'merge')

**Purpose**:
- Tracks all operations on canonical events
- Enables dry-run mode for safe testing
- Provides audit trail for debugging
- Supports rollback scenarios

**Typical Query**:
```sql
-- View recent event operations
SELECT 
  change_type,
  payload->>'event_name' as event,
  payload->>'action' as action,
  created_at
FROM canonical_event_changes
ORDER BY created_at DESC
LIMIT 20;
```

---

## Relationships & Foreign Keys

### Foreign Key Relationships

```
users (id) <── user_wallets (user_id)
users (id) <── user_auth_methods (user_id)
users (id) <── completed_quests (user_id)
users (id) <── leaderboards (user_id)
users (id) <── user_reputations (user_id)
users (id) <── user_streaks (user_id)
users (id) <── user_inventory (user_id)
users (id) <── city_progress (user_id)

cities (id) <── users (home_city_id)
cities (id) <── city_progress (city_id)
cities (id) <── community_goals (city_id)

quests (id) <── completed_quests (quest_id)
```

### Cascade Behavior

**ON DELETE CASCADE**:
- `user_wallets` → deletes all wallets when user deleted
- `user_auth_methods` → deletes all auth methods when user deleted
- `user_reputations` → deletes all reputation entries when user deleted
- `user_streaks` → deletes all streaks when user deleted
- `user_inventory` → deletes all inventory items when user deleted
- `city_progress` → deletes city contributions when user or city deleted
- `community_goals` → deletes goals when city deleted

---

## Indexes

### Performance Indexes

**Lookup Indexes** (for foreign key joins):
- All foreign key columns have indexes for fast joins

**Sorting Indexes** (for leaderboards):
- `leaderboards.zo_points DESC`
- `users.zo_balance DESC`
- `user_reputations.score DESC`
- `cities.population_total DESC`

**Filtering Indexes** (for WHERE clauses):
- `users.role`, `users.culture`, `users.user_tier`
- `quests.category`, `quests.slug`
- `nodes.type`, `nodes.status`
- `calendars.is_active`

**Geospatial Indexes** (for location queries):
- `users(lat, lng)`
- `cities(latitude, longitude)`
- `nodes(latitude, longitude)`

---

## Triggers & Functions

### 1. Auto-Update `updated_at` Column

**Function**:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Trigger**:
```sql
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Applied to**: `users`, `cities`, `community_goals`

---

### 2. Auto-Update Stats on Quest Completion

**Function**: `on_completed_quest_update_stats()`

**Trigger**: `trigger_quest_completion` on `completed_quests` (AFTER INSERT)

**What it does**:
1. Updates `users.zo_balance` with token reward
2. Updates `user_reputations` from `metadata.reputation_delta`
3. Awards items to `user_inventory` from `metadata.items_awarded`
4. Upserts `leaderboards` entry (increments points, quest count)
5. Updates `user_streaks` for quest streak tracking

**Example metadata structure**:
```json
{
  "reward_zo": 420,
  "reputation_delta": {
    "Explorer": 10,
    "Pioneer": 5
  },
  "items_awarded": [
    {
      "type": "badge",
      "id": "voice-sync-winner",
      "quantity": 1
    }
  ],
  "quest_title": "Quantum Voice Sync",
  "completed_via": "web_app"
}
```

**Location**: `/migrations/002_foundation_individual_progression.sql` (lines 192-265)

---

### 3. Auto-Update City Population

**Function**: `update_city_population()`

**Trigger**: `update_city_population_trigger` on `users` (AFTER INSERT OR UPDATE OF home_city_id)

**What it does**:
1. When user sets `home_city_id`:
   - Increments `cities.population_total` for new city
   - Decrements `cities.population_total` for old city (if changing)
2. Recalculates `cities.stage` based on population:
   - Stage 1: 0-10 users
   - Stage 2: 11-50 users
   - Stage 3: 51-200 users
   - Stage 4: 201-1000 users
   - Stage 5: 1000+ users

**Location**: `/migrations/003_city_progression.sql` (lines 159-226)

---

### 4. Utility Functions

#### `get_user_by_identifier(identifier_value TEXT)`

**Purpose**: Get user by any identifier (Privy DID, email, or wallet address)

**Returns**: Table with `(user_id, name, email, primary_wallet, role)`

**Usage**:
```sql
SELECT * FROM get_user_by_identifier('did:privy:clr3j1k2f00...');
SELECT * FROM get_user_by_identifier('user@example.com');
SELECT * FROM get_user_by_identifier('0x1234...');
```

---

#### `set_primary_wallet(user_id_param TEXT, wallet_address_param TEXT)`

**Purpose**: Set a wallet as primary for a user

**Returns**: BOOLEAN (TRUE if successful, FALSE if wallet doesn't belong to user)

**Usage**:
```sql
SELECT set_primary_wallet('did:privy:...', '0x1234...');
```

---

## RLS Policies

### Row-Level Security (RLS) Enabled on:
- `users`
- `user_wallets`
- `user_auth_methods`

### Policies

#### Users Table
```sql
-- Users can read their own data
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own data
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid()::text = id);

-- Service role can do anything (for server-side operations)
CREATE POLICY users_service_role ON users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

#### User Wallets Table
```sql
-- Users can read their own wallets
CREATE POLICY user_wallets_select_own ON user_wallets
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Users can insert their own wallets
CREATE POLICY user_wallets_insert_own ON user_wallets
  FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Service role can do anything
CREATE POLICY wallets_service_role ON user_wallets
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

#### User Auth Methods Table
```sql
-- Users can read their own auth methods
CREATE POLICY user_auth_select_own ON user_auth_methods
  FOR SELECT
  USING (auth.uid()::text = user_id);

-- Service role can do anything
CREATE POLICY auth_methods_service_role ON user_auth_methods
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
```

---

## Data Flow

### Quest Completion Flow

```
1. User completes quest in app
       ↓
2. API: POST /api/quests/complete
       ↓
3. INSERT INTO completed_quests
       ↓
4. TRIGGER: on_completed_quest_update_stats()
       ↓
   ├── UPDATE users.zo_balance
   ├── UPSERT user_reputations
   ├── INSERT user_inventory
   ├── UPSERT leaderboards
   └── UPSERT user_streaks
       ↓
5. UI: Display success + updated stats
```

### City Sync Flow

```
1. User syncs home city via "Map your Sync"
       ↓
2. UPDATE users SET home_city_id = 'san-francisco-us'
       ↓
3. TRIGGER: update_city_population()
       ↓
   ├── UPDATE cities.population_total += 1 (new city)
   ├── UPDATE cities.population_total -= 1 (old city, if exists)
   └── UPDATE cities.stage (based on new population)
       ↓
4. Award reputation: 200 points to city_sync trait
       ↓
5. UI: Show success animation
```

### Leaderboard Update Flow

```
Quest Completed
       ↓
completed_quests INSERT
       ↓
Trigger extracts metadata.reward_zo (default: 420)
       ↓
UPSERT leaderboards (user_id)
       ↓
   ├── zo_points += reward_zo
   ├── total_quests_completed += 1
   ├── last_quest_completed_at = NOW()
   └── updated_at = NOW()
       ↓
Next SELECT * FROM leaderboards ORDER BY zo_points DESC
shows updated rankings instantly
```

---

## Sample Queries

### User Queries

#### Get user with all wallets
```sql
SELECT 
  u.*,
  json_agg(
    json_build_object(
      'address', uw.address,
      'chain_type', uw.chain_type,
      'is_primary', uw.is_primary
    )
  ) FILTER (WHERE uw.address IS NOT NULL) as wallets
FROM users u
LEFT JOIN user_wallets uw ON u.id = uw.user_id
WHERE u.id = '<zo_user_id>'
GROUP BY u.id;
```

#### Get user's reputation breakdown
```sql
SELECT 
  u.name,
  u.total_reputation_score,
  json_object_agg(
    ur.trait, ur.score
  ) as reputation_breakdown
FROM users u
LEFT JOIN user_reputations ur ON u.id = ur.user_id
WHERE u.id = '<zo_user_id>'
GROUP BY u.id, u.name, u.total_reputation_score;
```

#### Get user's inventory
```sql
SELECT 
  item_type,
  item_id,
  quantity,
  metadata,
  acquired_at
FROM user_inventory
WHERE user_id = '<zo_user_id>'
ORDER BY acquired_at DESC;
```

---

### Quest Queries

#### Get available quests for user (with cooldown check)
```sql
SELECT 
  q.*,
  MAX(cq.completed_at) as last_completed_at,
  CASE 
    WHEN q.cooldown_hours = 0 THEN 'one-time'
    WHEN MAX(cq.completed_at) IS NULL THEN 'available'
    WHEN NOW() >= MAX(cq.completed_at) + (q.cooldown_hours || ' hours')::interval THEN 'available'
    ELSE 'cooldown'
  END as availability_status,
  CASE 
    WHEN MAX(cq.completed_at) IS NOT NULL AND q.cooldown_hours > 0 
    THEN MAX(cq.completed_at) + (q.cooldown_hours || ' hours')::interval
    ELSE NULL
  END as available_at
FROM quests q
LEFT JOIN completed_quests cq 
  ON q.id = cq.quest_id AND cq.user_id = 'did:privy:clr3j1k2f00...'
WHERE q.status = 'active'
  AND (q.active_from IS NULL OR q.active_from <= NOW())
  AND (q.active_until IS NULL OR q.active_until >= NOW())
GROUP BY q.id;
```

#### Get user's quest history
```sql
SELECT 
  cq.completed_at,
  q.title,
  q.category,
  cq.amount as tokens_earned,
  cq.score,
  cq.location,
  cq.metadata
FROM completed_quests cq
JOIN quests q ON cq.quest_id = q.id
WHERE cq.user_id = '<zo_user_id>'
ORDER BY cq.completed_at DESC
LIMIT 50;
```

---

### Leaderboard Queries

#### Top 100 users by $ZO points
```sql
SELECT 
  rank() OVER (ORDER BY zo_points DESC) as rank,
  username,
  zo_points,
  total_quests_completed,
  last_quest_completed_at
FROM leaderboards
WHERE zo_points > 0
ORDER BY zo_points DESC
LIMIT 100;
```

#### City leaderboard (top contributors)
```sql
SELECT 
  rank() OVER (ORDER BY cp.zo_earned DESC) as rank,
  u.name,
  cp.zo_earned,
  cp.quests_completed,
  cp.events_attended,
  cp.nodes_visited
FROM city_progress cp
JOIN users u ON cp.user_id = u.id
WHERE cp.city_id = 'san-francisco-us'
ORDER BY cp.zo_earned DESC
LIMIT 50;
```

#### Reputation leaderboard (specific trait)
```sql
SELECT 
  rank() OVER (ORDER BY ur.score DESC) as rank,
  u.name,
  ur.score,
  ur.updated_at
FROM user_reputations ur
JOIN users u ON ur.user_id = u.id
WHERE ur.trait = 'Explorer'
ORDER BY ur.score DESC
ORDER BY ur.score DESC
LIMIT 100;
```

---

### City Queries

#### Get city with stats
```sql
SELECT 
  c.*,
  COUNT(DISTINCT u.id) as current_population,
  COUNT(DISTINCT cg.id) as active_goals
FROM cities c
LEFT JOIN users u ON c.id = u.home_city_id
LEFT JOIN community_goals cg ON c.id = cg.city_id AND cg.status = 'active'
WHERE c.id = 'san-francisco-us'
GROUP BY c.id;
```

#### Get cities by stage
```sql
SELECT 
  stage,
  COUNT(*) as city_count,
  SUM(population_total) as total_population,
  SUM(node_count) as total_nodes
FROM cities
GROUP BY stage
ORDER BY stage DESC;
```

#### Find nearby cities (within 500km)
```sql
SELECT 
  c.name,
  c.country,
  c.population_total,
  c.stage,
  -- Haversine distance formula
  6371 * acos(
    cos(radians(37.7749)) * cos(radians(c.latitude)) * 
    cos(radians(c.longitude) - radians(-122.4194)) + 
    sin(radians(37.7749)) * sin(radians(c.latitude))
  ) AS distance_km
FROM cities c
WHERE 6371 * acos(
  cos(radians(37.7749)) * cos(radians(c.latitude)) * 
  cos(radians(c.longitude) - radians(-122.4194)) + 
  sin(radians(37.7749)) * sin(radians(c.latitude))
) <= 500
ORDER BY distance_km;
```

---

### Analytics Queries

#### Daily active users
```sql
SELECT 
  DATE(last_seen) as date,
  COUNT(DISTINCT id) as dau
FROM users
WHERE last_seen >= NOW() - INTERVAL '30 days'
GROUP BY DATE(last_seen)
ORDER BY date DESC;
```

#### Quest completion rate by category
```sql
SELECT 
  q.category,
  COUNT(DISTINCT cq.user_id) as unique_completers,
  COUNT(*) as total_completions,
  AVG(cq.score) as avg_score
FROM completed_quests cq
JOIN quests q ON cq.quest_id = q.id
WHERE cq.completed_at >= NOW() - INTERVAL '30 days'
GROUP BY q.category
ORDER BY total_completions DESC;
```

#### User growth by month
```sql
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_users,
  SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('month', created_at)) as cumulative_users
FROM users
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month;
```

---

## Database Maintenance

### Recalculate Leaderboard (if sync lost)
```sql
-- Clear existing leaderboards
TRUNCATE leaderboards;

-- Recalculate from completed_quests
INSERT INTO leaderboards (user_id, wallet, username, zo_points, total_quests_completed, last_quest_completed_at)
SELECT 
  cq.user_id,
  uw.address,
  u.name,
  COALESCE(SUM(cq.amount), 0) as zo_points,
  COUNT(*) as total_quests,
  MAX(cq.completed_at) as last_completed
FROM completed_quests cq
JOIN users u ON cq.user_id = u.id
LEFT JOIN user_wallets uw ON u.id = uw.user_id AND uw.is_primary = true
GROUP BY cq.user_id, uw.address, u.name;
```

### Recalculate City Populations
```sql
-- Reset all city populations
UPDATE cities SET population_total = 0, population_active = 0;

-- Recalculate from users table
UPDATE cities c
SET 
  population_total = (
    SELECT COUNT(*) FROM users 
    WHERE home_city_id = c.id
  ),
  population_active = (
    SELECT COUNT(*) FROM users 
    WHERE home_city_id = c.id 
    AND last_seen >= NOW() - INTERVAL '30 days'
  );

-- Recalculate stages
UPDATE cities
SET stage = CASE
  WHEN population_total >= 1000 THEN 5
  WHEN population_total >= 201 THEN 4
  WHEN population_total >= 51 THEN 3
  WHEN population_total >= 11 THEN 2
  ELSE 1
END;
```

### Verify Database Integrity
```sql
-- Check for orphaned records
SELECT 'Orphaned user_wallets' as issue, COUNT(*) as count
FROM user_wallets uw
LEFT JOIN users u ON uw.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'Orphaned completed_quests' as issue, COUNT(*) as count
FROM completed_quests cq
LEFT JOIN users u ON cq.user_id = u.id
WHERE cq.user_id IS NOT NULL AND u.id IS NULL

UNION ALL

SELECT 'Negative zo_balance' as issue, COUNT(*) as count
FROM users
WHERE zo_balance < 0

UNION ALL

SELECT 'Negative reputation scores' as issue, COUNT(*) as count
FROM user_reputations
WHERE score < 0;
```

---

## Performance Tips

1. **Use `user_id` instead of `wallet_address`** in all new queries (user_id is indexed)
2. **Leverage indexes** - all foreign keys and common WHERE/ORDER BY columns are indexed
3. **Use JSONB operators** efficiently:
   - `metadata->>'key'` for text extraction
   - `metadata->'key'` for JSONB extraction
   - `metadata ? 'key'` for existence check
4. **Batch inserts** when possible (e.g., bulk quest completions)
5. **Use materialized views** for complex analytics (future optimization)

---

**Database Version**: 4.0  
**Last Major Update**: November 22, 2025 (ZO API Auth Migration)  
**Total Tables**: 14 (1 legacy)  
**Total Indexes**: 50+  
**Total Triggers**: 3 (auto-update stats, leaderboards, city population)  
**Total Functions**: 4  
**Authentication**: ZO API (phone-based OTP)  
**Migrations**: Managed via Supabase Dashboard




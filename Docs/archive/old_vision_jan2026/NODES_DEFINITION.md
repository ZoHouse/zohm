# Zo World Nodes Definition

> **Purpose**: Define all node types, their meanings, and database structure.
> **Status**: DRAFT - Edit this file to finalize node definitions.

---

## Overview

Nodes are physical or virtual locations within the Zo World ecosystem. Each node serves a specific purpose and contributes to the overall field/network.

---

## Current Node Types

### Active Types (16)

| Type | Icon | Description | Purpose |
|------|------|-------------|---------|
| `schelling_point` | 🎯 | | _Define: What makes a location a Schelling Point?_ |
| `degen_lounge` | 🎲 | | _Define: What happens at a Degen Lounge?_ |
| `zo_studio` | 🎬 | | _Define: Creative/production space?_ |
| `flo_zone` | 🧭 | | _Define: Flow state workspace?_ |
| `bored_room` | 🎮 | | _Define: Gaming/entertainment space?_ |
| `liquidity_pool` | 💧 | | _Define: Finance/trading hub?_ |
| `multiverse` | 🌌 | | _Define: Multi-purpose or virtual space?_ |
| `battlefield` | ⚔️ | | _Define: Competition/turf area?_ |
| `bio_hack` | 🧬 | | _Define: Health/biohacking lab?_ |
| `cafe` | ☕ | | _Define: Social gathering spot?_ |
| `420` | 🌿 | | _Define: Cannabis-friendly space?_ |
| `showcase` | ✨ | | _Define: Exhibition/demo space?_ |
| `culture_house` | 🏛️ | | _Define: Art/culture hub?_ |
| `staynode` | 🛏️ | | _Define: Accommodation/hostel?_ |
| `hacker_house` | ⚡ | | _Define: Builder/developer residence?_ |
| `founder_house` | 🏰 | | _Define: Startup founder residence?_ |

### Legacy Types (7) - Backward Compatibility

| Type | Icon | Keep? | Migrate To |
|------|------|-------|------------|
| `hacker_space` | ⚡ | YES / NO | _e.g., migrate to `hacker_house`?_ |
| `house` | 🏠 | YES / NO | _e.g., migrate to which type?_ |
| `collective` | 🌐 | YES / NO | |
| `protocol` | ⚡ | YES / NO | |
| `space` | 🏢 | YES / NO | |
| `festival` | 🎪 | YES / NO | |
| `dao` | 🏛️ | YES / NO | |

---

## Questions to Answer

1. **Which types do we actually need?**
   - Are all 16 active types necessary?
   - Should some be merged?
   - Are any missing?

2. **What defines each type?**
   - Physical vs virtual?
   - Permanent vs temporary?
   - Public vs private?
   - Owned vs partnered?

3. **What features are available at each type?**
   - Coworking
   - Coliving
   - Events
   - Cafe
   - Recording studio
   - Gym/wellness
   - etc.

4. **How does node type affect:**
   - Vibe Score calculation?
   - Quest availability?
   - Token rewards?
   - Map display?

---

## Database Schema

### Current `nodes` Table

```sql
CREATE TABLE nodes (
  -- Identity
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,

  -- Type & Status
  type TEXT NOT NULL,
  status TEXT NOT NULL,              -- 'active' | 'developing' | 'planning'

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
```

### Current Constraints

```sql
-- Type constraint (ONLY 5 TYPES ALLOWED IN DB!)
CHECK (type IN ('hacker_space', 'culture_house', 'schelling_point', 'flo_zone', 'staynode'))

-- Status constraint
CHECK (status IN ('active', 'developing', 'planning'))
```

### Mismatch Alert

| Location | Types Allowed |
|----------|---------------|
| **Code** (`nodeTypes.ts`) | 16 active + 7 legacy = 23 types |
| **Database** (CHECK constraint) | Only 5 types |

**Action needed**: Update DB constraint OR reduce code types to match.

---

## Proposed Node Types

_Edit this section with your final decisions._

### Tier 1: Core Nodes (Primary Locations)

| Type | Icon | Description | Features |
|------|------|-------------|----------|
| | | | |
| | | | |
| | | | |

### Tier 2: Partner Nodes (Affiliated Locations)

| Type | Icon | Description | Features |
|------|------|-------------|----------|
| | | | |
| | | | |

### Tier 3: Community Nodes (User-Created)

| Type | Icon | Description | Features |
|------|------|-------------|----------|
| | | | |
| | | | |

---

## Node Status Definitions

| Status | Meaning | Visible on Map? |
|--------|---------|-----------------|
| `active` | Fully operational | Yes |
| `developing` | Under construction/setup | Yes (different style?) |
| `planning` | Planned for future | No / Coming Soon |

---

## Features List

_Define the standard features that can be assigned to nodes._

| Feature Key | Display Name | Icon |
|-------------|--------------|------|
| `coworking` | Co-working | |
| `coliving` | Co-living | |
| `events` | Events | |
| `cafe` | Cafe | |
| `gym` | Gym/Fitness | |
| `recording` | Recording Studio | |
| `podcast` | Podcast Studio | |
| `art_studio` | Art Studio | |
| `rooftop` | Rooftop | |
| `pool` | Pool | |
| `kitchen` | Community Kitchen | |
| `laundry` | Laundry | |
| `parking` | Parking | |
| `wifi` | High-speed WiFi | |
| `247` | 24/7 Access | |
| | _Add more..._ | |

---

## Files to Update After Finalizing

Once you finalize node types, these files need updating:

1. **Type definitions**: `apps/web/src/lib/nodeTypes.ts`
2. **Database constraint**: Run migration to update CHECK constraint
3. **API validation**: `apps/web/src/app/api/nodes/` routes
4. **Filter UI**: `NodesOverlay.tsx`, `MobileNodesListOverlay.tsx`
5. **Documentation**: `Docs/DATABASE_SCHEMA.md`

---

## Notes

_Add any additional notes, ideas, or context here._

```
-
-
-
```

---

**Last Updated**: 2025-01-21
**Author**: _Your name_

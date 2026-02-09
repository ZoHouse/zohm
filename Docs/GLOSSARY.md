# Zo World Glossary

> **Single source of truth for all Zo World terminology.** Every term here is verified against the codebase. When introducing a new term in any doc, check this glossary first — if it already has a name, use that name.

**Last Updated**: February 2026

---

## How to Use This Glossary

1. **Before naming anything** — check if a term already exists here
2. **Code slugs** are the canonical identifiers (e.g. `science_technology`, not "Science & Tech")
3. **Display names** are what users see in the UI
4. **When two names exist** for the same thing, this glossary specifies which is canonical

---

## Products & Platforms

| Term | What It Is | Notes |
|------|-----------|-------|
| **Zo World** | The entire ecosystem — protocol, apps, community, physical spaces | Always two words. Never "ZoWorld". |
| **Zo OS / Zo Protocol** | The interconnected suite of tools and rules. Same thing, different names. | "OS" = tools/stack. "Protocol" = rules/coordination. Use whichever fits context. |
| **zo.xyz** | Landing page and admin platform. The front door to Zo World. | Nx monorepo. Repo: `zo.xyz`. |
| **game.zo.xyz** | The game map — navigation and action layer of Zo World. | NOT "questing map". The map is for navigation, discovery, events, AND quests. Repo: `zohm`. |
| **Zo Club App** | The all-inclusive mobile app. Full Zo World experience in your pocket. | Also called "mobile app". Repo: `ZoWorldmobile`. |
| **Passport SDK** | Shared identity and auth library (npm package). Used by both web and mobile. | `npm install zopassport`. Repo: `zopassport`. |
| **Hospitality Bot** | Property operations automation (LangGraph + WhatsApp). Merging into main builds. | Repo: `Hospitality-2.0`. |
| **Builder Bot** | GitHub contribution tracking and Builder Score (Telegram). Merging into main builds. | Repo: `ZoBuilder-bot`. |

### APIs

| Term | Base URL | What It Is |
|------|----------|-----------|
| **ZOHM API** | `zohm-api.up.railway.app/api/v1` | Community dev API. All client-facing code calls this. Proxies to ZO API. Env: `ZOHM_API_BASE_URL`. |
| **ZO API** | `api.io.zo.xyz` | Main identity database (CAS — Central Auth Service). Admin/internal only. Never call directly from client code. Env: `ZO_CAS_API_URL`. |

---

## The Map

The interactive 3D Mapbox-powered map at game.zo.xyz. This is the **primary navigation tool** for Zo World — not just a questing interface.

**Four core elements live on the map:**

| Element | What It Is |
|---------|-----------|
| **Nodes** | Physical spaces — Zo Houses, Zostels, community spots. The locations. |
| **Citizens** | Users with identity and progression. The people. |
| **Events & Activities** | Gatherings, meetups, experiences. What's happening. |
| **Quests** | Structured challenges that generate signals. What users do. |

---

## Identity & Roles

### User Roles

Defined in `users.role` column. Source: `Docs/DATABASE.md`.

| Role | Code Slug | Description |
|------|-----------|-------------|
| **Citizen** | `citizen` | Default for all new users. Events require review. Basic quests and map access. |
| **Member** | `member` | Set via admin. Standard access. |
| **Founder** | `founder` | Founder NFT holder OR `zo_membership = 'founder'`. Events auto-approved. Governance voting. Token rewards. |
| **Admin** | `admin` | Manual role assignment. Full access. Override all workflows. |
| **Vibe Curator** | `vibe_curator` | Manual role assignment. Approve events. Manage vibe checks. |

### Host Types

Who can host events. Source: `apps/web/src/types/events.ts` → `HostType`.

| Display Name | Code Slug |
|-------------|-----------|
| Citizen | `citizen` |
| Founder Member | `founder_member` |
| Admin | `admin` |
| Sponsor | `sponsor` |
| Vibe Curator | `vibe_curator` |

### Identity Progression

```
New User → Citizen (default) → Founder (NFT or membership upgrade)
```

Founder status is determined by: `founder_nfts_count > 0` OR `zo_membership = 'founder'`.

### Agent Roles (Operations)

Defined in `Docs/AGENTS.md`. 6 roles across 4 tiers.

| Tier | Role | Description |
|------|------|-------------|
| Tier 1 | **Director / Orchestrator** | Strategic multi-property overseer |
| Tier 2 | **BD Agent** | Business development, partnerships |
| Tier 2 | **Sales Agent** | Lead conversion, revenue |
| Tier 2 | **Events Agent** | Event lifecycle management |
| Tier 3 | **Vibe Curator** | Community culture and event approval |
| Tier 4 | **House Captain** | Daily operations manager at a node |

### Other Roles

| Term | What It Is |
|------|-----------|
| **EIR (Entrepreneur-in-Residence)** | Community lead at a Zo House. Gets free stay for culture work. |
| **Black Passport Holder** | Founder Member (~40 per city). Co-creators and force multipliers. Same as "Founder" but emphasizes physical community role. |

---

## The 19 Cultures

Cultures are a core concept — they tag events, profiles, and community formation. There are exactly **19 culture values**.

**Two type definitions exist in code** with slightly different slugs. `EventCulture` (in `types/events.ts`) is the database/API canonical form. `CultureType` (in `lib/cultures.ts`) is the UI/display form.

Source: `apps/web/src/types/events.ts` → `EventCulture`
Display: `apps/web/src/lib/cultures.ts` → `CultureType`

| # | Display Name | EventCulture Slug | CultureType Slug | Icon |
|---|-------------|-------------------|------------------|------|
| 1 | Science & Technology | `science_technology` | `science_technology` | Science&Technology.png |
| 2 | Business | `business` | `business` | Business.png |
| 3 | Design | `design` | `design` | Design.png |
| 4 | Food | `food` | `food` | Food.png |
| 5 | Game / Games | `game` | `games` | Game.png |
| 6 | Health & Fitness | `health_fitness` | `health_fitness` | Health&Fitness.png |
| 7 | Home & Lifestyle | `home_lifestyle` | `home_lifestyle` | Home&Lifestyle.png |
| 8 | Law / Law & Order | `law` | `law_order` | Law.png |
| 9 | Literature & Stories | `literature_stories` | `literature` | Literature&Stories.png |
| 10 | Music & Entertainment | `music_entertainment` | `music_entertainment` | Music&Entertainment.png |
| 11 | Nature & Wildlife | `nature_wildlife` | `nature_wildlife` | Nature&Wildlife.png |
| 12 | Photography | `photography` | `photography` | Photography.png |
| 13 | Spiritual | `spiritual` | `spiritual` | Spiritual.png |
| 14 | Travel & Adventure | `travel_adventure` | `travel_adventure` | Travel&Adventure.png |
| 15 | Television & Cinema | `television_cinema` | `television_cinema` | Television&Cinema.png |
| 16 | Stories & Journal(s) | `stories_journal` | `stories_journals` | Stories&Journal.png |
| 17 | Sport / Sports | `sport` | `sports` | Sport.png |
| 18 | Follow Your Heart | `follow_your_heart` | `follow_your_heart` | FollowYourHeart.png |
| 19 | Default / Evolving Cultures | `default` | `evolving_cultures` | Default (2).jpg |

**Slug discrepancies** (6 values differ between EventCulture and CultureType):
- `game` vs `games`
- `law` vs `law_order`
- `literature_stories` vs `literature`
- `stories_journal` vs `stories_journals`
- `sport` vs `sports`
- `default` vs `evolving_cultures`

`EventCulture` is the database canonical form. `CultureType` is the UI display form. Both are valid in their contexts.

---

## Node Types (19)

Physical locations on the map. Each node has a type that determines its icon and color.

Source: `apps/web/src/lib/nodeTypes.ts` → `NodeType`

| # | Display Name | Code Slug | Icon | Zo-Owned? |
|---|-------------|-----------|------|-----------|
| 1 | Zo House | `zo_house` | Logo | Yes |
| 2 | Zostel | `zostel` | Logo | Yes |
| 3 | Zostel (legacy) | `staynode` | Logo | Yes |
| 4 | Food | `food` | 🍱 | No |
| 5 | Stay | `stay` | 🛏️ | No |
| 6 | Park | `park` | 🌳 | No |
| 7 | Hospital | `hospital` | 🏥 | No |
| 8 | Fire Station | `fire_station` | 🧯 | No |
| 9 | Post Office | `post_office` | 📮 | No |
| 10 | Bar | `bar` | 🍺 | No |
| 11 | Metro | `metro` | 🚊 | No |
| 12 | Airport | `airport` | ✈️ | No |
| 13 | Shopping | `shopping` | 🛍️ | No |
| 14 | Art | `art` | 🎨 | No |
| 15 | Sports Arena | `sports_arena` | 🏟️ | No |
| 16 | Arcade | `arcade` | 🕹️ | No |
| 17 | Library | `library` | 📚 | No |
| 18 | Gym | `gym` | 🏋️ | No |
| 19 | Startup Hub | `startup_hub` | 👨‍💻 | No |

**Node Status**: `active` | `developing` | `planning`

---

## Zone Types (13)

Zones are spaces within a node (e.g., rooms and areas inside a Zo House).

Source: `apps/web/src/lib/nodeTypes.ts` → `ZoneType`

| # | Display Name | Code Slug | Description |
|---|-------------|-----------|-------------|
| 1 | Schelling Point | `schelling_point` | Coordination/meeting space |
| 2 | Degen Lounge | `degen_lounge` | Social/trading culture space |
| 3 | Zo Studio | `zo_studio` | Recording/production facility |
| 4 | Flo Zone | `flo_zone` | Deep work/flow state workspace |
| 5 | Liquidity Pool | `liquidity_pool` | Pool/water feature |
| 6 | Multiverse | `multiverse` | Multi-purpose flex space |
| 7 | Battlefield | `battlefield` | Competition/sports area |
| 8 | Bio Hack | `bio_hack` | Health/fitness/biohacking |
| 9 | Zo Cafe | `zo_cafe` | Food/coffee service |
| 10 | 420 | `420` | Smoking-friendly space |
| 11 | Showcase | `showcase` | Exhibition/display area |
| 12 | Dorms | `dorms` | Shared accommodation |
| 13 | Private Rooms | `private_rooms` | Private accommodation |

---

## Event System

Source: `apps/web/src/types/events.ts`

### Event Categories (3)

| Display Name | Code Slug | Description |
|-------------|-----------|-------------|
| Community | `community` | Open gatherings, target 8-15 people |
| Sponsored | `sponsored` | Brand/partner involvement |
| Ticketed | `ticketed` | Paid admission |

### Event Submission Status (5)

`draft` → `pending` → `approved` / `rejected` / `cancelled`

### Event Location Types (3)

| Code Slug | Description |
|-----------|-------------|
| `zo_property` | At a Zo House or Zostel |
| `custom` | User-specified location |
| `online` | Virtual event |

### Event Source Types (5)

`ical` | `luma` | `community` | `activity_manager` | `admin`

### RSVP Status (8)

`pending` | `going` | `interested` | `not_going` | `waitlist` | `cancelled` | `approved` | `rejected`

### RSVP Types (5)

`standard` | `vip` | `speaker` | `organizer` | `host`

---

## Core Systems & Concepts

| Term | What It Is | Where Defined |
|------|-----------|--------------|
| **Vibe Score** | Real-time alignment percentage (0-100%). Computed from node presence, quests, connections, creative output. | ARCHITECTURE.md, DASHBOARD.md |
| **Vibe Check** | Token-gated governance proposal. Community voting on pending citizen events via Telegram. Requires founder quorum + 60% approval. | SYSTEM_FLOWS.md |
| **Quantum Sync** | Voice quest engine. Dual transcription (AssemblyAI + Web Speech API). Includes Game1111 mechanic. | VOICE_TRANSCRIPTION.md |
| **Game1111** | Voice quest mini-game: say "Zo" to start counter, stop at exactly 1111ms. | VOICE_TRANSCRIPTION.md |
| **Reality Engine** | The core loop: Observe → Model → Simulate → Reinforce. Processes signals into opportunities. Also called "Life Design Simulation Engine". | LORE.md, ARCHITECTURE.md |
| **Signal System** | Every interaction generates a signal: `quest_completed`, `location_updated`, `event_joined`, `node_presence`, `creation_shared`, `social_connection`. | QUESTING_MAP.md |
| **Culture System** | Users declare cultures (from the 19 types). Used for matching, events, and community formation. | Events, profiles, map |
| **Builder Score** | Reputation score from code contributions + peer nominations + engagement. Used by Builder Bot. | BUILDER_BOT.md |
| **Reputation Traits** | 4 types: Builder, Connector, Explorer, Pioneer. | ARCHITECTURE.md |
| **Streak System** | Tracks: `login`, `quest`, `event`, `checkin` streaks. | ARCHITECTURE.md |

---

## Physical Network

| Term | What It Is |
|------|-----------|
| **Zo House** | Full flagship property. Minimum 6 rooms, event programming, EIR leadership. |
| **Zo Node** | Lighter extension. Community hub or event space. Partner-operated. |
| **Zostel** | Backpacker hostel network (80+ properties). Most profitable vertical. |
| **Zostel Homes** | Premium boutique stays (20+ properties). |
| **Zo Trips** | Curated travel experiences. |
| **Zo Accelerator** | Always-on launchpad. 1.11% equity incubation or success-fee models. |
| **Zo Capital** | Pre-seed fund (coming). $50K check size. |
| **Zo Founders Network** | Global infrastructure: Zo Houses + Accelerator + Capital. |

---

## Philosophy & Lore

| Term | What It Is |
|------|-----------|
| **The Field** | Self-reinforcing system built around alignment, agency, creativity, transformation. |
| **Frequency** | The invisible operating system of a Zo Node. Shaped by intention, behavior, rhythm. |
| **Synchronized Layer** | Fully tuned personal timeline where identity, intention, and environment converge. |
| **Consent Culture** | Non-negotiable interaction framework: photo consent, physical space respect, invitation framing. |
| **MOOP** | Matter Out of Place. Environmental stewardship: leave spaces better. |
| **Five Senses Framework** | Design framework for vibes through sensory curation (sight, sound, touch, smell, taste). |

---

## Financial & Economic

| Term | What It Is |
|------|-----------|
| **$ZO / Zo Token** | In-game currency. Earned via quests. Blockchain-based (Base L2 network). |
| **Founder NFT** | NFT that grants Founder status. ERC-721 on Base network. |
| **Base Network** | Layer 2 blockchain where $ZO and NFTs live. |

---

## Auth & Session

| Term | What It Is |
|------|-----------|
| **Phone OTP** | The only auth method. Phone number + SMS code. No email, no social, no wallet login. |
| **Device Credentials** | `client-device-id` + `client-device-secret`. Generated per session, stored in localStorage + Supabase. |
| **Client Key** | `client-key` header. Platform-specific API key from Zo team. |
| **Access Token** | JWT from ZO API. Stored in localStorage as `zo_access_token`. |

---

## Naming Conventions

### Do

- Use **display names** in user-facing text (e.g., "Science & Technology")
- Use **code slugs** in technical docs and code (e.g., `science_technology`)
- Write "Zo World" (two words, capitalized)
- Write "Zo House" (two words)
- Write "$ZO" for the token
- Reference "game.zo.xyz" for the web app, "Zo Club App" for mobile
- Say "the map" or "game map" — not "questing map"

### Don't

- Don't write "ZoWorld" (one word)
- Don't say "questing map" — the map is for navigation, events, citizens, AND quests
- Don't call the ZOHM API "ZO API" — they are different services
- Don't invent new culture names — use one of the 19 defined values
- Don't use "8 agents" — it's 6 roles across 4 tiers

---

## Code Source Files

Quick reference for where canonical types are defined:

| Type | File |
|------|------|
| EventCulture (19) | `apps/web/src/types/events.ts` |
| CultureType (19) | `apps/web/src/lib/cultures.ts` |
| NodeType (19) | `apps/web/src/lib/nodeTypes.ts` |
| ZoneType (13) | `apps/web/src/lib/nodeTypes.ts` |
| EventCategory (3) | `apps/web/src/types/events.ts` |
| HostType (5) | `apps/web/src/types/events.ts` |
| SubmissionStatus (5) | `apps/web/src/types/events.ts` |
| RsvpStatus (8) | `apps/web/src/types/events.ts` |
| RsvpType (5) | `apps/web/src/types/events.ts` |
| NodeStatus (3) | `apps/web/src/lib/nodeTypes.ts` |
| User roles (5) | `Docs/DATABASE.md` → users.role |

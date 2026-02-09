# Zo World Game Map (`zohm`)

> **"A Life Design Simulation Engine" — The navigation and action layer of Zo World.**

- **Repository**: [github.com/ZoHouse/zohm](https://github.com/ZoHouse/zohm)
- **Status**: Production
- **License**: MIT
- **Live**: [game.zo.xyz](https://game.zo.xyz)
- **Role**: Navigation, questing, events, identity, governance

---

## Overview

`zohm` powers **game.zo.xyz** — the **navigation tool and action layer** for the entire Zo World. The interactive 3D map is not just for questing — it's how users discover nodes, find events, connect with citizens, and navigate the Zo universe. Everything in Zo World has a place on the map.

**Four core elements live on the map:**

| Element | What It Is |
|---------|------------|
| **Nodes** | Physical spaces (Zo Houses, Zostels, community spots) — the locations on the map |
| **Citizens** | Users with identity progression (Citizen → Founder) — the people |
| **Events & Activities** | Gatherings, meetups, experiences — what's happening at the nodes |
| **Quests** | Structured challenges that generate signals and earn rewards — what users do |

For the full all-inclusive experience including bookings, chat, and payments, see the [mobile app](./MOBILE_APP.md).

The engine implements the **Reality Engine Loop**:

```
Observe → Model → Simulate → Reinforce
```

1. **Observe**: Captures citizen behavior and signals (check-ins, quests, social interactions)
2. **Model**: Computes alignment via Vibe Score algorithm
3. **Simulate**: Generates next quests and opportunities
4. **Reinforce**: Rewards progress with tokens and strengthens the field

---

## Architecture

### Monorepo Structure

```
zohm/
├── apps/
│   └── web/                  # Next.js 15 web application (main app)
├── packages/
│   ├── api/                  # Database migrations and API utilities
│   ├── contracts/            # Smart contracts (ERC-20 tokens)
│   ├── sdk/                  # Shared TypeScript SDK and types
│   └── shared/               # Shared utilities
├── Docs/                     # Complete documentation suite
├── lore/                     # Protocol lore and ontology
└── scripts/                  # Database and automation scripts
```

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | Next.js | 15 |
| **UI Library** | React | 19 |
| **Language** | TypeScript | 5.x |
| **Styling** | Tailwind CSS | — |
| **Database** | Supabase (PostgreSQL) | — |
| **Auth** | ZO API (Phone + OTP) | — |
| **Blockchain** | Base (L2), Avalanche Fuji (testnet) | — |
| **Maps** | Mapbox GL JS (3D) | — |
| **Realtime** | Supabase Realtime subscriptions | — |
| **AI** | AssemblyAI (voice), OpenAI (narrative) | — |
| **Deployment** | Vercel | — |
| **CI/CD** | GitHub Actions | — |
| **Package Manager** | pnpm | 8.x |

---

## Core Features

### Zo Passport — Digital Identity

Dynamic identity system with progression from **Citizen** to **Founder**.

- Real-time profile completion tracking (10 fields)
- Social declaration system for timeline commitment
- Glassmorphism design with smooth animations
- Mobile-responsive interface
- Progression visualization

### Vibe Score — Reality Alignment Metric

Real-time alignment percentage computed from multidimensional life signals (0-100%).

**Factors:**
- Node presence (time spent at physical locations)
- Quest completion
- Social connections
- Creative output

The algorithm is explainable and auditable, with dynamic updates based on behavior and leaderboard rankings.

### Interactive Map — Navigation Layer

The **primary navigation tool** for Zo World. A 3D Mapbox-powered interface where users discover everything — nodes, events, citizens, and quests — all placed on a real-world map.

- Browse and discover Zo Nodes (physical spaces)
- See events and activities happening at each node
- Find citizens and community members nearby
- Real-time location tracking and discovery
- **Zostel Network integration** — 50+ locations across India
- Node resonance and presence tracking

**Node Types on the Map:**
- Zo House Bangalore — Flagship
- Zo House San Francisco — West Coast hub
- Zostel Network — 50+ partner hostels
- Community Nodes — User-created worldwide

### Quest System — Reality Programs

Structured quests that generate meaningful life signals and earn token rewards.

| Quest Type | Description |
|------------|-------------|
| **Social** | Community connections and events |
| **Creative** | Content creation and sharing |
| **Physical** | Location-based and node presence |
| **Digital** | On-chain and verification-based |

**Rewards:** $ZO tokens, blockchain verification proofs, real-time progress tracking, leaderboard rankings.

### Quantum Sync — Voice Quest

Audio-based reality tuning experience:
- Real-time voice analysis with AssemblyAI
- Gamified voice quest with token rewards
- Mobile-first interface with biometric auth
- Processes voice signals into validated quest completions

### Culture System

- Declare cultures: Design, Food, Science & Tech, Music, Photography, etc.
- Culture-based matching and community formation
- Real-time culture feed and interactions

---

## Signal System

Every interaction generates a signal that feeds the Reality Engine:

| Signal | Trigger |
|--------|---------|
| `quest_completed` | Quest submission |
| `location_updated` | Map movement |
| `event_joined` | Event attendance |
| `node_presence` | Time at physical nodes |
| `creation_shared` | Creative output |
| `social_connection` | Social interactions |

**Pipeline:** `Raw Data → Signals → State → Narrative`

---

## Identity Progression

| Level | Access |
|-------|--------|
| **Citizen** (entry) | Basic quests, map exploration, culture declaration |
| **Founder** (advanced) | Full access, token rewards, node creation, governance |

---

## Environment Variables

Required in `apps/web/.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ZOHM API (Community dev API — proxies auth, profiles, avatars)
ZOHM_API_BASE_URL=https://zohm-api.up.railway.app/api/v1
ZO_CLIENT_KEY_WEB=your_zo_client_key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token

# Blockchain
NEXT_PUBLIC_BASE_RPC_URL=your_base_rpc_url
REWARD_WALLET_PRIVATE_KEY=your_wallet_private_key

# AI Features (optional)
ASSEMBLYAI_API_KEY=your_assemblyai_key
OPENAI_API_KEY=your_openai_key
```

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Git**

### Quick Start

```bash
git clone https://github.com/ZoHouse/zohm.git
cd zohm

pnpm install

cd apps/web
cp .env.example .env.local
# Edit .env.local with your API keys

pnpm dev
# Open http://localhost:3000
```

### Available Scripts

```bash
pnpm dev              # Start web dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run linter
pnpm clean:install    # Clean reinstall
```

### Database Migrations

```bash
cd packages/api
node scripts/run-migration.js <migration-file.sql>
node scripts/run-migration.js <migration-file_ROLLBACK.sql>
```

### Node Management Scripts

```bash
node scripts/add-node.mjs     # Create a new node
node scripts/list-nodes.mjs   # List all nodes
node scripts/delete-node.mjs  # Delete a node
```

---

## The Six Core Systems

Every feature in zohm strengthens at least one of these:

1. **Vibe Score** — Real-time alignment percentage
2. **Quests** — Interaction primitives that generate signals
3. **Nodes** — Physical locations with resonance
4. **Citizens** — Users with identity and progression
5. **Map Interface** — Reality interaction canvas
6. **Narrative Engine** — Processes signals into story

---

## Security

- All secrets stored in environment variables
- API routes use ZO API authentication (phone + OTP)
- Database uses Row Level Security (RLS)
- Smart contracts audited before deployment

---

## Contributing

### Safe Editing Zones

| Zone | Status |
|------|--------|
| `components/**`, `hooks/**`, `sdk/**`, `docs/**`, `tests/**` | Safe to edit |
| `api/**`, `migrations/**`, `workflows/**` | Requires review |
| `.env files`, `package.json`, `contracts/**` | Never touch |

### Workflow

1. Fork and create feature branch
2. Create laundry list in `Docs/LAUNDRY/`
3. Make changes, run tests
4. Generate receipt: `python scripts/generate_receipt.py`
5. Commit and open PR

---

## Roadmap

- [ ] Narrative Engine v2 — AI-powered story generation
- [ ] AR Quest System — Mobile AR via 8th Wall
- [ ] Token Economics v2 — Advanced tokenomics
- [ ] Governance System — Founder-led decisions
- [ ] Mobile Native App — iOS and Android
- [ ] Wearable Integration — Smart glasses and AR

---

## Related Docs

- [GLOSSARY.md](../GLOSSARY.md) — All terms and naming conventions
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Full system architecture
- [VOICE_TRANSCRIPTION.md](../VOICE_TRANSCRIPTION.md) — Quantum Sync deep dive
- [EVENTS_SYSTEM.md](../EVENTS_SYSTEM.md) — Events and RSVP system
- [NODE_ADMIN_GUIDE.md](../NODE_ADMIN_GUIDE.md) — Node management guide
- [SYSTEM_FLOWS.md](../SYSTEM_FLOWS.md) — Auth, events, and vibe check flows

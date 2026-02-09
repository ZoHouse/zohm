# Zo World Documentation

> **A decentralized protocol for conscious reality design — the coordination layer for human acceleration.**

**Status**: Living Document
**Last Updated**: February 2026

---

## Documentation Map

### Foundation

| Doc | Description | Lines |
|-----|-------------|-------|
| **[Glossary](./GLOSSARY.md)** | **Single source of truth** for all terms, naming conventions, code-verified values | Reference |
| **[The Lore](./LORE.md)** | Complete vision document — Reality as a programmable field | Core philosophy |
| **[Founders Network](./FOUNDERS.md)** | Global infrastructure: Zo Houses, Zo Accelerator, Zo Capital | Business model |
| **[Project Rules](./PROJECT_RULES.md)** | 25 foundational principles for building Zo World | Constraints |

### System Architecture

| Doc | Description | Lines |
|-----|-------------|-------|
| **[Architecture](./ARCHITECTURE.md)** | 4-layer system architecture, tech stack, data flows, security model | 772 |
| **[System Flows](./SYSTEM_FLOWS.md)** | How users login (Phone OTP), create events (5-step), and Vibe Check governance | 639 |
| **[Database Schema](./DATABASE.md)** | Complete database tables and relationships | — |
| **[App Overview](./APP_OVERVIEW.md)** | Current app features and implementation status | 98 |

### User Journey

| Doc | Description | Lines |
|-----|-------------|-------|
| **[New User Funnel](./NEW_USER_FUNNEL.md)** | Production-verified auth and onboarding deep dive with exact SQL queries and API payloads | 1649 |
| **[Events System](./EVENTS_SYSTEM.md)** | Technical events system: iCal, canonical events, RSVP, admin, check-in flow | 1246 |
| **[Dashboard](./DASHBOARD.md)** | Desktop 3-column and mobile bottom-sheet dashboard, data sources, component hierarchy | 815 |
| **[Voice Transcription](./VOICE_TRANSCRIPTION.md)** | Quantum Sync: dual transcription (AssemblyAI + Web Speech API), Game1111 engine | 930 |

### Node Operations

| Doc | Description | Lines |
|-----|-------------|-------|
| **[Zo House Franchise](./ZO_HOUSE.md)** | Core principles, network architecture, property standards | — |
| **[Node Playbook](./NODE_PLAYBOOK.md)** | 7-stage node lifecycle and execution guide | — |
| **[Node Admin Guide](./NODE_ADMIN_GUIDE.md)** | 19 node types, 13 zone types, admin API endpoints, Supabase queries | 515 |
| **[Property Operations](./OPERATIONS.md)** | 6-phase daily operations, House Captain system | — |
| **[Events Operations](./EVENTS.md)** | Event lifecycle: pre-event planning, day-of coordination, post-event | 216 |
| **[Community & Culture](./CULTURE.md)** | Vibe Curator, consent culture, MOOP | — |
| **[Agent Architecture](./AGENTS.md)** | 6 roles across 4 tiers, system integrations | 133 |

### Zo OS / Zo Protocol — The 6 Projects

| Doc | Repository | Stack |
|-----|-----------|-------|
| **[Zo Web Platform](./projects/WEB_PLATFORM.md)** | [zo.xyz](https://github.com/ZoHouse/zo.xyz) | Nx + Next.js 14 + React 18 + Yarn |
| **[Game Map](./projects/QUESTING_MAP.md)** | [zohm](https://github.com/ZoHouse/zohm) | Next.js 15 + React 19 + Supabase + Mapbox |
| **[Hospitality Bot](./projects/HOSPITALITY_BOT.md)** | [Hospitality-2.0](https://github.com/ZoHouse/Hospitality-2.0) | Python + LangGraph + FastAPI + WhatsApp |
| **[Mobile App](./projects/MOBILE_APP.md)** | [ZoWorldmobile](https://github.com/ZoHouse/ZoWorldmobile) | React Native 0.73.6 + TypeScript + ZUI |
| **[Passport SDK](./projects/PASSPORT_SDK.md)** | [zopassport](https://github.com/ZoHouse/zopassport) | TypeScript + React + npm SDK |
| **[Builder Bot](./projects/BUILDER_BOT.md)** | [ZoBuilder-bot](https://github.com/ZoHouse/ZoBuilder-bot) | Python + Telegram + MongoDB |

Overview: **[Zo OS / Zo Protocol](./ZO_OS.md)** — Architecture diagram and project links. (Same thing, different names.)

---

## Key Concepts

### Identity Progression

| Level | Criteria | Permissions |
|-------|----------|-------------|
| **Citizen** | Default for new users | Events (pending review), RSVP, basic quests |
| **Founder** | Founder NFT OR `zo_membership = 'founder'` | Events auto-approved, governance voting, token rewards |
| **Admin** | Manual role assignment | Full access, override all workflows |
| **Vibe Curator** | Manual role assignment | Approve events, manage vibe checks |

### The 19 Cultures

Events and profiles use 19 culture values defined in `EventCulture` type:

Science & Tech, Business, Design, Food, Game, Health & Fitness, Home & Lifestyle, Law, Literature & Stories, Music & Entertainment, Nature & Wildlife, Photography, Spiritual, Travel & Adventure, Television & Cinema, Stories & Journal, Sport, Follow Your Heart, Default.

### The Two APIs

| API | Base URL | Purpose |
|-----|----------|---------|
| **ZOHM API** | `zohm-api.up.railway.app/api/v1` | Community dev API — what game.zo.xyz and community apps call. Proxies auth, profiles, avatars. |
| **ZO API** | `api.io.zo.xyz` | Main identity database (CAS). Admin operations, user management, founder lookups. Never called directly from client code. |

Code references: `ZOHM_API_BASE_URL` env var for ZOHM API, `ZO_CAS_API_URL` for ZO API. See [ZO_API.md](../ZO_API.md) for endpoint docs.

### Authentication

Phone OTP via ZOHM API (which proxies to ZO API) → Supabase user → localStorage session. No email/password, no social login, no wallet login. See [System Flows](./SYSTEM_FLOWS.md) and [New User Funnel](./NEW_USER_FUNNEL.md) for full details.

---

## Roadmap

### Done

- [x] Phone-based Auth (OTP via ZO API)
- [x] Event Creation (5-step wizard)
- [x] Vibe Check (Token-gated governance proposal)
- [x] Zo Passport identity system
- [x] Interactive Node Map (Mapbox 3D)
- [x] Quest System (Social, Creative, Physical, Digital)
- [x] Quantum Sync (Voice quest with AssemblyAI)
- [x] Dashboard (Desktop + Mobile)
- [x] Hospitality Bot (LangGraph + WhatsApp)
- [x] Builder Bot (Telegram + GitHub)
- [x] Passport SDK (npm package)

### In Progress

- [ ] Vibe Check Telegram Bot (inline voting in token-gated founder groups)
- [ ] City Nodes management
- [ ] Roles Matrix

### Planned

- [ ] Identity Verification (WorldID / KYC)
- [ ] $ZO Tokenomics
- [ ] Narrative Engine v2 (AI-powered story generation)
- [ ] AR Quest System (8th Wall)
- [ ] Marketplace
- [ ] API Reference (OpenAPI)
- [ ] Offline-First (PWA + TanStack Query)

---

## Doc Conventions

- **Check the [Glossary](./GLOSSARY.md) before introducing new terms** — if something already has a name, use that name
- **All paths in code references** are relative to `apps/web/src/` unless stated otherwise
- **Database table names** refer to Supabase PostgreSQL tables
- **ZOHM API** = community dev API (`zohm-api.up.railway.app`). **ZO API** = main identity DB (`api.io.zo.xyz`). They are different services.
- **Supabase** is the primary database (PostgreSQL + Realtime + RLS)
- **19 cultures, 19 node types, 13 zone types** — exact values in [Glossary](./GLOSSARY.md)

# Zo World Documentation

**Project**: Zo World Map (ZOHM)  
**Last Updated**: 2025-11-22  
**Status**: ✅ Production Ready

---

## 🚀 Quick Start

**New to the project?** Read these 5 core documents in order:

1. **`PROJECT_RULES.md`** ⭐ - **25 Foundational Rules** for building Zo World
2. **`ARCHITECTURE.md`** ⭐ - System architecture, tech stack & data flows
3. **`DATABASE_SCHEMA.md`** - Complete database schema with tables and relationships
4. **`cursorrule.md`** - AI pair-coding workflows and constraints
5. **`README.md`** - This file (documentation overview)

---

## 📚 Documentation Structure

```
Docs/
├── PROJECT_RULES.md       ⭐ 25 foundational principles
├── ARCHITECTURE.md        ⭐ System design & tech stack
├── DATABASE_SCHEMA.md     ⭐ Complete database schema
├── cursorrule.md          ⭐ AI coding workflows
└── README.md              ⭐ This file

/lore/
└── zo_protocol_lore.md    📖 Operating ontology & worldview
```

**Philosophy**: We keep only essential docs. Everything else is in the code, comments, or git history.

---

## 🎯 Documentation by Role

### For AI Assistants

**Read first** (in order):
1. `.cursorrules` (root) - Quick reference for safe zones
2. `Docs/PROJECT_RULES.md` - 25 foundational principles
3. `Docs/cursorrule.md` - Detailed workflows
4. `Docs/ARCHITECTURE.md` - System architecture
5. `Docs/DATABASE_SCHEMA.md` - Database schema

**Before coding**:
- Check path permissions in `cursorrule.md`
- Read relevant architecture sections
- Never edit forbidden paths (package.json, .env, etc.)

### For Developers

**Getting started**:
1. `ARCHITECTURE.md` - Understand the system
2. `DATABASE_SCHEMA.md` - Database structure
3. `/lore/zo_protocol_lore.md` - Understand the philosophy

**During development**:
- Reference `ARCHITECTURE.md` for API routes and data flows
- Check `DATABASE_SCHEMA.md` for tables, triggers, and queries
- Follow `PROJECT_RULES.md` for design principles

### For Product/Design

**Understanding the product**:
1. `/lore/zo_protocol_lore.md` - The Zo worldview
2. `ARCHITECTURE.md` - System overview & user flows
3. `PROJECT_RULES.md` - Foundational design principles

**Planning work**:
- All features must align with PROJECT_RULES.md
- Check ARCHITECTURE.md for technical feasibility
- Ensure lore compliance with zo_protocol_lore.md

---

## 📖 Core Documentation

### 1. `PROJECT_RULES.md` ⭐

The 25 foundational rules that govern all decisions in Zo World. Read this first.

**Key Principles**:
- Lore is law (operating ontology)
- Reality is programmable
- Build only what strengthens the engine
- Single source of truth
- Everything generates signals
- Simulation integrity above all

### 2. `ARCHITECTURE.md` ⭐

Complete system architecture including:
- Technology stack (Next.js 15, Supabase, ZO API, Mapbox)
- Authentication system (ZO API phone-based auth)
- Data flows (auth, quest completion, avatar generation, city sync)
- Component hierarchy
- API routes structure
- Security model
- Deployment architecture (Vercel)

### 3. `DATABASE_SCHEMA.md` ⭐

Full Supabase/Postgres schema:
- 14 tables (users, quests, cities, nodes, events, etc.)
- Relationships & foreign keys
- Indexes for performance
- Triggers & functions (auto-updating leaderboards, city population)
- Row-Level Security (RLS) policies
- Sample queries for common operations

### 4. `cursorrule.md` ⭐

AI pair-coding workflows and constraints:
- File permissions matrix (editable/review/forbidden)
- Pre-PR workflow
- Testing requirements
- Migration checklist
- Common scenarios
- Conflict resolution

### 5. `/lore/zo_protocol_lore.md` 📖

The operating ontology and worldview of Zo World. All features must align with this.

---

## ✨ Key Features (As of Nov 2024)

| Feature | Status | Description |
|---------|--------|-------------|
| **ZO API Auth** | ✅ Production | Phone-based authentication (Privy removed) |
| **Mapbox Integration** | ✅ Production | Interactive map with events, nodes, cities |
| **Quest System** | ✅ Production | Repeatable quests with cooldowns & rewards |
| **Game1111 Quest** | ✅ Production | Voice-activated timing quest (stop at 11:11) |
| **City Progression** | ✅ Production | 5-stage city growth system |
| **Leaderboards** | ✅ Production | Global & city rankings (auto-updated) |
| **Reputation System** | ✅ Production | 4 traits: Builder, Connector, Explorer, Pioneer |
| **Streak Tracking** | ✅ Production | Login, quest, event, checkin streaks |
| **Avatar Generation** | ✅ Production | ZO API avatar creation (bro/bae) |
| **Onboarding Flow** | ✅ Production | Nickname → Avatar → City Sync → Quest |
| **Event Calendar** | ✅ Production | Canonical events with geocoding cache |
| **Vibe Score** | 🚧 In Progress | AI-powered alignment measurement |
| **Node Activation** | 🔮 Planned | Physical location check-ins |

---

## 🛡️ Safety & Constraints

### Path Permissions (from `cursorrule.md`)

**✅ AI Editable** (no pre-approval needed):
- `apps/web/src/components/**/*.tsx` - React components
- `apps/web/src/hooks/**/*.ts` - Custom React hooks
- `packages/sdk/src/**/*.ts` - SDK types and utilities
- `Docs/**/*.md` - Documentation
- `tests/**/*.test.ts` - Tests

**⚠️ Human Review Required** (PR only, do not merge):
- `apps/web/src/app/api/**/*.ts` - API routes (security impact)
- `apps/web/src/lib/supabase.ts` - Database client
- `apps/web/src/lib/zo-api/**/*.ts` - ZO API client library
- `apps/web/src/lib/userDb.ts` - User database operations

**🚫 Forbidden** (never touch):
- `apps/web/package.json` - Dependencies (breaking changes)
- `apps/web/next.config.ts` - Build config (deployment impact)
- `.env*` files - Secrets and configuration
- `pnpm-workspace.yaml` - Monorepo structure

### Core Principles

1. **Humans set direction**, AI executes safe edits
2. **Single source of truth** - No duplicate logic or data
3. **All changes must be reversible** - Rollback plans required
4. **Simulation integrity** - Engine consistency over convenience
5. **Lore compliance** - Never contradict zo_protocol_lore.md

---

## 🏗️ Tech Stack Summary

**Frontend**:
- Next.js 15.4.2 (App Router)
- React 19.1.0
- TypeScript 5.x
- Tailwind CSS 4.x
- Mapbox GL JS 3.13.0

**Backend**:
- Next.js API Routes (serverless)
- Supabase (PostgreSQL 15)
- ZO API (authentication & profiles)

**Deployment**:
- Vercel (hosting & CI/CD)
- Supabase (managed database)

**Key Integrations**:
- ZO API - Phone auth, profile management, avatar generation
- Mapbox - Maps, geocoding, location services
- Luma API - Event calendar integration
- Anthropic Claude - AI features (Vibe Score)
- OpenAI Whisper - Voice transcription (quest audio)

---

## 📝 Updating Documentation

### When to Update

- **Architecture changes** → Update `ARCHITECTURE.md`
- **New tables/fields** → Update `DATABASE_SCHEMA.md`
- **Process changes** → Update `cursorrule.md`
- **Philosophy changes** → Update `PROJECT_RULES.md`

### How to Update

1. Read the relevant doc thoroughly
2. Make surgical edits (don't rewrite entire sections)
3. Update "Last Updated" date
4. Increment version if major change
5. Commit with clear message: `docs: update [DOC_NAME]`

**Philosophy**: Keep docs minimal. If it's not in these 5 files, it should be in the code.

---

## 🔍 Finding Information

**For architecture questions**: Read `ARCHITECTURE.md`  
**For database questions**: Read `DATABASE_SCHEMA.md`  
**For philosophy questions**: Read `PROJECT_RULES.md` and `/lore/zo_protocol_lore.md`  
**For AI coding questions**: Read `cursorrule.md`  
**For everything else**: Search the codebase or ask the team

---

## 🚀 Getting Started

**For New Developers**:
1. Read `PROJECT_RULES.md` (5 min)
2. Read `ARCHITECTURE.md` (15 min)
3. Read `DATABASE_SCHEMA.md` (10 min)
4. Browse `/lore/zo_protocol_lore.md` (5 min)
5. Start coding!

**For AI Assistants**:
1. Read `.cursorrules` in root (quick reference)
2. Read `Docs/PROJECT_RULES.md` (principles)
3. Read `Docs/cursorrule.md` (workflows)
4. Read `Docs/ARCHITECTURE.md` (tech details)
5. Check permissions before editing

**For Product/Design**:
1. Read `/lore/zo_protocol_lore.md` (worldview)
2. Read `PROJECT_RULES.md` (design principles)
3. Read `ARCHITECTURE.md` (what's possible technically)

---

## 📊 Documentation Status

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| **PROJECT_RULES.md** | 1.0 | 2025-11-13 | ✅ Complete |
| **ARCHITECTURE.md** | 2.0 | 2025-11-22 | ✅ Complete |
| **DATABASE_SCHEMA.md** | 3.0 | 2025-11-13 | ✅ Complete |
| **cursorrule.md** | 1.0 | 2025-11-13 | ⚠️ Needs update |
| **README.md** | 2.0 | 2025-11-22 | ✅ Complete |

**Overall Status**: 🟢 4/5 Complete | ⚠️ 1 Needs Update

---

## 🎯 Quick Links

### Essential Reading
- [PROJECT_RULES.md](PROJECT_RULES.md) - 25 foundational principles ⭐
- [ARCHITECTURE.md](ARCHITECTURE.md) - Complete system architecture ⭐
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) - Database schema & queries ⭐
- [cursorrule.md](cursorrule.md) - AI coding workflows ⭐
- [/lore/zo_protocol_lore.md](../lore/zo_protocol_lore.md) - Operating ontology 📖

### For Development
- Root `.cursorrules` - Quick reference for AI assistants
- `apps/web/src/lib/zo-api/` - ZO API client library
- `apps/web/src/lib/userDb.ts` - User database operations
- `apps/web/src/app/api/` - API routes

### For Understanding
- All code should be self-documenting
- Complex logic should have inline comments
- Git history contains decision context

---

**Last Updated**: 2025-11-22  
**Maintained By**: Development Team  
**Total Core Docs**: 5 files  
**Philosophy**: Minimal docs, maximum code clarity  
**Status**: ✅ Production Ready

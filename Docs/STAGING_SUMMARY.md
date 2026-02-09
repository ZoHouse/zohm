# Staging Branch Summary

> **Branch**: `staging` (from `main` at `d5efada`)
> **Date**: February 9, 2026
> **Total Changes**: 118 files changed, +11,241 lines, -19,143 lines (net: -7,902 lines)
> **Build Status**: Passing (Next.js 15 production build, 0 TypeScript errors)

---

## Commits (5)

| # | Hash | Message | Files |
|---|------|---------|-------|
| 1 | `c404c58` | `chore: Repo cleanup — remove stale files, fix .gitignore` | 63 files |
| 2 | `6d7511e` | `docs: Add complete documentation suite with GLOSSARY and INDEX` | 34 files |
| 3 | `bfcca03` | `feat: Zostel nodes, vibe score API, docs viewer, and asset dedup` | 14 files |
| 4 | `35c59af` | `chore: Add admin scripts, swagger docs, and remove stale scripts` | 17 files |
| 5 | `1a839e9` | `chore: trigger Vercel deploy on staging` | 0 files |

---

## What Changed: main → staging

### Files Deleted (70 files, ~42MB reclaimed)

#### Unused Dashboard Assets (31 files, ~41MB)
Grep-verified against source code — none of these images/SVGs are referenced anywhere.

- `chat-avatar-1.jpg`, `chat-avatar-2.jpg`, `chat-avatar-3.jpg`
- `coin-gradient-1.png`, `coin-gradient-2.png`, `coin-gradient-3.png`
- `comfyui-temp-iytpa-00048.png` (temp AI-generated file)
- `community-zo-collective-1.png`, `community-zo-collective-2.png`
- `culture-design.png`, `culture-food.png`, `culture-science-tech.png`
- `desktop-9-bg.jpg` (6.5MB)
- `dots-indicator.svg`, `icon-discord.png`, `icon-wallet.svg`, `icon-x-twitter.svg`
- `map-3d-main.jpg`, `map-marker.png`
- `nft-base.png` (13.6MB), `nft-overlay-blue.png`, `nft-overlay-green.png`, `nft-overlay-red.png`
- `profile-main.jpg`, `room-degen-lounge.jpg`, `room-schelling-point.jpg`
- `vector.svg`, `zo-house-blr-overlay.png`, `zo-house-sf.jpg`
- `zo-logo-badge.png`, `zo-node-graphic-1.png`, `zo-node-graphic-2.png`

#### Duplicate Assets (2 files, ~460KB)
- `background.png` — identical to `images/background.png`
- `figma-assets/landing-zo-logo.png` — identical to `quest-audio-assets/zo-logo.png` (references updated)

#### Stale Documentation (7 files)
- `Docs/AVATAR_UI_DISCREPANCIES.md` → archived to `Docs/archive/`
- `Docs/DASHBOARD_COMPLETE.md` → renamed to `Docs/DASHBOARD.md`
- `Docs/DATABASE_SCHEMA.md` → archived, replaced by `Docs/DATABASE.md`
- `Docs/NEW_USER_FUNNEL_DEEP_DIVE.md` → renamed to `Docs/NEW_USER_FUNNEL.md`
- `Docs/README.md` → archived, replaced by `Docs/INDEX.md`
- `README_API_DOCS.md` — stale API test doc
- `TESTING_ENDPOINTS.md` — stale endpoint test doc

#### Stale Scripts (14 files)
- `scripts/generate-icons.js`, `scripts/generate-favicon-icons.js` — broken/stale generators
- `scripts/migrate-console-logs.sh`, `scripts/migrate-console-to-devlog.js` — completed migration
- `scripts/run-migration.js`, `scripts/run-migration.sh`, `scripts/run-any-migration.js` — replaced by direct Supabase
- `scripts/test-zo-api.ts`, `scripts/validate-canonical-uid.ts` — one-time test scripts
- `scripts/import-zostel-nodes.mjs`, `scripts/list-nodes.mjs` — superseded
- `scripts/README_NODES.md` — docs for deleted scripts
- `scripts/seed-calendars.sql`, `scripts/setup-quest-tables.sql` — already applied

#### Applied SQL Migrations (6 files)
Already executed in Supabase, no longer needed in repo:
- `20260121-nodes-zones-v2.sql`
- `20260122-event-covers-storage.sql`
- `20260122-event-cultures.sql`
- `20260122-event-rsvps.sql`
- `20260122-extend-canonical-events.sql`
- `20260123-add-pending-rsvp-status.sql`

#### Other Removals (5 files)
- `lore/zo_protocol_lore.md` — byte-for-byte duplicate of `Docs/LORE.md`
- `apps/web/src/lib/bangaloreNodes.ts` — 1,226 lines of hardcoded node data, replaced by database
- `package-lock.json` — stale npm lockfile (project uses pnpm)
- `VERSION.txt` — contained only "V1", unreferenced
- `.deploy-trigger` — stale CI trigger file

---

### Files Added (36 files, +11K lines)

#### Documentation Suite (33 files)

**New Core Docs (18 files)**:

| File | Lines | Description |
|------|-------|-------------|
| `Docs/GLOSSARY.md` | 352 | **Single source of truth** — all terms, naming conventions, code-verified values |
| `Docs/INDEX.md` | 139 | Documentation hub linking all 22 docs with descriptions |
| `Docs/SYSTEM_FLOWS.md` | 638 | Auth (Phone OTP), Events (5-step), Vibe Check governance flows |
| `Docs/DATABASE.md` | 567 | Complete database schema and table relationships |
| `Docs/NODE_ADMIN_GUIDE.md` | 516 | 19 node types, 13 zone types, admin API, Supabase queries |
| `Docs/EVENTS_SYSTEM.md` | 1,245 | Technical events: iCal, canonical events, RSVP, admin, check-in |
| `Docs/EVENTS.md` | 216 | Event lifecycle: pre-event, day-of, post-event operations |
| `Docs/ZO_OS.md` | 141 | Zo OS / Zo Protocol architecture overview with diagrams |
| `Docs/AGENTS.md` | 132 | 6 agent roles across 4 tiers |
| `Docs/FOUNDERS.md` | 126 | Global infrastructure: Zo Houses, Accelerator, Capital |
| `Docs/ZO_HOUSE.md` | 211 | Core principles, network architecture, property standards |
| `Docs/NODE_PLAYBOOK.md` | 174 | 7-stage node lifecycle and execution guide |
| `Docs/OPERATIONS.md` | 199 | 6-phase daily operations, House Captain system |
| `Docs/CULTURE.md` | 157 | Vibe Curator, consent culture, MOOP principles |
| `Docs/APP_OVERVIEW.md` | 98 | Current app features and implementation status |
| `Docs/DASHBOARD.md` | — | Renamed from DASHBOARD_COMPLETE.md |
| `Docs/NEW_USER_FUNNEL.md` | — | Renamed from NEW_USER_FUNNEL_DEEP_DIVE.md |
| `Docs/LORE.md` | — | Moved from lore/zo_protocol_lore.md |

**Laundry (Code Cleanup Tracker) (1 file)**:
- `Docs/LAUNDRY/culture-slug-cleanup.md` — 6 mismatched culture slugs between `EventCulture` and `CultureType`

**Project Docs (6 files)**:

| File | Lines | Repository |
|------|-------|-----------|
| `Docs/projects/QUESTING_MAP.md` | 315 | zohm (game.zo.xyz) |
| `Docs/projects/WEB_PLATFORM.md` | 239 | zo.xyz |
| `Docs/projects/HOSPITALITY_BOT.md` | 387 | Hospitality-2.0 |
| `Docs/projects/MOBILE_APP.md` | 402 | ZoWorldmobile |
| `Docs/projects/PASSPORT_SDK.md` | 405 | zopassport |
| `Docs/projects/BUILDER_BOT.md` | 220 | ZoBuilder-bot |

**Archive (6 files)** — Historical versions preserved at `Docs/archive/old_vision_jan2026/`:
- ARCHITECTURE.md, AVATAR_UI_DISCREPANCIES.md, DATABASE_SCHEMA.md
- NODES_DEFINITION.md, NODE_ADMIN_GUIDE.md, README.md

#### Feature Code (5 new files)
- `apps/web/src/app/api/vibe-score/route.ts` — Vibe score API with Metabase
- `apps/web/src/hooks/useVibeScore.ts` — Client-side vibe score hook
- `apps/web/src/lib/metabase.ts` — Metabase query integration utility
- `apps/web/src/app/docs/[[...slug]]/page.tsx` — Docs viewer route
- `apps/web/src/app/docs/layout.tsx` — Docs viewer layout

#### Infrastructure (6 new files)
- `apps/web/scripts/download-cas-users.ts` — Download all 650K+ CAS users
- `apps/web/scripts/download-cas-founders.ts` — Download CAS founders
- `apps/web/scripts/merge-cas-users.ts` — Merge CAS user data
- `apps/web/scripts/zo-login.ts` — ZO API login utility
- `apps/web/scripts/run-download.sh` — Background download runner
- `apps/web/public/zostellogo.png` — Zostel logo asset

---

### Files Modified (12 files)

| File | Change |
|------|--------|
| `.gitignore` | Added: `.zo-admin-token`, `package-lock.json`, `Docs/docs copy/`. Removed: `docs/` rule (blocked Docs/ on macOS). Added: `!Docs/` + `!Docs/**` exceptions. |
| `Docs/ARCHITECTURE.md` | Added "The Two APIs" section — ZOHM API (proxy) vs ZO API (CAS) |
| `ZO_API.md` | Added two-API distinction header and table |
| `README.md` | Updated project overview |
| `apps/web/package.json` | Added tsx dev dependency |
| `apps/web/src/app/page.tsx` | Landing page updates |
| `apps/web/src/components/MapCanvas.tsx` | Map data and popup improvements |
| `apps/web/src/components/LandingPage.tsx` | Logo path: `figma-assets/landing-zo-logo.png` → `quest-audio-assets/zo-logo.png` |
| `apps/web/src/components/UnifiedOnboarding.tsx` | Same logo path fix |
| `apps/web/src/hooks/useMapGeoJSON.ts` | Map GeoJSON data improvements |
| `apps/web/src/lib/nodeTypes.ts` | Updated node type definitions |
| `pnpm-lock.yaml` | Dependency updates |

### Files Renamed/Moved (10 files)

| From | To |
|------|----|
| `Docs/DASHBOARD_COMPLETE.md` | `Docs/DASHBOARD.md` |
| `Docs/NEW_USER_FUNNEL_DEEP_DIVE.md` | `Docs/NEW_USER_FUNNEL.md` |
| `lore/zo_protocol_lore.md` | `Docs/LORE.md` |
| `Docs/AVATAR_UI_DISCREPANCIES.md` | `Docs/archive/old_vision_jan2026/` |
| `Docs/DATABASE_SCHEMA.md` | `Docs/archive/old_vision_jan2026/` |
| `Docs/README.md` | `Docs/archive/old_vision_jan2026/` |
| `swagger/swagger/swagger/README.md` | `swagger/README.md` |
| `swagger/swagger/swagger/index.html` | `swagger/index.html` |
| `swagger/swagger/swagger/openapi.yaml` | `swagger/openapi.yaml` |
| `swagger/swagger/swagger/server.js` | `swagger/server.js` |

---

## Security Fixes

1. **`.zo-admin-token`** — added to `.gitignore` (was untracked but at risk)
2. **`run-download.sh`** — removed hardcoded CAS credentials, now requires env vars
3. **`package-lock.json`** — removed and gitignored (stale npm lockfile from a pnpm project)
4. **`docs/` gitignore trap** — the rule `docs/` on macOS's case-insensitive filesystem was silently blocking ALL new files in `Docs/` from being tracked. Fixed with `!Docs/` exception.

---

## Branch Cleanup

| Branch | Action |
|--------|--------|
| `Old-main` | Deleted (stale since Nov 2025) |
| `vercel/react-flight-rce-vulnerability-6pzqcm` | Deleted (stale Vercel patch from Dec 2025) |
| `Samurai` | Kept |
| `manish-v4` | Kept |
| `dependabot/npm_and_yarn/...` | Kept (open PR #10) |

---

## Redundancy Audit Findings

### Resolved in This Branch
- 5 identical archive files removed (were byte-for-byte copies of main docs)
- 2 duplicate images removed with reference updates
- `Docs/.DS_Store` removed
- `Docs/docs copy/` directory removed (legacy Word docs)

### Flagged for Future Work
- **Culture slug discrepancy** → `Docs/LAUNDRY/culture-slug-cleanup.md`
  - 6 slugs differ between `EventCulture` (DB canonical) and `CultureType` (UI display)
  - Affects: `ProfilePanel.tsx`, `LeftSidebar.tsx`, `cultures.ts`
- **2 near-identical reward API routes** → `/api/send-avax-reward` and `/api/send-token-reward` (consolidation candidate)
- **3 unused hooks** → `useAvatarGeneration`, `useGame1111Engine`, `useVibeScore`
- **Debug API routes** → `/api/debug/avatar-test`, `/api/users/[id]/test-reset` (should be gated in production)
- **23 Dependabot vulnerabilities** on default branch (11 high, 12 moderate)

---

## Key Documentation Decisions

| Decision | Rationale |
|----------|-----------|
| "Game Map" not "Questing Map" | The map is the primary navigation tool for all of Zo World, not just quests |
| Four core map elements | Nodes, Citizens, Events/Activities, Quests |
| Zo OS = Zo Protocol | Same system, different names — "Protocol" = rules, "OS" = tools/stack |
| Two APIs documented | ZOHM API (community proxy) vs ZO API (main identity DB/CAS) |
| GLOSSARY as single source of truth | Every term fact-checked against code; check before introducing new terms |
| 19 node types (not 18) | `staynode` was missing from docs — it's a legacy alias for `zostel` |
| 19 cultures with dual slugs | EventCulture (DB) vs CultureType (UI) — discrepancy tracked in LAUNDRY |

---

## Build Verification

```
✓ Compiled successfully in 16.0s
✓ Types valid — 0 TypeScript errors
✓ 41 static pages generated
✓ 51 API routes compiled
✓ Production build passes (next build --no-lint)
```

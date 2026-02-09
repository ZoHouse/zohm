# Staging Branch Summary

> **Branch**: `staging` (from `main` at `d5efada`)
> **Date**: February 9, 2026
> **Commits**: 11
> **Total**: 139 files changed, +13,771 / -19,173 lines (60 deleted, 48 added, 21 modified, 10 renamed)
> **Build**: Passing — 0 TypeScript errors, 41 static pages, 55 API routes

---

## Commits

| # | Hash | Message | Scope |
|---|------|---------|-------|
| 1 | `c404c58` | `chore: Repo cleanup — remove stale files, fix .gitignore` | 63 files — deleted ~42MB unused assets, stale scripts, applied migrations |
| 2 | `6d7511e` | `docs: Add complete documentation suite with GLOSSARY and INDEX` | 34 files — 22 docs covering all systems, 6 project docs, archive |
| 3 | `bfcca03` | `feat: Zostel nodes, vibe score API, docs viewer, and asset dedup` | 14 files — /docs route, vibe score API, Metabase integration |
| 4 | `35c59af` | `chore: Add admin scripts, swagger docs, and remove stale scripts` | 17 files — CAS download scripts, Swagger docs, script cleanup |
| 5 | `1a839e9` | `chore: trigger Vercel deploy on staging` | 0 files — empty commit to trigger deploy |
| 6 | `be3be8b` | `docs: Add staging branch summary` | 1 file — this document (initial version) |
| 7 | `8b3f2ed` | `chore: Remove CAS download scripts — data already in Supabase` | 5 files — removed scripts added in #4, data now in DB |
| 8 | `6178e73` | `feat: Telegram vibe check for pending community events` | 9 files — full vibe check system: bot, webhook, cron, feature flags |
| 9 | `9aa2f44` | `docs: Update vibe check docs to match implementation` | 7 files — rewrote vibe check across 6 docs, deleted applied SQL |
| 10 | `bb9e081` | `feat: Luma API integration + event system improvements` | 20 files — Luma client, geo-routed push, RSVP sync, webhook, worker |
| 11 | `bdd9c6c` | `fix: Use correct Luma calendar ID for Zo Events` | 1 file — replaced placeholder with API-verified calendar ID |

---

## New Features

### Telegram Vibe Check (commit #8)

Community governance for pending citizen events via Telegram.

- **Flow**: Citizen creates event → `pending` → bot posts to TG approval group → members vote with inline buttons → cron resolves after 24h
- **Decision**: Simple majority (`upvotes > downvotes` = approved)
- **Non-blocking**: All Telegram calls are fire-and-forget
- **Feature flag**: `FEATURE_VIBE_CHECK_TELEGRAM` (default: `false`)
- **Files**: `lib/telegram/` (vibeCheck.ts, bot.ts, types.ts), `api/webhooks/telegram/`, `api/worker/resolve-vibe-checks/`, `lib/featureFlags.ts`

### Luma API Integration (commits #10, #11)

Bidirectional event sync with Luma calendars via geo-routed push.

- **Geo-routing**: Events within 500km of Bangalore → BLR calendar (`cal-ZVonmjVxLk7F2oM`), everything else → Zo Events calendar (`cal-3YNnBTToy9fnnjQ`)
- **Push**: Auto-approved events push to Luma on creation; vibe-check-approved events push on resolution
- **Sync**: Worker pulls Luma RSVPs back to `event_rsvps` table
- **Webhook**: Receives Luma guest updates in real-time
- **Feature flag**: `FEATURE_LUMA_API_SYNC` (default: `false`)
- **Files**: `lib/luma/` (client.ts, config.ts, eventPush.ts, rsvpSync.ts, syncWorker.ts, types.ts), `api/luma/setup/`, `api/webhooks/luma/`, `api/worker/sync-luma/`

### Vibe Score API (commit #3)

- Node-level vibe scoring via Metabase query integration
- Client hook: `useVibeScore.ts`
- API: `GET /api/vibe-score`

### Docs Viewer (commit #3)

- Serves `Docs/` directory via `/docs/[[...slug]]` route on game.zo.xyz
- Layout + page components for markdown rendering

---

## Documentation Overhaul

### 22 Docs Created or Rewritten

**Core** (7): GLOSSARY, INDEX, SYSTEM_FLOWS, DATABASE, EVENTS_SYSTEM, EVENTS, APP_OVERVIEW
**Architecture** (3): ARCHITECTURE (updated), ZO_OS, AGENTS
**Node Ops** (5): ZO_HOUSE, NODE_PLAYBOOK, NODE_ADMIN_GUIDE, OPERATIONS, CULTURE
**Business** (1): FOUNDERS
**User Journey** (2): DASHBOARD (renamed), NEW_USER_FUNNEL (renamed)
**Lore** (1): LORE (moved from lore/)
**Laundry** (1): culture-slug-cleanup.md

**6 Project Docs** (one per Zo OS repo): WEB_PLATFORM, QUESTING_MAP, HOSPITALITY_BOT, MOBILE_APP, PASSPORT_SDK, BUILDER_BOT

**6 Archive Docs** preserved at `Docs/archive/old_vision_jan2026/`

### Key Documentation Decisions

| Decision | Rationale |
|----------|-----------|
| "Game Map" not "Questing Map" | The map is the navigation tool for all of Zo World, not just quests |
| Four core map elements | Nodes, Citizens, Events/Activities, Quests |
| Zo OS = Zo Protocol | Same system, different names — "Protocol" = rules, "OS" = tools/stack |
| Two APIs documented | ZOHM API (community proxy) vs ZO API (main identity DB/CAS) |
| GLOSSARY as single source of truth | Every term fact-checked against code |
| 19 node types (not 18) | `staynode` was missing — it's a legacy alias for `zostel` |
| 19 cultures with dual slugs | EventCulture (DB) vs CultureType (UI) — tracked in LAUNDRY |

---

## Repo Cleanup

### Deleted (60 files, ~42MB reclaimed)

| Category | Count | Details |
|----------|-------|---------|
| Unused dashboard assets | 31 | Grep-verified — no code references. Includes 13.6MB `nft-base.png`, 6.5MB `desktop-9-bg.jpg` |
| Stale scripts | 14 | Completed migrations, broken generators, one-time test scripts |
| Applied SQL migrations | 7 | All executed in Supabase (`nodes-zones-v2`, `event-covers`, `event-cultures`, `event-rsvps`, `extend-canonical-events`, `pending-rsvp-status`, `vibe-checks-tables`) |
| Stale docs | 5 | Archived or renamed, replaced by new docs |
| Duplicate assets | 2 | `background.png`, `landing-zo-logo.png` — references updated |
| Other | 5 | `bangaloreNodes.ts` (1,226 lines hardcoded data), `package-lock.json`, `VERSION.txt`, `.deploy-trigger`, `lore/zo_protocol_lore.md` |

### Security Fixes

1. **`.zo-admin-token`** — added to `.gitignore`
2. **`run-download.sh`** — removed hardcoded CAS credentials, now requires env vars
3. **`package-lock.json`** — removed and gitignored (stale npm lockfile in a pnpm project)
4. **`docs/` gitignore trap** — the rule `docs/` on macOS case-insensitive FS was blocking `Docs/` from tracking. Fixed with `!Docs/` exception.

### Branch Cleanup

| Branch | Action |
|--------|--------|
| `Old-main` | Deleted (stale since Nov 2025) |
| `vercel/react-flight-rce-vulnerability-6pzqcm` | Deleted (stale Vercel patch) |
| `Samurai`, `manish-v4`, `dependabot/...` | Kept |

---

## Flagged for Future Work

- **Culture slug discrepancy** → `Docs/LAUNDRY/culture-slug-cleanup.md` — 6 slugs differ between `EventCulture` (DB) and `CultureType` (UI)
- **2 near-identical reward API routes** → `/api/send-avax-reward` and `/api/send-token-reward`
- **3 unused hooks** → `useAvatarGeneration`, `useGame1111Engine`, `useVibeScore`
- **Debug API routes** → `/api/debug/avatar-test`, `/api/users/[id]/test-reset` (should be gated in production)
- **23 Dependabot vulnerabilities** on default branch (11 high, 12 moderate)

---

## Environment Variables (New)

| Variable | Feature | Required |
|----------|---------|----------|
| `FEATURE_VIBE_CHECK_TELEGRAM` | Vibe check system | Set `true` to enable |
| `TELEGRAM_BOT_TOKEN` | Vibe check | If vibe check enabled |
| `TELEGRAM_VIBE_CHECK_CHAT_ID` | Vibe check | If vibe check enabled |
| `FEATURE_LUMA_API_SYNC` | Luma integration | Set `true` to enable |
| `LUMA_BLR_API_KEY` | Luma BLR calendar | If Luma enabled |
| `LUMA_ZO_EVENTS_API_KEY` | Luma Zo Events calendar | If Luma enabled |

---

## Build Verification

```
Compiled successfully
Types valid — 0 TypeScript errors
41 static pages generated
55 API routes compiled
Production build passes (next build --no-lint)
```

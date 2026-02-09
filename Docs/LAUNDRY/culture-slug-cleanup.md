# Culture Slug Cleanup

**Priority**: Medium
**Type**: Code cleanup / Bug prevention
**Created**: February 2026

---

## Problem

Two TypeScript type definitions exist for cultures with **different slugs** for 6 of the 19 values:

| Database Slug (`EventCulture`) | `CultureType` Slug | Display Name |
|-------------------------------|--------------------| -------------|
| `game` | `games` | Game / Games |
| `law` | `law_order` | Law / Law & Order |
| `literature_stories` | `literature` | Literature & Stories |
| `stories_journal` | `stories_journals` | Stories & Journal(s) |
| `sport` | `sports` | Sport / Sports |
| `default` | `evolving_cultures` | Default / Evolving Cultures |

**Source of truth**: The **database** (`event_cultures` table) uses `EventCulture` slugs. The `CultureType` in `cultures.ts` has diverged.

---

## Affected Files

### Canonical (correct slugs — `EventCulture`)

| File | Role |
|------|------|
| `apps/web/src/types/events.ts` | Type definition — used by events, RSVP, cover images |
| `apps/web/src/lib/eventCoverDefaults.ts` | Culture cover image mapping |
| `apps/web/src/components/events/CultureSelector.tsx` | Event creation culture picker |
| `apps/web/src/components/events/EditEventModal.tsx` | Event editing |
| `apps/web/src/components/mobile-dashboard/MobileMyEventsCard.tsx` | Mobile event display |
| `apps/web/src/components/desktop-dashboard/MyEventsCard.tsx` | Desktop event display |
| `apps/web/src/app/my-events/page.tsx` | My Events page |
| `apps/web/src/app/api/events/cultures/route.ts` | Cultures API (reads from DB) |
| `Docs/DATABASE.md` | Database schema docs |

### Diverged (wrong slugs — `CultureType`)

| File | Role | Impact |
|------|------|--------|
| `apps/web/src/lib/cultures.ts` | Type + icon/name/color helpers | Used by profile and dashboard |
| `apps/web/src/components/ProfilePanel.tsx` | User profile culture selector | Selects cultures using `CultureType` slugs |
| `apps/web/src/components/desktop-dashboard/LeftSidebar.tsx` | Dashboard culture display | Displays cultures using `CultureType` slugs |

---

## Fix

### Option A: Align `cultures.ts` to database slugs (Recommended)

1. Update `CultureType` in `cultures.ts` to match `EventCulture` slugs
2. Update all `getCultureIcon`, `getCultureDisplayName`, `getCultureColor` maps
3. Update `getAllCultures()` return values
4. Test ProfilePanel and LeftSidebar still work

**Changes needed in `cultures.ts`:**
```
games → game
law_order → law
literature → literature_stories
stories_journals → stories_journal
sports → sport
evolving_cultures → default
```

### Option B: Unify into single type

1. Delete `CultureType` from `cultures.ts`
2. Import `EventCulture` from `types/events.ts` everywhere
3. Move icon/name/color helpers to use `EventCulture` keys
4. Update `ProfilePanel.tsx` and `LeftSidebar.tsx` imports

Option B is cleaner long-term (single source of truth) but requires more file changes.

---

## Risk

Currently this may cause silent bugs where a user selects a culture in their profile (using `CultureType` slugs like `games`) but the database stores the `EventCulture` slug (`game`). If the profile selector writes `games` to the DB but events expect `game`, culture filtering and matching could silently fail.

---

## Verification

After fix, grep for all 6 old slugs to confirm removal:
```bash
grep -r "games\|law_order\|literature'\|stories_journals\|sports'\|evolving_cultures" apps/web/src/
```

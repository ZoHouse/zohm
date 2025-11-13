# Legacy Feature Documentation

This folder contains older feature documentation that has been superseded by newer, cleaner specs in the parent `FEATURES/` folder.

---

## Purpose

Keep old detailed docs for reference while using cleaner, production-ready specs for implementation.

---

## Files

### `GAME1111_TECHNICAL_DOCUMENTATION.md`
**Status**: Superseded by `../06-game1111-spec.md`  
**Contains**: Original detailed Game1111 documentation with mechanics, UI, improvements  
**Use**: Reference for historical context and detailed mechanics

---

### `AR_DOCUMENTATION.md`
**Status**: Reference  
**Contains**: AR marker scanning documentation  
**Note**: AR features not yet fully spec'd in main FEATURES

---

### `AR_INTEGRATION_EXAMPLE.md`
**Status**: Reference  
**Contains**: AR integration example code  
**Note**: Keep for when implementing AR quests

---

### `avatar-integration/`
**Status**: Superseded by mobile docs and ZO API integration plans  
**Contains**: 
- `AVATAR_BACKEND_ANSWERS.md` - Backend API answers
- `AVATAR_QUESTIONS_WE_CAN_ANSWER.md` - Codebase analysis
- `AVATAR_SELECTION_IMPLEMENTATION.md` - Implementation details
- `DOCUMENTATION_INDEX.md` - Old index

**Use**: Reference for understanding mobile app avatar system

---

## When to Use Legacy Docs

✅ **Good reasons**:
- Understanding detailed mechanics (Game1111 scoring details)
- Historical context for decisions
- Implementation examples (AR integration)
- Cross-referencing with current specs

❌ **Bad reasons**:
- As primary implementation guide (use parent `FEATURES/` instead)
- For API contracts (use `../API_CONTRACTS.md`)
- For current architecture (use `../ARCHITECTURE.md`)

---

## Relationship to Current Specs

| Legacy Doc | Current Spec | Notes |
|------------|-------------|-------|
| `GAME1111_TECHNICAL_DOCUMENTATION.md` | `../06-game1111-spec.md` | New spec is cleaner, production-ready |
| `avatar-integration/` | `../../mobile/` + ZO API docs | Mobile-specific, being replaced |
| `AR_*.md` | TBD | AR features not yet fully spec'd |

---

## Cleanup Policy

- Keep legacy docs as long as they provide value
- If information is fully migrated to new specs, move to `../../archive/`
- Update this README when adding/removing files

---

**Last Updated**: 2025-11-13


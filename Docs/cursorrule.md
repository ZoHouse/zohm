# Zo World - AI Pair-Coding Detailed Workflows

**Version**: 1.0  
**Last Updated**: 2025-11-13  
**Purpose**: Detailed technical workflows and enforcement for AI-assisted development

This document extends the root `.cursorrules` file with detailed workflows, examples, and enforcement procedures.

---

## Quick Reference

**Before editing, read in order:**
1. `.cursorrules` (root) - Core principles & safe zones
2. `Docs/PROJECT_RULES.md` - 25 foundational rules
3. This file - Detailed workflows
4. `Docs/CONSTRAINTS.md` - Path permissions matrix
5. `Docs/ARCHITECTURE.md` - System design

---

## Table of Contents

1. [File Permissions Matrix](#file-permissions-matrix)
2. [Pre-PR Workflow](#pre-pr-workflow)
3. [Laundry List Template](#laundry-list-template)
4. [Work Order Template](#work-order-template)
5. [Receipt Generation](#receipt-generation)
6. [Signal Contract Template](#signal-contract-template)
7. [Testing Requirements](#testing-requirements)
8. [Migration Checklist](#migration-checklist)
9. [Common Scenarios](#common-scenarios)
10. [Conflict Resolution](#conflict-resolution)

---

## File Permissions Matrix

### ✅ AI Editable (No Pre-Approval)

```
apps/web/src/components/**/*.tsx
apps/web/src/hooks/**/*.ts
packages/sdk/src/**/*.ts
Docs/**/*.md (except RECEIPTS/)
tests/**/*.test.ts
```

**Requirements:**
- Must follow PROJECT_RULES.md principles
- Clear commit messages
- Update tests if behavior changes
- No breaking changes to public APIs

### ⚠️ Human Review Required (PR Only)

```
apps/web/src/app/api/**/*.ts
apps/web/src/lib/supabase.ts
apps/web/src/lib/supabaseAdmin.ts
apps/web/src/lib/zo-api/**/*.ts
apps/web/src/lib/userDb.ts
```

**Requirements:**
- Create PR with detailed description
- Include test results (`pnpm test`)
- Document what changed and why
- Tag appropriate reviewer
- Wait for human approval before merge

### 🚫 Forbidden (Never Touch)

```
.env*
apps/web/package.json
apps/web/next.config.ts
pnpm-workspace.yaml
```

**If needed:**
- Create issue explaining why the change is necessary
- Provide detailed justification
- List alternatives considered
- Assign to human owner
- Never attempt direct edit

---

## Pre-PR Workflow

### Step 1: Run Tests

```bash
cd /Users/samuraizan/zohm
pnpm test
```

Include test summary in PR description.

### Step 2: Verify Lore Compliance

Read relevant sections:
- `/lore/zo_protocol_lore.md` - Operating ontology
- `Docs/PROJECT_RULES.md` - Foundational rules

Confirm no contradictions.

### Step 3: Update Documentation (If Needed)

- Architecture changes → Update `Docs/ARCHITECTURE.md`
- New tables/fields → Update `Docs/DATABASE_SCHEMA.md`
- New API routes → Document in `ARCHITECTURE.md` API section

---

## PR Description Template

Use this when creating a PR for human review:

```markdown
## Summary

Brief description of what changed and why.

## Changes

- Added/Modified/Removed: X
- Added/Modified/Removed: Y
- Added/Modified/Removed: Z

## Affected Systems

- [ ] Authentication
- [ ] Quests
- [ ] Map/Events
- [ ] Database
- [ ] Leaderboards
- [ ] Cities
- [ ] Other: ___

## Testing

- [ ] Unit tests pass (`pnpm test`)
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Works on mobile and desktop

## Lore Compliance

- [ ] Aligns with PROJECT_RULES.md
- [ ] No contradictions with /lore/zo_protocol_lore.md
- [ ] Follows architectural patterns in ARCHITECTURE.md

## Rollback Plan

If this needs to be reverted:
1. Run `git revert <commit>`
2. [Any additional steps, e.g., clear cache, restart services]
```

---

## Testing Requirements

### Unit Tests (Required)

```typescript
// Example: apps/web/src/components/BodyTypeSelector.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BodyTypeSelector } from './BodyTypeSelector';

test('selects bro on click', () => {
  const onChange = jest.fn();
  render(<BodyTypeSelector value="bro" onChange={onChange} />);
  
  fireEvent.click(screen.getByText('Bro'));
  expect(onChange).toHaveBeenCalledWith('bro');
});
```

### Integration Tests (For API Routes)

```typescript
// Example: tests/api/quests/complete.test.ts
test('POST /api/quests/complete saves to DB', async () => {
  const response = await fetch('/api/quests/complete', {
    method: 'POST',
    body: JSON.stringify({
      user_id: 'test-user',
      quest_id: 'game-1111-quest',
      score: 1111
    })
  });
  
  expect(response.status).toBe(200);
  // Verify DB state
});
```

### Test Command

```bash
pnpm test                 # All tests
pnpm test:watch          # Watch mode
pnpm test:coverage       # Coverage report
```

---

## Migration Checklist

### Before Creating Migration

- [ ] Read `Docs/DATABASE_SCHEMA.md`
- [ ] Check if existing columns can be reused
- [ ] Design for nullable columns (safer)
- [ ] Plan rollback strategy

### Migration File Structure

**UP script**: `packages/api/migrations/XXX_feature_name.sql`

```sql
-- Migration XXX: Feature Name
-- Description: Brief description
-- Author: Your name
-- Date: YYYY-MM-DD

BEGIN;

-- Step 1: Add columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS body_type TEXT;

-- Step 2: Add constraints
ALTER TABLE users
ADD CONSTRAINT check_body_type 
CHECK (body_type IS NULL OR body_type IN ('bro', 'bae'));

-- Step 3: Add indexes
CREATE INDEX IF NOT EXISTS idx_users_body_type 
ON users(body_type) WHERE body_type IS NOT NULL;

COMMIT;
```

**DOWN script**: `packages/api/migrations/XXX_feature_name_ROLLBACK.sql`

```sql
-- Rollback Migration XXX: Feature Name

BEGIN;

DROP INDEX IF EXISTS idx_users_body_type;
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_body_type;
ALTER TABLE users DROP COLUMN IF EXISTS body_type;

COMMIT;
```

### Testing Migrations

```bash
# Apply
psql $DATABASE_URL < packages/api/migrations/XXX_feature_name.sql

# Verify
psql $DATABASE_URL -c "\d users"

# Rollback
psql $DATABASE_URL < packages/api/migrations/XXX_feature_name_ROLLBACK.sql
```

---

## Common Scenarios

### Scenario 1: Adding a New Component

**Safe Zone**: ✅ AI Editable

**Steps**:
1. Create component in `apps/web/src/components/`
2. Write unit test
3. Update parent component to use it
4. No laundry list needed (small change)
5. Commit with clear message

**Example**:
```bash
git add apps/web/src/components/NewComponent.tsx
git commit -m "feat(ui): add NewComponent for feature X"
```

---

### Scenario 2: Modifying API Route

**Protected Zone**: ⚠️ Human Review Required

**Steps**:
1. Make changes to API route
2. Update `ARCHITECTURE.md` if endpoint signature changed
3. Write/update tests
4. Run `pnpm test` to verify
5. Create PR with clear description (do not merge)
6. Tag reviewer

---

### Scenario 3: Database Schema Change

**Protected Zone**: ⚠️ Human Review Required

**Steps**:
1. Document the change needed and why
2. Update `Docs/DATABASE_SCHEMA.md` with new schema
3. Write migration SQL (if needed, store locally, don't commit)
4. Update affected API routes and types
5. Write/update tests
6. Create PR with clear description
7. Wait for human review
8. **Note**: Migration SQL should be run manually on Supabase dashboard, not committed to git [[memory:11179047]]

---

### Scenario 4: Need to Change package.json

**Forbidden**: 🚫 Never Touch

**Steps**:
1. Create GitHub issue explaining why dependency is needed
2. List alternatives considered
3. Note security implications
4. Tag: `dependencies` label
5. Assign to human owner
6. Do not attempt direct edit

---

## Conflict Resolution

### Lore Conflict

**Detected**: Feature contradicts `lore/zo_protocol_lore.md`

**Action**:
1. Stop implementation
2. Create RFC in `Docs/ARCHITECTURE.md`
3. Describe conflict and proposed resolution
4. Tag: `lore-conflict` label
5. Request human review
6. Wait for guidance

### Missing Requirements

**Detected**: Feature requirements unclear or missing

**Action**:
1. Stop implementation
2. Create GitHub issue describing the ambiguity
3. Propose solution(s) with tradeoffs
4. Tag relevant stakeholders
5. Wait for clarification

### Forbidden Path Required

**Detected**: Feature needs `package.json`, `.env`, or config change

**Action**:
1. Create GitHub issue with justification
2. Include:
   - Why it's needed
   - Alternatives considered
   - Security considerations
   - Impact assessment
3. Assign to human owner
4. Do not proceed with direct edit

---

## Emergency Protocol

If you cannot meet requirements (tests fail, lore violation, etc.):

1. **Abort** the change
2. **Create issue** in GitHub with:
   - Failure reason
   - What was attempted
   - Diagnostics/logs
   - Suggested fix
3. **Tag** relevant owners
4. **Do not merge** broken code

---

## Summary Checklist

Before creating any PR:

- [ ] Read PROJECT_RULES.md (understand principles)
- [ ] Check path permissions (editable/review/forbidden)
- [ ] Run tests (`pnpm test`)
- [ ] Verify lore compliance (no contradictions)
- [ ] Update relevant docs (ARCHITECTURE.md, DATABASE_SCHEMA.md)
- [ ] Write clear commit message
- [ ] Create PR with detailed description
- [ ] Tag appropriate reviewer
- [ ] **Do not merge if human review required**

---

## Questions?

1. Check `.cursorrules` (root) for quick reference
2. Read `Docs/PROJECT_RULES.md` for philosophy
3. Check this file (cursorrule.md) for workflows
4. Read `Docs/ARCHITECTURE.md` for technical details
5. Create GitHub issue if unclear
6. Ask human when in doubt

**Remember**: Human wins. When in doubt, ask. Never merge protected changes without approval.

---

**End of Detailed Workflows**

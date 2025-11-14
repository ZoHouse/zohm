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
apps/web/src/lib/privy.ts
packages/api/migrations/**/*.sql
.github/workflows/**/*.yml
```

**Requirements:**
- Create PR with detailed description
- Generate draft receipt (see Receipt Generation)
- Include test results
- Tag appropriate reviewer
- Wait for human approval before merge

### 🚫 Forbidden (Never Touch)

```
.env*
apps/web/package.json
apps/web/next.config.ts
packages/contracts/**
pnpm-workspace.yaml (structure changes)
```

**If needed:**
- Create work order in `Docs/WORK_ORDERS/`
- Assign to human owner
- Provide detailed justification
- Never attempt direct edit

---

## Pre-PR Workflow

### Step 1: Create Laundry List (Required for all PRs)

```bash
# Create file
touch Docs/LAUNDRY/$(date +%Y%m%d)-<slug>-LAUNDRY.md
```

Use the template below. List 3-5 concrete tasks.

### Step 2: Create Work Order (If Feature-Sized)

For changes affecting multiple systems or requiring >2 hours:

```bash
touch Docs/WORK_ORDERS/$(date +%Y%m%d)-<slug>-WORK_ORDER.md
```

Include:
- Problem statement
- Proposed solution
- Affected systems (Vibe/Quests/Nodes/etc)
- Migration requirements
- Rollback plan
- Signal contracts

### Step 3: Generate Draft Receipt (If Touching Protected Paths)

```bash
python scripts/generate_receipt.py
```

This creates: `Docs/RECEIPTS/drafts/<receipt-id>.json`

Commit this with your changes.

### Step 4: Run Tests

```bash
cd /Users/samuraizan/zohm
pnpm test
```

Include test summary in PR description.

### Step 5: Verify Lore Compliance

Read relevant sections:
- `lore/zo_protocol_lore.md` - Operating ontology
- `Docs/PROJECT_RULES.md` - Foundational rules
- `Docs/VIBE_SCORE.md` - If touching vibe calculations

Confirm no contradictions.

### Step 6: Update Contracts (If Adding Signals/Endpoints)

- New signals → Update `Docs/SIGNALS.md`
- New API routes → Update `Docs/API_CONTRACTS.md`
- Schema changes → Update `Docs/DATABASE_SCHEMA.md`

---

## Laundry List Template

**File**: `Docs/LAUNDRY/YYYYMMDD-<slug>-LAUNDRY.md`

```markdown
# Laundry List: <Feature Name>

**Date**: YYYY-MM-DD
**Assignee**: AI Agent / Human Name
**Status**: Draft / In Progress / Complete
**Estimated Time**: <30 minutes

## Context

Brief description of why this work is needed.

## Tasks

- [ ] Task 1: Specific, actionable item
- [ ] Task 2: Another concrete step
- [ ] Task 3: Final verification step

## Acceptance Criteria

- Works on desktop and mobile
- No console errors
- Follows lore and rules
- Tests pass

## Related Docs

- Link to ARCHITECTURE section
- Link to relevant feature spec
```

---

## Work Order Template

**File**: `Docs/WORK_ORDERS/YYYYMMDD-<slug>-WORK_ORDER.md`

```markdown
# Work Order: <Feature Name>

**ID**: WO-YYYYMMDD-<slug>
**Date**: YYYY-MM-DD
**Assignee**: Human Name
**Estimated Time**: 1-4 hours
**Status**: Draft / In Progress / Review / Complete

## Problem Statement

Clear description of what needs to be built or fixed.

## Affected Systems

- [ ] Vibe Score
- [ ] Quests
- [ ] Nodes
- [ ] Citizens
- [ ] Map Interface
- [ ] Narrative Engine

## Proposed Solution

### Architecture Changes

Describe any new components, services, or data flows.

### Database Changes

List any migrations required.

### API Changes

New or modified endpoints.

### Signal Contracts

What new signals will be emitted?

## Implementation Plan

1. Step 1
2. Step 2
3. Step 3

## Testing Plan

- Unit tests: X files
- Integration tests: Y scenarios
- Manual testing: Z steps

## Rollback Plan

If this needs to be reverted:
1. Run migration down script: `migration_XXX_ROLLBACK.sql`
2. Revert PR: `git revert <commit>`
3. Clear cache: `...`

## Related Docs

- Link to feature spec
- Link to migration
- Link to laundry list

## Approval

- [ ] Human reviewer approved
- [ ] Tests passed
- [ ] Receipt generated
```

---

## Receipt Generation

### What is a Receipt?

A machine-readable record of changes to protected paths.

### When Required

- Any change to `apps/web/src/app/api/**`
- Database migrations
- CI/CD workflow changes
- Smart contract modifications

### How to Generate

```bash
cd /Users/samuraizan/zohm
python scripts/generate_receipt.py
```

This creates `Docs/RECEIPTS/drafts/<timestamp>-<commit>.json`:

```json
{
  "receipt_id": "20251113-143022-a1b2c3d",
  "branch": "samurai-new",
  "commit": "a1b2c3d",
  "timestamp": "2025-11-13T14:30:22Z",
  "changed_files": [
    "apps/web/src/app/api/quests/complete/route.ts"
  ],
  "requires_human_review": true,
  "tests_passed": true,
  "lore_compliant": true
}
```

### After Merge

CI will move draft receipt to `Docs/RECEIPTS/` and update `index.json`.

---

## Signal Contract Template

**File**: `Docs/SIGNALS.md` (append to this file)

```markdown
### <signal_name>

**Emitted by**: Quest/Map/Event system
**Trigger**: User completes action X
**Frequency**: Once per action / Continuous / Scheduled

**Payload**:
```json
{
  "signal_type": "quest_completed",
  "user_id": "string",
  "quest_id": "string",
  "score": number,
  "timestamp": "ISO8601",
  "metadata": {
    "proximity_factor": number,
    "reward_zo": number
  }
}
```

**Consumed by**:
- Vibe Score Engine (updates alignment)
- Leaderboard (updates rank)
- Narrative Engine (generates story beat)

**Privacy**: No PII stored, only derived metrics
**Retention**: 72 hours raw, aggregated to daily summaries
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
1. Create laundry list in `Docs/LAUNDRY/`
2. Generate draft receipt: `python scripts/generate_receipt.py`
3. Make changes to API route
4. Update API_CONTRACTS.md if signature changed
5. Write integration test
6. Create PR (do not merge)
7. Tag reviewer

---

### Scenario 3: Database Schema Change

**Protected Zone**: ⚠️ Human Review Required + Migration

**Steps**:
1. Create work order in `Docs/WORK_ORDERS/`
2. Design migration (UP + DOWN scripts)
3. Update `Docs/DATABASE_SCHEMA.md`
4. Test migration on staging
5. Generate draft receipt
6. Create PR with migration files
7. Wait for DBA/human review

---

### Scenario 4: Need to Change package.json

**Forbidden**: 🚫 Never Touch

**Steps**:
1. Create work order explaining why dependency is needed
2. List alternatives considered
3. Security implications
4. Assign to human owner
5. Do not attempt direct edit

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

### Missing Signal Contract

**Detected**: Feature generates data but no signal defined

**Action**:
1. Stop implementation
2. Create signal contract draft in `Docs/SIGNALS.md`
3. Define payload, frequency, consumers
4. Create laundry list for implementation
5. Wait for approval

### Forbidden Path Required

**Detected**: Feature needs `package.json` or contract change

**Action**:
1. Create work order with justification
2. Include:
   - Why it's needed
   - Alternatives considered
   - Security review
   - Migration/rollback plan
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

- [ ] Read PROJECT_RULES.md
- [ ] Check path permissions (CONSTRAINTS.md)
- [ ] Create laundry list (if needed)
- [ ] Create work order (if feature-sized)
- [ ] Generate receipt (if protected path)
- [ ] Run tests (`pnpm test`)
- [ ] Verify lore compliance
- [ ] Update contracts (signals/API)
- [ ] Write clear commit message
- [ ] Tag appropriate reviewer
- [ ] Do not merge if human review required

---

## Questions?

1. Check `.cursorrules` (root) for quick reference
2. Read `Docs/PROJECT_RULES.md` for philosophy
3. Check `Docs/CONSTRAINTS.md` for permissions
4. Create issue if unclear
5. Ask human when in doubt

**Remember**: Human wins. When in doubt, ask. Never merge protected changes.

---

**End of Detailed Workflows**

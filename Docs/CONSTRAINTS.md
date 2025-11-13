# Code Constraints & Boundaries

**Project**: Zo World Map (ZOHM)  
**Last Updated**: 2025-11-13  
**Purpose**: Define editable/immutable path rules for AI and human developers

---

## Overview

This document defines which parts of the codebase are:
- ✅ **Editable** - AI and humans can modify freely
- ⚠️ **Guarded** - Requires human approval before changes
- 🔒 **Immutable** - Never modify without explicit permission from tech lead

---

## Path Classification

### ✅ Editable Paths

AI and developers can freely modify these:

```
apps/web/src/components/        # React components (except QuestAudio.tsx)
apps/web/src/app/               # Next.js app routes
apps/web/src/hooks/             # Custom React hooks
apps/web/src/lib/               # Utility libraries
apps/web/src/styles/            # CSS and styling
apps/web/public/                # Static assets
Docs/                           # Documentation (this file excluded)
scripts/                        # Helper scripts
lore/                           # Lore and narrative content
```

**Rules**:
- Test changes locally before committing
- Follow existing code style
- Add comments for complex logic
- Update related docs if behavior changes

---

### ⚠️ Guarded Paths

Require human review and approval before changes:

```
apps/web/src/app/api/           # API routes
apps/web/src/lib/supabase.ts    # Database client
apps/web/src/lib/questService.ts # Quest business logic
migrations/                     # Database migrations
.env.local                      # Environment variables (never commit)
apps/web/src/components/QuestAudio.tsx  # Game1111 component
packages/                       # Shared packages (when created)
```

**Rules**:
- Create a **Work Order** in `Docs/WORK_ORDERS/` before starting
- Run full test suite
- Get approval from at least one reviewer
- Create a **draft receipt** before opening PR

---

### 🔒 Immutable Paths

Never modify without explicit tech lead permission:

```
packages/contracts/             # Smart contracts (future)
infra/                          # Infrastructure as code (future)
.github/workflows/              # CI/CD workflows
.github/CODEOWNERS              # Code ownership
Docs/CONSTRAINTS.md             # This file
Docs/API_CONTRACTS.md           # API contracts
Docs/RECEIPTS/                  # Receipt system
scripts/generate_receipt.py     # Receipt generation script
package.json                    # Root dependencies
pnpm-workspace.yaml             # Workspace config
```

**Rules**:
- If you need to change these, **stop and ask a human first**
- Create a detailed **Work Order** explaining why the change is needed
- Get approval from tech lead or project owner
- Changes to these paths MUST include a receipt

---

## File-Level Constraints

### Never Modify

These specific files are critical and should never be changed by AI:

```
.gitignore
.cursorignore
README.md (root)
LICENSE
CONTRIBUTING.md (when created)
SECURITY.md (when created)
```

---

### Modify with Extreme Caution

These files can break the entire application if changed incorrectly:

```
apps/web/next.config.js
apps/web/tailwind.config.ts
apps/web/tsconfig.json
migrations/*.sql
```

**Before modifying**:
1. Backup the current version
2. Create a rollback script
3. Test in staging environment
4. Get human approval

---

## Database Constraints

### Migration Rules

**✅ Always Safe**:
- Adding new nullable columns
- Creating new tables
- Adding indexes
- Creating new triggers

**⚠️ Requires Review**:
- Adding non-nullable columns (requires default value)
- Modifying existing columns (use ALTER)
- Renaming columns (breaks existing queries)
- Adding foreign keys

**🔒 Never Do Without Permission**:
- Dropping tables
- Dropping columns
- Modifying RLS policies
- Changing primary keys
- Deleting data

---

### Migration Checklist

Before creating a migration:
- [ ] Migration file named `XXX_descriptive_name.sql`
- [ ] Rollback file created `XXX_descriptive_name_ROLLBACK.sql`
- [ ] Migration tested locally
- [ ] Migration tested on staging
- [ ] Data migration plan documented
- [ ] Rollback tested
- [ ] Receipt created

---

## API Route Constraints

### Safe to Add

- New API routes under `/api/v1/`
- New query parameters (as long as they're optional)
- New optional fields in response bodies

### Requires Review

- Changing existing API routes
- Modifying request/response schemas
- Adding required parameters
- Changing status codes
- Modifying authentication logic

### Never Do

- Remove API routes without deprecation plan
- Change response format of existing endpoints
- Remove fields from responses (use optional instead)
- Bypass authentication on protected routes

---

## Component Constraints

### Safe to Add

- New components in `apps/web/src/components/`
- New UI elements
- Styling changes
- Accessibility improvements

### Requires Review

- Modifying `QuestAudio.tsx` (Game1111 component)
- Changing state management logic
- Modifying authentication flows
- Changing routing logic

### Never Do

- Remove components that are imported elsewhere without checking usage
- Change prop interfaces without updating all callers
- Modify global state without understanding side effects

---

## Environment Variable Rules

**✅ Safe to Add**:
- New optional environment variables
- Development-only variables

**⚠️ Requires Review**:
- New required environment variables
- Changing default values
- Removing variables

**🔒 Never Commit**:
- `.env.local` file
- Any file containing secrets or API keys
- Production credentials

**How to Add New Environment Variables**:
1. Add to `.env.example` with placeholder value
2. Document in `Docs/DEVELOPMENT_SETUP.md`
3. Update `Docs/DEPLOYMENT_GUIDE.md` if needed
4. Add to CI/CD secrets (if applicable)

---

## Testing Requirements

### Before Committing

All changes must pass:
- [ ] TypeScript compilation (`npm run build`)
- [ ] Linting (`npm run lint`)
- [ ] Local dev server runs (`npm run dev`)
- [ ] Manual testing of changed features

### Before Opening PR

For guarded paths, also require:
- [ ] Unit tests written for new functions
- [ ] Integration tests for API routes
- [ ] E2E tests for critical user flows
- [ ] Test coverage doesn't decrease

---

## AI-Specific Constraints

### What AI Should Do

✅ **Proactively help with**:
- Writing component code
- Creating hooks
- Styling improvements
- Documentation updates
- Adding tests
- Code refactoring (in editable paths)

✅ **Ask before doing**:
- Modifying API routes
- Creating migrations
- Changing authentication
- Modifying quest logic
- Touching contracts/infra

✅ **Never do autonomously**:
- Delete files in guarded/immutable paths
- Modify CI/CD workflows
- Change environment variables
- Deploy to production
- Merge PRs

---

### AI Workflow for Guarded Changes

1. **Acknowledge the constraint**:
   > "I see this file is in a guarded path. Let me create a Work Order for this change."

2. **Create Work Order**:
   > Creating `Docs/WORK_ORDERS/WO-001-add-vibe-score-endpoint.md`

3. **Get approval**:
   > "I've created a Work Order. Should I proceed with implementation, or would you like to review it first?"

4. **Implement with caution**:
   - Add extensive comments
   - Write comprehensive tests
   - Create rollback plan

5. **Generate receipt**:
   > "Running `scripts/generate_receipt.py` to create a draft receipt..."

6. **Create PR (don't merge)**:
   > "I've opened PR #123. It's ready for human review. Do not merge until approved."

---

## Breaking the Rules

### When You Can Break These Rules

Only in these situations:
1. **Emergency hotfix** - Production is down, immediate fix needed
2. **Explicit permission** - Tech lead says "yes, modify this immutable file"
3. **False alarm** - File is incorrectly classified (update this doc)

### How to Break the Rules Safely

1. **Announce your intention**:
   > "I need to modify [immutable_file]. This is because [reason]. Proceeding with extreme caution."

2. **Backup everything**:
   ```bash
   git stash
   git checkout -b emergency-hotfix-[date]
   ```

3. **Make minimal changes**:
   - Change only what's absolutely necessary
   - Add detailed comments explaining why

4. **Test exhaustively**:
   - Test locally
   - Test on staging
   - Get human approval before production

5. **Document the exception**:
   - Add entry to `Docs/RECEIPTS/emergency/`
   - Update this doc if classification was wrong

---

## Updating These Constraints

This document is a living contract. To update:

1. **Who can update**: Tech lead, project owner, or team consensus
2. **Process**:
   - Create PR with proposed changes
   - Explain reasoning in PR description
   - Get approval from at least 2 maintainers
   - Announce changes to whole team
3. **What to update**:
   - Path classifications (if they were wrong)
   - Rules (if they're too strict/loose)
   - Examples (if they're unclear)

---

## Enforcement

### CI/CD Enforcement

The following GitHub Actions enforce these constraints:

1. **`enforce-receipt.yml`**:
   - Blocks PRs touching guarded/immutable paths without receipts
   - Requires draft receipt in `Docs/RECEIPTS/drafts/`

2. **`enforce-tests.yml`** (planned):
   - Blocks PRs without passing tests
   - Requires minimum test coverage

3. **`enforce-approval.yml`** (planned):
   - Blocks PRs to guarded paths without human approval
   - Requires CODEOWNERS approval

### Code Review Checklist

Reviewers should check:
- [ ] Does this PR modify guarded/immutable paths?
- [ ] If yes, is there a draft receipt?
- [ ] If yes, was a Work Order created first?
- [ ] Are tests included?
- [ ] Is there a rollback plan for database changes?
- [ ] Are environment variables documented?

---

## Examples

### ✅ Good: Adding a New Component

```bash
# This is fine - components/ is editable
touch apps/web/src/components/VibeScoreWidget.tsx
# ... write component code ...
git add apps/web/src/components/VibeScoreWidget.tsx
git commit -m "feat: add VibeScoreWidget component"
git push origin feature/vibe-score-widget
```

**No receipt needed, no special approval.**

---

### ⚠️ Requires Review: Adding API Endpoint

```bash
# This is guarded - need Work Order and receipt
echo "Creating Work Order first..."
touch Docs/WORK_ORDERS/WO-005-vibe-score-api.md
# ... write work order ...

# Now create the endpoint
touch apps/web/src/app/api/v1/vibe/[userId]/route.ts
# ... implement endpoint ...

# Run tests
npm test

# Generate receipt
python3 scripts/generate_receipt.py

# Create PR (don't merge)
git add .
git commit -m "feat(api): add vibe score endpoint [WO-005]"
git push origin feature/vibe-score-api
# Open PR and request review
```

**Requires: Work Order + Receipt + Human Approval**

---

### 🔒 Immutable: Modifying Smart Contract

```bash
# ❌ STOP - This is immutable
# AI should NOT do this without explicit permission

# Instead, AI should say:
# "I see you want to modify a smart contract. This is an immutable path.
#  I need explicit permission from the tech lead before proceeding.
#  Should I create a Work Order for this change, or do you want to
#  handle it manually?"
```

**Requires: Tech lead permission + Detailed work order + Security audit**

---

## Related Documentation

- `Docs/API_CONTRACTS.md` - API endpoint contracts
- `Docs/WORK_ORDERS/README.md` - Work order system
- `Docs/RECEIPTS/README.md` - Receipt system
- `.github/CODEOWNERS` - Code ownership assignments
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template


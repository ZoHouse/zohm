# Work Orders

**Purpose**: Medium-sized tasks that require planning, review, and receipts.

---

## What Goes in Work Orders?

✅ **Good candidates**:
- New API endpoints
- Database migrations
- Quest system changes
- Authentication modifications
- Performance optimizations
- Integration with external APIs
- Refactoring guarded paths

❌ **Not for work orders** (use laundry instead):
- Typos and formatting
- Simple component updates
- Documentation fixes
- Minor style changes

---

## Work Order Format

```markdown
# Work Order: WO-XXX - Short Title

**Created**: 2025-11-13  
**Owner**: @username  
**Status**: 🟢 Approved  
**Estimated Time**: 3 hours  
**Priority**: High

---

## Objective

Clear statement of what this work order aims to accomplish.

## Context

Background information:
- Why is this needed?
- What problem does it solve?
- What's the current state?

## Scope

### In Scope
- List specific tasks included
- Files that will be modified
- Features that will be added

### Out of Scope
- List what is NOT included
- Future enhancements (for later)

## Technical Design

### Approach
Describe the technical approach in detail.

### Files to Modify
- `path/to/file1.ts` - What changes
- `path/to/file2.ts` - What changes

### New Files to Create
- `path/to/newfile.ts` - Purpose

### Database Changes
- New tables / columns
- Migrations needed
- Data migrations

## Dependencies

- Requires: WO-001 to be completed first
- Blocks: WO-005 (waiting on this)
- Related: LAUNDRY-010

## Testing Plan

- [ ] Unit tests for X
- [ ] Integration tests for Y
- [ ] Manual testing steps
- [ ] Performance benchmarks

## Rollback Plan

If something goes wrong:
1. Revert commit ABC123
2. Run rollback migration
3. Clear cache

## Acceptance Criteria

- [ ] Feature works as described
- [ ] Tests pass
- [ ] Documentation updated
- [ ] Receipt generated
- [ ] Code reviewed

## Notes

Additional context, links, or considerations.
```

---

## Workflow

### 1. Create Work Order

```bash
# Create file
touch Docs/WORK_ORDERS/WO-XXX-short-description.md

# Fill out template
# Commit work order
git add Docs/WORK_ORDERS/WO-XXX-short-description.md
git commit -m "docs: create WO-XXX work order"
```

---

### 2. Get Approval

- Post work order link in team chat
- Tag relevant stakeholders
- Wait for approval before starting
- Update status to 🟢 Approved

---

### 3. Implementation

```bash
# Create feature branch
git checkout -b feature/WO-XXX-short-description

# Do the work
# ... implement changes ...

# Run tests
npm test

# Update work order status to 🟡 In Progress
```

---

### 4. Generate Receipt

```bash
# Create draft receipt
python3 scripts/generate_receipt.py

# Receipt saved to Docs/RECEIPTS/drafts/
```

---

### 5. Create PR

```bash
# Commit changes
git add .
git commit -m "feat: implement WO-XXX - short description"

# Push
git push origin feature/WO-XXX-short-description

# Open PR using template
# Link work order in PR description
```

---

### 6. Code Review

- Reviewer checks work order was followed
- Reviewer verifies receipt exists
- Reviewer runs tests locally
- At least one approval required

---

### 7. Merge & Close

```bash
# After approval, merge PR
# Update work order status to ✅ Complete
# Move work order to archive

mv Docs/WORK_ORDERS/WO-XXX-short-description.md \
   Docs/WORK_ORDERS/archive/2025-11/
```

---

## Status Icons

- 📝 **Draft** - Being written
- 🔍 **Review** - Waiting for approval
- 🟢 **Approved** - Ready to start
- 🟡 **In Progress** - Being implemented
- ⏸️ **Paused** - On hold
- ✅ **Complete** - Done and merged
- ❌ **Cancelled** - Not moving forward
- 🔴 **Blocked** - Waiting on dependency

---

## Priority Levels

- 🔥 **Critical** - Blocks production / emergency fix
- 🔴 **High** - Important feature / critical path
- 🟠 **Medium** - Nice to have / normal priority
- 🟢 **Low** - Enhancement / future consideration

---

## Examples

See these example work orders:

### WO-001: Add Vibe Score API
`Docs/WORK_ORDERS/WO-001-vibe-score-api.md`
- New endpoint implementation
- Complex feature with multiple files
- Requires database changes

### WO-002: Game1111 Data Integration
`Docs/WORK_ORDERS/WO-002-game1111-integration.md`
- Existing feature enhancement
- Touches guarded paths
- Requires testing plan

### WO-003: ZO API Auth Migration
`Docs/WORK_ORDERS/WO-003-zo-api-auth-migration.md`
- Large refactor
- High risk changes
- Multiple phases

---

## Work Orders vs Laundry vs Epics

| Aspect | Laundry | Work Order | Epic |
|--------|---------|------------|------|
| Size | < 30 min | 1-4 hours | > 1 week |
| Risk | Very low | Medium | High |
| Approval | None | Review | Tech lead |
| Receipt | No | Yes | Yes |
| Phases | N/A | Single | Multiple WOs |

---

## Templates

### Small Work Order (1-2 hours)
Use simplified template with just:
- Objective
- Files to modify
- Testing plan
- Acceptance criteria

### Large Work Order (3-4 hours)
Use full template above

### Epic Work Order (> 4 hours)
Break into multiple work orders:
- WO-XXX-part-1
- WO-XXX-part-2
- etc.

---

## Archive Policy

Work orders should be moved to `Docs/WORK_ORDERS/archive/YYYY-MM/` after completion:

```bash
# Create month folder if needed
mkdir -p Docs/WORK_ORDERS/archive/2025-11

# Move completed work orders
mv Docs/WORK_ORDERS/WO-*.md Docs/WORK_ORDERS/archive/2025-11/
```

Keep current month in root for easy reference.

---

## Related Documentation

- `Docs/CONSTRAINTS.md` - Which paths need work orders
- `Docs/RECEIPTS/README.md` - Receipt system
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template
- `Docs/LAUNDRY/README.md` - Smaller tasks


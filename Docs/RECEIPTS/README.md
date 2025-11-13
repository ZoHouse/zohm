# Receipts System

**Purpose**: Track all changes to critical codepaths with machine-readable receipts.

---

## What are Receipts?

Receipts are **machine-readable JSON files** that document:
- What changed
- Who changed it
- Why it changed
- How to roll back

Think of them as "change logs on steroids" for critical infrastructure.

---

## When Do You Need a Receipt?

### ✅ Always Required For

- Changes to `packages/contracts/` (smart contracts)
- Changes to `infra/` (infrastructure)
- Changes to `.github/workflows/` (CI/CD)
- Database migrations
- API contract changes
- Authentication/security changes

### ⚠️ Sometimes Required For

- Changes to `/api/` routes (if modifying existing endpoints)
- Changes to `lib/questService.ts` (business logic)
- Major refactors (> 500 lines changed)

### ❌ Never Required For

- Documentation changes
- Styling/UI tweaks
- New components (not modifying existing)
- Laundry list items

---

## Receipt Format

```json
{
  "receipt_id": "20251113-153000-abc123",
  "branch": "feature/vibe-score-api",
  "commit": "abc123def456",
  "timestamp": "2025-11-13T15:30:00Z",
  "author": "github_username",
  "work_order": "WO-005",
  "type": "feature",
  "summary": "Add Vibe Score API endpoint",
  "files_changed": [
    "apps/web/src/app/api/v1/vibe/[userId]/route.ts",
    "apps/web/src/lib/vibeService.ts"
  ],
  "migrations": [
    "migrations/006_vibe_scores_table.sql"
  ],
  "rollback_plan": {
    "steps": [
      "Revert commit abc123def456",
      "Run migrations/006_vibe_scores_table_ROLLBACK.sql",
      "Restart API server"
    ],
    "estimated_downtime": "< 1 minute"
  },
  "tests": {
    "unit": "45 passed",
    "integration": "12 passed",
    "e2e": "3 passed"
  },
  "reviewers": ["@reviewer1", "@reviewer2"],
  "status": "merged",
  "pr_url": "https://github.com/ZoHouse/zohm/pull/123"
}
```

---

## Generating a Receipt

### Automatic (Script)

```bash
# Run the receipt generator
python3 scripts/generate_receipt.py

# Output: Docs/RECEIPTS/drafts/20251113-153000-abc123.json
```

The script automatically captures:
- Current branch name
- Latest commit SHA
- Timestamp
- Files changed in this branch

---

### Manual (Template)

If script fails, use this template:

```json
{
  "receipt_id": "YYYYMMDD-HHMMSS-shortsha",
  "branch": "your-branch",
  "commit": "commit-sha",
  "timestamp": "ISO-8601-timestamp",
  "author": "your-github-username",
  "work_order": "WO-XXX",
  "type": "feature|fix|refactor|migration",
  "summary": "One-line description",
  "files_changed": [],
  "migrations": [],
  "rollback_plan": {
    "steps": [],
    "estimated_downtime": ""
  },
  "tests": {},
  "reviewers": [],
  "status": "draft",
  "pr_url": ""
}
```

---

## Receipt Lifecycle

### 1. Draft Receipt

**Location**: `Docs/RECEIPTS/drafts/`

**When**: Created during development, before opening PR

**Status**: `draft`

```bash
# Generate draft
python3 scripts/generate_receipt.py

# Result: drafts/20251113-153000-abc123.json
```

---

### 2. PR Receipt

**Status**: Updated to include PR URL

**When**: After opening PR, before merging

```json
{
  ...
  "pr_url": "https://github.com/ZoHouse/zohm/pull/123",
  "reviewers": ["@reviewer1"],
  "status": "in_review"
}
```

---

### 3. Merged Receipt

**Location**: `Docs/RECEIPTS/` (root)

**When**: After PR is merged

**Status**: `merged`

```bash
# Move from drafts to root
mv Docs/RECEIPTS/drafts/20251113-153000-abc123.json \
   Docs/RECEIPTS/20251113-153000-abc123.json

# Update index.json
# Add entry to receipts array
```

---

### 4. Archived Receipt

**Location**: `Docs/RECEIPTS/archive/YYYY-MM/`

**When**: After 3 months (or project milestone)

```bash
# Archive old receipts
mkdir -p Docs/RECEIPTS/archive/2025-11
mv Docs/RECEIPTS/202511*.json Docs/RECEIPTS/archive/2025-11/
```

---

## Receipt Index

`Docs/RECEIPTS/index.json` maintains a searchable index:

```json
{
  "version": "1.0",
  "receipts": [
    {
      "receipt_id": "20251113-153000-abc123",
      "timestamp": "2025-11-13T15:30:00Z",
      "type": "feature",
      "summary": "Add Vibe Score API endpoint",
      "pr_url": "https://github.com/ZoHouse/zohm/pull/123",
      "status": "merged"
    }
  ],
  "metadata": {
    "description": "Receipt index for ZOHM",
    "last_updated": "2025-11-13T15:30:00Z",
    "total_receipts": 1
  }
}
```

Update this file when moving receipts from drafts to root.

---

## CI Enforcement

### Workflow: `enforce-receipt.yml`

Located: `.github/workflows/enforce-receipt.yml`

**What it does**:
1. Detects changes to guarded/immutable paths
2. Checks if `Docs/RECEIPTS/drafts/` has a new receipt
3. Blocks PR if no receipt found
4. Allows PR if receipt exists

**How it works**:
```yaml
- name: Check for receipt
  run: |
    FILES=$(git diff --name-only $BASE $HEAD)
    if echo "$FILES" | grep -E 'contracts/|infra/|workflows/' ; then
      if [ ! -d "Docs/RECEIPTS/drafts" ] || [ -z "$(ls -A Docs/RECEIPTS/drafts)" ]; then
        echo "❌ Protected path changes detected. Receipt required!"
        exit 1
      fi
    fi
```

---

## Example Receipt

### Real Example: Game1111 Integration

```json
{
  "receipt_id": "20251113-140000-def456",
  "branch": "feature/game1111-integration",
  "commit": "def456abc789",
  "timestamp": "2025-11-13T14:00:00Z",
  "author": "samuraizan",
  "work_order": "WO-002",
  "type": "feature",
  "summary": "Integrate Game1111 score persistence and leaderboard updates",
  "files_changed": [
    "apps/web/src/components/QuestAudio.tsx",
    "apps/web/src/app/api/quests/complete/route.ts",
    "apps/web/src/lib/questService.ts"
  ],
  "migrations": [],
  "rollback_plan": {
    "steps": [
      "Revert commit def456abc789",
      "Clear completed_quests entries for game-1111-quest",
      "Recalculate leaderboard rankings"
    ],
    "estimated_downtime": "< 30 seconds"
  },
  "tests": {
    "unit": "8 new tests added, all passed",
    "integration": "4 API tests passed",
    "manual": "Tested Game1111 completion flow 5 times successfully"
  },
  "reviewers": ["@tech-lead"],
  "status": "merged",
  "pr_url": "https://github.com/ZoHouse/zohm/pull/98"
}
```

---

## Searching Receipts

### By Date
```bash
ls Docs/RECEIPTS/202511*.json
```

### By Type
```bash
grep -l '"type": "migration"' Docs/RECEIPTS/*.json
```

### By File Changed
```bash
grep -l 'questService.ts' Docs/RECEIPTS/*.json
```

### By Work Order
```bash
grep -l 'WO-005' Docs/RECEIPTS/*.json
```

---

## Best Practices

### ✅ Do

- Generate receipt **before** opening PR
- Include detailed rollback steps
- List ALL files changed (not just guarded ones)
- Update receipt with PR URL after opening
- Move to root after merging
- Keep receipts forever (for audit trail)

### ❌ Don't

- Skip receipts for guarded paths (CI will block you)
- Create empty receipts just to pass CI
- Delete receipts (archive instead)
- Modify receipts after merging (immutable record)
- Reuse receipt IDs

---

## Rollback Using Receipts

If a deployment fails:

1. **Find the receipt**:
   ```bash
   ls Docs/RECEIPTS/ | grep latest
   ```

2. **Read rollback plan**:
   ```bash
   cat Docs/RECEIPTS/20251113-153000-abc123.json | jq '.rollback_plan'
   ```

3. **Execute steps**:
   ```bash
   git revert abc123def456
   psql -f migrations/006_vibe_scores_ROLLBACK.sql
   sudo systemctl restart api-server
   ```

4. **Verify**:
   - Run health checks
   - Check error logs
   - Test affected features

5. **Document**:
   - Create incident report
   - Update receipt with rollback timestamp
   - Create new work order for proper fix

---

## Receipts vs Git Commits

| Aspect | Git Commit | Receipt |
|--------|------------|---------|
| Purpose | Code versioning | Change documentation |
| Audience | Developers | Ops + audit |
| Machine-readable | Partial | Full |
| Rollback info | No | Yes |
| Test results | No | Yes |
| Work order link | No | Yes |

Receipts **augment** git commits, not replace them.

---

## Related Documentation

- `Docs/CONSTRAINTS.md` - When receipts are required
- `Docs/WORK_ORDERS/README.md` - Work order system
- `.github/workflows/enforce-receipt.yml` - CI enforcement
- `scripts/generate_receipt.py` - Receipt generator script


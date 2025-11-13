# Laundry List

**Purpose**: Tiny, safe tasks that AI or junior developers can pick up autonomously.

---

## What Goes in Laundry List?

✅ **Good candidates**:
- Fix typos in documentation
- Add missing TypeScript types
- Improve code comments
- Add accessibility attributes
- Refactor small functions
- Update outdated dependencies (minor versions)
- Add unit tests for existing functions
- Improve error messages
- Extract magic numbers to constants

❌ **Not for laundry**:
- API endpoint changes
- Database migrations
- Authentication logic
- Quest reward calculations
- Anything in guarded/immutable paths

---

## Laundry List Format

Each laundry item is a small markdown file:

```markdown
# [LAUNDRY-001] Fix typo in QuestAudio component

**Status**: 🟢 Available  
**Difficulty**: Easy  
**Time Estimate**: 5 minutes  
**Path**: `apps/web/src/components/QuestAudio.tsx`

## Description
Line 42 has "frequnecy" instead of "frequency"

## Task
Change `frequnecy` to `frequency` on line 42

## Acceptance Criteria
- [ ] Typo fixed
- [ ] No other changes made
- [ ] File still compiles

## Related Files
- `apps/web/src/components/QuestAudio.tsx`
```

---

## How to Create a Laundry Item

1. **Identify a small task** during code review or normal work
2. **Create a new file**: `Docs/LAUNDRY/LAUNDRY-XXX-short-description.md`
3. **Use template above**
4. **Mark as available**: Status = 🟢 Available
5. **Commit the laundry file** (not the fix itself!)

---

## How to Pick Up a Laundry Item

### For AI
```
1. List available laundry: ls Docs/LAUNDRY/*.md | grep "🟢 Available"
2. Pick one: Open LAUNDRY-001-fix-typo.md
3. Update status to 🟡 In Progress
4. Complete the task
5. Update status to ✅ Done
6. Commit changes with message: "chore: [LAUNDRY-001] fix typo in QuestAudio"
```

### For Humans
```bash
# List available tasks
ls Docs/LAUNDRY/*.md

# Pick one and mark in progress
echo "Status: 🟡 In Progress" >> Docs/LAUNDRY/LAUNDRY-001-fix-typo.md

# Do the work...

# Mark done
echo "Status: ✅ Done" >> Docs/LAUNDRY/LAUNDRY-001-fix-typo.md
git commit -m "chore: [LAUNDRY-001] fix typo"
```

---

## Status Icons

- 🟢 **Available** - Ready to be picked up
- 🟡 **In Progress** - Someone is working on it
- ✅ **Done** - Completed and merged
- ❌ **Cancelled** - No longer needed
- 🔴 **Blocked** - Waiting on something else

---

## Examples

See the files in this directory for examples:
- `LAUNDRY-001-fix-typo.md` - Simple typo fix
- `LAUNDRY-002-add-types.md` - Add TypeScript types
- `LAUNDRY-003-improve-comments.md` - Better code comments

---

## Laundry vs Work Orders

| Aspect | Laundry | Work Order |
|--------|---------|------------|
| Size | Tiny (< 30 min) | Medium (1-4 hours) |
| Risk | Very low | Medium |
| Approval | None needed | Review required |
| Receipt | No | Yes |
| Paths | Editable only | Can touch guarded |

---

## Cleanup

Laundry items should be moved to `Docs/LAUNDRY/archive/` once completed:

```bash
# After merging PR
mv Docs/LAUNDRY/LAUNDRY-001-fix-typo.md Docs/LAUNDRY/archive/
```

Archive files every month to keep the list clean.


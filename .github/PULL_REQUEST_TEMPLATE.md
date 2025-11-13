# PR Title: [scope] short description

<!-- 
Example: feat(api): add vibe score endpoint
Example: fix(quest): correct token calculation for Game1111
Example: chore(docs): update API contracts
-->

## Summary

<!-- One paragraph describing the change -->

## Type of Change

- [ ] 🚀 Feature (new functionality)
- [ ] 🐛 Bug fix (fixes an issue)
- [ ] 📝 Documentation (no code changes)
- [ ] 🎨 Style (formatting, no logic changes)
- [ ] ♻️ Refactor (code improvement, no behavior change)
- [ ] ⚡ Performance (faster/lighter code)
- [ ] 🔒 Security (vulnerability fix)
- [ ] 🗄️ Database (schema or migration)

## Linked Work

- **Work Order ID**: WO-XXX (if applicable)
- **Laundry List ID**: LAUNDRY-XXX (if applicable)
- **Related Issues**: #123, #456

## Changes

<!-- List the key files changed and what was modified -->

**Modified Files**:
- `path/to/file1.ts` - Added vibe score calculation
- `path/to/file2.ts` - Updated API route handler

**New Files**:
- `path/to/newfile.ts` - Vibe score service

**Deleted Files**:
- `path/to/oldfile.ts` - Replaced by new implementation

## Testing

### Test Results

- **Unit Tests**: ✅ 45 passed, 0 failed
- **Integration Tests**: ✅ 12 passed, 0 failed
- **E2E Tests**: ✅ 3 passed, 0 failed
- **Manual Testing**: ✅ Tested on local dev + staging

### Test Coverage

- **Before**: 78%
- **After**: 82%
- **Change**: +4%

### How to Test

```bash
# 1. Checkout this branch
git checkout feature/vibe-score-api

# 2. Install dependencies
npm install

# 3. Run tests
npm test

# 4. Start dev server
npm run dev

# 5. Test manually
# - Open http://localhost:3000
# - Navigate to profile page
# - Verify vibe score displays correctly
```

## Database Changes

- [ ] **No database changes**
- [ ] **Migration added**: `migrations/XXX_description.sql`
- [ ] **Rollback added**: `migrations/XXX_description_ROLLBACK.sql`
- [ ] **Tested migration** on local database
- [ ] **Tested rollback** successfully
- [ ] **Data migration plan** documented below

### Migration Details

```sql
-- Paste migration SQL here (if applicable)
```

### Rollback Plan

```bash
# Steps to rollback this change
1. Revert commit: git revert <commit-sha>
2. Run rollback migration: psql -f migrations/XXX_ROLLBACK.sql
3. Restart services: npm run dev
```

**Estimated Downtime**: < 1 minute

## Receipts

<!-- For changes to guarded/immutable paths -->

- [ ] **Receipt not required** (editable paths only)
- [ ] **Draft receipt created**: `Docs/RECEIPTS/drafts/<receipt-id>.json`
- [ ] **Receipt includes rollback plan**
- [ ] **Receipt includes test results**

### Receipt Link

`Docs/RECEIPTS/drafts/20251113-153000-abc123.json`

## Environment Variables

- [ ] **No new environment variables**
- [ ] **New variables added** (documented below)

### New Environment Variables

```bash
# Add to .env.local
NEW_API_KEY=your_key_here
NEW_API_URL=https://api.example.com
```

**Documentation updated in**: `Docs/DEVELOPMENT_SETUP.md`

## Breaking Changes

- [ ] **No breaking changes**
- [ ] **Breaking changes** (details below)

### Breaking Change Details

<!-- 
Describe:
- What breaks
- Who is affected
- Migration path
- Deprecation timeline
-->

## Security Considerations

- [ ] No security implications
- [ ] Security review required (tagged @security-team)
- [ ] Secrets/keys properly secured
- [ ] Input validation added
- [ ] Authentication/authorization unchanged

## Performance Impact

- [ ] No performance impact
- [ ] Performance improved (details below)
- [ ] Performance degraded (justified below)

### Performance Details

<!-- Benchmark results, profiling data, load test results -->

## Accessibility

- [ ] No accessibility changes
- [ ] Accessibility improved
- [ ] Tested with screen reader
- [ ] Keyboard navigation works
- [ ] ARIA labels added where needed

## Approvals Required

<!-- Check boxes as approvals are received -->

- [ ] **Code Owner** (see CODEOWNERS)
- [ ] **Tech Lead** (for guarded paths)
- [ ] **QA Team** (for critical features)
- [ ] **Product** (for user-facing changes)
- [ ] **Security** (for contracts/infra changes)

## Pre-Merge Checklist

### Code Quality

- [ ] TypeScript compiles without errors
- [ ] Linting passes (`npm run lint`)
- [ ] No console.log statements (or justified)
- [ ] Code follows style guide
- [ ] Comments added for complex logic

### Testing

- [ ] All tests pass locally
- [ ] New tests added for new code
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] Manual testing completed

### Documentation

- [ ] README updated (if needed)
- [ ] API docs updated (if endpoint changed)
- [ ] Code comments added
- [ ] Work order completed (if applicable)
- [ ] Migration guide added (if breaking change)

### CI/CD

- [ ] CI builds pass
- [ ] No new warnings introduced
- [ ] Staging deployment successful
- [ ] Smoke tests pass on staging

## Deployment Notes

### Before Deploying

```bash
# Pre-deployment steps
1. Run migrations on production DB
2. Set new environment variables
3. Clear cache
```

### After Deploying

```bash
# Post-deployment verification
1. Check health endpoint
2. Verify feature works
3. Monitor error logs for 10 minutes
```

### Rollback Instructions

```bash
# If deployment fails
1. git revert <commit-sha>
2. Run rollback migration
3. Redeploy previous version
```

## Notes for Reviewer

<!-- 
Add any context that will help reviewers:
- Tricky parts of the code
- Design decisions made
- Alternative approaches considered
- Known limitations
- Future improvements planned
-->

## Screenshots / Recordings

<!-- For UI changes, add before/after screenshots or screen recordings -->

**Before**:
<!-- Screenshot or "N/A" -->

**After**:
<!-- Screenshot or "N/A" -->

## Related PRs

<!-- Link to related PRs in this or other repos -->

- #120 - Dependency for this PR
- #125 - Follow-up PR (WIP)

---

## Post-Merge Actions

- [ ] Update receipt status to "merged"
- [ ] Move receipt to `Docs/RECEIPTS/` root
- [ ] Update `Docs/RECEIPTS/index.json`
- [ ] Close related work order
- [ ] Notify stakeholders
- [ ] Update project board
- [ ] Create follow-up issues (if needed)

---

<!-- 
This PR template helps ensure:
✅ All necessary information is provided
✅ Testing is thorough
✅ Documentation is updated
✅ Receipts are generated for guarded paths
✅ Rollback plans exist
✅ Security and performance are considered
-->


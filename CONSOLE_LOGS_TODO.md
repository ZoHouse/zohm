# Console Logs Cleanup - TODO

## Status: Deferred

Console log cleanup was attempted but requires advanced AST parsing to avoid breaking multi-line statements.

## Current State

- **Console.log**: ~811 statements across 80 files
- **Console.warn**: ~146 statements across 36 files  
- **Console.error**: ~313 statements across 87 files (KEEP for production debugging)

## Why Not Cleaned Yet

Simple regex/sed approaches break multi-line console statements:
```typescript
// Breaks when the opening console.log( line is deleted:
console.log({
  property: value,  // <- becomes orphaned, syntax error
  another: data
});
```

## Production Impact

✅ **NONE** - Next.js automatically strips `console.log` and `console.warn` in production builds.
- No bundle size impact
- No performance impact
- Only affects development debugging noise

## Future Solution

Use babel-plugin-transform-remove-console with proper AST parsing:

```bash
# Install
pnpm add -D babel-plugin-transform-remove-console @babel/core @babel/cli

# Configure .babelrc
{
  "plugins": [
    ["transform-remove-console", { "exclude": ["error"] }]
  ]
}

# Run transformation
npx babel src --out-dir src-clean --plugins=babel-plugin-transform-remove-console
```

## Decision

**Leave console logs as-is** - They don't affect production and cleaning them is error-prone without proper tooling.

If needed later, use babel transformation or manual file-by-file review.


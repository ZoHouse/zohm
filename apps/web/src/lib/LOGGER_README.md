# Development Logger Utility

## Overview

This utility provides development-only logging that automatically suppresses console output in production environments.

## Usage

### Import the logger

```typescript
import { devLog } from '@/lib/logger';
```

### Replace console.log with devLog

```typescript
// ❌ Before (logs in production)
console.log('User logged in:', userId);
console.error('Failed to fetch:', error);
console.warn('Deprecated API');

// ✅ After (only logs in development)
devLog.log('User logged in:', userId);
devLog.error('Failed to fetch:', error);
devLog.warn('Deprecated API');
```

## API

All standard console methods are supported:

- `devLog.log()` - General logging
- `devLog.error()` - Error logging
- `devLog.warn()` - Warning logging  
- `devLog.info()` - Info logging
- `devLog.debug()` - Debug logging
- `devLog.table()` - Table logging
- `devLog.group()` / `devLog.groupEnd()` - Grouped logging

## When Logs Appear

**Development (logs will appear)**:
- `localhost`
- `127.0.0.1`
- `192.168.x.x` (local network)
- `10.0.x.x` (local network)
- `*.local` domains
- `NODE_ENV=development`

**Production (logs suppressed)**:
- `game.zo.xyz`
- Any other production domain
- `NODE_ENV=production`

## Critical Production Logs

For errors that MUST be logged even in production:

```typescript
import { prodLog } from '@/lib/logger';

prodLog.error('Critical payment failure:', error);
prodLog.warn('Security issue detected');
```

**Note**: Use `prodLog` sparingly - only for critical errors that need monitoring in production.

## Migration Guide

### Quick Search & Replace

1. Find: `console.log(`
2. Replace: `devLog.log(`

3. Add import at top of file:
   ```typescript
   import { devLog } from '@/lib/logger';
   ```

### Automated Migration (optional)

You can use this regex pattern to find all console statements:

```regex
console\.(log|error|warn|info|debug|table|group|groupEnd)
```

## Benefits

✅ Clean production console (better performance)  
✅ No sensitive data leaked in production logs  
✅ Better user experience (no console spam)  
✅ Easy debugging in development  
✅ Same API as native console (easy migration)  

## Example

```typescript
import { devLog } from '@/lib/logger';

export function fetchUserData(userId: string) {
  devLog.log('🔍 Fetching user data for:', userId);
  
  try {
    const data = await api.getUser(userId);
    devLog.log('✅ User data loaded:', data);
    return data;
  } catch (error) {
    devLog.error('❌ Failed to fetch user:', error);
    throw error;
  }
}
```

**In Development**:
```
🔍 Fetching user data for: user_123
✅ User data loaded: { name: "John", ... }
```

**In Production**:
```
(no output)
```

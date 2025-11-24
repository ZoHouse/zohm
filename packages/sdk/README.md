# @zohm/sdk

Shared SDK for ZOHM WebApp and Mobile - provides TypeScript types and API client utilities.

## Installation

```bash
# From workspace root
npm install

# SDK is automatically linked via pnpm workspaces
```

## Usage

### API Client (Class-based)

```typescript
import { ApiClient } from '@zohm/sdk';

const client = new ApiClient({
  baseUrl: 'https://app.zo.xyz',
  authToken: privyToken,
  timeout: 30000
});

// GET request
const leaderboard = await client.get('/api/leaderboard');

// POST request
const result = await client.post('/api/quests/complete', {
  user_id: 'did:privy:xxx',
  quest_id: 'game-1111-quest',
  score: 1095
});

// Handle response
if (result.success) {
  console.log('Quest completed!', result.data);
} else {
  console.error('Error:', result.error);
}
```

### API Client (Function-based)

```typescript
import { createApiClient } from '@zohm/sdk';

const apiFetch = createApiClient('https://app.zo.xyz', authToken);

const response = await apiFetch('/api/leaderboard', {
  method: 'GET'
});
```

### TypeScript Types

```typescript
import type {
  User,
  Quest,
  QuestCompletion,
  LeaderboardEntry,
  VibeScore,
  ApiResponse
} from '@zohm/sdk';

// Type-safe quest completion
const completion: QuestCompletion = {
  user_id: 'did:privy:xxx',
  quest_id: 'game-1111-quest',
  score: 1095,
  location: 'webapp'
};

// Type-safe response handling
const response: ApiResponse<LeaderboardEntry[]> = await apiFetch('/api/leaderboard');
```

### Helper Functions

```typescript
import { unwrapResponse, getResponseData } from '@zohm/sdk';

// Unwrap (throws on error)
try {
  const data = unwrapResponse(response);
  console.log(data);
} catch (error) {
  console.error('API error:', error.message);
}

// Get with default
const leaderboard = getResponseData(response, []);
```

## Type Guards

```typescript
import { isApiError, isSuccessResponse } from '@zohm/sdk';

if (isApiError(response)) {
  console.error('Error:', response.error);
} else if (isSuccessResponse(response)) {
  console.log('Success:', response.data);
}
```

## Development

```bash
# Build SDK
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Lint
npm run lint
```

## Exports

### Types
- `ApiResponse<T>` - Standard API response format
- `User` - User profile data
- `Quest` - Quest definition
- `QuestCompletion` - Quest completion payload
- `LeaderboardEntry` - Leaderboard entry
- `VibeScore` - Vibe score data (v2.0)
- `City` - City data
- `Event` - Calendar event
- And many more...

### Client
- `ApiClient` - Class-based API client
- `createApiClient` - Function-based API client factory
- `unwrapResponse` - Extract data or throw error
- `getResponseData` - Get data with fallback

## Related Documentation

- `Docs/API_CONTRACTS.md` - API endpoint contracts
- `Docs/API_ENDPOINTS.md` - Complete API reference
- `Docs/ARCHITECTURE.md` - System architecture

## License

MIT


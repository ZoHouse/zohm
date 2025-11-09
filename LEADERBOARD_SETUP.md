# Leaderboard Auto-Update Setup

This guide explains how to set up the automatic leaderboard system that updates when users complete quests.

## Overview

The leaderboard system uses a **PostgreSQL trigger** that automatically:
- Updates user points when they complete quests
- Tracks total quests completed per user
- Records the last quest completion time
- Maintains accurate rankings

## Setup Instructions

### Option 1: Using Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to your project at https://supabase.com
   - Navigate to the SQL Editor

2. **Run the Migration**
   - Copy the entire contents of `src/lib/migrations/leaderboard-trigger.sql`
   - Paste it into a new SQL query
   - Click "Run" to execute

3. **Verify Setup**
   - Check that the `leaderboards` table was created
   - Verify the trigger `quest_completion_leaderboard_update` exists
   - Test by completing a quest and checking the leaderboard

### Option 2: Using Supabase CLI

```bash
# Make sure you have Supabase CLI installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push

# Or apply the SQL file directly
supabase db execute -f src/lib/migrations/leaderboard-trigger.sql
```

### Option 3: Manual Setup via API

If you have service_role access, you can run the setup programmatically:

```typescript
import { setupLeaderboardTrigger } from '@/lib/setupLeaderboard';

// Run this once to set up the trigger
await setupLeaderboardTrigger();
```

## Database Schema

### Leaderboards Table

```sql
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY,
  wallet TEXT UNIQUE NOT NULL,
  username TEXT DEFAULT 'Anon',
  zo_points INTEGER DEFAULT 0,
  total_quests_completed INTEGER DEFAULT 0,
  last_quest_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### Trigger Function

The trigger automatically:
1. Extracts `reward_zo` from quest metadata (defaults to 420)
2. Creates or updates the leaderboard entry for the user
3. Adds the reward points to their total
4. Increments their quest completion count
5. Updates the last completion timestamp

## How It Works

### Automatic Updates

When a quest is completed:

```typescript
// In QuestsOverlay.tsx
await markQuestCompleted(
  walletAddress,
  questId,
  undefined,
  undefined,
  {
    reward_zo: 420,  // ← This value is used by the trigger
    quest_title: "Quest Name",
    // ... other metadata
  }
);

// The trigger automatically updates the leaderboard!
// No additional code needed.
```

### Manual Operations

**Recalculate entire leaderboard** (if data gets out of sync):
```sql
SELECT * FROM recalculate_leaderboard();
```

**Update a user's display name**:
```sql
SELECT sync_leaderboard_username('0x1234...', 'NewUsername');
```

Or via TypeScript:
```typescript
import { syncLeaderboardUsername } from '@/lib/setupLeaderboard';

await syncLeaderboardUsername(walletAddress, username);
```

## Syncing Usernames

To sync usernames from the users table to the leaderboard, add this to your profile update logic:

```typescript
import { syncLeaderboardUsername } from '@/lib/setupLeaderboard';

// After updating user profile
await updateUserProfile(userId, { username: newUsername });

// Sync to leaderboard
await syncLeaderboardUsername(walletAddress, newUsername);
```

## Maintenance Functions

### Check Setup Status

```typescript
import { checkLeaderboardSetup } from '@/lib/setupLeaderboard';

const status = await checkLeaderboardSetup();
console.log('Table exists:', status.tableExists);
console.log('Has data:', status.hasData);
```

### Get Statistics

```typescript
import { getLeaderboardStats } from '@/lib/setupLeaderboard';

const stats = await getLeaderboardStats();
console.log('Total users:', stats.totalUsers);
console.log('Total points:', stats.totalPoints);
console.log('Total quests:', stats.totalQuests);
```

## Testing

1. **Complete a quest** as a test user
2. **Check the leaderboard** - the user should appear with 420 points
3. **Complete another quest** - points should increase to 840
4. **Verify the ranking** - users should be sorted by points (highest first)

## Troubleshooting

### Trigger not firing?

Check if the trigger exists:
```sql
SELECT * FROM pg_trigger 
WHERE tgname = 'quest_completion_leaderboard_update';
```

### Points not updating?

1. Check if `completed_quests` inserts are successful
2. Verify the metadata contains `reward_zo`
3. Check Supabase logs for errors

### Leaderboard out of sync?

Recalculate from scratch:
```sql
SELECT * FROM recalculate_leaderboard();
```

## Security

- **Row Level Security (RLS)** is enabled on the leaderboards table
- Anyone can **read** the leaderboard (public)
- Only the **trigger** can insert/update entries
- This prevents users from manually manipulating their scores

## Next Steps

After setup:
1. ✅ Complete a test quest to verify the trigger works
2. ✅ Check the leaderboard displays correctly
3. ✅ Implement username syncing when users update profiles
4. ✅ Monitor the leaderboard for any issues

## Support

If you encounter issues:
1. Check Supabase logs for errors
2. Verify the trigger was created successfully
3. Test with a simple quest completion
4. Run `recalculate_leaderboard()` to rebuild from scratch


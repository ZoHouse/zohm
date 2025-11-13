# Supabase Setup for Quest System

This guide explains how to set up the database tables required for the Quest/Game system with full Supabase integration.

## Prerequisites

- Supabase project created
- Environment variables set:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (optional, for admin operations)

## Database Tables

### 1. User Quest Stats Table

Stores aggregate statistics for each user's quest performance.

```sql
-- User Quest Stats Table
CREATE TABLE IF NOT EXISTS user_quest_stats (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_address TEXT UNIQUE NOT NULL,
  nickname TEXT,
  avatar TEXT,
  total_tokens INTEGER DEFAULT 0,
  total_syncs INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  unique_locations INTEGER DEFAULT 0,
  multiplier DECIMAL(10, 2) DEFAULT 1.0,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  next_sync_available_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_quest_stats_wallet ON user_quest_stats(wallet_address);
CREATE INDEX IF NOT EXISTS idx_user_quest_stats_best_score ON user_quest_stats(best_score DESC);
```

### 2. Quest Scores Table

Records individual quest attempts with score, location, and tokens earned.

```sql
-- Quest Scores Table
CREATE TABLE IF NOT EXISTS quest_scores (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  wallet_address TEXT NOT NULL,
  score INTEGER NOT NULL,
  location TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  tokens_earned INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_quest_scores_wallet ON quest_scores(wallet_address);
CREATE INDEX IF NOT EXISTS idx_quest_scores_score ON quest_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_quest_scores_completed_at ON quest_scores(completed_at DESC);
```

### 3. Auto-Update Trigger

This trigger automatically updates user stats whenever a new quest score is recorded.

```sql
-- Function to update user stats after quest completion
CREATE OR REPLACE FUNCTION update_user_quest_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_quest_stats (
    wallet_address,
    total_tokens,
    total_syncs,
    best_score,
    last_sync_at,
    next_sync_available_at,
    updated_at
  )
  VALUES (
    NEW.wallet_address,
    NEW.tokens_earned,
    1,
    NEW.score,
    NEW.completed_at,
    NEW.completed_at + INTERVAL '12 hours',
    NOW()
  )
  ON CONFLICT (wallet_address) DO UPDATE SET
    total_tokens = user_quest_stats.total_tokens + NEW.tokens_earned,
    total_syncs = user_quest_stats.total_syncs + 1,
    best_score = GREATEST(user_quest_stats.best_score, NEW.score),
    last_sync_at = NEW.completed_at,
    next_sync_available_at = NEW.completed_at + INTERVAL '12 hours',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update stats when quest is completed
DROP TRIGGER IF EXISTS trigger_update_user_quest_stats ON quest_scores;
CREATE TRIGGER trigger_update_user_quest_stats
AFTER INSERT ON quest_scores
FOR EACH ROW
EXECUTE FUNCTION update_user_quest_stats();
```

## How to Set Up

### Option 1: Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste all the SQL from above (sections 1, 2, and 3)
5. Click **Run** to execute

### Option 2: Using the createQuestTablesSQL export

The SQL schema is also exported in `/src/lib/questService.ts`:

```typescript
import { createQuestTablesSQL } from '@/lib/questService';
console.log(createQuestTablesSQL);
```

Copy the output and run it in Supabase SQL Editor.

## Data Flow

### When a user completes a quest:

1. **QuestAudio** component records the game score
2. **recordQuestScore()** inserts a new row in `quest_scores`
3. **Trigger** automatically updates `user_quest_stats` with:
   - Incremented total_tokens
   - Incremented total_syncs
   - Updated best_score (if new score is higher)
   - Set next_sync_available_at (current time + 12 hours)
4. **QuestComplete** component fetches and displays:
   - User's stats from `user_quest_stats`
   - Top 10 players from `user_quest_stats` (ordered by best_score)

### Cooldown System

- Users can sync once every 12 hours
- The `next_sync_available_at` field tracks when the next sync is available
- Frontend checks this before allowing a new sync

## API Functions

All database operations are handled by `/src/lib/questService.ts`:

- `getUserQuestStats(walletAddress)` - Get user's aggregate stats
- `recordQuestScore(...)` - Record a new quest score
- `getQuestLeaderboard(limit)` - Get top players
- `canUserSync(walletAddress)` - Check if cooldown has expired
- `getTimeUntilNextSync(walletAddress)` - Get time remaining until next sync
- `updateUserQuestProfile(...)` - Update nickname/avatar
- `calculateUniqueLocations(walletAddress)` - Count unique locations visited

## Testing

1. Complete a quest in the app
2. Check the `quest_scores` table - should see a new row
3. Check the `user_quest_stats` table - should see updated stats
4. View the leaderboard in QuestComplete screen

## Troubleshooting

### Tables don't exist error

Run the SQL schema in Supabase SQL Editor.

### Permission denied

Ensure Row Level Security (RLS) policies are set correctly:

```sql
-- Allow authenticated users to read their own stats
ALTER TABLE user_quest_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own stats"
ON user_quest_stats FOR SELECT
TO authenticated
USING (auth.uid()::text = wallet_address);

-- Allow public read for leaderboard
CREATE POLICY "Public leaderboard read"
ON user_quest_stats FOR SELECT
TO public
USING (true);

-- Allow service role to insert/update
CREATE POLICY "Service role full access"
ON quest_scores FOR ALL
TO service_role
USING (true);
```

### Mock data fallback

If Supabase is not configured, the app will use mock data:
- Mock user stats
- Mock leaderboard (Syd.zo, Baba.zo, DV.zo)

## Next Steps

After setting up the database:

1. Test the full quest flow
2. Implement location/map screen
3. Add multiplier calculations based on unique locations
4. Implement real token distribution (blockchain integration)
5. Add quest history view for users



# 🏆 Leaderboard Quick Start

## ⚡ Quick Setup (5 minutes)

### Step 1: Run the SQL Migration

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy & paste the contents of `src/lib/migrations/leaderboard-trigger.sql`
3. Click **Run**
4. ✅ Done! The trigger is now active.

### Step 2: Test It

Complete a quest and check the leaderboard - points should automatically appear!

---

## 📊 How It Works

```
User completes quest
        ↓
Quest saved to completed_quests table
        ↓
🔥 TRIGGER FIRES AUTOMATICALLY 🔥
        ↓
Leaderboard updated with points
        ↓
Rankings recalculated
```

**No code changes needed!** The trigger handles everything.

---

## 🎯 Key Features

✅ **Automatic Updates** - Points added instantly when quests complete  
✅ **Quest Tracking** - Counts total quests per user  
✅ **Timestamps** - Records last quest completion time  
✅ **Secure** - Users can't manually edit their scores  
✅ **Efficient** - Uses database triggers (no API calls)

---

## 🔧 Useful Commands

### Recalculate Everything (if needed)
```sql
SELECT * FROM recalculate_leaderboard();
```

### Update Username
```sql
SELECT sync_leaderboard_username('0xWALLET_ADDRESS', 'NewUsername');
```

### Check Leaderboard Stats
```typescript
import { getLeaderboardStats } from '@/lib/setupLeaderboard';
const stats = await getLeaderboardStats();
```

---

## 🐛 Troubleshooting

**Points not updating?**
1. Check if the SQL migration ran successfully
2. Verify `completed_quests` table has `metadata` with `reward_zo`
3. Run `SELECT * FROM recalculate_leaderboard();` to rebuild

**Table doesn't exist?**
- Run the SQL migration from `src/lib/migrations/leaderboard-trigger.sql`

---

## 📝 Current Reward Structure

- **Quest Completion**: 420 $ZO points
- Points are extracted from `metadata.reward_zo` in `completed_quests`
- Default is 420 if not specified

---

## 🚀 Next Steps

1. ✅ Run the SQL migration
2. ✅ Test with a quest completion
3. 🔄 Sync usernames when users update profiles (optional)
4. 📈 Monitor leaderboard growth

For detailed documentation, see `LEADERBOARD_SETUP.md`


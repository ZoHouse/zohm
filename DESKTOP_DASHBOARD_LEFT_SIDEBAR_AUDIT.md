# Desktop Dashboard - Left Sidebar Current State Audit

**Version**: 1.0  
**Last Updated**: 2025-11-18  
**For**: Manish  
**Purpose**: Identify what's wired correctly, what's miswired, and what's missing

---

## Legend

- ✅ **WIRED CORRECTLY** - Working as intended, no changes needed
- ⚠️ **PARTIALLY WIRED** - Some data connected, but incomplete or needs improvement
- ❌ **NOT WIRED** - Hardcoded or placeholder data, needs implementation
- 🔴 **MISWIRED** - Connected to wrong data source or incorrect logic

---

## Element-by-Element Audit

### 1. Founder ID Badge
**Lines**: 110-132  
**Status**: ❌ **NOT WIRED** (Hardcoded)

#### Current State:
```typescript
<p>Founder</p>
<p>#1413</p>  // ← Hardcoded number
```

#### What's Wrong:
- Number `#1413` is hardcoded
- Always shows "Founder" even if user isn't a founder
- Not connected to any database

#### Should Be:
```typescript
// Only show if user.role === 'Founder' OR user.founder_nfts_count > 0
{isFounder && (
  <>
    <p>Founder</p>
    <p>#{founderNftTokenId}</p>  // ← From user's first NFT
  </>
)}
```

#### Data Source Needed:
- `users.role` - Check if 'Founder'
- `users.founder_nfts_count` - Check if > 0
- `user_inventory` table - Query for `MIN(token_id)` where `item_type = 'nft'`

#### Fix Priority: **HIGH** (conditionally hide + query NFT number)

---

### 2. Citizen ID Badge
**Lines**: 133-154  
**Status**: ❌ **NOT WIRED** (Hardcoded)

#### Current State:
```typescript
<p>Citizen</p>
<p>#35235</p>  // ← Hardcoded number
```

#### What's Wrong:
- Number `#35235` is hardcoded
- Not calculated from user's actual signup order

#### Should Be:
```typescript
<p>Citizen</p>
<p>#{citizenNumber}</p>  // ← Calculated from signup order
```

#### Data Source Needed:
```sql
-- Count users created before or at the same time as this user
SELECT COUNT(*) 
FROM users 
WHERE created_at <= (SELECT created_at FROM users WHERE id = $1);
```

#### Alternative:
- Add `citizen_id` column to users table (auto-increment on signup)

#### Fix Priority: **MEDIUM** (requires SQL query or new column)

---

### 3. Profile Photo
**Lines**: 158-197  
**Status**: ✅ **WIRED CORRECTLY**

#### Current State:
```typescript
<img 
  src={userProfile?.pfp || DashboardAssets.profile.photo}
  alt="Profile" 
/>
```

#### What's Right:
- ✅ Uses `userProfile?.pfp` from Privy
- ✅ Falls back to default placeholder
- ✅ Unicorn avatars assigned on signup (via `privyDb.ts`)
- ✅ Positioned correctly inside animated GIF frame

#### Data Source:
- **Privy**: `userProfile.pfp`
- **Database**: `users.pfp`
- **Fallback**: `DashboardAssets.profile.photo`

#### Fix Priority: **NONE** (working correctly ✅)

---

### 4. User Name
**Lines**: 200-221  
**Status**: ✅ **WIRED CORRECTLY**

#### Current State:
```typescript
<p>{userProfile?.name || 'Anonymous'}</p>
```

#### What's Right:
- ✅ Uses `userProfile?.name` from Privy
- ✅ Falls back to 'Anonymous' if no name

#### Possible Improvement:
```typescript
// More sophisticated fallback
const displayName = userProfile?.name 
  || userProfile?.email?.split('@')[0] 
  || `${primaryWallet?.slice(0, 6)}...${primaryWallet?.slice(-4)}`
  || 'Anonymous Citizen';
```

#### Fix Priority: **LOW** (working, but could be enhanced)

---

### 5. Verified Badge
**Lines**: 213-220  
**Status**: 🔴 **MISWIRED** (Always shows)

#### Current State:
```typescript
<div className="w-10 h-10 flex items-center justify-center overflow-hidden">
  <img src={DashboardAssets.profile.badge} alt="Verified" />
</div>
// ← Always visible, no conditional logic
```

#### What's Wrong:
- Badge shows for ALL users regardless of status
- No verification check

#### Should Be:
```typescript
{isVerified && (
  <div className="w-10 h-10">
    <img src={DashboardAssets.profile.badge} alt="Verified" />
  </div>
)}

// Where isVerified is:
const isVerified = 
  userProfile?.onboarding_completed || 
  (userProfile?.founder_nfts_count && userProfile.founder_nfts_count > 0) ||
  questCompletions > 0;
```

#### Data Source Needed:
- `users.onboarding_completed` (boolean)
- `users.founder_nfts_count` (integer)
- `quest_completions` table - count for user

#### Fix Priority: **HIGH** (incorrect behavior)

---

### 6. Bio
**Lines**: 223-236  
**Status**: ⚠️ **PARTIALLY WIRED** (Display only, not editable)

#### Current State:
```typescript
<p>
  {userProfile?.bio || 'Deep understanding of Web3 and product development...'}
</p>
// ← Shows bio but not editable
```

#### What's Right:
- ✅ Displays `userProfile?.bio`
- ✅ Has fallback text

#### What's Missing:
- ❌ No edit functionality (click to edit)
- ❌ No save functionality
- ❌ No "+ Add bio" state when empty

#### Should Be:
```typescript
{!bio && !isEditingBio ? (
  <button onClick={() => setIsEditingBio(true)}>
    + Add bio
  </button>
) : isEditingBio ? (
  <textarea 
    value={bio} 
    onChange={(e) => setBio(e.target.value)}
    maxLength={200}
  />
  <button onClick={handleSaveBio}>Save</button>
) : (
  <p onClick={() => setIsEditingBio(true)}>{bio}</p>
)}
```

#### API Needed:
```typescript
PATCH /api/profile/update
Body: { userId, bio }
```

#### Fix Priority: **MEDIUM** (display works, needs editing)

---

### 7. Wallet Button
**Lines**: 238-264  
**Status**: ✅ **WIRED CORRECTLY**

#### Current State:
```typescript
const primaryWallet = userProfile?.wallets?.[0]?.address;
const shortWallet = primaryWallet ? `0x...${primaryWallet?.slice(-4)}` : '';

const handleCopyWallet = () => {
  if (userProfile?.wallets?.[0]?.address) {
    navigator.clipboard.writeText(userProfile.wallets[0].address);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }
};

<button onClick={handleCopyWallet}>
  <img src={DashboardAssets.icons.wallet} alt="Wallet" />
  <p>{shortWallet}</p>
  <img src={DashboardAssets.icons.copyArrow} alt="Copy" />
</button>
```

#### What's Right:
- ✅ Gets wallet from `userProfile.wallets[0].address`
- ✅ Formats as `0x...6785`
- ✅ Copies full address to clipboard
- ✅ Shows "copied" feedback for 2 seconds
- ✅ Icon and copy arrow visible

#### Fix Priority: **NONE** (working perfectly ✅)

---

### 8. X/Twitter Icon
**Lines**: 268-282  
**Status**: ❌ **NOT WIRED** (No functionality)

#### Current State:
```typescript
<button 
  className="flex items-center justify-center border border-solid hover:opacity-80 transition-opacity"
  style={{ 
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: DashboardRadius.sm,
  }}
>
  <div className="w-5 h-5">
    <img src={DashboardAssets.icons.xTwitter} alt="X" />
  </div>
</button>
// ← No onClick handler, not connected to any data
```

#### What's Wrong:
- Icon shows but does nothing when clicked
- Not connected to `users.x_handle`
- No modal for connection

#### Should Be:
```typescript
const xHandle = userProfile?.x_handle;

<button onClick={() => {
  if (xHandle) {
    window.open(`https://x.com/${xHandle}`, '_blank');
  } else {
    setShowXModal(true);
  }
}}>
  <img src={DashboardAssets.icons.xTwitter} alt="X" />
</button>

{/* Modal for entering X handle */}
{showXModal && <XConnectModal onSave={handleSaveXHandle} />}
```

#### Data Source Needed:
- `users.x_handle` (string | null) - **EXISTS in DB**
- `users.x_connected` (boolean) - **EXISTS in DB**

#### API Needed:
```typescript
PATCH /api/profile/update
Body: { userId, x_handle: "username" }
```

#### Fix Priority: **HIGH** (visible but non-functional)

---

### 9. Telegram Icon
**Lines**: 284-299  
**Status**: ❌ **NOT WIRED** (No functionality)

#### Current State:
```typescript
<button 
  className="flex items-center justify-center border border-solid hover:opacity-80 transition-opacity"
  style={{ 
    width: '40px',
    height: '40px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: DashboardRadius.sm,
  }}
>
  <div className="w-5 h-5">
    <img src={DashboardAssets.icons.telegram} alt="Telegram" />
  </div>
</button>
// ← No onClick handler, not connected to any data
```

#### What's Wrong:
- Icon shows but does nothing when clicked
- `users.telegram_handle` column **DOES NOT EXIST**
- `users.telegram_connected` column **DOES NOT EXIST**
- No modal for connection

#### Should Be:
```typescript
const telegramHandle = userProfile?.telegram_handle;

<button onClick={() => {
  if (telegramHandle) {
    window.open(`https://t.me/${telegramHandle}`, '_blank');
  } else {
    setShowTelegramModal(true);
  }
}}>
  <img src={DashboardAssets.icons.telegram} alt="Telegram" />
</button>
```

#### Database Migration Needed:
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS telegram_handle TEXT,
ADD COLUMN IF NOT EXISTS telegram_connected BOOLEAN DEFAULT FALSE;
```

#### API Needed:
```typescript
PATCH /api/profile/update
Body: { userId, telegram_handle: "username" }
```

#### Fix Priority: **HIGH** (needs migration + implementation)

---

### 10. Cultures Section
**Lines**: 302-403  
**Status**: ✅ **WIRED CORRECTLY** (Display only)

#### Current State:
```typescript
const cultures = userProfile?.culture?.split(',').map(c => c.trim()).filter(Boolean) || [];

{cultures.length > 0 ? cultures.map((culture, idx) => {
  const icon = getCultureIcon(culture);
  const displayName = getCultureDisplayName(culture);
  return (
    <div key={idx}>
      <img src={icon} alt={displayName} />
      <p>{displayName}</p>
    </div>
  );
}) : (
  // Fallback: Food, Tech, Design
)}
```

#### What's Right:
- ✅ Reads from `userProfile.culture`
- ✅ Splits comma-separated values
- ✅ Maps to icons via `getCultureIcon()`
- ✅ Maps to display names via `getCultureDisplayName()`
- ✅ Shows fallback cultures if none selected

#### What's Missing:
- ❌ Not editable (can't add/remove cultures)
- ❌ No modal for culture selection

#### Fix Priority: **LOW** (display works, editing can come later)

---

### 11. $Zo Balance
**Lines**: 405-450  
**Status**: ✅ **WIRED CORRECTLY**

#### Current State:
```typescript
const [balance, setBalance] = React.useState(0);

React.useEffect(() => {
  if (!userId) return;

  async function fetchBalance() {
    try {
      const response = await fetch(`/api/users/${userId}/progress`, {
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data?.quests?.zo_points !== undefined) {
          setBalance(data.quests.zo_points);
        }
      }
    } catch (error) {
      console.warn('Could not fetch balance:', error);
    }
  }

  fetchBalance();
  const intervalId = setInterval(fetchBalance, 3000);
  return () => clearInterval(intervalId);
}, [userId]);

const formatBalance = (bal: number) => {
  if (bal >= 1000) {
    return `${(bal / 1000).toFixed(2)}K`;
  }
  return bal.toString();
};

<p>{formatBalance(balance)}</p>
```

#### What's Right:
- ✅ Fetches from `/api/users/${userId}/progress`
- ✅ Reads `data.quests.zo_points`
- ✅ Updates every 3 seconds
- ✅ Formats with K suffix (1.5K for 1500)
- ✅ Shows coin icon
- ✅ Error handling

#### Possible Improvements:
```typescript
// Add M suffix for millions
const formatBalance = (bal: number) => {
  if (bal >= 1000000) return `${(bal / 1000000).toFixed(1)}M`;
  if (bal >= 1000) return `${(bal / 1000).toFixed(1)}K`;
  return bal.toString();
};
```

#### Fix Priority: **NONE** (working correctly ✅)

---

### 12. Vibe Score
**Lines**: 451-471  
**Status**: ✅ **WIRED CORRECTLY**

#### Current State:
```typescript
const [vibeScore, setVibeScore] = React.useState(99); // Default 99

React.useEffect(() => {
  if (!userId) return;

  async function fetchVibeScore() {
    try {
      const response = await fetch(`/api/vibe/${userId}`, {
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data?.success && data?.data?.score !== undefined) {
          setVibeScore(data.data.score);
        }
      }
    } catch (error) {
      console.warn('Could not fetch vibe score:', error);
    }
  }

  fetchVibeScore();
  const intervalId = setInterval(fetchVibeScore, 30000);
  return () => clearInterval(intervalId);
}, [userId]);

<p>{vibeScore}%</p>
```

#### What's Right:
- ✅ Fetches from `/api/vibe/${userId}`
- ✅ Reads `data.data.score`
- ✅ Updates every 30 seconds
- ✅ Shows as percentage (87%)
- ✅ Default value 99% while loading
- ✅ Error handling

#### API Implementation:
- ✅ `/api/vibe/${userId}` endpoint exists
- ✅ Calculates: `(Completed Syncs / Expected Syncs) × 100`
- ✅ Based on game-1111 quest completions
- ✅ See `Docs/VIBE_SCORE.md` for full spec

#### Fix Priority: **NONE** (working correctly ✅)

---

### 13. Request Connection Button
**Lines**: 474-493  
**Status**: ❌ **NOT WIRED** (No functionality)

#### Current State:
```typescript
<button 
  className="flex items-center justify-center hover:opacity-90 transition-opacity"
  style={{
    gap: DashboardSpacing.xs,
    height: '32px',
    padding: `${DashboardSpacing.sm} ${DashboardSpacing.md}`,
    backgroundColor: '#ffffff',
    borderRadius: DashboardRadius.pill,
  }}
>
  <p>Request Connection</p>
</button>
// ← No onClick handler, always shows, no state management
```

#### What's Wrong:
- Button always shows (even on own profile)
- No onClick handler
- No connection status tracking
- No API to send connection request
- `connections` table doesn't exist

#### Should Be:
```typescript
const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
const isOwnProfile = userId === currentUserId;

{!isOwnProfile && (
  <button 
    onClick={handleRequestConnection}
    disabled={connectionStatus !== 'none'}
  >
    <p>
      {connectionStatus === 'none' && 'Request Connection'}
      {connectionStatus === 'pending' && 'Request Sent'}
      {connectionStatus === 'connected' && 'Connected'}
    </p>
  </button>
)}
```

#### Database Schema Needed:
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id)
);
```

#### APIs Needed:
```typescript
POST /api/connections/request
Body: { requesterId, recipientId }

GET /api/connections/${userId}/status?targetUserId=...
Returns: { status: 'none' | 'pending' | 'connected' }
```

#### Fix Priority: **MEDIUM** (needs full connection system)

---

### 14. Founder NFTs Section
**Lines**: 496-601  
**Status**: ❌ **NOT WIRED** (Hardcoded)

#### Current State:
```typescript
<div>
  <p>FOUNDER NFTs</p>
  
  {/* NFT 1 */}
  <div>
    <img src="/dashboard-assets/430-1.png" alt="NFT #411" />
    <p>#411</p>
  </div>

  {/* NFT 2 */}
  <div>
    <img src="/dashboard-assets/430-2.png" alt="NFT #831" />
    <p>#831</p>
  </div>

  {/* NFT 3 */}
  <div>
    <img src="/dashboard-assets/430-3.png" alt="NFT #420" />
    <p>#420</p>
  </div>
</div>
// ← Always shows same 3 NFTs, not user-specific
```

#### What's Wrong:
- Shows same 3 NFTs for ALL users
- NFT numbers (#411, #831, #420) are hardcoded
- Images are hardcoded
- Section shows even if user has 0 NFTs
- Not querying `user_inventory` table

#### Should Be:
```typescript
const [founderNfts, setFounderNfts] = useState([]);

useEffect(() => {
  async function fetchNfts() {
    const response = await fetch(`/api/users/${userId}/inventory?type=nft`);
    const data = await response.json();
    const founders = data.items.filter(item => item.item_id.startsWith('founder_'));
    setFounderNfts(founders);
  }
  if (userId) fetchNfts();
}, [userId]);

{founderNfts.length > 0 && (
  <div>
    <p>FOUNDER NFTs</p>
    {founderNfts.map(nft => (
      <div key={nft.token_id}>
        <img src={nft.image_url} alt={`NFT #${nft.token_id}`} />
        <p>#{nft.token_id}</p>
      </div>
    ))}
  </div>
)}
```

#### Database Query:
```sql
SELECT token_id, item_id, image_url, acquired_at
FROM user_inventory
WHERE user_id = $1
  AND item_type = 'nft'
  AND item_id LIKE 'founder_%'
ORDER BY acquired_at ASC;
```

#### API Needed:
```typescript
GET /api/users/${userId}/inventory?type=nft
Returns: { items: [{ token_id, item_id, image_url, acquired_at }] }
```

#### Fix Priority: **HIGH** (completely wrong data shown)

---

## Summary: What Needs to Be Fixed

### ✅ WORKING CORRECTLY (5 elements)
1. Profile Photo
2. User Name
3. Wallet Button
4. $Zo Balance
5. Vibe Score

### ⚠️ PARTIALLY WORKING (2 elements)
6. Bio (displays but not editable)
7. Cultures (displays but not editable)

### ❌ NOT WIRED (5 elements)
8. Founder ID Badge (hardcoded)
9. Citizen ID Badge (hardcoded)
10. X/Twitter Icon (no functionality)
11. Telegram Icon (no functionality + missing DB columns)
12. Request Connection Button (no functionality + missing table)
13. Founder NFTs (hardcoded, wrong data)

### 🔴 MISWIRED (1 element)
14. Verified Badge (always shows, should be conditional)

---

## Action Items for Manish

### Phase 1: Fix Broken/Miswired Elements (High Priority)

1. **Verified Badge** 🔴
   - [ ] Add conditional rendering
   - [ ] Query `onboarding_completed`, `founder_nfts_count`, quest count
   - [ ] Only show if user is verified

2. **X/Twitter Icon** ❌
   - [ ] Add onClick handler
   - [ ] Fetch `users.x_handle` from database
   - [ ] If connected → open profile
   - [ ] If not connected → show modal
   - [ ] Create `/api/profile/update` endpoint for saving

3. **Telegram Icon** ❌
   - [ ] Run migration to add columns
   - [ ] Add onClick handler
   - [ ] Same behavior as X icon
   - [ ] Use same API endpoint

4. **Founder NFTs** ❌
   - [ ] Query `user_inventory` table
   - [ ] Show only user's NFTs
   - [ ] Hide section if user has 0 NFTs
   - [ ] Use `image_url` from database

5. **Founder ID Badge** ❌
   - [ ] Query user's first NFT token_id
   - [ ] Only show if user has founder NFTs
   - [ ] Hide badge if not a founder

### Phase 2: Complete Partial Implementations (Medium Priority)

6. **Bio Editing** ⚠️
   - [ ] Add edit state
   - [ ] Add textarea for editing
   - [ ] Add save button
   - [ ] Call `/api/profile/update` endpoint
   - [ ] Show "+ Add bio" when empty

7. **Citizen ID** ❌
   - [ ] Create SQL query or add column
   - [ ] Calculate sequential number
   - [ ] Display real number

### Phase 3: New Features (Low Priority)

8. **Request Connection Button** ❌
   - [ ] Create `connections` table
   - [ ] Create `/api/connections/request` endpoint
   - [ ] Add connection status check
   - [ ] Hide on own profile
   - [ ] Show different states

9. **Culture Editing** ⚠️
   - [ ] Add edit modal
   - [ ] Allow selecting multiple cultures
   - [ ] Save via `/api/profile/update`

---

## Database Migrations Needed

### 1. Telegram Support (HIGH PRIORITY)
```sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS telegram_handle TEXT,
ADD COLUMN IF NOT EXISTS telegram_connected BOOLEAN DEFAULT FALSE;
```

### 2. Citizen ID (MEDIUM PRIORITY)
```sql
-- Option A: Add column (recommended)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS citizen_id SERIAL;

-- Option B: Use SQL query (no migration needed)
```

### 3. Connections System (LOW PRIORITY)
```sql
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(requester_id, recipient_id)
);
```

---

## API Endpoints Needed

### 1. Profile Update (HIGH PRIORITY)
```typescript
PATCH /api/profile/update
Body: { 
  userId: string,
  bio?: string,
  x_handle?: string,
  telegram_handle?: string,
  culture?: string
}
Returns: { success: boolean, data: UpdatedUser }
```

### 2. Inventory Query (HIGH PRIORITY)
```typescript
GET /api/users/:userId/inventory?type=nft
Returns: { 
  items: Array<{
    token_id: number,
    item_id: string,
    image_url: string,
    acquired_at: string
  }>
}
```

### 3. Connection Request (LOW PRIORITY)
```typescript
POST /api/connections/request
Body: { requesterId: string, recipientId: string }

GET /api/connections/:userId/status?targetUserId=...
Returns: { status: 'none' | 'pending' | 'connected' }
```

---

## Testing Checklist

After each fix, test:

- [ ] **Verified Badge**: Only shows for verified users
- [ ] **X Icon**: Opens profile when connected, shows modal when not
- [ ] **Telegram Icon**: Opens profile when connected, shows modal when not
- [ ] **Bio**: Click to edit, saves correctly, shows placeholder when empty
- [ ] **Founder ID**: Shows correct NFT number, hides when not founder
- [ ] **Citizen ID**: Shows correct sequential number
- [ ] **Founder NFTs**: Shows user's actual NFTs, hides when none
- [ ] **Connection Button**: Correct states, hides on own profile
- [ ] **$Zo Balance**: Still updating every 3s
- [ ] **Vibe Score**: Still updating every 30s
- [ ] **Wallet Button**: Still copies correctly
- [ ] **Profile Photo**: Still displays correctly
- [ ] **Cultures**: Still displays correctly

---

## Questions to Answer Before Starting

1. **Does `user_inventory` table exist?**
   - Check if we can query NFTs
   - If not, where are NFTs stored?

2. **Does `/api/users/:userId/inventory` endpoint exist?**
   - Test it manually
   - If not, needs to be created

3. **Do we want citizen_id as a column or calculated?**
   - Column: Faster queries, needs migration
   - Calculated: No migration, slower queries

4. **Priority order for Manish:**
   - Which elements should be fixed first?
   - Any blockers?

---

## Notes

- Don't break existing working elements (Balance, Vibe Score, Wallet)
- Test after each change
- Keep styling consistent with current design
- Use existing API patterns
- Add error handling for all API calls
- Show loading states where appropriate

**Good luck Manish! Start with Phase 1 fixes. 🚀**


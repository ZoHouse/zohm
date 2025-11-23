# Dynamic Founder NFTs Implementation

## Summary

The Founder NFTs section in the desktop dashboard now dynamically fetches and displays NFTs from the user's ZO API profile instead of showing hardcoded placeholder data.

---

## What Changed

### 1. Created `useFounderNFTs` Hook
**File**: `apps/web/src/hooks/useFounderNFTs.ts`

**Purpose**: Fetch founder NFTs from ZO API profile

**Features**:
- Fetches `founder_tokens` from ZO API `/api/v1/profile/me/`
- Returns NFT data with `token_id`, `name`, and `image`
- Handles loading and error states
- Automatically constructs image paths from token IDs

**Usage**:
```typescript
const { nfts, isLoading, error } = useFounderNFTs();
```

### 2. Updated LeftSidebar Component
**File**: `apps/web/src/components/desktop-dashboard/LeftSidebar.tsx`

**Changes**:
- Imported `useFounderNFTs` hook
- Replaced hardcoded NFT data with dynamic data
- Added loading state ("Loading NFTs...")
- Added empty state ("No Founder NFTs found")
- Only shows section if user has NFTs or is loading
- Added image error fallback to placeholder

**Before**:
```tsx
{/* Hardcoded NFTs */}
<img src="/dashboard-assets/430-1.png" alt="NFT #411" />
<p>#411</p>
```

**After**:
```tsx
{/* Dynamic NFTs from ZO API */}
{founderNFTs.map((nft) => (
  <div key={nft.token_id}>
    <img src={nft.image} alt={nft.name} />
    <p>#{nft.token_id}</p>
  </div>
))}
```

---

## Data Flow

```
1. User logs in with ZO API
   ↓
2. ZO API returns profile with founder_tokens array
   ↓
3. useFounderNFTs hook fetches profile from ZO API
   ↓
4. Hook extracts founder_tokens from profile
   ↓
5. Maps tokens to FounderNFT format with images
   ↓
6. LeftSidebar renders NFTs dynamically
```

---

## ZO API Data Structure

### Profile Response (`/api/v1/profile/me/`)
```json
{
  "id": "user_123",
  "first_name": "John",
  "membership": "founder",
  "founder_tokens": [
    {
      "token_id": "411",
      "name": "Founder #411"
    },
    {
      "token_id": "831",
      "name": "Founder #831"
    },
    {
      "token_id": "420",
      "name": "Founder #420"
    }
  ]
}
```

### Hook Output
```typescript
{
  nfts: [
    {
      token_id: "411",
      name: "Founder #411",
      image: "/dashboard-assets/founder-nft-411.png"
    },
    {
      token_id: "831",
      name: "Founder #831",
      image: "/dashboard-assets/founder-nft-831.png"
    }
  ],
  isLoading: false,
  error: null
}
```

---

## Image Handling

### Image Path Convention
```
/dashboard-assets/founder-nft-{token_id}.png
```

**Examples**:
- Token ID `411` → `/dashboard-assets/founder-nft-411.png`
- Token ID `831` → `/dashboard-assets/founder-nft-831.png`
- Token ID `420` → `/dashboard-assets/founder-nft-420.png`

### Fallback Strategy
If image fails to load:
```typescript
onError={(e) => {
  e.target.src = '/dashboard-assets/founder-nft-placeholder.png';
}}
```

---

## UI States

### 1. Loading State
```
┌─────────────────────┐
│ FOUNDER NFTs        │
├─────────────────────┤
│  Loading NFTs...    │
└─────────────────────┘
```

### 2. Empty State (No NFTs)
```
Section is hidden (not rendered)
```

### 3. Success State (With NFTs)
```
┌─────────────────────┐
│ FOUNDER NFTs        │
├─────────────────────┤
│ [IMG] #411          │
│ [IMG] #831          │
│ [IMG] #420          │
└─────────────────────┘
```

---

## Testing

### How to Test

1. **Start dev server**:
   ```bash
   cd apps/web && pnpm dev
   ```

2. **Login with ZO account** that has Founder NFTs

3. **Check desktop dashboard** - Left sidebar should show:
   - "Loading NFTs..." initially
   - Then actual NFTs from your ZO profile
   - Or section hidden if no NFTs

4. **Test with different accounts**:
   - Account with NFTs → Shows NFTs
   - Account without NFTs → Section hidden
   - Not logged in → Section hidden

### Console Logs
```javascript
// Success
✅ Loaded 3 Founder NFTs

// No NFTs
No access token, skipping founder NFTs fetch

// Error
❌ Error fetching Founder NFTs: Failed to fetch profile
```

---

## Future Enhancements

### 1. IPFS/Metadata Support
Currently uses local images. Could fetch from:
- IPFS metadata URIs
- OpenSea API
- Direct contract calls

### 2. Click to View
Add click handler to open:
- OpenSea listing
- NFT detail modal
- Etherscan transaction

### 3. Hover Effects
Add visual feedback:
- Hover to enlarge
- Show rarity/traits
- Display last transfer date

### 4. Caching
Implement caching to reduce API calls:
- Cache in localStorage
- Refresh every N minutes
- Invalidate on profile update

---

## Files Modified

- ✅ `apps/web/src/hooks/useFounderNFTs.ts` (NEW)
- ✅ `apps/web/src/components/desktop-dashboard/LeftSidebar.tsx`

## Files Not Needed
- ❌ `apps/web/src/app/api/founder-nfts/route.ts` (Deleted - ZO API already provides data)

---

## TypeScript Status

✅ No TypeScript errors
✅ All types properly defined
✅ Proper error handling

---

## Ready to Test! 🚀

The Founder NFTs section is now fully dynamic and will display the actual NFTs from each user's ZO API profile.


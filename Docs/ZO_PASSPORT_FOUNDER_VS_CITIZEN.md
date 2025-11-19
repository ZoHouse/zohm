# Zo Passport: Founder vs Citizen Detection

**Date**: November 19, 2025  
**Component**: `ZoPassport`  
**Status**: ✅ Production Ready  
**Auto-Detection**: ✅ Fully Automatic  

---

## 🔍 How Detection Works

### Automatic Status Detection

```typescript
// In ZoPassport.tsx
const isFounder = useMemo(() => {
  if (!userProfile) return false;
  // User is a founder if they have founder NFTs
  return (userProfile.founder_nfts_count || 0) > 0;
}, [userProfile]);
```

**Detection Logic:**
- **Founder** = `founder_nfts_count > 0`
- **Citizen** = `founder_nfts_count === 0` or `null`

### Data Source

```
ZoPassport
  ↓
usePrivyUser() hook
  ↓
Supabase: users table
  ↓
Field: founder_nfts_count
  ↓
Auto-calculate: isFounder
  ↓
Render appropriate passport
```

---

## 🎨 Visual Differences

### Founder Passport (founder_nfts_count > 0)

```
┌─────────────────────────┐
│ 🌅 Pink Gradient BG     │ ← FOUNDER_BG image
│                         │
│    ⭕ 80% ⭕            │ ← White progress ring
│     🔵 Avatar           │ ← User avatar
│        💎 [Z Badge]     │ ← Pink founder badge
│                         │
│   ━━━━━━━━━━━━━━━━━    │
│   Samurai               │ ← White text
│   FOUNDER OF ZO WORLD   │ ← White text
└─────────────────────────┘
   Pink shadow glow
```

**Founder Styling:**
- Background: Pink gradient image (`FOUNDER_BG`)
- Text: `text-white` (white)
- Progress Ring: White (`#FFFFFF`)
- Shadow: `shadow-black/50`
- Badge: Pink "Z" badge visible
- Title: "Founder of Zo World"

### Citizen Passport (founder_nfts_count === 0)

```
┌─────────────────────────┐
│ 🧡 Orange Gradient BG   │ ← CITIZEN_BG image
│                         │
│    ⭕ 50% ⭕            │ ← Dark progress ring
│     🔵 Avatar           │ ← User avatar
│        [No Badge]       │ ← No founder badge
│                         │
│   ━━━━━━━━━━━━━━━━━    │
│   Alex Chen             │ ← Dark text
│   CITIZEN OF ZO WORLD   │ ← Dark text
└─────────────────────────┘
   Orange shadow glow
```

**Citizen Styling:**
- Background: Orange gradient image (`CITIZEN_BG`)
- Text: `text-[#111111]` (dark)
- Progress Ring: Dark (`#111111`)
- Shadow: `shadow-[#F1563F]/50` (orange)
- Badge: **Not visible**
- Title: "Citizen of Zo World"

---

## 📊 Complete Style Comparison

| Property | Founder | Citizen |
|----------|---------|---------|
| **Background Image** | Pink gradient (`FOUNDER_BG`) | Orange gradient (`CITIZEN_BG`) |
| **Text Color** | White (`#FFFFFF`) | Dark (`#111111`) |
| **Progress Ring** | White (`#FFFFFF`) | Dark (`#111111`) |
| **Progress Track** | White 20% opacity | Dark 10% opacity |
| **Shadow** | Black 50% opacity | Orange 50% opacity |
| **Founder Badge** | ✅ Visible (pink Z) | ❌ Hidden |
| **Title** | "FOUNDER OF ZO WORLD" | "CITIZEN OF ZO WORLD" |

---

## 🧪 Testing Both States

### Test Page Setup

Visit: `http://localhost:3001/passport-test`

```tsx
// The test page shows both versions side by side:

{/* Founder Version */}
<ZoPassport
  profile={{
    avatar: "/images/rank1.jpeg",
    name: "Samurai",
    isFounder: true  // ← Founder passport
  }}
  completion={{ done: 8, total: 10 }}
/>

{/* Citizen Version */}
<ZoPassport
  profile={{
    avatar: "/images/rank1.jpeg",
    name: "Alex Chen",
    isFounder: false  // ← Citizen passport
  }}
  completion={{ done: 5, total: 10 }}
/>
```

---

## 🔐 Database Schema

### users table (Supabase)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT,
  pfp TEXT,
  bio TEXT,
  founder_nfts_count INTEGER DEFAULT 0,  -- ← This field determines status
  twitter TEXT,
  telegram TEXT,
  phone TEXT,
  -- ... other fields
);
```

**Key Field:**
- `founder_nfts_count` (INTEGER)
  - `0` or `NULL` → **Citizen**
  - `> 0` → **Founder**

---

## 🚀 Usage Examples

### Example 1: Wired Component (Auto-Detect)

```tsx
// Automatically detects founder status from database
import { ZoPassport } from '@/components/desktop-dashboard';

export default function Profile() {
  return <ZoPassport />;
  // ✅ Will show founder passport if user has NFTs
  // ✅ Will show citizen passport if user has no NFTs
}
```

### Example 2: Manual Override (Testing)

```tsx
// Manually specify founder status
import { ZoPassport } from '@/components/desktop-dashboard';

export default function TestPage() {
  return (
    <>
      {/* Force founder display */}
      <ZoPassport
        profile={{ name: "Test User", isFounder: true }}
        completion={{ done: 10, total: 10 }}
      />
      
      {/* Force citizen display */}
      <ZoPassport
        profile={{ name: "Test User", isFounder: false }}
        completion={{ done: 5, total: 10 }}
      />
    </>
  );
}
```

---

## 🔄 How to Change User Status

### Make User a Founder

```sql
-- In Supabase SQL Editor
UPDATE users 
SET founder_nfts_count = 1 
WHERE id = 'did:privy:xxx';
```

**Result:** Passport immediately switches to founder design

### Make User a Citizen

```sql
-- In Supabase SQL Editor
UPDATE users 
SET founder_nfts_count = 0 
WHERE id = 'did:privy:xxx';
```

**Result:** Passport immediately switches to citizen design

### Check Current Status

```sql
-- View current founder status
SELECT 
  id, 
  name, 
  founder_nfts_count,
  CASE 
    WHEN founder_nfts_count > 0 THEN 'FOUNDER'
    ELSE 'CITIZEN'
  END as status
FROM users
WHERE id = 'did:privy:xxx';
```

---

## 💡 Real-World Flow

### New User Journey

```
1. User connects wallet
   ↓
2. usePrivyUser() fetches profile
   ↓
3. founder_nfts_count = 0 (default)
   ↓
4. ZoPassport detects: isFounder = false
   ↓
5. Renders CITIZEN passport
   ↓
6. User mints/buys founder NFT
   ↓
7. Backend updates founder_nfts_count = 1
   ↓
8. Page refreshes or profile reloads
   ↓
9. ZoPassport detects: isFounder = true
   ↓
10. Renders FOUNDER passport ✨
```

---

## 🎯 Key Benefits

### 1. **Zero Configuration**
Drop in component, status auto-detected

### 2. **Real-Time Updates**
Changes when NFT count updates in database

### 3. **No Props Needed**
Fetches everything automatically

### 4. **Graceful Defaults**
- Missing NFT count → Citizen
- Missing profile → Loading state
- Missing avatar → Default image

### 5. **Consistent Branding**
- Founders: Premium pink theme
- Citizens: Community orange theme

---

## 🐛 Troubleshooting

### Issue: Passport shows citizen but user has NFTs

**Check:**
```sql
-- Verify NFT count in database
SELECT founder_nfts_count FROM users WHERE id = 'USER_ID';
```

**Fix:**
```sql
-- Update NFT count if incorrect
UPDATE users SET founder_nfts_count = X WHERE id = 'USER_ID';
```

### Issue: Passport not switching after NFT purchase

**Causes:**
1. Database not updated yet (blockchain sync delay)
2. Profile not refreshed in frontend
3. Cache issue

**Fix:**
```tsx
// Force profile reload
const { loadUserProfile } = usePrivyUser();
await loadUserProfile();
```

### Issue: Badge not showing for founder

**Check:**
1. Is `isFounder` prop being passed correctly?
2. Inspect React DevTools: `profile.isFounder` should be `true`
3. Check `founder_nfts_count` in database

---

## 📝 Code References

| File | Purpose |
|------|---------|
| `ZoPassport.tsx` | Auto-detection logic and data fetching |
| `ZoPassportTest.tsx` | Visual rendering (presentational component) |
| `usePrivyUser.ts` | User data fetching hook |
| Background Images | CDN-hosted (FOUNDER_BG / CITIZEN_BG) |

### Background Image URLs

```typescript
// Founder background (pink gradient)
const FOUNDER_BG = "https://proxy.cdn.zo.xyz/gallery/media/images/a1659b07-94f0-4490-9b3c-3366715d9717_20250515053726.png";

// Citizen background (orange gradient)
const CITIZEN_BG = "https://proxy.cdn.zo.xyz/gallery/media/images/bda9da5a-eefe-411d-8d90-667c80024463_20250515053805.png";
```

---

## ✅ Summary

✅ **Automatic Detection**: Checks `founder_nfts_count` from database  
✅ **Two Designs**: Distinct founder (pink) vs citizen (orange) themes  
✅ **Self-Contained**: No manual status prop needed  
✅ **Real-Time**: Updates when database changes  
✅ **Tested**: Works on `/passport-test` page  

**Ready to deploy anywhere in the app!** 🚀

---

**Created**: November 18, 2025  
**Status**: ✅ Fully Implemented  
**Test**: `http://localhost:3001/passport-test`


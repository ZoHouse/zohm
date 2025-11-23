# Avatar Generation Debug - New User Onboarding

**Issue**: Avatar not generating for new users during onboarding  
**Date**: November 23, 2025  
**Status**: 🔍 Debugging in progress

---

## Changes Made

Added comprehensive logging to `UnifiedOnboarding.tsx` to diagnose the avatar generation issue:

### 1. Enhanced `triggerAvatarGeneration` Logging

**Before**:
```typescript
console.log('🚀 Triggering avatar generation via API...');
await updateProfile(token, { ... });
```

**After**:
```typescript
console.log('🚀 Triggering avatar generation via API...');
console.log('📝 Profile data:', { first_name, body_type, place_name, userId });
const result = await updateProfile(token, { ... });
console.log('📡 updateProfile result:', result);
```

### 2. Enhanced `pollForAvatar` Logging

**Before**:
```typescript
const result = await getProfile(token);
if (result.success && result.profile?.avatar?.image) {
  console.log('✅ Avatar ready:', ...);
}
```

**After**:
```typescript
console.log(`🔄 Polling attempt ${attempt}/${maxAttempts}...`);
const result = await getProfile(token);
console.log(`📊 Poll ${attempt} result:`, {
  success: result.success,
  hasProfile: !!result.profile,
  hasAvatar: !!result.profile?.avatar,
  avatarStatus: result.profile?.avatar?.status,
  avatarImage: result.profile?.avatar?.image ? 'EXISTS' : 'NULL',
});
```

---

## How to Test

1. **Clear your user data** (to simulate a new user):
   ```javascript
   // In browser console
   localStorage.clear();
   ```

2. **Refresh the page** and go through onboarding

3. **Watch the browser console** for these logs:

### Expected Log Sequence

```
🎬 Saving user data...
✅ User data saved, starting generation...
🚀 Triggering avatar generation via API...
📝 Profile data: { first_name: "...", body_type: "bro", place_name: "...", userId: "..." }
📡 updateProfile result: { success: true, ... }
⏳ Starting avatar polling...
🔄 Polling attempt 1/30...
📊 Poll 1 result: { success: true, hasProfile: true, hasAvatar: true, avatarStatus: "pending", avatarImage: "NULL" }
🔄 Polling attempt 2/30...
📊 Poll 2 result: { success: true, hasProfile: true, hasAvatar: true, avatarStatus: "processing", avatarImage: "NULL" }
...
🔄 Polling attempt N/30...
📊 Poll N result: { success: true, hasProfile: true, hasAvatar: true, avatarStatus: "completed", avatarImage: "EXISTS" }
✅ Avatar ready: https://cdn.zo.xyz/avatars/...
```

### Possible Failure Points

| Log | Issue | Solution |
|-----|-------|----------|
| `❌ No access token found` | User not authenticated | Check login flow |
| `❌ Failed to trigger generation: ...` | API call failed | Check ZO API status, credentials |
| `📡 updateProfile result: { success: false, error: "..." }` | Profile update failed | Check API error message |
| `⚠️ Avatar generation timeout after 30 seconds` | Backend taking too long | Increase timeout or check backend |
| `📊 Poll N result: { success: false, ... }` | getProfile failing | Check device credentials, token |
| `avatarStatus: "failed"` | Backend generation failed | Check ZO API logs |

---

## Avatar Generation Flow

```
User fills form → Click "Get Citizenship"
         ↓
Save to Supabase (upsertUser)
         ↓
Transition to 'generating' screen
         ↓
Call updateProfile(token, { first_name, body_type, place_name })
         ↓
Backend receives request → Starts avatar generation
         ↓
Poll getProfile() every 1 second (max 30 attempts)
         ↓
Check profile.avatar.status: "pending" → "processing" → "completed"
         ↓
When profile.avatar.image exists → Show success screen
         ↓
If timeout (30s) → Show default avatar (bro.png or bae.png)
```

---

## Common Issues

### Issue 1: `updateProfile` Returns `success: false`

**Symptoms**: Avatar generation never starts

**Possible Causes**:
- Invalid access token
- Missing device credentials
- ZO API error

**Debug**:
```javascript
// Check token
localStorage.getItem('zo_access_token')
localStorage.getItem('zo_token')

// Check device credentials in Supabase
SELECT zo_device_id, zo_device_secret FROM users WHERE id = '<user_id>';
```

### Issue 2: Polling Times Out

**Symptoms**: `⚠️ Avatar generation timeout after 30 seconds`

**Possible Causes**:
- Backend avatar generation is slow
- Backend is down
- Avatar generation failed silently

**Solution**:
- Check ZO API backend logs
- Increase timeout to 60 seconds if needed
- Add fallback to default avatars (already implemented)

### Issue 3: `getProfile` Fails During Polling

**Symptoms**: `❌ Polling error on attempt N: ...`

**Possible Causes**:
- Token expired during polling
- Device credentials missing
- Network issue

**Solution**:
- Implement token refresh
- Verify device credentials are saved correctly

---

## Next Steps

1. **Test with a new user** and share the console logs
2. **Look for specific error messages** in the logs
3. **Check the Network tab** for failed API requests
4. **Verify ZO API backend** is processing avatar generation requests

---

## Files Modified

- `apps/web/src/components/UnifiedOnboarding.tsx` - Added detailed logging

---

**Status**: ⏳ Awaiting Test Results  
**Action Required**: Test new user onboarding and share console logs


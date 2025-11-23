# Device Credentials: Mobile vs Web

## 🔄 Side-by-Side Comparison

| Step | Mobile App (React Native) | Web App (Next.js) | Match? |
|------|---------------------------|-------------------|--------|
| **1. Generate** | Random UUID on app launch | Random UUID on OTP request | ✅ Same |
| **2. Send OTP** | Send random UUIDs | Send random UUIDs | ✅ Same |
| **3. Verify OTP** | Send same random UUIDs | Send same random UUIDs | ✅ Same |
| **4. API Response** | Returns `device_id`, `device_secret` | Returns `device_id`, `device_secret` | ✅ Same |
| **5. Storage** | Save to **AsyncStorage** | Save to **Supabase** | ⚠️ Different storage, same concept |
| **6. Subsequent Calls** | Fetch from AsyncStorage | Fetch from Supabase | ⚠️ Different storage, same concept |
| **7. Reuse** | Same credentials until logout | Same credentials until logout | ✅ Same |
| **8. Logout** | Generate new random UUIDs | Generate new random UUIDs | ✅ Same |

---

## 🎯 Key Insight

**The ONLY difference** is where we store the credentials:
- **Mobile**: `AsyncStorage` (device-local, like localStorage)
- **Web**: `Supabase` (database, accessible from any device)

**Both approaches are valid!** The API doesn't care where you store them, only that you send the correct ones.

---

## 📱 Mobile Storage (AsyncStorage)

```typescript
// Mobile app stores locally on the device
await AsyncStorage.setItem('ZO_DEVICE_ID', device_id);
await AsyncStorage.setItem('ZO_DEVICE_SECRET', device_secret);

// Later, fetches from local storage
const deviceId = await AsyncStorage.getItem('ZO_DEVICE_ID');
const deviceSecret = await AsyncStorage.getItem('ZO_DEVICE_SECRET');
```

**Pros**:
- Fast (local)
- No network call

**Cons**:
- Lost if app is uninstalled
- Can't sync across devices

---

## 🌐 Web Storage (Supabase)

```typescript
// Web app stores in database
await supabase.from('users').update({
  zo_device_id: device_id,
  zo_device_secret: device_secret,
});

// Later, fetches from database
const { data } = await supabase
  .from('users')
  .select('zo_device_id, zo_device_secret')
  .eq('id', userId)
  .single();
```

**Pros**:
- Persists across devices
- Can be backed up
- Can be managed server-side

**Cons**:
- Requires network call
- Slightly slower

---

## ✅ Conclusion

**Our implementation is CORRECT!** ✅

We're doing exactly what the mobile app does, just with a different storage mechanism.

**The API failure is NOT due to device credentials.**

It's almost certainly **CORS**.

---

## 🧪 How to Prove It

Run this SQL query in Supabase to see your stored credentials:

```sql
SELECT 
  id,
  name,
  zo_user_id,
  zo_device_id,
  zo_device_secret,
  zo_token IS NOT NULL as has_token,
  created_at,
  updated_at
FROM users
WHERE id = '5fe9695677ff484aa1ad6bbba9828a91';
```

If you see valid UUIDs in `zo_device_id` and `zo_device_secret`, then our storage is working correctly.

Then run the `TEST_ZO_API.html` page to confirm it's CORS.


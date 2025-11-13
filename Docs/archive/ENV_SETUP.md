# Environment Variables Setup for Avatar Integration

## Required ZO API Variables

Add these to your `.env.local` file:

```bash
# ============================================================================
# ZO API Configuration (Avatar Generation)
# ============================================================================

# Base URL for ZO API (source of truth for profiles/avatars)
ZO_API_BASE_URL=https://api.zo.xyz

# Platform-specific client key for web
ZO_CLIENT_KEY_WEB=your_web_client_key_here

# Device credentials (session-based for web)
ZO_CLIENT_DEVICE_ID=your_device_id_here
ZO_CLIENT_DEVICE_SECRET=your_device_secret_here
```

## Getting ZO API Credentials

### 1. Ask ZO Backend Team For:
- `ZO_API_BASE_URL` - API endpoint (probably `https://api.zo.xyz`)
- `ZO_CLIENT_KEY_WEB` - Web client key (similar to iOS/Android keys in mobile app)

### 2. Device Credentials
Device ID and Secret are typically generated during user authentication:
- **Option A**: Generate on first login (like mobile app does)
- **Option B**: Use fixed values for web platform
- **Option C**: Use browser fingerprint as device ID

## Example `.env.local`

```bash
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PRIVY_APP_ID=...

# NEW: ZO API for Avatar Generation
ZO_API_BASE_URL=https://api.zo.xyz
ZO_CLIENT_KEY_WEB=zo_web_key_12345
ZO_CLIENT_DEVICE_ID=webapp_device_001
ZO_CLIENT_DEVICE_SECRET=secret_abc123
```

## Testing

Once environment variables are set, test the connection:

```bash
# In terminal
curl -X POST https://api.zo.xyz/api/v1/profile/me/ \
  -H "Content-Type: application/json" \
  -H "Platform: web" \
  -H "client-key: $ZO_CLIENT_KEY_WEB" \
  -H "client-device-id: $ZO_CLIENT_DEVICE_ID" \
  -H "client-device-secret: $ZO_CLIENT_DEVICE_SECRET" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"body_type": "bro"}'
```

## Next Steps

1. Get credentials from ZO backend team
2. Add to `.env.local`
3. Run migration: `npm run migrate:up`
4. Test avatar generation API routes


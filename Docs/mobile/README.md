# Mobile App Documentation

This folder contains documentation specific to the React Native mobile app.

---

## Files

### `APP_OVERVIEW.md`
Complete overview of the mobile app's stack, architecture, features, navigation, and authentication.

**Key Topics**:
- Tech stack (React Native, Expo, Firebase)
- Architecture patterns
- Navigation structure
- Authentication flow
- Feature modules

---

### `MOBILE_APP_DATABASE_API.md`
API documentation for mobile app database interactions.

**Key Topics**:
- API endpoints used by mobile
- Database schema for mobile-specific tables
- Sync strategies
- Offline support

---

### `AVATAR_PROFILE_FIREBASE_DOCUMENTATION.md`
Mobile app's avatar selection and Firebase integration.

**Key Topics**:
- NFT-based avatar selection
- Firebase authentication
- Profile management
- Avatar storage

---

## Mobile vs WebApp

| Aspect | Mobile App | WebApp |
|--------|-----------|--------|
| **Platform** | React Native (iOS/Android) | Next.js 15 (Web) |
| **Auth** | Firebase + Privy | Privy (→ ZO API) |
| **Database** | Firebase + Supabase | Supabase |
| **Avatar** | NFT selection | Generated avatar |
| **Map** | React Native Maps | Mapbox GL JS |
| **Status** | Separate repo | This repo (monorepo) |

---

## Future Plans

The mobile app will eventually be migrated into this monorepo under `apps/mobile/`.

**Timeline**: TBD

**Migration Plan**:
1. Review mobile codebase
2. Align authentication (ZO API for both)
3. Share SDK package (`@zohm/sdk`)
4. Move to `apps/mobile/` in this repo
5. Set up shared CI/CD

---

## Related Documentation

- `../ARCHITECTURE.md` - WebApp architecture
- `../WALLET_AND_PHONE_TO_PROFILE_FLOW.md` - Unified auth strategy
- `../ZO_API_DOCUMENTATION.md` - Shared API reference
- `../../packages/sdk/` - Shared SDK (future)

---

**Note**: These docs are for reference. Active mobile development happens in the separate mobile repo until migration is complete.


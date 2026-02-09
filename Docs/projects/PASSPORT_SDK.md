# Zo Passport SDK (`zopassport`)

> **"One line reputation to rule the world" — A portable identity system.**

- **Repository**: [github.com/ZoHouse/zopassport](https://github.com/ZoHouse/zopassport)
- **NPM**: `npm install zopassport`
- **Status**: Production
- **License**: MIT
- **Flow**: Phone OTP → Avatar → Passport → Wallet

---

## Overview

The **shared identity layer** across all Zo World apps. Provides complete authentication, onboarding, avatar generation, passport display, and wallet management. Used by both [game.zo.xyz](./QUESTING_MAP.md) and the [mobile app](./MOBILE_APP.md) — this stays as a shared npm package rather than being merged, since both platforms depend on it.

---

## Quick Start

### 4 Commands to Run

```bash
mkdir my-zopassport && cd my-zopassport
npm install zopassport
npx create-zopassport
cp .env.example .env   # Edit: VITE_ZO_CLIENT_KEY=your-key
npm install && npm run dev
```

App runs at `http://localhost:5173`.

Get your client key at: [zo.xyz/developers](https://zo.xyz/developers)

### What's Included

After `npm install zopassport`:
- Complete demo app — full phone → passport → wallet flow
- All dependencies — React, Vite, TypeScript pre-configured
- All assets — images, videos, icons bundled
- Environment template — just add your client key

---

## SDK Initialization

### Framework-Agnostic

```typescript
import { ZoPassportSDK } from 'zopassport';

const sdk = new ZoPassportSDK({
  clientKey: 'your-client-key',
  autoRefresh: true,
});
```

### React Integration

```tsx
import {
  ZoPassportProvider,
  useZoPassport,
  ZoLanding,
  ZoOnboarding,
  ZoPassportCard,
} from 'zopassport/react';

function App() {
  return (
    <ZoPassportProvider clientKey="your-client-key">
      <YourApp />
    </ZoPassportProvider>
  );
}

function YourApp() {
  const { isAuthenticated, user, sendOTP, verifyOTP } = useZoPassport();

  if (!isAuthenticated) {
    return (
      <ZoLanding
        onAuthSuccess={(userId, user) => console.log('Logged in!', user)}
        sendOTP={sendOTP}
        verifyOTP={verifyOTP}
      />
    );
  }

  return (
    <ZoPassportCard
      profile={{
        avatar: user.avatar?.image,
        name: user.first_name,
        isFounder: user.membership === 'founder',
      }}
      completion={{ done: 8, total: 10 }}
    />
  );
}
```

---

## Components

### `<ZoLanding />`

Full-screen landing page with video background and auth modal.

```tsx
<ZoLanding
  onAuthSuccess={(userId, user) => {}}
  sendOTP={async (code, phone) => sdk.auth.sendOTP(code, phone)}
  verifyOTP={async (code, phone, otp) => sdk.auth.verifyOTP(code, phone, otp)}
  videoUrl="/videos/background.mp4"
  logoUrl="/zo-logo.png"
  title="ZOHMMM!"
/>
```

### `<ZoOnboarding />`

Complete onboarding flow — nickname input, location detection, avatar preview.

```tsx
<ZoOnboarding
  onComplete={(data) => console.log(data)}
  updateProfile={(updates) => sdk.updateProfile(updates)}
  getProfile={() => sdk.getProfile()}
/>
```

### `<ZoPassportCard />`

Passport card display with leather texture, Founder/Citizen variants, and progress ring.

```tsx
<ZoPassportCard
  profile={{
    avatar: 'https://...',
    name: 'Samurai',
    isFounder: true,
  }}
  completion={{ done: 8, total: 10 }}
/>
```

### `<ZoAuth />`

Standalone phone OTP authentication component.

```tsx
<ZoAuth
  onSuccess={(userId, user) => {}}
  onClose={() => {}}
  sendOTP={sendOTP}
  verifyOTP={verifyOTP}
/>
```

### `<PhoneInput />` & `<OTPInput />`

Low-level input components for custom auth flows.

### `<WalletScreen />`

Full wallet management screen.

```tsx
<WalletScreen onBack={() => console.log('Back')} />
```

### `<WalletCard />`

Compact wallet card widget.

```tsx
<WalletCard
  balance={100}
  user={user}
  isOpen={isOpen}
  onToggle={() => setIsOpen(!isOpen)}
/>
```

---

## Hooks

### `useZoPassport()`

Main hook for authentication state and operations.

```tsx
const {
  sdk, user, isAuthenticated, isLoading,
  sendOTP, verifyOTP, logout, refreshProfile,
} = useZoPassport();
```

### `useProfile()`

Profile operations and completion tracking.

```tsx
const {
  user, completion, isFounder,
  updateProfile, reload,
} = useProfile();
```

### `useAvatar()`

Avatar generation operations.

```tsx
const {
  avatarUrl, isGenerating, generateAvatar,
} = useAvatar();
```

### `useWalletBalance()`

```tsx
const { balance, isLoading } = useWalletBalance(sdk.client);
```

### `useTransactions()`

```tsx
const { transactions } = useTransactions(sdk.client);
```

---

## Features

### Authentication
- Phone number + OTP authentication
- Automatic token refresh
- Session persistence across page reloads

### Avatar Generation
- Choose body type (Bro/Bae)
- AI-powered avatar generation
- Polling status updates during generation

### Passport Card
- Leather texture design
- Founder/Citizen variants with different backgrounds
- Progress ring indicator (profile completion)

### Onboarding Flow
- Nickname input
- Location detection
- Avatar preview and selection

### Wallet System
- Built-in $ZO token balance display
- Transaction history
- Framework-agnostic API:
  ```typescript
  const balance = await sdk.wallet.getBalance();
  const transactions = await sdk.wallet.getTransactions();
  ```

---

## Storage Adapters

### Web (Default)
Uses `localStorage` automatically.

### React Native

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ZoPassportSDK, AsyncStorageAdapter } from 'zopassport';

const sdk = new ZoPassportSDK({
  clientKey: 'your-key',
  storageAdapter: new AsyncStorageAdapter(AsyncStorage),
});
```

### Server-Side / Testing

```tsx
import { ZoPassportSDK, MemoryStorageAdapter } from 'zopassport';

const sdk = new ZoPassportSDK({
  clientKey: 'your-key',
  storageAdapter: new MemoryStorageAdapter(),
});
```

---

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  ZoUser,
  ZoAuthResponse,
  ZoProfileUpdatePayload,
  ZoPassportConfig,
} from 'zopassport';
```

---

## Platform Configuration

### Vite

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native-reanimated': path.resolve(__dirname, './reanimated-mock.js'),
    },
    extensions: ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx'],
  },
  define: { global: 'window' },
});
```

### Next.js

```javascript
const withTM = require('next-transpile-modules')([
  'zopassport',
  'react-native-web',
]);

module.exports = withTM({
  webpack: (config) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': 'react-native-web',
    };
    return config;
  },
});
```

---

## Assets Required

Include in your `public/` folder:

```
public/
├── figma-assets/
│   └── landing-zo-logo.png
├── videos/
│   └── loading-screen-background.mp4
├── bro.png                    # Bro avatar preview
├── bae.png                    # Bae avatar preview
├── Cultural Stickers/         # 17 culture icons
│   ├── Travel&Adventure.png
│   ├── Design.png
│   ├── Science&Technology.png
│   ├── Food.png
│   ├── Music&Entertainment.png
│   ├── Photography.png
│   ├── Health&Fitness.png
│   ├── Sport.png
│   ├── Literature&Stories.png
│   ├── Television&Cinema.png
│   ├── Spiritual.png
│   ├── Nature&Wildlife.png
│   ├── Business.png
│   ├── Law.png
│   ├── Home&Lifestyle.png
│   ├── Game.png
│   └── Stories&Journal.png
└── images/
    └── rank1.jpeg             # Fallback avatar
```

### CDN Assets

Override via props:
- **Founder Background**: `https://proxy.cdn.zo.xyz/gallery/media/images/a1659b07-...`
- **Citizen Background**: `https://proxy.cdn.zo.xyz/gallery/media/images/bda9da5a-...`

---

## Related Docs

- [NEW_USER_FUNNEL.md](../NEW_USER_FUNNEL.md) — Auth flow deep dive
- [ARCHITECTURE.md](../ARCHITECTURE.md) — System architecture
- [MOBILE_APP.md](./MOBILE_APP.md) — Mobile app (uses Passport SDK)
- [QUESTING_MAP.md](./QUESTING_MAP.md) — Game map (uses Passport)

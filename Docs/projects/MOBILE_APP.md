# Zo World Mobile App (`ZoWorldmobile`)

> **"Where Vibes Become Reality" — The all-inclusive Zo World experience.**

- **Repository**: [github.com/ZoHouse/ZoWorldmobile](https://github.com/ZoHouse/ZoWorldmobile)
- **Status**: Production-ready
- **Platforms**: iOS and Android
- **Framework**: React Native 0.73.6
- **Role**: Full experience — questing, bookings, chat, wallet, events

---

## Overview

**Zo Club App** is the **all-inclusive mobile experience** for Zo World. Everything from the web game (Quantum Sync quests, events, Vibe Score) plus IRL property bookings, real-time chat, Razorpay payments, Web3 wallet, NFT gallery, and the ZUI design system. This is the complete Zo World in your pocket — while [game.zo.xyz](./QUESTING_MAP.md) is the web navigation and action layer, the mobile app is the full experience.

---

## Core Features

### Quantum Sync — Audio Quest System

The flagship feature — complete audio quests to earn Zo Tokens and compete on leaderboards.

| Feature | Description |
|---------|-------------|
| **Audio Quests** | Record audio responses to complete challenges |
| **1111 Challenge** | Mini-game: stop the counter at exactly 1111ms |
| **Leaderboard** | Top 10 rankings with profile pictures and scores |
| **Token Rewards** | Earn $ZO tokens for completed quests |
| **Progress Tracking** | Multipliers, unique locations, best scores |
| **Stats Dashboard** | Quantum Sync statistics at a glance |

### Booking System

Full property booking experience:

- **Property Discovery** — Browse Zo properties with high-quality imagery
- **Smart Inventory** — Real-time availability with calendar selection
- **Workstation Booking** — Day-use workspace reservations
- **Room Service** — In-stay service requests
- **Member Management** — Add guests with ID verification (Aadhar/Passport)
- **Payment Integration** — Secure checkout with Razorpay
- **Multi-currency** — Support for different currencies

### Community & Social

- **Real-time Chat** — Socket.io powered messaging with reactions
- **Bulletin Board** — Community feed with posts and interactions
- **Events** — Discover and RSVP to Zo World events
- **Operations Dashboard** — Task management for Zo team members

### Web3 Integration

Powered by Reown AppKit (WalletConnect v2):

| Chain | Status |
|-------|--------|
| Ethereum Mainnet | Supported |
| Polygon | Supported |
| Arbitrum | Supported |
| Base | Supported |

**Features:** Connect any WalletConnect wallet, ENS name display, Zo NFT collection gallery, multi-wallet management.

### Customization

- **9 App Icons** — Default, BW, Comic, FYH, Hoodie, Sticker, Tape, Vibe, ZoZoZo
- **Dual Themes** — Cherry (warm) and Coal (dark)
- **Profile Customization** — Personalize Zo identity

---

## Tech Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.73.6 | Mobile framework |
| TypeScript | 5.0.4 | Type safety |
| NativeBase | 3.4.28 | UI component library |
| React Navigation | 6.x | Navigation |

### State Management & Data

| Package | Purpose |
|---------|---------|
| `@tanstack/react-query` | Modern data fetching and caching |
| `react-query` | Legacy API support |
| `wagmi` | Ethereum React hooks |
| `viem` | TypeScript Ethereum library |

### UI/UX Libraries

| Package | Purpose |
|---------|---------|
| `@gorhom/bottom-sheet` | Native bottom sheets |
| `@gorhom/portal` | Portal system for modals |
| `react-native-reanimated` | High-performance 60fps animations |
| `react-native-reanimated-carousel` | Carousel components |
| `react-native-calendars` | Calendar UI |
| `lottie-react-native` | Lottie animations |
| `react-native-video` | Video playback |

### Audio & Media

| Package | Purpose |
|---------|---------|
| `react-native-audio-recorder-player` | Audio recording (Quantum Sync) |
| `react-native-fast-image` | Optimized image loading |
| `react-native-zoom-toolkit` | Image zoom gestures |
| `react-native-image-picker` | Media selection |

### Web3 & Blockchain

| Package | Purpose |
|---------|---------|
| `@reown/appkit-wagmi-react-native` | WalletConnect v2 |
| `wagmi` | React Hooks for Ethereum |
| `viem` | Ethereum interactions |
| `@walletconnect/react-native-compat` | WalletConnect compatibility |

### Backend Services

| Service | Purpose |
|---------|---------|
| Firebase Analytics | Usage analytics |
| Firebase Crashlytics | Crash reporting |
| Firebase Messaging | Push notifications |
| Razorpay | Payment processing |
| Socket.io | Real-time communication |

---

## Architecture

### Provider Hierarchy

```
App Root
├── WagmiProvider (Web3 state)
│   └── QueryClientProvider (TanStack Query)
│       └── GestureHandlerRootView
│           └── QueryClientProvider (React Query)
│               └── ThemeProvider (ZUI theming)
│                   └── NavigationContainer
│                       └── NativeBaseProvider
│                           └── AuthProvider
│                               └── BottomSheetModalProvider
│                                   └── PortalProvider
│                                       ├── StatusBar
│                                       ├── AppNavigation
│                                       ├── AppKit (WalletConnect)
│                                       └── NoInternetModal
```

### Navigation Structure

```
Stack Navigator
├── Auth Flow
│   ├── Splash
│   ├── Welcome / Welcome2
│   ├── EntryVibe
│   ├── Onboarding / Onboarding2
│   └── ConnectEmail
│
├── Main Tab Navigator (5 tabs)
│   ├── Home (Quantum Sync Dashboard)
│   ├── Bulletin (Community Feed)
│   ├── IRL (Events & Bookings)
│   ├── AllChats (Messages)
│   ├── Profile
│   └── OpsDashboard (conditional)
│
└── Detail Screens
    ├── QuestAudio / QuestComplete
    ├── Booking Flow (BookingDetail → Confirm → Payment)
    ├── SingleEvent / SingleHouse / SingleRoom
    ├── SingleChat / ChatThreadInfo
    ├── AllWallets / AllZoNFTs
    └── ...more
```

### State Management

| Layer | Technology | Usage |
|-------|------------|-------|
| Server State | TanStack Query + React Query | API data, caching, background refresh |
| Auth State | Context API | User session, tokens |
| Web3 State | Wagmi + AppKit | Wallet connection, transactions |
| UI State | React State + Reanimated | Local component state, animations |
| Theme State | ZUI ThemeProvider | Theme switching |

---

## Project Structure

```
zo-club-dj-app_revamp/
├── android/                       # Android native code
├── ios/                           # iOS native code (9 app icon sets)
├── assets/
│   ├── fonts/                     # Rubik, Space Grotesk, Syne
│   ├── images/                    # Static images
│   ├── lotties/                   # confetti, thunder, zoloader
│   └── videos/                    # loading, mic-recording, zo-coin
├── src/
│   ├── App.tsx                    # Root component
│   ├── components/
│   │   ├── contexts/              # 10 React contexts
│   │   ├── helpers/               # 20 helper components
│   │   ├── icons/                 # 86 SVG icons
│   │   ├── illustrations/         # 15 illustrations
│   │   ├── lotties/               # 3 Lottie wrappers
│   │   ├── patterns/              # 3 pattern components
│   │   ├── skeletons/             # 16 loading skeletons
│   │   └── ui/                    # 39 UI components
│   ├── screens/                   # 39 app screens
│   │   ├── bookings/              # Booking flow
│   │   ├── Home.tsx               # Quantum Sync dashboard
│   │   ├── QuestAudio.tsx         # Audio recording
│   │   ├── QuestComplete.tsx      # Quest completion
│   │   └── Profile.tsx
│   ├── modals/                    # 30 modal components
│   ├── hooks/                     # 22 custom hooks
│   ├── utils/api/                 # 13 API clients
│   ├── config/                    # colors, theme, typography, web3
│   ├── definitions/               # TypeScript type definitions
│   └── zui/                       # ZUI Design System
│       ├── Components/            # 28 core components
│       ├── config/                # Theme configs
│       ├── helpers/               # 20 advanced components
│       ├── hocs/                  # 4 higher-order components
│       ├── hooks/                 # 6 ZUI hooks
│       ├── icons/                 # 46 ZUI icons
│       └── sheets/                # 14 bottom sheets
```

---

## ZUI Design System

**ZUI (Zo UI)** is the custom design system providing consistent styling and theming.

### Theme Colors

```typescript
{
  background: "#121212",    // Primary dark background
  lighter: "#202020",       // Secondary background
  text: "#FFFFFF",          // Primary text
  yellow: "#CFFF50",        // Neon accent (Zo signature)
  pink: "#FF2F8E",          // Secondary accent
  orange: "#FF9E4C",        // Tertiary accent
  success: "#66DF48",
  alert: "#FF4545",
  warning: "#FFD600",
}
```

### Typography

| Font | Usage |
|------|-------|
| **Syne** | Headings, display text |
| **Space Grotesk** | Body text, UI elements |
| **Rubik** | Monospace, code |

### Core Components (28)

Avatar, Button, Text, TextInput, Screen, Checkbox, RadioFields, Carousel, Loader, NoContent, Confetti, Tags, DetailList, and more.

### Bottom Sheets (14)

DateSelector, CurrencySheet, AddMemberSheet, PolicySheet, InventoryDetail, DoorUnlockSheet, RoomServiceSheet, and more.

### Usage

```tsx
import { Button, Text, Screen } from '@/zui/Components';
import { DateSelector } from '@/zui/sheets';

const MyScreen = () => (
  <Screen>
    <Text variant="heading">Welcome to Zo</Text>
    <Button onPress={handlePress}>Start Quantum Sync</Button>
  </Screen>
);
```

---

## API Integration

### API Domains

| Module | Prefix | Purpose |
|--------|--------|---------|
| Auth | `/auth/*` | Authentication |
| Profile | `/profile/*` | User profiles |
| Bookings | `/bookings/*` | Property reservations |
| Quantum Sync | `/quantumsync/*` | Quest system |
| Comms | `/comms/*` | Chat and messaging |
| Web3 | `/webthree/*` | Blockchain operations |
| ZoWorld | `/zoworld/*` | Platform metadata |
| Gallery | `/gallery/*` | Media management |
| Housekeeping | `/housekeeping/*` | Operations tasks |

### Key Endpoints

```
POST /quantumsync/audio        # Upload quest audio
GET  /quantumsync/stats        # User statistics
GET  /quantumsync/leaderboard  # Top rankings
GET  /bookings/inventory       # Available rooms
POST /bookings/create          # Create reservation
POST /bookings/workstation     # Book workspace
POST /bookings/service         # Room service request
POST /auth/login               # User login
POST /auth/refresh             # Refresh token
```

---

## Performance Optimizations

| Area | Technique |
|------|-----------|
| **Images** | FastImage caching, lazy loading, progressive JPEGs |
| **Lists** | FlashList with item recycling |
| **Animations** | Reanimated for 60fps native animations |
| **Video** | Optimized codecs, muted autoplay, background pause |
| **Bundle** | Hermes enabled, tree shaking |
| **Data** | Query caching, background refetching |

---

## Security

| Feature | Implementation |
|---------|----------------|
| Authentication | JWT tokens with secure storage |
| Storage | iOS Keychain / Android Keystore |
| Network | HTTPS only, certificate pinning ready |
| Payments | Razorpay PCI-DSS compliance |
| Web3 | WalletConnect v2 security model |
| Updates | Force update modal for critical patches |

---

## Getting Started

### Prerequisites

- **Node.js** >= 16.x
- **Yarn**
- **Xcode** 15+ (iOS)
- **Android Studio** (Android)
- **CocoaPods** (iOS)
- **Ruby** with Bundler (iOS)

### Installation

```bash
git clone https://github.com/ZoHouse/ZoWorldmobile.git
cd ZoWorldmobile

yarn install

# iOS
cd ios && pod install && cd ..

# Start Metro bundler
yarn start

# Run
yarn ios          # iOS
yarn android      # Android
```

### Pre-Release Checklist

- [ ] Set initial route to `splash` (not `quest-audio`)
- [ ] Disable API logging (`ENABLE_LOGS = false`)
- [ ] Test all payment flows in production mode
- [ ] Verify Firebase configuration
- [ ] Test push notifications and deep linking
- [ ] Test all 9 app icons
- [ ] Optimize video asset sizes
- [ ] Verify Quantum Sync backend connectivity
- [ ] Test Web3 integrations with real wallets

---

## Related Docs

- [PASSPORT_SDK.md](./PASSPORT_SDK.md) — Zo Passport SDK (shared auth)
- [VOICE_TRANSCRIPTION.md](../VOICE_TRANSCRIPTION.md) — Quantum Sync audio system
- [ARCHITECTURE.md](../ARCHITECTURE.md) — Full system architecture
- [DASHBOARD.md](../DASHBOARD.md) — Dashboard design (web counterpart)

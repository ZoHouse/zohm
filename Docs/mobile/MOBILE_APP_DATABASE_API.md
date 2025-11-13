# Zo Club Mobile App - Database & API Schema Documentation

**Platform**: React Native (iOS + Android)  
**Backend**: REST API + Firebase Services  
**Last Updated**: November 13, 2025  
**App Version**: 0.73.6

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Backend API Endpoints](#backend-api-endpoints)
4. [Firebase Integration](#firebase-integration)
5. [Local Storage](#local-storage)
6. [Data Models](#data-models)
7. [API Request Flow](#api-request-flow)
8. [Sample API Calls](#sample-api-calls)

---

## Overview

### Technology Stack

**Data Layer**:
- **Backend API**: REST API at `https://api.zo.xyz/api/v1/` (configurable base URL)
- **Firebase Analytics**: Event tracking and crash reporting
- **Firebase Cloud Messaging**: Push notifications
- **Firebase Crashlytics**: Crash reporting
- **AsyncStorage**: Local key-value storage for tokens, user preferences
- **React Native FileSystem (RNFS)**: Local file storage for images/cache

**State Management**:
- **React Query**: Server state management (caching, fetching, mutations)
- **React Context**: Global state (Auth, Comms, ZoTokens)
- **React Hooks**: Local component state

**HTTP Client**:
- **Axios**: Promise-based HTTP client with interceptors

### Key Differences from Web App

| Aspect | Mobile App | Web App |
|--------|-----------|---------|
| **Database Access** | Via REST API | Direct Supabase (PostgreSQL) |
| **Authentication** | Backend API + Firebase | Privy (DID-based) |
| **Wallet Management** | Backend handles wallet logic | Direct multi-wallet support |
| **Real-time** | Socket.io for chat | Supabase real-time subscriptions |
| **Storage** | AsyncStorage (key-value) | Browser localStorage |
| **Push Notifications** | Firebase Cloud Messaging | PWA notifications (future) |

---

## Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│           React Native Mobile App                    │
│                                                       │
│  ┌──────────────┐    ┌──────────────┐               │
│  │   Screens    │───▶│  Components  │               │
│  └──────┬───────┘    └──────┬───────┘               │
│         │                   │                        │
│         ▼                   ▼                        │
│  ┌──────────────────────────────────┐               │
│  │     React Query Hooks            │               │
│  │  (useQuery, useMutation)         │               │
│  └────────────┬─────────────────────┘               │
│               │                                      │
│               ▼                                      │
│  ┌──────────────────────────────────┐               │
│  │     API Utilities (src/utils/api)│               │
│  │  - auth.ts                        │               │
│  │  - bookings.ts                    │               │
│  │  - profile.ts                     │               │
│  │  - comms.ts                       │               │
│  │  - webthree.ts                    │               │
│  │  - ... (10 API modules)           │               │
│  └────────────┬─────────────────────┘               │
│               │                                      │
│               ▼                                      │
│  ┌──────────────────────────────────┐               │
│  │     Axios HTTP Client            │               │
│  │  (with auth interceptors)        │               │
│  └────────────┬─────────────────────┘               │
└───────────────┼──────────────────────────────────────┘
                │
                ▼
┌───────────────────────────────────────────────────────┐
│           Backend API Server                           │
│        https://api.zo.xyz/api/v1/                     │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │   Database   │  │   Firebase   │  │  Blockchain  ││
│  │  (MongoDB/   │  │   Services   │  │   Networks   ││
│  │   Postgres)  │  │              │  │              ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│           Local Storage (Device)                       │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │ AsyncStorage │  │ RNFS (Files) │  │   Keychain   ││
│  │ (Key-Value)  │  │  (Images)    │  │   (Secure)   ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
└───────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────┐
│           Firebase Services                            │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐│
│  │  Analytics   │  │Cloud Messaging│  │ Crashlytics  ││
│  └──────────────┘  └──────────────┘  └──────────────┘│
└───────────────────────────────────────────────────────┘
```

---

## Backend API Endpoints

### Base URL
```
https://api.zo.xyz/api/v1/
```

### API Modules Structure

The mobile app organizes API calls into 10 modules:

```typescript
// src/utils/api/index.ts
export {
  authApis,           // Authentication endpoints
  bookingsApis,       // Booking & reservation endpoints
  casApis,            // Community Access System endpoints
  commsApis,          // Chat & messaging endpoints
  housekeepingApis,   // Operations & housekeeping endpoints
  profileApis,        // User profile endpoints
  rzpPaymentApis,     // Razorpay payment endpoints
  socialsApis,        // Social features endpoints
  webthreeApis,       // Web3 & blockchain endpoints
  zoworldApis         // Zo World metadata endpoints
};
```

---

### 1. Authentication APIs (`authApis`)

#### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/auth/login` | Login with email/password |
| `POST` | `/api/v1/auth/signup` | Create new account |
| `POST` | `/api/v1/auth/verify-otp` | Verify OTP code |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Logout user |
| `POST` | `/api/v1/auth/apple` | Apple Sign In |
| `POST` | `/api/v1/auth/google` | Google Sign In |
| `GET` | `/api/v1/auth/me` | Get current user |

#### Request/Response Examples

**Login**:
```typescript
// Request
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "hashed_password"
}

// Response
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "Ishaan",
      "role": "Member"
    },
    "tokens": {
      "access_token": "eyJhbGci...",
      "refresh_token": "eyJhbGci...",
      "expires_in": 3600
    }
  }
}
```

**Apple/Google Sign In**:
```typescript
// Request
POST /api/v1/auth/apple
{
  "id_token": "apple_id_token",
  "user_identifier": "000123.456789abcdef"
}

// Response
{
  "success": true,
  "data": {
    "user": {...},
    "tokens": {...},
    "is_new_user": false
  }
}
```

---

### 2. Profile APIs (`profileApis`)

#### Query Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/profile/me` | Get own profile |
| `GET` | `/api/v1/profile/me/ens` | Get ENS names for wallet |
| `GET` | `/api/v1/profile/me/pfp` | Get profile picture |
| `GET` | `/api/v1/profile/seed` | Get seed data for profile |
| `GET` | `/api/v1/profile/custom-nickname/available/:nickname` | Check nickname availability |

#### Mutation Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `PUT` | `/api/v1/profile/me` | Update profile |
| `PUT` | `/api/v1/profile/me/ens` | Update ENS selection |
| `POST` | `/api/v1/profile/me/pfp` | Upload profile picture |

#### Data Model: User Profile

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  pfp: string | null;              // Profile picture URL
  bio: string | null;
  culture: string | null;          // Cultural affinity
  role: 'Founder' | 'Member' | 'Citizen';
  founder_nfts_count: number;
  
  // Location
  lat: number | null;
  lng: number | null;
  city: string | null;
  
  // Social
  x_handle: string | null;         // Twitter handle
  x_connected: boolean;
  
  // Web3
  wallet_address: string | null;
  ens_name: string | null;
  
  // URLs
  calendar_url: string | null;
  main_quest_url: string | null;
  side_quest_url: string | null;
  
  // Timestamps
  created_at: string;              // ISO 8601
  last_seen: string | null;
  updated_at: string;
}
```

---

### 3. Bookings APIs (`bookingsApis`)

#### Query Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/bookings/upcoming` | Get upcoming bookings |
| `GET` | `/api/v1/bookings/me` | Get my bookings |
| `GET` | `/api/v1/bookings/stay/operators` | Get stay operators (Zo Houses) |
| `GET` | `/api/v1/bookings/stay/operators/all` | Get all stay operators |
| `GET` | `/api/v1/bookings/stay/bookings` | Get stay bookings |
| `GET` | `/api/v1/bookings/stay/pricing` | Get stay pricing |
| `GET` | `/api/v1/bookings/experience/operators` | Get experience operators |
| `GET` | `/api/v1/bookings/experience/all/inventory` | Get all experience inventory |
| `GET` | `/api/v1/bookings/experience/bookings` | Get experience bookings |
| `GET` | `/api/v1/bookings/experience/pricing` | Get experience pricing |
| `GET` | `/api/v1/bookings/experience/availability` | Check experience availability |

#### Mutation Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/bookings/stay/bookings` | Create stay booking |
| `PUT` | `/api/v1/bookings/stay/bookings/:id` | Update stay booking |
| `POST` | `/api/v1/bookings/experience/bookings` | Create experience booking |

#### Data Model: Booking

```typescript
interface Booking {
  id: string;
  user_id: string;
  
  // Booking Type
  type: 'stay' | 'experience';
  operator_id: string;             // Zo House or experience provider
  
  // Stay Booking
  room_type?: string;              // "Private Room", "Dorm Bed", etc.
  check_in?: string;               // ISO 8601 date
  check_out?: string;              // ISO 8601 date
  guests_count?: number;
  
  // Experience Booking
  experience_name?: string;
  experience_date?: string;        // ISO 8601 datetime
  participants_count?: number;
  
  // Pricing
  base_price: number;
  taxes: number;
  total_price: number;
  currency: string;                // "INR", "USD", etc.
  
  // Payment
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  payment_id: string | null;       // Razorpay payment ID
  
  // Status
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  
  // Members (for group bookings)
  members: BookingMember[];
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

interface BookingMember {
  name: string;
  email: string;
  phone: string;
  id_type: 'aadhar' | 'passport';
  id_number: string;
  id_photo_url: string | null;
}
```

---

### 4. Communications APIs (`commsApis`)

#### Query Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/comms/threads` | Get chat threads |
| `GET` | `/api/v1/comms/accounts/me` | Get my comm account |
| `GET` | `/api/v1/comms/silenced-accounts` | Get silenced accounts |

#### Mutation Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/comms/media` | Upload media (image/video) |
| `POST` | `/api/v1/comms/threads` | Create thread |
| `PUT` | `/api/v1/comms/threads/:id` | Update thread |
| `POST` | `/api/v1/comms/silenced-accounts` | Silence account |

#### Real-time: Socket.io

**Connection**:
```typescript
import io from 'socket.io-client';

const socket = io('https://comms.zo.xyz', {
  auth: {
    token: accessToken
  }
});
```

**Events**:
- `connect`: Connected to server
- `disconnect`: Disconnected
- `message:new`: New message received
- `message:updated`: Message edited
- `message:deleted`: Message deleted
- `thread:updated`: Thread metadata updated
- `typing:start`: User started typing
- `typing:stop`: User stopped typing
- `presence:online`: User came online
- `presence:offline`: User went offline

#### Data Model: Chat Message

```typescript
interface ChatMessage {
  id: string;
  thread: string;                  // Thread ID
  
  // Message Type
  category: 'conversation' | 'system';
  type: 'sent' | 'received';
  
  // Sender
  sender: {
    id: string;
    profile: {
      nickname: string;
      name: string;
      bio: string;
      pfp: string | null;
    };
  };
  
  // Content
  body: {
    text: string;
    embeds: MessageEmbed[];
  };
  mentions: string[];              // User IDs mentioned
  
  // Attachments
  attachments: MessageAttachment[];
  
  // Reactions
  reactions: {
    mine: string[];                // Emoji reactions by current user
    summary: ReactionSummary[];    // All reactions summary
  };
  
  // Thread
  in_reply_to: string | null;      // Message ID if reply
  
  // Status
  status: 'sending' | 'sent' | 'delivered' | 'seen' | 'failed';
  receipt: {
    delivered_at: string | null;
    seen_at: string | null;
  };
  
  // Timestamps
  timestamp: string;               // ISO 8601
}

interface MessageAttachment {
  type: 'image' | 'video' | 'file';
  url: string;
  thumbnail_url?: string;
  filename?: string;
  size?: number;
  mime_type?: string;
}

interface MessageEmbed {
  type: 'link' | 'giphy' | 'image';
  url: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
}
```

---

### 5. Web3 APIs (`webthreeApis`)

#### Query Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/web3/nfts` | Get user's NFTs |
| `GET` | `/api/v1/web3/balance` | Get token balance |
| `GET` | `/api/v1/web3/transactions` | Get transaction history |

#### Mutation Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/web3/connect` | Connect wallet |
| `POST` | `/api/v1/web3/disconnect` | Disconnect wallet |

#### Data Model: NFT

```typescript
interface NFT {
  id: string;
  contract_address: string;
  token_id: string;
  chain: 'ethereum' | 'polygon' | 'arbitrum' | 'base';
  
  // Metadata
  name: string;
  description: string | null;
  image_url: string;
  animation_url: string | null;
  
  // Collection
  collection_name: string;
  collection_slug: string;
  
  // Attributes
  attributes: NFTAttribute[];
  
  // Owner
  owner_address: string;
  
  // Timestamps
  acquired_at: string | null;
  last_transfer_at: string;
}

interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: string;
}
```

---

### 6. Zo World APIs (`zoworldApis`)

#### Query Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/zoworld/metadata` | Get Zo World metadata |
| `GET` | `/api/v1/zoworld/nodes` | Get Zo Houses/nodes |
| `GET` | `/api/v1/zoworld/events` | Get events |

#### Data Model: Zo House Node

```typescript
interface ZoHouseNode {
  id: string;
  name: string;
  type: 'hacker_space' | 'culture_house' | 'schelling_point' | 'flo_zone' | 'staynode';
  status: 'active' | 'developing' | 'planning';
  
  // Location
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  address: string | null;
  
  // Details
  description: string;
  features: string[];              // ['coworking', 'coliving', 'events', ...]
  capacity: number | null;
  
  // Links
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  contact_email: string | null;
  
  // Media
  image: string | null;
  images: string[];                // Gallery
  
  // Timestamps
  inserted_at: string;
  updated_at: string;
}
```

---

### 7. CAS APIs (`casApis`)

**CAS**: Community Access System (for member access control)

#### Query Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/cas/access` | Check access permissions |
| `GET` | `/api/v1/cas/gates` | Get gate status |

---

### 8. Housekeeping APIs (`housekeepingApis`)

#### Query Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/housekeeping/tasks` | Get tasks |
| `GET` | `/api/v1/housekeeping/shifts` | Get shift schedule |

#### Mutation Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/housekeeping/tasks` | Create task |
| `PUT` | `/api/v1/housekeeping/tasks/:id` | Update task status |

---

### 9. Payment APIs (`rzpPaymentApis`)

#### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/payments/create-order` | Create Razorpay order |
| `POST` | `/api/v1/payments/verify` | Verify payment signature |
| `POST` | `/api/v1/payments/refund` | Process refund |

#### Data Model: Payment

```typescript
interface Payment {
  id: string;
  booking_id: string;
  
  // Razorpay
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  
  // Amount
  amount: number;
  currency: string;
  
  // Status
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  
  // Timestamps
  created_at: string;
  captured_at: string | null;
}
```

---

### 10. Socials APIs (`socialsApis`)

#### Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/socials/bulletin` | Get bulletin posts |
| `POST` | `/api/v1/socials/bulletin` | Create bulletin post |
| `GET` | `/api/v1/socials/events` | Get social events |

---

## Firebase Integration

### Firebase Services Used

#### 1. Firebase Analytics

**Usage**: Track user events and app usage

```typescript
import analytics from '@react-native-firebase/analytics';

// Log event
await analytics().logEvent('quest_completed', {
  quest_id: 'voice-sync',
  score: 1111,
  tokens_earned: 420
});

// Log screen view
await analytics().logScreenView({
  screen_name: 'HomeScreen',
  screen_class: 'HomeScreen'
});

// Set user properties
await analytics().setUserProperties({
  role: 'Founder',
  city: 'San Francisco'
});
```

**Events Tracked**:
- `app_open`: App launched
- `login`: User logged in
- `signup`: New user registered
- `booking_created`: Booking made
- `quest_completed`: Quest finished
- `message_sent`: Chat message sent
- `nft_viewed`: NFT viewed
- `wallet_connected`: Wallet connected

---

#### 2. Firebase Cloud Messaging (FCM)

**Usage**: Push notifications

```typescript
import messaging from '@react-native-firebase/messaging';

// Request permission
const authStatus = await messaging().requestPermission();
const enabled = 
  authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  authStatus === messaging.AuthorizationStatus.PROVISIONAL;

// Get FCM token
const fcmToken = await messaging().getToken();

// Listen for messages
messaging().onMessage(async remoteMessage => {
  console.log('Notification received:', remoteMessage);
});

// Background message handler
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);
});
```

**Notification Payload**:
```json
{
  "notification": {
    "title": "New Message",
    "body": "Alice sent you a message"
  },
  "data": {
    "screen_name": "SingleChat",
    "thread_id": "thread_123"
  }
}
```

---

#### 3. Firebase Crashlytics

**Usage**: Crash reporting and error tracking

```typescript
import crashlytics from '@react-native-firebase/crashlytics';

// Log error
crashlytics().recordError(error);

// Log custom event
crashlytics().log('User completed onboarding');

// Set user identifier
crashlytics().setUserId(userId);

// Set custom attributes
crashlytics().setAttribute('role', 'Founder');
crashlytics().setAttribute('version', '1.0.0');
```

---

## Local Storage

### AsyncStorage (Key-Value Store)

**Usage**: Store user preferences, tokens, cached data

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data
await AsyncStorage.setItem('access_token', token);
await AsyncStorage.setItem('user_profile', JSON.stringify(profile));

// Retrieve data
const token = await AsyncStorage.getItem('access_token');
const profileStr = await AsyncStorage.getItem('user_profile');
const profile = profileStr ? JSON.parse(profileStr) : null;

// Remove data
await AsyncStorage.removeItem('access_token');

// Clear all
await AsyncStorage.clear();
```

**Keys Used**:
- `access_token`: JWT access token
- `refresh_token`: JWT refresh token
- `user_profile`: Cached user profile
- `user_preferences`: App settings
- `onboarding_completed`: Boolean flag
- `notification_permission`: Permission status
- `last_sync_time`: Last data sync timestamp

---

### React Native Keychain (Secure Storage)

**Usage**: Store sensitive data (tokens, passwords)

```typescript
import * as Keychain from 'react-native-keychain';

// Store credentials
await Keychain.setGenericPassword(
  'access_token',
  token,
  {
    service: 'zo.club.auth'
  }
);

// Retrieve credentials
const credentials = await Keychain.getGenericPassword({
  service: 'zo.club.auth'
});

if (credentials) {
  const token = credentials.password;
}

// Delete credentials
await Keychain.resetGenericPassword({
  service: 'zo.club.auth'
});
```

---

### React Native FileSystem (RNFS)

**Usage**: Store images, cached files

```typescript
import RNFS from 'react-native-fs';

// Paths
const documentPath = RNFS.DocumentDirectoryPath;
const cachePath = RNFS.CachesDirectoryPath;

// Write file
const filePath = `${documentPath}/profile.jpg`;
await RNFS.writeFile(filePath, imageBase64, 'base64');

// Read file
const imageData = await RNFS.readFile(filePath, 'base64');

// Delete file
await RNFS.unlink(filePath);

// List files
const files = await RNFS.readDir(documentPath);
```

**Directories Used**:
- `{DocumentDirectory}/images/`: Profile pictures, ID photos
- `{DocumentDirectory}/cache/`: Temporary cached data
- `{CacheDirectory}/media/`: Chat media cache

---

## Data Models

### Complete Data Model Definitions

#### User

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  pfp: string | null;
  bio: string | null;
  culture: string | null;
  role: 'Founder' | 'Member' | 'Citizen';
  founder_nfts_count: number;
  
  lat: number | null;
  lng: number | null;
  city: string | null;
  
  x_handle: string | null;
  x_connected: boolean;
  
  wallet_address: string | null;
  ens_name: string | null;
  
  calendar_url: string | null;
  main_quest_url: string | null;
  side_quest_url: string | null;
  
  created_at: string;
  last_seen: string | null;
  updated_at: string;
}
```

#### Booking

```typescript
interface Booking {
  id: string;
  user_id: string;
  type: 'stay' | 'experience';
  operator_id: string;
  
  // Stay fields
  room_type?: string;
  check_in?: string;
  check_out?: string;
  guests_count?: number;
  
  // Experience fields
  experience_name?: string;
  experience_date?: string;
  participants_count?: number;
  
  // Pricing
  base_price: number;
  taxes: number;
  total_price: number;
  currency: string;
  
  // Payment
  payment_status: 'pending' | 'paid' | 'refunded' | 'cancelled';
  payment_id: string | null;
  
  // Status
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  
  // Members
  members: BookingMember[];
  
  created_at: string;
  updated_at: string;
}
```

#### Chat Thread

```typescript
interface ChatThread {
  id: string;
  name: string;
  type: 'direct' | 'group';
  
  participants: ChatParticipant[];
  
  last_message: {
    text: string;
    timestamp: string;
    sender_id: string;
  } | null;
  
  unread_count: number;
  
  metadata: {
    avatar: string | null;
    description: string | null;
  };
  
  created_at: string;
  updated_at: string;
}

interface ChatParticipant {
  id: string;
  name: string;
  pfp: string | null;
  role: 'admin' | 'member';
  joined_at: string;
}
```

#### Event

```typescript
interface Event {
  id: string;
  name: string;
  description: string;
  
  // Dates
  start_date: string;
  end_date: string;
  
  // Location
  location_name: string;
  address: string;
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  
  // Details
  category: string;
  capacity: number | null;
  attendees_count: number;
  
  // Media
  image: string | null;
  images: string[];
  
  // Links
  event_url: string | null;
  calendar_url: string | null;
  
  // Host
  host: {
    id: string;
    name: string;
    pfp: string | null;
  };
  
  created_at: string;
  updated_at: string;
}
```

---

## API Request Flow

### Authentication Flow

```
1. User opens app
       ↓
2. Check AsyncStorage for access_token
       ↓
   ┌─── Token exists ───┐         ┌─── No token ───┐
   │                     │         │                 │
   ▼                     │         ▼                 │
3. Validate token        │    3. Show login screen  │
   (GET /api/v1/auth/me) │                          │
   │                     │         │                 │
   ├─ Valid ─────────────┘         │                 │
   │                               ▼                 │
   │                          4. Login               │
   │                             (POST /api/v1/auth/login)
   │                               │                 │
   ├─ Invalid ───────────────────┘                 │
   │                                                 │
   ▼                                                 │
5. Fetch user profile                               │
   (GET /api/v1/profile/me)                        │
   │                                                 │
   └────────────────────────────────────────────────┘
                     │
                     ▼
              6. Navigate to app
```

### API Request Interceptor

```typescript
// Add auth token to all requests
axios.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors (refresh token)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = await AsyncStorage.getItem('refresh_token');
      
      try {
        const response = await axios.post('/api/v1/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const { access_token } = response.data;
        await AsyncStorage.setItem('access_token', access_token);
        
        // Retry original request
        error.config.headers.Authorization = `Bearer ${access_token}`;
        return axios.request(error.config);
      } catch {
        // Refresh failed, logout
        await AsyncStorage.clear();
        // Navigate to login
      }
    }
    
    return Promise.reject(error);
  }
);
```

---

## Sample API Calls

### Get User Profile

```typescript
import { profileApis } from '@/utils/api';
import { useQuery } from 'react-query';

const { data, isLoading, error } = useQuery(
  profileApis.PROFILE_ME('', '', {})
);

if (data) {
  const profile = data.data.data;
  console.log('User:', profile.name);
}
```

### Create Booking

```typescript
import { bookingsApis } from '@/utils/api';

const createBookingMutation = bookingsApis.BOOKINGS_STAY_BOOKINGS(
  {
    onSuccess: (response) => {
      console.log('Booking created:', response.data.data.id);
    },
    onError: (error) => {
      console.error('Booking failed:', error);
    }
  },
  '',
  'POST'
);

// Execute mutation
createBookingMutation.mutate({
  data: {
    operator_id: 'zo-house-sf',
    room_type: 'Private Room',
    check_in: '2025-01-15',
    check_out: '2025-01-20',
    guests_count: 2,
    members: [
      {
        name: 'Ishaan',
        email: 'ishaan@zo.xyz',
        phone: '+1234567890',
        id_type: 'passport',
        id_number: 'AB1234567'
      }
    ]
  }
});
```

### Send Chat Message (Socket.io)

```typescript
import io from 'socket.io-client';

const socket = io('https://comms.zo.xyz', {
  auth: { token: accessToken }
});

socket.on('connect', () => {
  console.log('Connected to chat');
});

// Send message
socket.emit('message:send', {
  thread_id: 'thread_123',
  text: 'Hello from mobile!',
  mentions: [],
  attachments: []
});

// Listen for messages
socket.on('message:new', (message) => {
  console.log('New message:', message);
});
```

---

## API Response Standards

### Success Response Format

```json
{
  "success": true,
  "data": {
    "id": "123",
    "name": "Example"
  },
  "message": "Operation successful"
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Pagination Format

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "has_more": true
  }
}
```

---

## Performance Optimizations

### React Query Caching

```typescript
// Cache user profile for 1 hour
const { data } = useQuery(
  profileApis.PROFILE_ME('', '', {
    staleTime: 3600000,      // 1 hour
    cacheTime: 3600000,
    refetchOnWindowFocus: false
  })
);
```

### Optimistic Updates

```typescript
const updateProfileMutation = profileApis.PROFILE_ME(
  {
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries(['profile', 'me']);
      
      // Snapshot previous value
      const previous = queryClient.getQueryData(['profile', 'me']);
      
      // Optimistically update
      queryClient.setQueryData(['profile', 'me'], (old) => ({
        ...old,
        data: { ...old.data, ...newData.data }
      }));
      
      return { previous };
    },
    onError: (err, newData, context) => {
      // Rollback on error
      queryClient.setQueryData(['profile', 'me'], context.previous);
    },
    onSettled: () => {
      // Refetch after mutation
      queryClient.invalidateQueries(['profile', 'me']);
    }
  },
  '',
  'PUT'
);
```

---

## Security Considerations

### Token Storage
- **Access tokens**: Stored in AsyncStorage (expires in 1 hour)
- **Refresh tokens**: Stored in React Native Keychain (secure)
- **Never log tokens** in production

### API Security
- All requests over HTTPS
- JWT tokens in Authorization header
- Automatic token refresh on 401
- Rate limiting on backend

### Data Validation
- All API responses validated with TypeScript types
- Form inputs validated before submission
- User input sanitized to prevent XSS

---

**Last Updated**: November 13, 2025  
**API Version**: v1  
**Mobile App Version**: 0.73.6  
**Backend Base URL**: `https://api.zo.xyz/api/v1/`




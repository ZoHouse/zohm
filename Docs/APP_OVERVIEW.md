# Zo World App Overview

> **Current state of the application architecture, features, and implementation status.**

---

## 🏗️ Architecture

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Maps**: Mapbox GL JS (`react-map-gl`)
- **State Management**: React Hooks + Context
- **Authentication**: Custom phone auth + Supabase

---

## 📱 Key Features

### 1. The Map Interface (`/`)
The core experience is a geospatial explorer.

- **Map Engine**: Interactive 3D map with custom styles.
- **Clustering**: Nodes and events are clustered for performance (`lib/mapClustering.ts`).
- **Modes**:
  - **Local**: Focuses on user's immediate vicinity (100km radius).
  - **Global**: Shows the entire network of nodes and events.
- **Data Sources**:
  - **Nodes**: Physical locations (Zo House, Zostels, etc.) from Supabase.
  - **Events**: Aggregated from Supabase + iCal feeds (Luma).
- **Onboarding Overlay**: New users go through a "Ritual" flow before accessing the map.

### 2. Zo Passport (`/zopassport`)
The user's digital identity and profile page.

- **Identity Card**: Visual passport card with avatar, name, and founder status.
- **Citizenship Declaration**: Interactive modal to generate a downloadable "Citizen of Zo World" card.
- **Social Sharing**: Integration to post declaration directly to X (Twitter).
- **Culture Collection**: Users select "Cultures" (interests) represented by digital stickers.
- **Economy**: Real-time display of **$Zo** token balance.

### 3. Quests & Gamification
Interactive challenges to engage users with the physical world.

- **AR Quests**: Augmented Reality challenges (using 8th Wall).
- **Audio Quests**: Voice-interactive quests (`QuestAudio` component).
- **Rewards**: Users earn $Zo tokens and reputation for completion.
- **Leaderboards**: City and global rankings.

### 4. Events System
Discovery engine for community gatherings.

- **Sources**:
  - **Luma Integration**: Auto-syncs events from diverse calendars (`lib/icalParser.ts`).
  - **Community**: User-generated events stored in Supabase.
- **Filtering**: By category (Party, Tech, Wellness, etc.) and time.
- **RSVP**: Direct integration to attend events.

---

## 📂 Directory Structure

| Path | Purpose |
|------|---------|
| `apps/web/src/app` | Next.js App Router pages |
| ├── `page.tsx` | Main Map & Dashboard (Home) |
| ├── `zopassport/` | Passport & Identity page |
| └── `api/` | Backend API routes (Events, Users, Auth) |
| `apps/web/src/components` | UI Components |
| ├── `MapCanvas.tsx` | Main map logic & rendering |
| ├── `QuestAudio.tsx` | Voice quest interaction |
| └── `desktop-dashboard/` | Desktop-specific UI |
| `apps/web/src/lib` | Core Logic |
| ├── `supabase.ts` | Database client & queries |
| ├── `icalParser.ts` | Calendar event syncing |
| └── `geoUtils.ts` | Geospatial calculations |

---

## 🚦 Current Status

| Feature | Status | Notes |
|---------|--------|-------|
| **Map Visualization** | ✅ Active | Robust clustering & GL rendering |
| **User Onboarding** | ✅ Active | "Ritual" flow with voice elements |
| **Passport/Profile** | ✅ Active | Declaration & sharing working |
| **Event Sync** | ✅ Active | Luma iCal parsing operational |
| **Quests** | 🟡 Beta | AR/Audio quests in active testing |
| **Wallet/Web3** | 🟡 Beta | Token balance display active |
| **City/Local View** | ✅ Active | Auto-detects user location |

---

## 🔄 Key Workflows

1.  **New User**: Landing -> Phone Auth -> Onboarding (Ritual) -> Map (Local View).
2.  **Returning User**: Map (Global/Local) -> Dashboard/Passport.
3.  **Explorer**: Browse Map -> Click Node/Event -> Fly to Location -> RSVP.

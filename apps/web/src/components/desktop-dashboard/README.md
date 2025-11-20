# Desktop Dashboard

A comprehensive desktop dashboard for Zo World, featuring a 3-column layout with profile, content, and social sections.

## Overview

The Desktop Dashboard is a full-screen experience designed for desktop users, showcasing:
- **User Profile & Stats**: Founder/Citizen badges, avatar, bio, social links, $Zo balance, Vibe Score
- **Content & Activities**: NFTs, visited nodes, quests, 3D map view
- **Social Features**: Private chat rooms, virtual rooms, communities, upcoming events

## Design Source

Based on Figma design: [zo.xyz Dashboard (Node 188:6757)](https://www.figma.com/design/I8P5ECz7pOA4aBa4sxOBEM/zo.xyz?node-id=188-6757)

## Architecture

```
DesktopDashboard (Main Container)
├── DashboardHeader (Top navigation + user menu)
├── LeftSidebar (Profile, Quests, Offers/Help)
├── CenterColumn (NFTs, Travel, Map, CTAs)
└── RightSidebar (Chat, Rooms, Communities, Events)
```

## Components

### 1. `DesktopDashboard.tsx`
Main container component that orchestrates the entire dashboard layout.

**Props:**
- `onClose?: () => void` - Callback when dashboard is closed

**State Management:**
- Uses `usePrivyUser` for user profile data
- Handles loading states
- Manages background gradient overlay

### 2. `DashboardHeader.tsx`
Top navigation bar with branding, music player, and profile menu.

**Features:**
- Zo World logo + Founder Member badge
- Music player widget (placeholder for SFOxZo Radio)
- Navigation links (Quantum Sync, Schelling Point, Degen Lounge)
- Map icon shortcut
- Profile menu with avatar
- Optional close button

### 3. `LeftSidebar.tsx`
Enhanced profile card with user information and quest details.

**Sections:**
- **Profile Card:**
  - Founder/Citizen ID badges
  - Large avatar (312x312px)
  - Display name (ENS or custom)
  - Bio text
  - Wallet address (copyable)
  - Social links (X, Discord)
  - Culture badges
  - Stats: $Zo balance & Vibe Score
  - "Request Connection" CTA
  
- **Main Quest Card:**
  - Quest image
  - Title & description
  - Category tags
  - Reward amount
  
- **Offer Section:**
  - User's skills/offerings
  
- **Help Section:**
  - What user needs help with

**Data Integration:**
- Fetches real quest data via `useDashboardData` hook
- Displays first active quest as "Main Quest"

### 4. `CenterColumn.tsx`
Content showcase for NFTs, travel, and map interactions.

**Sections:**
- **Founder NFTs:**
  - Carousel/grid of user's NFTs
  - NFT images with IDs
  - Pagination dots
  
- **Travel:**
  - Visited nodes (up to 3)
  - Node images + names
  - City tags (3-letter codes)
  - Dynamic based on user's node visits
  
- **3D Map View:**
  - Interactive map preview
  - Search button overlay
  - Zoom controls
  - Center marker
  - Zo logo badge
  
- **Open Your Own ZO NODE:**
  - CTA card for node application

**Data Integration:**
- Fetches real nodes via `useDashboardData` hook
- Displays visited/nearby nodes dynamically

### 5. `RightSidebar.tsx`
Social features and community engagement.

**Sections:**
- **Private Room:**
  - Chat interface
  - Member avatars
  - Message bubbles (left + right aligned)
  - Emoji reactions
  - Text input
  
- **Virtual Rooms:**
  - Schelling Point
  - Degen Lounge
  - Room thumbnails
  - Pagination dots
  
- **Communities:**
  - Demo Day
  - Degen Lounge
  - Zo Collective
  - Community thumbnails
  - Pagination dots
  
- **Events:**
  - Upcoming events (up to 2)
  - Event thumbnails
  - Start time (relative)
  - Location & category
  - "Register" buttons
  - Pagination dots
  
- **ZO CARD:**
  - Application CTA

**Data Integration:**
- Fetches real events from `canonical_events` via `useDashboardData` hook
- Displays upcoming events with live time calculations

## Data Hook: `useDashboardData`

Custom React hook for fetching dashboard data from Supabase.

**Exports:**
```typescript
interface DashboardEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  location?: string;
  category?: string;
  image_url?: string;
  is_free: boolean;
}

interface DashboardQuest {
  id: string;
  slug: string;
  title: string;
  description: string;
  reward: number;
  category?: string;
  image_url?: string;
}

interface VisitedNode {
  id: string;
  name: string;
  city: string;
  lat: number;
  lng: number;
  image_url?: string;
}

function useDashboardData(): {
  events: DashboardEvent[];
  quests: DashboardQuest[];
  visitedNodes: VisitedNode[];
  loading: boolean;
}
```

**Data Sources:**
- `canonical_events`: Upcoming events (5 max)
- `quests`: Active quests (3 max)
- `nodes`: Visited/nearby nodes (5 max)

## Usage

### Basic Implementation

```tsx
import DesktopDashboard from '@/components/desktop-dashboard';

function App() {
  return (
    <DesktopDashboard 
      onClose={() => {
        // Handle dashboard close
        router.push('/');
      }} 
    />
  );
}
```

### Test Page

A test page is available at `/dashboard-test` for development and testing:

```tsx
// apps/web/src/app/dashboard-test/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import DesktopDashboard from '@/components/desktop-dashboard';

export default function DashboardTestPage() {
  const router = useRouter();
  return <DesktopDashboard onClose={() => router.push('/')} />;
}
```

Access at: `http://localhost:3000/dashboard-test`

## Styling

The dashboard uses:
- **Tailwind CSS** for utility-first styling
- **Backdrop blur effects** for glassmorphism UI
- **Futura Std** font for headings (loaded via font-family fallback)
- **Rubik** font for body text (already in project)
- **Dark theme** with purple/pink gradients
- **White/8 opacity** for borders and overlays

### Color Palette
- Background: `#121212` (Coal/Background/Primary)
- Card Background: `#202020` (Coal/Background/Card)
- Text Primary: `#FFFFFF` (Coal/Text/Primary)
- Text Secondary: `#5A5A5A` (Coal/Text/Secondary)
- Text Focus: `#CFFF50` (Coal/Text/Focus)
- Accent: Purple/Pink gradients

## TODO: Remaining Work

### 1. Responsive Breakpoints (dash-14)
- [ ] Add media queries for tablet (768px - 1024px)
- [ ] Add fallback to mobile view for screens < 768px
- [ ] Ensure columns stack appropriately on smaller screens
- [ ] Test on various screen sizes

### 2. Polish & Testing (dash-15)
- [ ] Add hover states and microinteractions
- [ ] Implement skeleton loaders for data fetching
- [ ] Test with real user data (various profile types)
- [ ] Ensure all images load correctly
- [ ] Add error states for failed data fetches
- [ ] Polish spacing to match Figma exactly
- [ ] Add animations for section transitions
- [ ] Implement music player functionality
- [ ] Add real-time chat functionality
- [ ] Implement event registration flow
- [ ] Add NFT data fetching (if available)

### 3. Future Enhancements
- [ ] Add keyboard navigation support
- [ ] Implement drag-and-drop for sections
- [ ] Add customizable dashboard layouts
- [ ] Integrate real-time updates (WebSockets)
- [ ] Add notification badges
- [ ] Implement search functionality
- [ ] Add filters for events/quests
- [ ] Create deep links for dashboard sections

## Dependencies

- React 18+
- Next.js 14+
- Tailwind CSS
- `@privy-io/react-auth` (for user authentication)
- `lucide-react` (for icons)
- Supabase client (for data fetching)

## Notes

- Currently uses placeholder images for some sections (NFTs, nodes, rooms, communities)
- Music player is a visual placeholder - needs audio integration
- Private Room chat is static - needs real-time backend
- Registration buttons are placeholders - needs event registration flow
- The dashboard is optimized for desktop (min-width: 1280px)
- Mobile responsiveness is pending (see TODO dash-14)

## File Structure

```
apps/web/src/components/desktop-dashboard/
├── DesktopDashboard.tsx      # Main container
├── DashboardHeader.tsx        # Top navigation
├── LeftSidebar.tsx            # Profile & quests
├── CenterColumn.tsx           # Content & map
├── RightSidebar.tsx           # Social & events
├── index.ts                   # Exports
└── README.md                  # This file

apps/web/src/hooks/
└── useDashboardData.ts        # Data fetching hook

apps/web/src/app/dashboard-test/
└── page.tsx                   # Test page
```

## Support

For questions or issues, please refer to the main project documentation or contact the development team.






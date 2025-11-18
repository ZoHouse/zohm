# Quest: Home Node Activation

**Quest ID**: `home-node-activation`  
**Quest Type**: AR Creation Quest  
**Status**: 🚧 In Development  
**Priority**: P1 - Core Feature  
**Estimated Dev Time**: 10-14 days  

---

## 📋 Table of Contents

1. [Quest Overview](#quest-overview)
2. [Narrative & Lore](#narrative--lore)
3. [User Experience Flow](#user-experience-flow)
4. [Technical Architecture](#technical-architecture)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [8th Wall AR Implementation](#8th-wall-ar-implementation)
8. [3D Asset Specifications](#3d-asset-specifications)
9. [Rewards System](#rewards-system)
10. [Edge Cases & Validation](#edge-cases--validation)
11. [Testing Plan](#testing-plan)
12. [Future Enhancements](#future-enhancements)

---

## Quest Overview

### **Concept**
Users scan their physical home space using WebAR, place a 3D "**\z/**" (Zo logo) beacon within their house, and activate their home as a node on the Zo World network.

### **Core Mechanics**
1. **Scan**: User opens camera and scans their room (8th Wall SLAM)
2. **Place**: User taps to place a floating 3D "\z/" logo in their space
3. **Activate**: Portal animation plays, GPS coordinates captured
4. **Reward**: User earns 200-375 $ZO tokens
5. **Network**: Their home appears on the global Zo World map

### **Why This Matters**
- Transforms every user into a **node creator** (not just consumer)
- Creates **user-generated content** at scale
- Builds **physical-digital bridge** (core to Zo philosophy)
- Drives **real-world engagement** and community
- **Viral loop**: Each node can attract visitors

---

## Narrative & Lore

### **Quest Name**: "Host a Zo House"

### **Quest Description**
> "The Zo network grows through conscious creators like you. Your home is a frequency anchor—a point where digital meets physical reality. Scan your space. Place the \z/ beacon. Activate your portal. Join the network."

### **Lore Context**
In Zo World's ontology:
- **Nodes** = Reality anchors where frequencies converge
- **\z/ Beacon** = A programmable reality marker
- **Home Portal** = Personal sovereignty over your reality
- **Network Effect** = More nodes = stronger collective field

### **Quest Giver** (Optional NPC/System Message)
> "Welcome, Citizen. You've experienced the map. Now, become part of it. Your consciousness creates reality. Your home space holds power. Let's activate it."

---

## User Experience Flow

### **1. Quest Discovery**

**Location**: Quests Overlay (Mobile & Desktop)

```tsx
<QuestCard>
  <Icon>🏠</Icon>
  <Title>Host a Zo House</Title>
  <Description>
    Turn your home into a node on the Zo World network. 
    Scan your space and place a reality beacon.
  </Description>
  <Rewards>
    <ZoTokens>200-375 $ZO</ZoTokens>
    <Badge>Node Host</Badge>
    <Reputation>+50 Network Builder</Reputation>
  </Rewards>
  <Requirements>
    <Requirement>📷 Camera Access</Requirement>
    <Requirement>📍 Location Access</Requirement>
    <Requirement>🌐 AR-Capable Device</Requirement>
  </Requirements>
  <Status>One-time Quest</Status>
  <CTA>Begin Activation</CTA>
</QuestCard>
```

---

### **2. Permission Flow**

**Screen**: Pre-AR Permission Screen

```
╔═══════════════════════════════════╗
║                                   ║
║          📷  🌍  📡              ║
║                                   ║
║   We need your help to:          ║
║                                   ║
║   ✓ Access Camera                ║
║     (Scan your space in AR)      ║
║                                   ║
║   ✓ Access Location              ║
║     (Place node on map)          ║
║                                   ║
║   ✓ Use Device Motion            ║
║     (Track 3D movement)          ║
║                                   ║
║   [Grant Permissions]            ║
║                                   ║
╚═══════════════════════════════════╝
```

**Technical**:
- Check `navigator.permissions.query()`
- Request in sequence: location → camera → motion
- Handle denied states gracefully
- Store permission status in localStorage

---

### **3. AR Scanning Phase**

**Screen**: AR Surface Detection

```
┌───────────────────────────────────┐
│  👆 Instructions:                 │
│                                   │
│  Walk around your space slowly.   │
│  Point camera at floor and walls. │
│  We're mapping your room...       │
└───────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│       [Camera Feed - AR View]       │
│                                     │
│  ╔═══════════════════════════╗    │
│  ║                           ║    │
│  ║    [Floor Detection]      ║    │
│  ║    [Wall Detection]       ║    │
│  ║                           ║    │
│  ╚═══════════════════════════╝    │
│                                     │
└─────────────────────────────────────┘

┌───────────────────────────────────┐
│  Progress: ████████░░ 84%         │
│                                   │
│  Surfaces Detected: 12            │
│  Anchor Points: 8                 │
│                                   │
│  Status: Keep moving...           │
└───────────────────────────────────┘
```

**Technical Requirements**:
- 8th Wall World Tracking enabled
- Surface detection (horizontal & vertical)
- Minimum 75% room coverage before proceeding
- Real-time feedback on scan quality
- Timeout after 2 minutes (prompt user to retry)

**User Feedback**:
- ✅ Good coverage - surfaces highlighted in green
- ⚠️ Move slower - detecting motion blur
- ❌ Too dark - increase lighting
- 🔄 Rotate device - need more angles

---

### **4. Portal Placement Phase**

**Screen**: 3D Beacon Placement

```
┌───────────────────────────────────┐
│  👆 Tap anywhere to place beacon  │
└───────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│       [Camera Feed - AR View]       │
│                                     │
│              ⚡                     │
│             /z/                     │
│         (floating 3D)               │
│                                     │
│    [Grid overlay on floor]          │
│                                     │
└─────────────────────────────────────┘

┌───────────────────────────────────┐
│  Controls:                        │
│                                   │
│  [↕️ Height]  [↔️ Rotate] [📏 Scale] │
│                                   │
│  Position: ✓ Valid                │
│  Lighting: ✓ Good                 │
│                                   │
│  [Lock Beacon Here] ✨            │
└───────────────────────────────────┘
```

**Beacon Behavior**:
- **Default Position**: 1.5m above detected floor surface
- **Floating Animation**: Gentle up/down hover (±5cm)
- **Rotation**: Slow spin (360° in 10 seconds)
- **Scale**: Adjustable from 0.5x to 2.0x
- **Glow Effect**: Pulsing golden light (breathing pattern)
- **Particles**: Subtle sparkles emanating upward

**Constraints**:
- Must be placed on detected surface (floor/table/wall)
- Height limits: 0.5m to 3.0m from floor
- Cannot be placed outside scanned area
- Minimum 0.5m from walls/obstacles

**Visual Feedback**:
- ✅ Green outline = Valid placement
- ❌ Red outline = Invalid placement
- 🎯 Reticle follows user tap point

---

### **5. Node Configuration**

**Screen**: Name Your Node

```
╔═══════════════════════════════════╗
║                                   ║
║  Your Zo House is ready! ✨       ║
║                                   ║
║  ┌─────────────────────────────┐ ║
║  │                             │ ║
║  │   [3D Preview of Beacon]    │ ║
║  │       /z/ (animated)        │ ║
║  │                             │ ║
║  └─────────────────────────────┘ ║
║                                   ║
║  Name your node:                  ║
║  ┌─────────────────────────────┐ ║
║  │ Sam's Creative Den        🏠│ ║
║  └─────────────────────────────┘ ║
║                                   ║
║  Node Type:                       ║
║  ○ 🏠 Home Portal                 ║
║  ○ 💼 Work Space                  ║
║  ○ 🎨 Creative Studio             ║
║  ○ 🧘 Meditation Space            ║
║  ○ 🎮 Game Room                   ║
║                                   ║
║  Visibility:                      ║
║  [✓] Show on public map           ║
║  [✓] Allow visitors               ║
║  [ ] Private node                 ║
║                                   ║
║  Location:                        ║
║  📍 Bengaluru, Karnataka, India   ║
║  🌍 12.9352°N, 77.6245°E          ║
║                                   ║
║  [Activate Portal] ⚡             ║
║                                   ║
╚═══════════════════════════════════╝
```

**Validation Rules**:
- Node name: 3-50 characters, alphanumeric + spaces
- Node type: Required selection
- Location: Auto-filled from GPS (read-only)
- Cannot create duplicate node at same coordinates

**Suggested Names** (AI-generated based on context):
- If in bedroom: "Dream Anchor", "Rest Portal"
- If timestamp is night: "Night Frequency", "Moon Node"
- If user has "creative" in profile: "Creative Lab", "Idea Portal"

---

### **6. Activation Animation**

**Screen**: Portal Activation Sequence

```
┌─────────────────────────────────────┐
│                                     │
│       [Full Screen AR View]         │
│                                     │
│              ⚡⚡⚡                  │
│            ///z///                  │
│          (expanding)                │
│                                     │
│    ╔═══════════════════════╗       │
│    ║   ACTIVATING...       ║       │
│    ║   ████████░░░ 73%     ║       │
│    ╚═══════════════════════╝       │
│                                     │
└─────────────────────────────────────┘

Animation Sequence (5 seconds):
0.0s - Beacon glows brighter
0.5s - Particle burst outward
1.0s - Beacon expands 2x size
1.5s - Beam shoots up (symbolizing connection to network)
2.0s - Pulse wave expands from beacon (ripple effect)
2.5s - Beacon stabilizes, rotating faster
3.0s - Screen flash (white)
3.5s - Network connection lines appear (connecting to nearby nodes)
4.0s - Status text: "SYNCING WITH NETWORK..."
4.5s - Status text: "PORTAL ACTIVE ✨"
5.0s - Transition to rewards screen
```

**Audio** (if sound enabled):
- 0.0s: Low hum (rising frequency)
- 1.0s: Crystalline chime
- 2.0s: Whoosh (expansion)
- 3.0s: Power surge sound
- 4.5s: Success chime

**Haptics** (mobile devices):
- 0.5s: Light tap
- 2.0s: Medium pulse
- 3.0s: Strong pulse
- 4.5s: Success pattern (three taps)

---

### **7. Rewards & Completion**

**Screen**: Quest Complete

```
╔═══════════════════════════════════╗
║                                   ║
║         ✨ PORTAL ACTIVE ✨        ║
║                                   ║
║  Your Zo House is now on the      ║
║  network! You are Node Host #847  ║
║                                   ║
║  ┌─────────────────────────────┐ ║
║  │  Sam's Creative Den         │ ║
║  │  📍 Bengaluru, India        │ ║
║  │  🏠 Home Portal              │ ║
║  │  🌐 Node ID: ZH-BLR-847     │ ║
║  └─────────────────────────────┘ ║
║                                   ║
║  REWARDS EARNED:                  ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    ║
║  💰 Base Activation    +200 $ZO  ║
║  🌍 New City Bonus     +50 $ZO   ║
║  🚀 Early Adopter      +100 $ZO  ║
║  ✨ Creative Name      +25 $ZO   ║
║  ━━━━━━━━━━━━━━━━━━━━━━━━━━━    ║
║  TOTAL                 375 $ZO   ║
║                                   ║
║  UNLOCKED:                        ║
║  🎖️ Node Host Badge               ║
║  📊 +50 Network Builder Rep       ║
║  🗺️ Your node is now visible     ║
║                                   ║
║  NEXT STEPS:                      ║
║  • Visit your portal daily (+10)  ║
║  • Share with friends (viral!)    ║
║  • Upgrade portal (cosmetics)     ║
║                                   ║
║  [View on Map] [Share Portal]     ║
║                                   ║
╚═══════════════════════════════════╝
```

---

## Technical Architecture

### **Tech Stack**

```json
{
  "ar_engine": "8th Wall XR",
  "3d_rendering": "Three.js + @react-three/fiber",
  "ar_features": [
    "World Tracking (6DOF SLAM)",
    "Surface Detection",
    "Light Estimation",
    "Persistent Anchors"
  ],
  "backend": "Next.js API Routes + Supabase",
  "storage": "Supabase PostgreSQL + PostGIS"
}
```

### **Component Architecture**

```
apps/web/src/
├── components/
│   ├── quests/
│   │   └── home-node-activation/
│   │       ├── HomeNodeQuest.tsx           # Main quest wrapper
│   │       ├── PermissionRequest.tsx       # Permission flow
│   │       ├── ARScanner.tsx               # Surface scanning
│   │       ├── BeaconPlacement.tsx         # 3D beacon placement
│   │       ├── NodeConfiguration.tsx       # Name/settings form
│   │       ├── ActivationAnimation.tsx     # Portal activation
│   │       └── RewardsScreen.tsx           # Completion screen
│   │
│   └── ar/
│       ├── ARSession.tsx                   # 8th Wall session manager
│       ├── SurfaceDetector.tsx             # Surface detection UI
│       ├── ZoBeacon3D.tsx                  # 3D \z/ beacon model
│       ├── ARControls.tsx                  # Scale/rotate/height controls
│       └── ARCameraFeed.tsx                # Camera preview wrapper
│
├── hooks/
│   ├── useARSession.ts                     # 8th Wall session hook
│   ├── useSurfaceDetection.ts              # Surface detection state
│   ├── useBeaconPlacement.ts               # Beacon placement logic
│   └── useNodeCreation.ts                  # Node creation API calls
│
├── lib/
│   ├── ar/
│   │   ├── 8thwall.ts                      # 8th Wall initialization
│   │   ├── slam.ts                         # SLAM tracking utilities
│   │   ├── anchors.ts                      # Persistent anchor management
│   │   └── surface-detection.ts            # Surface detection helpers
│   │
│   └── nodes/
│       ├── user-node-creation.ts           # Node creation logic
│       ├── node-validation.ts              # Validation rules
│       └── node-rewards.ts                 # Rewards calculation
│
└── app/api/
    └── nodes/
        ├── create-user-node/route.ts       # POST - Create node
        ├── validate-location/route.ts      # POST - Validate GPS
        ├── upload-anchor/route.ts          # POST - Save AR anchor data
        └── nearby-user-nodes/route.ts      # GET - Find nearby nodes
```

---

## Database Schema

### **Main Table: `user_nodes`**

```sql
-- User-generated nodes (homes, personal spaces)
CREATE TABLE user_nodes (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id),
  
  -- Node metadata
  name TEXT NOT NULL CHECK (char_length(name) >= 3 AND char_length(name) <= 50),
  description TEXT CHECK (char_length(description) <= 500),
  node_type TEXT NOT NULL DEFAULT 'home_portal',
  -- Types: home_portal, work_space, creative_studio, meditation_space, game_room, other
  
  -- Real-world location
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude >= -90 AND latitude <= 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude >= -180 AND longitude <= 180),
  address TEXT, -- Reverse geocoded address
  city TEXT,
  country TEXT,
  
  -- AR anchor data (8th Wall persistent anchors)
  ar_anchor_id TEXT, -- 8th Wall anchor ID
  ar_anchor_data JSONB, -- Full anchor serialization
  beacon_position JSONB NOT NULL, -- {x, y, z} in world space
  beacon_rotation JSONB NOT NULL DEFAULT '{"x":0,"y":0,"z":0,"w":1}', -- Quaternion
  beacon_scale FLOAT NOT NULL DEFAULT 1.0 CHECK (beacon_scale >= 0.5 AND beacon_scale <= 2.0),
  
  -- Spatial index for PostGIS
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  ) STORED,
  
  -- Gamification metrics
  activation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_visited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_count INTEGER NOT NULL DEFAULT 0, -- User's own visits
  unique_visitor_count INTEGER NOT NULL DEFAULT 0, -- Others visiting
  total_interactions INTEGER NOT NULL DEFAULT 0,
  daily_streak INTEGER NOT NULL DEFAULT 0, -- Consecutive days visited
  longest_streak INTEGER NOT NULL DEFAULT 0,
  
  -- Rewards tracking
  tokens_earned_total INTEGER NOT NULL DEFAULT 0,
  tokens_earned_today INTEGER NOT NULL DEFAULT 0,
  last_reward_at TIMESTAMP WITH TIME ZONE,
  
  -- Status & moderation
  status TEXT NOT NULL DEFAULT 'active',
  -- Status: active, inactive, flagged, suspended, deleted
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE, -- Manually verified by team
  verification_method TEXT, -- manual, auto, community
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by TEXT REFERENCES users(id),
  
  -- Anti-abuse
  flagged_count INTEGER NOT NULL DEFAULT 0,
  flagged_reasons JSONB DEFAULT '[]',
  last_flagged_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata & extensibility
  customization JSONB DEFAULT '{}', -- Portal colors, effects, etc.
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Constraints
  CONSTRAINT unique_user_active_node UNIQUE(user_id, latitude, longitude) 
    WHERE status = 'active' AND deleted_at IS NULL
);

-- Indexes for performance
CREATE INDEX idx_user_nodes_user_id ON user_nodes(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_nodes_status ON user_nodes(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_user_nodes_public ON user_nodes(is_public) WHERE is_public = true AND deleted_at IS NULL;
CREATE INDEX idx_user_nodes_created ON user_nodes(created_at DESC);

-- Spatial index for nearby queries (PostGIS)
CREATE INDEX idx_user_nodes_location ON user_nodes USING GIST (location) WHERE deleted_at IS NULL;

-- Full-text search on name and description
CREATE INDEX idx_user_nodes_search ON user_nodes USING GIN (
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
) WHERE deleted_at IS NULL;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_nodes_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_nodes_updated_at
  BEFORE UPDATE ON user_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_user_nodes_timestamp();

-- Row Level Security (RLS)
ALTER TABLE user_nodes ENABLE ROW LEVEL SECURITY;

-- Users can read all public nodes
CREATE POLICY "Public nodes are viewable by everyone"
  ON user_nodes FOR SELECT
  USING (is_public = true AND status = 'active' AND deleted_at IS NULL);

-- Users can read their own nodes (including private)
CREATE POLICY "Users can view their own nodes"
  ON user_nodes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own nodes
CREATE POLICY "Users can create their own nodes"
  ON user_nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own nodes
CREATE POLICY "Users can update their own nodes"
  ON user_nodes FOR UPDATE
  USING (auth.uid() = user_id);

-- Only admins can delete (soft delete)
CREATE POLICY "Only admins can delete nodes"
  ON user_nodes FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin' AND 
    deleted_at IS NOT NULL
  );
```

### **Supporting Table: `user_node_visits`**

```sql
-- Track visits to user nodes (by owner and others)
CREATE TABLE user_node_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES user_nodes(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL REFERENCES users(id),
  
  -- Visit details
  visit_type TEXT NOT NULL DEFAULT 'ar_visit',
  -- Types: ar_visit, remote_view, map_click, share_click
  
  -- AR session data (if applicable)
  ar_session_duration INTEGER, -- seconds
  ar_interactions INTEGER DEFAULT 0, -- taps, gestures, etc.
  
  -- Metadata
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  device_info JSONB, -- User agent, device type
  metadata JSONB DEFAULT '{}',
  
  -- Constraints
  CONSTRAINT unique_visitor_node_day UNIQUE(visitor_id, node_id, DATE(visited_at))
  -- One visit per user per node per day
);

-- Indexes
CREATE INDEX idx_node_visits_node_id ON user_node_visits(node_id);
CREATE INDEX idx_node_visits_visitor_id ON user_node_visits(visitor_id);
CREATE INDEX idx_node_visits_date ON user_node_visits(visited_at DESC);

-- RLS
ALTER TABLE user_node_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view visits to their nodes"
  ON user_node_visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_nodes 
      WHERE user_nodes.id = node_id 
      AND user_nodes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can record their own visits"
  ON user_node_visits FOR INSERT
  WITH CHECK (auth.uid() = visitor_id);
```

### **Supporting Table: `node_interactions`**

```sql
-- Track specific interactions with nodes (likes, shares, etc.)
CREATE TABLE node_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  node_id UUID NOT NULL REFERENCES user_nodes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  
  -- Interaction type
  interaction_type TEXT NOT NULL,
  -- Types: like, share, report, bookmark, comment
  
  -- Interaction data
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_user_node_interaction UNIQUE(user_id, node_id, interaction_type)
);

-- Indexes
CREATE INDEX idx_node_interactions_node ON node_interactions(node_id);
CREATE INDEX idx_node_interactions_user ON node_interactions(user_id);
CREATE INDEX idx_node_interactions_type ON node_interactions(interaction_type);
```

---

## API Endpoints

### **1. Create User Node**

```typescript
// POST /api/nodes/create-user-node

interface CreateNodeRequest {
  name: string;
  description?: string;
  node_type: 'home_portal' | 'work_space' | 'creative_studio' | 'meditation_space' | 'game_room' | 'other';
  latitude: number;
  longitude: number;
  ar_anchor_data: {
    anchor_id: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    scale: number;
    surface_type: 'horizontal' | 'vertical';
    confidence: number; // 0-1
  };
  is_public: boolean;
}

interface CreateNodeResponse {
  success: boolean;
  node: {
    id: string;
    name: string;
    node_type: string;
    coordinates: { lat: number; lng: number };
    activation_date: string;
    rewards: {
      base_activation: number;
      bonuses: Array<{ name: string; amount: number }>;
      total: number;
    };
    badges_earned: string[];
    reputation_earned: number;
  };
  next_steps: string[];
}

// Implementation
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateNodeRequest = await request.json();

    // Validation
    if (!body.name || body.name.length < 3 || body.name.length > 50) {
      return NextResponse.json(
        { error: 'Node name must be 3-50 characters' },
        { status: 400 }
      );
    }

    // Check if user already has a node at this location
    const { data: existingNode } = await supabase
      .from('user_nodes')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('latitude', body.latitude)
      .eq('longitude', body.longitude)
      .eq('status', 'active')
      .maybeSingle();

    if (existingNode) {
      return NextResponse.json(
        { error: 'You already have a node at this location' },
        { status: 409 }
      );
    }

    // Reverse geocode for address
    const { city, country, address } = await reverseGeocode(
      body.latitude,
      body.longitude
    );

    // Calculate rewards
    const rewards = calculateNodeCreationRewards({
      user_id: session.user.id,
      city,
      country,
      name: body.name,
    });

    // Create node
    const { data: node, error } = await supabase
      .from('user_nodes')
      .insert({
        user_id: session.user.id,
        name: body.name,
        description: body.description,
        node_type: body.node_type,
        latitude: body.latitude,
        longitude: body.longitude,
        city,
        country,
        address,
        ar_anchor_id: body.ar_anchor_data.anchor_id,
        ar_anchor_data: body.ar_anchor_data,
        beacon_position: body.ar_anchor_data.position,
        beacon_rotation: body.ar_anchor_data.rotation,
        beacon_scale: body.ar_anchor_data.scale,
        is_public: body.is_public,
        tokens_earned_total: rewards.total,
      })
      .select()
      .single();

    if (error) throw error;

    // Grant rewards
    await grantRewards(session.user.id, rewards.total);

    // Grant badges
    const badges = await grantNodeHostBadge(session.user.id);

    // Update user reputation
    await updateReputation(session.user.id, 50, 'node_host');

    // Record quest completion
    await recordQuestCompletion({
      user_id: session.user.id,
      quest_id: 'home-node-activation',
      score: 100,
      amount: rewards.total,
      metadata: {
        node_id: node.id,
        node_name: body.name,
        location: `${city}, ${country}`,
        rewards_breakdown: rewards.breakdown,
      },
    });

    return NextResponse.json({
      success: true,
      node: {
        id: node.id,
        name: node.name,
        node_type: node.node_type,
        coordinates: { lat: node.latitude, lng: node.longitude },
        activation_date: node.created_at,
        rewards: {
          base_activation: rewards.breakdown.base,
          bonuses: rewards.breakdown.bonuses,
          total: rewards.total,
        },
        badges_earned: badges,
        reputation_earned: 50,
      },
      next_steps: [
        'Visit your portal daily to earn 10 $ZO',
        'Share your portal link to attract visitors',
        'Upgrade your portal with cosmetics',
      ],
    });
  } catch (error) {
    console.error('Error creating user node:', error);
    return NextResponse.json(
      { error: 'Failed to create node' },
      { status: 500 }
    );
  }
}
```

### **2. Validate Location**

```typescript
// POST /api/nodes/validate-location

interface ValidateLocationRequest {
  latitude: number;
  longitude: number;
}

interface ValidateLocationResponse {
  valid: boolean;
  reason?: string;
  nearby_nodes?: Array<{
    id: string;
    name: string;
    distance_meters: number;
  }>;
  location_info: {
    city: string;
    country: string;
    address: string;
  };
  bonuses: {
    is_new_city: boolean;
    is_new_country: boolean;
  };
}

// Implementation
export async function POST(request: NextRequest) {
  const body: ValidateLocationRequest = await request.json();

  // Check for nearby nodes (within 10m radius to prevent duplicates)
  const nearbyNodes = await findNearbyUserNodes(
    body.latitude,
    body.longitude,
    10 // meters
  );

  if (nearbyNodes.length > 0) {
    return NextResponse.json({
      valid: false,
      reason: 'Another node exists too close to this location',
      nearby_nodes: nearbyNodes,
    });
  }

  // Reverse geocode
  const locationInfo = await reverseGeocode(body.latitude, body.longitude);

  // Check if this is a new city/country for the network
  const bonuses = await checkLocationBonuses(
    body.latitude,
    body.longitude,
    locationInfo
  );

  return NextResponse.json({
    valid: true,
    location_info: locationInfo,
    bonuses,
  });
}
```

### **3. Get Nearby User Nodes**

```typescript
// GET /api/nodes/nearby-user-nodes?lat=12.9352&lng=77.6245&radius=5000

interface NearbyNodesResponse {
  nodes: Array<{
    id: string;
    name: string;
    node_type: string;
    owner: {
      id: string;
      nickname: string;
      pfp: string;
    };
    coordinates: { lat: number; lng: number };
    distance_meters: number;
    visit_count: number;
    is_verified: boolean;
    created_at: string;
  }>;
  total_count: number;
}

// Implementation with PostGIS spatial query
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');
  const radius = parseInt(searchParams.get('radius') || '5000'); // meters

  const { data: nodes, error } = await supabase.rpc('find_nearby_user_nodes', {
    p_latitude: lat,
    p_longitude: lng,
    p_radius_meters: radius,
    p_limit: 50,
  });

  if (error) throw error;

  return NextResponse.json({
    nodes,
    total_count: nodes.length,
  });
}
```

---

## 8th Wall AR Implementation

### **Setup & Configuration**

```typescript
// apps/web/src/lib/ar/8thwall.ts

import { XR8 } from '@8thwall/xr';

export async function initialize8thWall() {
  // Check if device is AR-capable
  if (!XR8.XrDevice.isDeviceSupported()) {
    throw new Error('Device does not support WebAR');
  }

  // Request camera permissions
  await XR8.XrDevice.requestCameraPermissions();

  // Initialize XR8
  XR8.XrDevice.configure({
    cameraConfig: {
      direction: XR8.XrDevice.CAM_FACING_WORLD, // Back camera
    },
  });

  // Add world tracking pipeline module
  XR8.addCameraPipelineModule({
    name: 'zo-world-tracking',
    onStart: () => {
      console.log('🌍 World tracking started');
    },
    onUpdate: ({ processCpuResult }) => {
      // Access SLAM data
      const { reality } = processCpuResult;
      if (reality) {
        // reality.rotation() - device orientation
        // reality.position() - device position
        // reality.intrinsics() - camera parameters
      }
    },
  });

  return XR8;
}
```

### **Surface Detection**

```typescript
// apps/web/src/lib/ar/surface-detection.ts

import { XR8 } from '@8thwall/xr';
import * as THREE from 'three';

export class SurfaceDetector {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private detectedSurfaces: Array<{
    type: 'horizontal' | 'vertical';
    position: THREE.Vector3;
    normal: THREE.Vector3;
    confidence: number;
  }> = [];

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  // Raycast to detect surfaces
  detectSurface(screenX: number, screenY: number): {
    hit: boolean;
    position?: THREE.Vector3;
    normal?: THREE.Vector3;
    type?: 'horizontal' | 'vertical';
  } {
    // Convert screen coordinates to normalized device coordinates
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1;

    // Create raycaster
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);

    // Perform raycast against detected surfaces
    const intersects = raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const normal = hit.face?.normal || new THREE.Vector3(0, 1, 0);

      // Determine surface type based on normal
      const angle = normal.angleTo(new THREE.Vector3(0, 1, 0));
      const type = angle < Math.PI / 4 ? 'horizontal' : 'vertical';

      return {
        hit: true,
        position: hit.point,
        normal,
        type,
      };
    }

    return { hit: false };
  }

  // Get scan progress (0-1)
  getScanProgress(): number {
    return Math.min(this.detectedSurfaces.length / 12, 1.0);
  }
}
```

### **Persistent Anchors**

```typescript
// apps/web/src/lib/ar/anchors.ts

export interface AnchorData {
  anchor_id: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: number;
  timestamp: number;
}

export async function createPersistentAnchor(
  position: THREE.Vector3,
  rotation: THREE.Quaternion,
  scale: number
): Promise<AnchorData> {
  const anchorId = `zo-anchor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const anchorData: AnchorData = {
    anchor_id: anchorId,
    position: {
      x: position.x,
      y: position.y,
      z: position.z,
    },
    rotation: {
      x: rotation.x,
      y: rotation.y,
      z: rotation.z,
      w: rotation.w,
    },
    scale,
    timestamp: Date.now(),
  };

  // Store anchor in 8th Wall's persistent anchor system
  // (This uses browser's localStorage + 8th Wall's cloud anchors)
  localStorage.setItem(`anchor_${anchorId}`, JSON.stringify(anchorData));

  return anchorData;
}

export async function loadPersistentAnchor(
  anchorId: string
): Promise<AnchorData | null> {
  const stored = localStorage.getItem(`anchor_${anchorId}`);
  if (!stored) return null;

  return JSON.parse(stored) as AnchorData;
}
```

---

## 3D Asset Specifications

### **\z/ Beacon Model**

**Design Requirements**:
```
Symbol: \z/ (Zo logo)
Style: Minimalist, geometric, glowing
File Format: GLTF 2.0 (.glb)
Polycount: 1,000-5,000 triangles (mobile-optimized)
Texture Size: 512x512 or 1024x1024 (power of 2)
Materials: PBR (Physically Based Rendering)
Animations: 
  - Idle loop (floating, rotating)
  - Activation sequence (expand, glow, pulse)
  - Interaction feedback (bounce, flash)
```

**Three.js Implementation**:

```typescript
// apps/web/src/components/ar/ZoBeacon3D.tsx

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

interface ZoBeaconProps {
  position: [number, number, number];
  scale: number;
  isActivating?: boolean;
}

export function ZoBeacon3D({ position, scale, isActivating }: ZoBeaconProps) {
  const meshRef = useRef<THREE.Group>(null);
  const { scene, materials } = useGLTF('/models/zo-beacon.glb');

  // Idle animation: gentle floating + rotation
  useFrame(({ clock }) => {
    if (!meshRef.current || isActivating) return;

    const t = clock.getElapsedTime();

    // Floating motion (sine wave)
    meshRef.current.position.y = position[1] + Math.sin(t * 0.8) * 0.05;

    // Slow rotation
    meshRef.current.rotation.y = t * 0.3;

    // Pulsing glow effect (modify material emissive)
    if (materials.BeaconMaterial) {
      const intensity = 0.5 + Math.sin(t * 1.5) * 0.3;
      materials.BeaconMaterial.emissiveIntensity = intensity;
    }
  });

  return (
    <group ref={meshRef} position={position} scale={scale}>
      <primitive object={scene.clone()} />
      
      {/* Particle system */}
      <points>
        <bufferGeometry>
          {/* Generate upward-floating particles */}
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#FFD700"
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>

      {/* Activation animation */}
      {isActivating && (
        <mesh>
          {/* Expanding ring effect */}
          <ringGeometry args={[0.5, 0.6, 32]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
}
```

**Material Specifications**:
```json
{
  "name": "BeaconMaterial",
  "pbrMetallicRoughness": {
    "baseColorFactor": [0.8, 0.7, 0.3, 1.0],
    "metallicFactor": 0.8,
    "roughnessFactor": 0.2
  },
  "emissiveFactor": [1.0, 0.843, 0.0],
  "emissiveStrength": 0.5
}
```

---

## Rewards System

### **Calculation Logic**

```typescript
// apps/web/src/lib/nodes/node-rewards.ts

export interface NodeRewards {
  total: number;
  breakdown: {
    base: number;
    bonuses: Array<{ name: string; amount: number; reason: string }>;
  };
}

export async function calculateNodeCreationRewards(params: {
  user_id: string;
  city: string;
  country: string;
  name: string;
}): Promise<NodeRewards> {
  const breakdown = {
    base: 200,
    bonuses: [] as Array<{ name: string; amount: number; reason: string }>,
  };

  // Bonus 1: New city (first node in this city)
  const isNewCity = await checkIfNewCity(params.city);
  if (isNewCity) {
    breakdown.bonuses.push({
      name: 'New City Bonus',
      amount: 50,
      reason: `First node in ${params.city}`,
    });
  }

  // Bonus 2: Early adopter (first 1000 nodes)
  const totalNodes = await countTotalUserNodes();
  if (totalNodes < 1000) {
    breakdown.bonuses.push({
      name: 'Early Adopter',
      amount: 100,
      reason: `Node #${totalNodes + 1} of first 1000`,
    });
  }

  // Bonus 3: Creative naming (AI check)
  const isCreativeName = await checkCreativeNaming(params.name);
  if (isCreativeName) {
    breakdown.bonuses.push({
      name: 'Creative Name',
      amount: 25,
      reason: 'Unique and creative node name',
    });
  }

  // Bonus 4: Streak (if user has daily streak)
  const dailyStreak = await getUserDailyStreak(params.user_id);
  if (dailyStreak >= 7) {
    breakdown.bonuses.push({
      name: 'Streak Multiplier',
      amount: 50,
      reason: `${dailyStreak}-day streak active`,
    });
  }

  const total = breakdown.base + breakdown.bonuses.reduce((sum, b) => sum + b.amount, 0);

  return { total, breakdown };
}

// Daily check-in rewards
export async function calculateDailyVisitReward(nodeId: string): Promise<number> {
  // Base: 10 $ZO per daily visit
  // Max: 70 $ZO per week from one node
  return 10;
}

// Visitor rewards (passive income)
export async function calculateVisitorReward(
  nodeId: string,
  visitorId: string
): Promise<number> {
  // Node owner earns 5 $ZO per unique visitor
  return 5;
}
```

### **Reward Caps & Limits**

```typescript
export const REWARD_LIMITS = {
  // Creation rewards
  max_activation_reward: 375,
  max_nodes_per_user: 3, // Can create up to 3 nodes
  
  // Daily rewards
  max_daily_visit_per_node: 10,
  max_daily_total: 100, // Across all nodes
  
  // Visitor rewards
  max_visitor_reward_per_day: 50, // From visitors
  max_visitors_counted_per_day: 10, // Only first 10 unique visitors count
  
  // Time limits
  visit_cooldown_hours: 24, // Must wait 24h between own visits
  visitor_cooldown_hours: 24, // Each visitor counted once per 24h
};
```

---

## Edge Cases & Validation

### **Location Validation**

```typescript
// Must validate before creating node

export async function validateNodeLocation(
  lat: number,
  lng: number,
  userId: string
): Promise<{ valid: boolean; error?: string }> {
  // Check 1: Valid GPS coordinates
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return { valid: false, error: 'Invalid GPS coordinates' };
  }

  // Check 2: Not in ocean (using reverse geocoding)
  const location = await reverseGeocode(lat, lng);
  if (!location.city || !location.country) {
    return { valid: false, error: 'Location must be on land (city required)' };
  }

  // Check 3: Not too close to existing nodes (10m minimum)
  const nearby = await findNearbyUserNodes(lat, lng, 10);
  if (nearby.length > 0) {
    return { valid: false, error: 'Another node exists within 10 meters' };
  }

  // Check 4: User doesn't already have node at this location
  const userNodes = await getUserNodes(userId);
  const duplicate = userNodes.find(
    (node) =>
      Math.abs(node.latitude - lat) < 0.0001 &&
      Math.abs(node.longitude - lng) < 0.0001
  );
  if (duplicate) {
    return { valid: false, error: 'You already have a node at this location' };
  }

  // Check 5: User hasn't exceeded node creation limit
  if (userNodes.length >= REWARD_LIMITS.max_nodes_per_user) {
    return {
      valid: false,
      error: `Maximum ${REWARD_LIMITS.max_nodes_per_user} nodes per user`,
    };
  }

  return { valid: true };
}
```

### **AR Anchor Validation**

```typescript
export function validateARAnch or(anchorData: any): boolean {
  // Check anchor has required fields
  if (!anchorData.position || !anchorData.rotation || !anchorData.scale) {
    return false;
  }

  // Check position is reasonable (within 10m radius of camera)
  const distance = Math.sqrt(
    anchorData.position.x ** 2 +
    anchorData.position.y ** 2 +
    anchorData.position.z ** 2
  );
  if (distance > 10) {
    return false; // Too far from camera origin
  }

  // Check height is reasonable (0.5m to 3m above ground)
  if (anchorData.position.y < 0.5 || anchorData.position.y > 3) {
    return false;
  }

  // Check scale is within bounds
  if (anchorData.scale < 0.5 || anchorData.scale > 2.0) {
    return false;
  }

  return true;
}
```

### **Anti-Spam Measures**

```typescript
// Prevent abuse

export const ANTI_SPAM_RULES = {
  // Rate limiting
  max_node_creations_per_day: 1,
  max_node_creations_per_week: 3,
  
  // Minimum time between actions
  min_seconds_between_scans: 60,
  min_seconds_between_placements: 30,
  
  // Verification
  require_email_verification: true,
  require_minimum_account_age_hours: 24,
};
```

---

## Testing Plan

### **Manual Testing Checklist**

**Environment Setup**:
- [ ] Test on iPhone 12+ (iOS 15+)
- [ ] Test on Android (Chrome 90+)
- [ ] Test on various lighting conditions
- [ ] Test indoors vs outdoors
- [ ] Test in different room sizes

**Permission Flow**:
- [ ] Camera permission: granted
- [ ] Camera permission: denied
- [ ] Camera permission: previously denied (re-request)
- [ ] Location permission: granted
- [ ] Location permission: denied
- [ ] Motion sensors: available
- [ ] Motion sensors: unavailable

**AR Scanning**:
- [ ] Surface detection works on floor
- [ ] Surface detection works on walls
- [ ] Surface detection works on tables
- [ ] Scan progress updates correctly
- [ ] Minimum coverage requirement enforced
- [ ] Low light warning appears
- [ ] Motion blur detection works

**Beacon Placement**:
- [ ] Beacon appears at tap point
- [ ] Beacon snaps to detected surface
- [ ] Height adjustment works
- [ ] Rotation adjustment works
- [ ] Scale adjustment works
- [ ] Invalid placement shows red outline
- [ ] Valid placement shows green outline
- [ ] Beacon animation plays smoothly

**Node Creation**:
- [ ] Name validation works (3-50 chars)
- [ ] Node type selection works
- [ ] Location auto-filled correctly
- [ ] Privacy toggle works
- [ ] Duplicate location detection works
- [ ] API call succeeds
- [ ] Rewards calculated correctly
- [ ] Success screen displays properly

**Database**:
- [ ] Node created with correct data
- [ ] Quest completion recorded
- [ ] Rewards granted to user
- [ ] Badges granted
- [ ] Reputation updated
- [ ] Node appears on map

**Edge Cases**:
- [ ] GPS unavailable
- [ ] GPS inaccurate (low accuracy)
- [ ] Network offline during creation
- [ ] User exits mid-scan
- [ ] User closes browser during activation
- [ ] AR session crashes
- [ ] Multiple rapid submissions (double-click protection)

### **Automated Tests**

```typescript
// apps/web/__tests__/home-node-activation.test.ts

describe('Home Node Activation Quest', () => {
  describe('Location Validation', () => {
    it('should reject invalid GPS coordinates', async () => {
      const result = await validateNodeLocation(999, 999, 'user123');
      expect(result.valid).toBe(false);
    });

    it('should reject nodes in ocean', async () => {
      const result = await validateNodeLocation(0, 0, 'user123'); // Atlantic Ocean
      expect(result.valid).toBe(false);
      expect(result.error).toContain('on land');
    });

    it('should reject duplicate nodes', async () => {
      // Create first node
      await createUserNode({ lat: 12.9352, lng: 77.6245, userId: 'user123' });
      
      // Try to create second node at same location
      const result = await validateNodeLocation(12.9352, 77.6245, 'user123');
      expect(result.valid).toBe(false);
    });
  });

  describe('Rewards Calculation', () => {
    it('should calculate base rewards correctly', async () => {
      const rewards = await calculateNodeCreationRewards({
        user_id: 'user123',
        city: 'TestCity',
        country: 'TestCountry',
        name: 'Test Node',
      });
      
      expect(rewards.breakdown.base).toBe(200);
      expect(rewards.total).toBeGreaterThanOrEqual(200);
    });

    it('should apply new city bonus', async () => {
      // Ensure city is new
      await clearTestData();
      
      const rewards = await calculateNodeCreationRewards({
        user_id: 'user123',
        city: 'NewCity',
        country: 'India',
        name: 'Test Node',
      });
      
      const cityBonus = rewards.breakdown.bonuses.find(b => b.name === 'New City Bonus');
      expect(cityBonus).toBeDefined();
      expect(cityBonus?.amount).toBe(50);
    });
  });

  describe('AR Anchor Validation', () => {
    it('should accept valid anchor data', () => {
      const anchor = {
        position: { x: 0, y: 1.5, z: -2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: 1.0,
      };
      
      expect(validateARAnchor(anchor)).toBe(true);
    });

    it('should reject anchor too far from camera', () => {
      const anchor = {
        position: { x: 15, y: 1.5, z: -2 }, // 15m away
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: 1.0,
      };
      
      expect(validateARAnchor(anchor)).toBe(false);
    });
  });
});
```

---

## Future Enhancements

### **Phase 2: Advanced Features**

1. **Portal Customization**
   ```typescript
   const customizationOptions = {
     colors: ['gold', 'purple', 'blue', 'green', 'rainbow'],
     effects: ['sparkles', 'flames', 'lightning', 'cosmic', 'nature'],
     sizes: [0.5, 1.0, 1.5, 2.0],
     animations: ['idle', 'energetic', 'calm', 'dynamic'],
   };
   ```

2. **Multi-Room Nodes**
   - Users can create multiple beacons in different rooms
   - Each room = sub-node with its own mini-rewards
   - "Apartment Network" achievement

3. **Social Features**
   - Other users can visit your node remotely (AR view)
   - Leave messages/comments at nodes
   - Node guestbook
   - Node ratings/reviews

4. **Portal Linking**
   - Connect your node to friend's node
   - Create "reality bridges"
   - Teleportation quest between linked nodes

5. **Node Upgrades**
   ```typescript
   const upgrades = {
     tier1: { cost: 100, benefits: ['custom_color', 'visitor_cap_20'] },
     tier2: { cost: 500, benefits: ['custom_effects', 'visitor_cap_50'] },
     tier3: { cost: 1000, benefits: ['mini_game', 'visitor_cap_100'] },
     tier4: { cost: 5000, benefits: ['portal_link', 'visitor_cap_unlimited'] },
   };
   ```

6. **Node Events**
   - Host events at your node
   - Limited-time power-ups
   - Node takeover challenges

7. **AR Mini-Games at Nodes**
   - Hide virtual items in your space
   - Others visit and find them (AR treasure hunt)
   - Earn tokens for participation

### **Phase 3: Advanced AR**

1. **Persistent Cloud Anchors**
   - 8th Wall Cloud Anchors for multi-session persistence
   - Beacons stay in exact same spot across sessions
   - Works across different devices

2. **Object Occlusion**
   - Beacon goes behind furniture realistically
   - Advanced depth sensing (iPhone LiDAR)

3. **Lighting Estimation**
   - Beacon matches room lighting
   - Shadows cast on real surfaces
   - PBR materials react to environment

4. **Spatial Audio**
   - Beacon emits sound
   - 3D audio positioning
   - Sounds change based on user position

---

## Appendix

### **A. 8th Wall Resources**

- [8th Wall Documentation](https://www.8thwall.com/docs/)
- [World Tracking Guide](https://www.8thwall.com/docs/guides/world-tracking/)
- [Cloud Anchors](https://www.8thwall.com/docs/guides/cloud-anchors/)
- [Three.js Integration](https://www.8thwall.com/docs/guides/threejs/)

### **B. External Dependencies**

```json
{
  "@8thwall/xr": "^latest",
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.90.0",
  "mapbox-gl": "^3.0.0" // For reverse geocoding
}
```

### **C. Performance Targets**

```
AR Session:
- Frame rate: 30+ FPS (mobile)
- Scan time: <60 seconds
- Surface detection: <3 seconds per surface
- Beacon render time: <16ms per frame

API Calls:
- Node creation: <2 seconds
- Location validation: <500ms
- Nearby nodes query: <1 second

Database:
- Write latency: <200ms
- Read latency: <100ms
- Spatial queries: <500ms
```

### **D. Glossary**

- **SLAM**: Simultaneous Localization and Mapping
- **6DOF**: Six Degrees of Freedom (position + rotation)
- **Anchor**: Fixed point in 3D space tracked by AR
- **Surface Detection**: Finding floors/walls for object placement
- **Persistent Anchor**: Anchor that survives across sessions
- **WebAR**: Augmented Reality in web browsers (no app)
- **Node**: Physical location on Zo World network

---

## Status & Next Steps

**Current Status**: 📋 Documentation Complete

**Next Steps**:
1. Review & approval from team
2. 8th Wall account setup
3. Begin Phase 1 implementation
4. Create 3D \z/ beacon asset
5. Build AR scanning component
6. Database migration

**Estimated Timeline**: 2-3 weeks to MVP

**Team Assignment**:
- AR Developer: 8th Wall integration
- 3D Artist: Beacon model
- Backend: API + database
- Frontend: UI components
- QA: Device testing

---

**Questions? Feedback?**  
Create an issue or reach out to the team. Let's build this! 🚀

---

*Document Version: 1.0*  
*Last Updated: 2025-11-17*  
*Author: AI + Zo World Team*  
*Status: Ready for Implementation*


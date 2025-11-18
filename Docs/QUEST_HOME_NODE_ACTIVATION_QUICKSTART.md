# Home Node Activation Quest - Quick Start Guide

**Status**: 🚧 Ready for Development  
**Priority**: P1 - Core Feature  
**Estimated Time**: 2-3 weeks to MVP

---

## 📋 What This Is

A quest where users scan their physical space with their phone camera, place a 3D `\z/` beacon in their room, and activate their home as a node on the Zo World network.

**User Flow**:
```
User → Opens quest → Scans room → Places beacon → Names node → ✨ Activated! → Earns 200-375 $ZO
```

---

## 🚀 Getting Started (Day 1)

### Step 1: Set Up 8th Wall Account

1. Go to https://www.8thwall.com/
2. Click "Sign Up" (Free, no credit card)
3. Create new project: "Zo World Node Activation"
4. Copy your App Key

### Step 2: Add Environment Variables

```bash
# Add to apps/web/.env.local

# 8th Wall
NEXT_PUBLIC_8TH_WALL_APP_KEY=your_app_key_here
NEXT_PUBLIC_8TH_WALL_API_KEY=your_api_key_here

# Already have these (Mapbox for reverse geocoding)
NEXT_PUBLIC_MAPBOX_TOKEN=existing_token
```

### Step 3: Install Dependencies

```bash
cd apps/web

pnpm add @8thwall/xr three @react-three/fiber @react-three/drei
```

### Step 4: Test AR on Your Device

```bash
# Start dev server
pnpm dev

# Expose to your phone (8th Wall requires HTTPS)
# Option A: Use ngrok
ngrok http 3000

# Option B: Use localtunnel
npx localtunnel --port 3000

# Open the URL on your phone and test camera access
```

---

## 🏗️ Implementation Roadmap

### Week 1: AR Foundation

**Goal**: Get AR working on device

```typescript
// Create these files:
apps/web/src/lib/ar/
├── 8thwall.ts           // Initialize 8th Wall
├── surface-detection.ts // Detect floors/walls
└── anchors.ts          // Save beacon position

apps/web/src/hooks/
└── useARSession.ts      // React hook for AR

apps/web/src/components/ar/
├── ARSession.tsx        // AR camera view
└── SurfaceDetector.tsx  // Visual feedback
```

**Checklist**:
- [ ] Camera opens on device
- [ ] Surface detection works (tap to place object)
- [ ] Can place a simple cube in AR
- [ ] Cube stays in place when moving phone

**Testing**: Test on your phone daily!

---

### Week 2: Quest Flow

**Goal**: Build the full quest experience

```typescript
// Create these files:
apps/web/src/components/quests/home-node-activation/
├── PermissionRequest.tsx  // Ask for camera + GPS
├── ARScanner.tsx          // "Scan your room" screen
├── BeaconPlacement.tsx    // Place the \z/ beacon
├── NodeConfiguration.tsx  // Name your node
├── ActivationAnimation.tsx// Cool activation effect
└── RewardsScreen.tsx      // Show rewards

// API endpoint:
apps/web/src/app/api/nodes/
└── create-user-node/route.ts
```

**Checklist**:
- [ ] Permission flow works
- [ ] AR scanning works
- [ ] Beacon placement works
- [ ] Can name the node
- [ ] API creates node in database
- [ ] Rewards granted

---

### Week 3: Polish & Testing

**Goal**: Make it production-ready

**Tasks**:
- Create 3D beacon model (or use placeholder)
- Add activation animation
- Test on multiple devices (iOS + Android)
- Performance optimization
- Error handling
- Documentation

**Checklist**:
- [ ] Tested on iPhone 12+ (iOS 15+)
- [ ] Tested on Android (Chrome 90+)
- [ ] Works in different lighting
- [ ] Works in small/large rooms
- [ ] Handles permission denials
- [ ] Handles network failures
- [ ] 30+ FPS on device
- [ ] Bundle size acceptable

---

## 📦 Database Setup

### Run Migration

```bash
# Create migration file
packages/api/migrations/010_user_nodes_ar_activation.sql
```

```sql
-- Copy from Docs/QUEST_HOME_NODE_ACTIVATION.md#database-schema
-- Then run:

psql $DATABASE_URL -f packages/api/migrations/010_user_nodes_ar_activation.sql
```

**Tables Created**:
- `user_nodes` - Stores user-created nodes
- `user_node_visits` - Tracks visits
- `node_interactions` - Likes, shares, etc.

---

## 🎮 Testing the Quest

### Local Testing (No Real AR)

```tsx
// Create a test page: apps/web/src/app/test-quest/page.tsx

import HomeNodeActivationQuest from '@/components/quests/HomeNodeActivationQuest';

export default function TestQuestPage() {
  return (
    <HomeNodeActivationQuest
      userId="test-user-123"
      onComplete={(rewards) => {
        console.log('✅ Quest completed!', rewards);
        alert(`Earned ${rewards.tokens} $ZO!`);
      }}
      onCancel={() => {
        console.log('❌ Quest cancelled');
      }}
    />
  );
}
```

Visit: `http://localhost:3000/test-quest`

### Device Testing (Real AR)

1. Start dev server: `pnpm dev`
2. Expose with ngrok: `ngrok http 3000`
3. Open ngrok URL on your phone
4. Test the full flow

**Test Checklist**:
- [ ] Camera permissions work
- [ ] Location permissions work
- [ ] AR session starts
- [ ] Can see room through camera
- [ ] Can place beacon
- [ ] Beacon stays in place
- [ ] Can complete quest
- [ ] Node shows on map

---

## 🔗 Wiring to Main App

**After testing is complete**, integrate the quest:

### 1. Add to Quests List

```typescript
// apps/web/src/lib/supabase.ts

// Insert into quests table:
{
  id: 'home-node-activation-uuid',
  slug: 'home-node-activation',
  title: '🏠 Host a Zo House',
  description: 'Scan your space and activate your home as a node on the Zo World network',
  reward: 200,
  rewards_breakdown: {
    base: 200,
    bonuses: {
      new_city: 50,
      early_adopter: 100,
      creative_name: 25
    }
  },
  cooldown_hours: 0, // One-time quest
  status: 'active',
  type: 'ar_creation'
}
```

### 2. Add Launch Button in QuestsOverlay

```typescript
// apps/web/src/components/QuestsOverlay.tsx

const handleJoinQuest = async (quest: QuestEntry) => {
  if (quest.slug === 'home-node-activation') {
    // Launch AR quest
    setShowHomeNodeQuest(true);
    return;
  }
  // ... existing code
};
```

### 3. Render Quest Component

```tsx
// In QuestsOverlay or parent component

{showHomeNodeQuest && (
  <HomeNodeActivationQuest
    userId={userId}
    onComplete={(rewards) => {
      // Handle completion
      setShowHomeNodeQuest(false);
      // Refresh user data
      // Show success message
    }}
    onCancel={() => {
      setShowHomeNodeQuest(false);
    }}
  />
)}
```

### 4. Show User Nodes on Map

```typescript
// apps/web/src/components/MapCanvas.tsx

// Fetch user nodes
const { data: userNodes } = await supabase
  .from('user_nodes')
  .select('*')
  .eq('is_public', true)
  .eq('status', 'active');

// Add markers for each node
userNodes.forEach(node => {
  const marker = new mapboxgl.Marker({
    color: '#FFD700', // Gold for user nodes
    scale: 0.8
  })
    .setLngLat([node.longitude, node.latitude])
    .setPopup(
      new mapboxgl.Popup().setHTML(`
        <h3>${node.name}</h3>
        <p>Node Host: ${node.user.nickname}</p>
        <p>Type: ${node.node_type}</p>
      `)
    )
    .addTo(map);
});
```

---

## 🎨 3D Beacon Asset

### Option 1: Use Simple Geometry (Quick Start)

```typescript
// apps/web/src/components/ar/ZoBeaconSimple.tsx

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export function ZoBeaconSimple({ position, scale }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    // Rotate
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    
    // Float
    meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime()) * 0.1;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      {/* Simple \z/ shape using text geometry */}
      <textGeometry args={['\\z/', { font, size: 0.5, height: 0.1 }]} />
      <meshStandardMaterial
        color="#FFD700"
        emissive="#FFD700"
        emissiveIntensity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}
```

### Option 2: Create Custom Model (Later)

1. Design in Blender (free 3D software)
2. Export as `.glb` file
3. Place in `public/models/zo-beacon.glb`
4. Load with `useGLTF` from `@react-three/drei`

---

## 🐛 Common Issues & Fixes

### "8th Wall not loading"
```bash
# Check API key is correct
echo $NEXT_PUBLIC_8TH_WALL_APP_KEY

# Must be HTTPS (8th Wall requirement)
# Use ngrok or localtunnel for local testing
```

### "Camera permission denied"
```typescript
// Handle gracefully in code
if (!cameraPermission) {
  return (
    <div>
      <h3>Camera Access Required</h3>
      <p>Please enable camera in your browser settings</p>
      <button onClick={requestPermissionsAgain}>Try Again</button>
    </div>
  );
}
```

### "Surface detection not working"
- Move phone slower
- Improve room lighting
- Point at textured surfaces (not blank walls)
- Increase minimum surface threshold

### "Beacon not staying in place"
- Check AR anchor is being saved
- Verify `createPersistentAnchor()` is called
- Test SLAM tracking quality

---

## 📚 Resources

### Documentation
- [Full Quest Spec](./QUEST_HOME_NODE_ACTIVATION.md)
- [8th Wall Docs](https://www.8thwall.com/docs/)
- [Three.js Docs](https://threejs.org/docs/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/)

### Example Projects
- [8th Wall Templates](https://www.8thwall.com/templates)
- [AR Object Placement](https://www.8thwall.com/examples/ar-object-placement)
- [World Tracking Demo](https://www.8thwall.com/examples/world-tracking)

### Tools
- [Blender](https://www.blender.org/) - Free 3D modeling
- [glTF Viewer](https://gltf-viewer.donmccurdy.com/) - Preview 3D models
- [ngrok](https://ngrok.com/) - Local HTTPS tunneling

---

## 🎯 Success Criteria

Quest is ready to launch when:

✅ Works on iOS 15+ (Safari)  
✅ Works on Android (Chrome 90+)  
✅ Camera/GPS permissions handled  
✅ AR scanning completes in <60s  
✅ Beacon placement accurate  
✅ Node creation succeeds  
✅ Rewards granted correctly  
✅ Performance 30+ FPS  
✅ No crashes or major bugs  
✅ Tested by 10+ users  

---

## 🚢 Launch Plan

1. **Beta Testing** (Week 3)
   - Deploy to staging
   - Test with internal team
   - Fix critical bugs

2. **Limited Release** (Week 4)
   - Launch to first 100 users
   - Monitor analytics
   - Gather feedback

3. **Full Launch** (Week 5)
   - Announce on socials
   - Add to main quest list
   - Monitor engagement

---

## 📊 Metrics to Track

After launch:
- Quest completion rate
- Average scan time
- Node creation success rate
- Daily active nodes
- Most popular node types
- Geographic distribution
- User retention (return visits)

---

## 🤝 Need Help?

- **AR Issues**: Check [8th Wall Forum](https://forum.8thwall.com/)
- **Three.js**: Check [Three.js Discourse](https://discourse.threejs.org/)
- **Quest Design**: Review [main spec doc](./QUEST_HOME_NODE_ACTIVATION.md)
- **Database**: Check [Supabase docs](https://supabase.com/docs)

---

**Ready to build?** Start with Week 1 and test early, test often! 🚀

---

*Last Updated: 2025-11-17*  
*Status: 🚧 Ready for Development*  
*Next: Set up 8th Wall account and test AR on device*


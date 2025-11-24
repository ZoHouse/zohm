# Quests Directory

This directory contains standalone quest components for Zo World.

## Structure

```
quests/
├── README.md                        # This file
├── HomeNodeActivationQuest.tsx      # AR node creation quest (in development)
└── [future quests]
```

---

## Home Node Activation Quest

**Status**: 🚧 In Development  
**Priority**: P1 - Core Feature  
**Doc**: [Docs/QUEST_HOME_NODE_ACTIVATION.md](../../../../Docs/QUEST_HOME_NODE_ACTIVATION.md)

### Overview

This quest allows users to scan their physical space using WebAR and place a 3D `\z/` beacon to activate their home as a node on the Zo World network.

### Development Status

- ✅ Quest specification complete
- ✅ Database schema designed
- ✅ API endpoints planned
- ⏳ 8th Wall integration pending
- ⏳ 3D beacon model pending
- ⏳ AR scanning component pending
- ⏳ Testing on devices pending

### How to Work on This Quest

#### 1. Local Development

```bash
# This quest is NOT yet wired to the main app
# You can work on it independently without affecting production

# To test the placeholder:
# 1. Import the component where needed
# 2. Render with test props
# 3. Build out each phase incrementally
```

#### 2. Testing Locally

```tsx
// Example usage (for testing only)
import HomeNodeActivationQuest from '@/components/quests/HomeNodeActivationQuest';

function TestPage() {
  return (
    <HomeNodeActivationQuest
      userId="test-user-123"
      onComplete={(rewards) => {
        console.log('Quest completed!', rewards);
      }}
      onCancel={() => {
        console.log('Quest cancelled');
      }}
    />
  );
}
```

#### 3. Integration Checklist

Before wiring this quest to the main app, ensure:

**Technical**:
- [ ] 8th Wall API keys configured
- [ ] Dependencies installed (`@8thwall/xr`, `three`, etc.)
- [ ] 3D beacon model created and optimized
- [ ] AR components built and tested
- [ ] API endpoints implemented
- [ ] Database migrations run
- [ ] RLS policies configured

**Testing**:
- [ ] Works on iOS 15+ (Safari)
- [ ] Works on Android (Chrome 90+)
- [ ] Permission flows tested (granted/denied)
- [ ] AR scanning works in various lighting
- [ ] Beacon placement accurate
- [ ] Node creation succeeds
- [ ] Rewards granted correctly
- [ ] Offline queue works
- [ ] Performance acceptable (30+ FPS)

**Documentation**:
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Component props documented
- [ ] Error handling documented
- [ ] Testing guide written

### Integration Points

Once ready, this quest will be wired into:

1. **QuestsOverlay** (`/components/QuestsOverlay.tsx`)
   ```tsx
   {
     id: 'home-node-activation',
     slug: 'home-node-activation',
     title: '🏠 Host a Zo House',
     description: 'Scan your space and activate your home as a node',
     reward: '200-375 $ZO',
     type: 'ar_creation',
     cooldown_hours: 0, // One-time quest
   }
   ```

2. **Mobile Dashboard** (optional quick access)
   ```tsx
   <QuickActionButton
     icon="🏠"
     label="Host Your Space"
     onClick={launchHomeNodeQuest}
   />
   ```

3. **Map Interface** (show user nodes)
   ```tsx
   <UserNodeMarker
     position={[node.lng, node.lat]}
     owner={node.user}
     onClick={viewNodeDetails}
   />
   ```

---

## Development Workflow

### Phase 1: Foundation (Week 1)

**Goal**: Set up AR infrastructure

**Tasks**:
1. Create 8th Wall account (free tier)
2. Add dependencies to `package.json`
3. Create `/lib/ar/8thwall.ts` initialization
4. Test basic AR session on device
5. Create simple surface detection

**Files to Create**:
- `lib/ar/8thwall.ts`
- `lib/ar/surface-detection.ts`
- `hooks/useARSession.ts`
- `components/ar/ARSession.tsx`

### Phase 2: Core Quest (Week 2)

**Goal**: Build quest flow

**Tasks**:
1. Permission request screens
2. AR scanning UI
3. Beacon placement
4. Node configuration form
5. API endpoint for node creation

**Files to Create**:
- `components/quests/home-node-activation/PermissionRequest.tsx`
- `components/quests/home-node-activation/ARScanner.tsx`
- `components/quests/home-node-activation/BeaconPlacement.tsx`
- `components/quests/home-node-activation/NodeConfiguration.tsx`
- `app/api/nodes/create-user-node/route.ts`

### Phase 3: Polish (Week 3)

**Goal**: Rewards, animations, testing

**Tasks**:
1. Activation animation
2. Rewards screen
3. Map integration
4. Share functionality
5. Device testing
6. Performance optimization

**Files to Create**:
- `components/quests/home-node-activation/ActivationAnimation.tsx`
- `components/quests/home-node-activation/RewardsScreen.tsx`
- `lib/nodes/node-rewards.ts`

---

## Dependencies

```json
{
  "@8thwall/xr": "^latest",
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.90.0"
}
```

---

## Database Schema

See [Docs/QUEST_HOME_NODE_ACTIVATION.md](../../../../Docs/QUEST_HOME_NODE_ACTIVATION.md#database-schema) for:
- `user_nodes` table
- `user_node_visits` table
- `node_interactions` table
- PostGIS spatial indexes
- RLS policies

### Migration File Location

```
packages/api/migrations/010_user_nodes_ar_activation.sql
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/nodes/create-user-node` | POST | Create new user node |
| `/api/nodes/validate-location` | POST | Validate GPS coordinates |
| `/api/nodes/nearby-user-nodes` | GET | Find nearby user nodes |
| `/api/nodes/upload-anchor` | POST | Save AR anchor data |

See [API specification](../../../../Docs/QUEST_HOME_NODE_ACTIVATION.md#api-endpoints) for full details.

---

## Environment Variables

Add to `.env.local`:

```bash
# 8th Wall
NEXT_PUBLIC_8TH_WALL_APP_KEY=your_app_key_here
NEXT_PUBLIC_8TH_WALL_API_KEY=your_api_key_here

# Mapbox (for reverse geocoding)
NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here
```

---

## Testing

### Manual Testing

1. **iOS Testing**:
   ```bash
   # Use ngrok or similar to expose localhost
   ngrok http 3000
   
   # Open on iPhone 12+ with iOS 15+
   # Test in Safari (Chrome doesn't support WebXR on iOS)
   ```

2. **Android Testing**:
   ```bash
   # Use ngrok or similar
   ngrok http 3000
   
   # Open on Android device with Chrome 90+
   ```

### Automated Testing

```bash
# Run unit tests
pnpm test apps/web/src/components/quests/HomeNodeActivationQuest.test.tsx

# Run integration tests
pnpm test:integration
```

---

## Performance Targets

- AR frame rate: 30+ FPS
- Scan time: <60 seconds
- Node creation API: <2 seconds
- 3D beacon render: <16ms per frame
- Bundle size: <500KB (lazy loaded)

---

## Troubleshooting

### "8th Wall not loading"
- Check API keys in `.env.local`
- Ensure HTTPS (8th Wall requires secure context)
- Check browser console for errors

### "Camera permission denied"
- Clear browser settings
- Test in incognito/private mode
- Check iOS Settings → Safari → Camera

### "Surface detection not working"
- Improve lighting
- Move slower
- Point at textured surfaces (not blank walls)

### "Node creation fails"
- Check GPS accuracy
- Verify location is on land
- Check for duplicate nodes nearby
- Review database logs

---

## Contributing

When working on this quest:

1. **Create feature branch**: `feat/home-node-activation-[component]`
2. **Test thoroughly** on both iOS and Android
3. **Document changes** in this README
4. **Update specification** if requirements change
5. **Request review** before merging

---

## Contact

Questions about this quest? Reach out:
- Create issue with `[Quest: Home Node]` prefix
- Tag @ar-team or @backend-team as needed
- Check specification doc for detailed context

---

**Status**: 🚧 In Development  
**Last Updated**: 2025-11-17  
**Next Milestone**: Complete Phase 1 (AR Foundation)


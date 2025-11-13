# AR Functionality Documentation

## Overview

Your Zo Club app has an **Image-based Augmented Reality (AR)** feature built using **ViroReact** (a React Native AR/VR library). The AR experience allows users to point their iPhone camera at specific physical marker images and see 3D animated content overlaid in the real world.

---

## How It Works

### 1. **Technology Stack**

- **ViroReact** (`@reactvision/react-viro`): AR/VR library for React Native
- **ViroKit**: Native iOS AR framework (CocoaPods dependency)
- **ARKit**: Apple's native AR framework (underlying technology)

### 2. **AR Type: Image Recognition**

The app uses **image marker tracking**:
- Pre-defined images (called "anchors" or "markers") are registered with specific IDs
- When the camera detects one of these images, it triggers AR content
- 3D models and text are displayed anchored to the detected image position
- Content stays locked to the image as the user moves around

---

## Architecture

### File Structure

```
/Users/samuraizan/zo-club-dj-ar_work/
├── src/
│   ├── screens/
│   │   └── ARBoot.tsx                 ← Main AR screen component
│   └── components/helpers/
│       └── AppNavigation.tsx          ← Navigation (6th tab)
├── assets/
│   └── ar/
│       ├── zostel_jdp_01.jpg          ← Marker images (8 total)
│       ├── zostel_jdp_02.jpg
│       ├── zostel_jdp_03.jpg
│       ├── zostel_jdp_04.jpg
│       ├── zostel_jdp_05.jpg
│       ├── zostel_jdp_06.jpg
│       ├── zostel_jdp_07.jpg
│       ├── zostel_jdp_08.jpg
│       ├── samurai_hiphop_dance/      ← 3D model (active)
│       │   ├── samurai_hiphop_dance.vrx
│       │   └── [texture files].png
│       ├── blackpanther/              ← Alternative 3D models
│       ├── zo-diamond/
│       └── samurai_ape_laying.vrx
```

---

## Component Breakdown: ARBoot.tsx

### Main Components

#### 1. **ARBootScreen** (Root Component)
```typescript
const ARBootScreen: React.FC<ARBootScreenProps> = ({ navigation })
```

**Purpose**: 
- Checks if AR is supported on the device
- Renders the ViroARSceneNavigator if supported
- Shows error message if AR is not available

**Key Feature**:
- Uses `isARSupportedOnDevice()` to verify ARKit compatibility
- Only iPhone 6S and newer support ARKit

---

#### 2. **ARScene** (Main AR Scene)
```typescript
const ARScene = () => { ... }
```

**Purpose**: The actual AR experience component

**State Management**:
```typescript
{
  currentAnchor: string | null,      // Which marker is currently detected
  animationName: string,             // Animation to play ("mixamo.com")
  modelAnim: boolean,                // Whether animation is playing
  loopState: boolean,                // Whether to loop animation
  pauseUpdates: boolean,             // Pause anchor position updates
  anchorPosition: Viro3DPoint | null, // 3D position of detected marker
  anchorRotation: Viro3DPoint | null  // 3D rotation of detected marker
}
```

**Key Features**:
- Manages AR tracking lifecycle
- Handles anchor detection/loss
- Controls 3D model animations

---

#### 3. **Image Markers (Anchors)**

**Registered Markers** (8 total, currently 4 active):
```typescript
const anchorNames = [
  "zostel2",  // Active
  "zostel4",  // Active
  "zostel6",  // Active
  "zostel8"   // Active
];
```

**Marker Configuration**:
```typescript
ViroARTrackingTargets.createTargets({
  zostel1: {
    source: require('../../assets/ar/zostel_jdp_01.jpg'),
    orientation: "Up",
    physicalWidth: 5  // Real-world width in meters
  },
  // ... 7 more markers
});
```

**Important Properties**:
- `source`: Path to marker image
- `orientation`: Image orientation ("Up" means upright)
- `physicalWidth`: Real-world size for accurate tracking (5 meters)

---

#### 4. **3D Content**

When a marker is detected, the app displays:

**A. 3D Animated Character**:
```typescript
<Viro3DObject
  source={require('../../assets/ar/samurai_hiphop_dance/samurai_hiphop_dance.vrx')}
  position={[0, -0.5, 0]}      // 0.5m below marker
  scale={[0.1, 0.1, 0.1]}      // 10% original size
  animation={{
    name: "mixamo.com",          // Animation name from model
    run: true,                   // Start playing
    loop: true                   // Loop forever
  }}
  type="VRX"                     // ViroReact model format
/>
```

**B. 3D Text**:
```typescript
<ViroText 
  text="Zo Zo Zo!" 
  color="#ff0000"
  position={[0, 0.5, 0]}        // 0.5m above character
  extrusionDepth={5}            // 3D depth
/>
```

**C. Billboard Behavior**:
```typescript
<ViroNode transformBehaviors={["billboardY"]}>
```
- `billboardY`: Makes content always face the camera (rotate on Y-axis only)

---

## Event Lifecycle

### 1. **Anchor Found** (`onAnchorFound`)
```typescript
function onAnchorFound(anchor: ViroAnchor, name: string) {
  // Triggered when marker is first detected
  setState({
    currentAnchor: name,        // Store which marker
    modelAnim: true,            // Start animation
    pauseUpdates: true,         // Lock position
    anchorPosition: anchor.position,
    anchorRotation: anchor.rotation
  });
  
  Alert.alert("Anchor Found", `Anchor Found: ${name}`);
}
```

**When it happens**:
- User points camera at a registered marker image
- ARKit recognizes the image
- 3D content appears on the marker

---

### 2. **Anchor Updated** (`onAnchorUpdated`)
```typescript
function onAnchorUpdated(anchor: ViroAnchor) {
  // Triggered as marker moves/tracking improves
  setState({
    anchorPosition: anchor.position,
    anchorRotation: anchor.rotation
  });
}
```

**When it happens**:
- User moves around the marker
- Lighting changes improve tracking
- Camera gets better view of marker

---

### 3. **Anchor Removed** (`onAnchorRemoved`)
```typescript
function onAnchorRemoved(anchor: ViroAnchor) {
  // Triggered when marker is lost
  setState({
    anchorPosition: null,
    anchorRotation: null
  });
}
```

**When it happens**:
- Marker goes out of view
- Tracking quality becomes too poor
- User moves too far away

---

## How to Use (End User Instructions)

### Prerequisites:
1. iPhone 6S or newer (ARKit support)
2. iOS 11.0 or higher
3. Printed marker images (or display on another screen)

### Steps:

1. **Open the app**
2. **Tap the 6th tab** at the bottom (AR icon)
3. **Grant camera permissions** if prompted
4. **Point camera at a marker image**:
   - Use `zostel_jdp_02.jpg`, `zostel_jdp_04.jpg`, `zostel_jdp_06.jpg`, or `zostel_jdp_08.jpg`
   - Marker should be clearly visible and well-lit
   - Hold steady for 1-2 seconds
5. **Watch AR content appear**:
   - Animated samurai character performing hip-hop dance
   - "Zo Zo Zo!" text above the character
   - Alert popup confirming marker detected

### Best Practices:
- ✅ Good lighting conditions
- ✅ Marker flat on surface or wall
- ✅ Hold phone steady initially
- ✅ Keep marker in view
- ❌ Avoid reflective surfaces
- ❌ Don't move too quickly
- ❌ Avoid very dim lighting

---

## Technical Specifications

### Marker Images

**Current Markers** (in `/assets/ar/`):

| Marker ID | File | Status | Size Config |
|-----------|------|--------|-------------|
| zostel1 | zostel_jdp_01.jpg | Inactive | 5m wide |
| zostel2 | zostel_jdp_02.jpg | **Active** | 5m wide |
| zostel3 | zostel_jdp_03.jpg | Inactive | 5m wide |
| zostel4 | zostel_jdp_04.jpg | **Active** | 5m wide |
| zostel5 | zostel_jdp_05.jpg | Inactive | 5m wide |
| zostel6 | zostel_jdp_06.jpg | **Active** | 5m wide |
| zostel7 | zostel_jdp_07.jpg | Inactive | 5m wide |
| zostel8 | zostel_jdp_08.jpg | **Active** | 5m wide |

**Note**: The `physicalWidth: 5` means the app expects these markers to be 5 meters wide in the real world. This is used for accurate scale and positioning.

### 3D Models

**Currently Used**:
- **File**: `samurai_hiphop_dance.vrx`
- **Format**: VRX (ViroReact optimized format)
- **Animation**: "mixamo.com" (hip-hop dance from Mixamo.com)
- **Scale**: 10% of original size
- **Position**: 0.5m below marker center

**Available Alternatives** (not currently in use):
- `blackpanther/object_bpanther_anim.vrx` - Animated Black Panther character
- `zo-diamond/zo-diamond.vrx` - Zo diamond model
- `samurai_ape_laying.vrx` - Samurai ape in laying pose

---

## Known Issues & Limitations

### Current Implementation Issues:

1. **Lighting Sensitivity**
   ```typescript
   // From code comments:
   // "Anchor detection is not working with different time of day 
   // and lighting conditions."
   ```
   - **Issue**: ARKit image tracking requires consistent lighting
   - **Impact**: May not detect markers in different lighting than training images
   - **Workaround**: Use markers in similar lighting conditions

2. **Multiple Angle Detection**
   ```typescript
   // "Anchor is defined by 5 images at different angles 
   // between 20 to 160 degrees."
   ```
   - **Missing**: Currently only one image per marker
   - **Impact**: Only works from specific viewing angles
   - **Solution**: Add multiple angle versions of each marker

3. **GPS Location Not Implemented**
   ```typescript
   // "Anchor needs precise GPS location. As precise as possible."
   ```
   - **Missing**: No geolocation filtering
   - **Impact**: Can't restrict AR to specific real-world locations
   - **Future**: Add GPS check before showing AR content

4. **Backend Integration Not Complete**
   ```typescript
   // "The objects will need to be placed per anchor image 
   // and defined in backend."
   // "Anchor images will need to be streamed from backend 
   // based on location."
   ```
   - **Missing**: Hardcoded markers and models
   - **Impact**: Can't dynamically load content based on location
   - **Future**: Build backend API for dynamic AR content

---

## Configuration Guide

### Adding New Markers

1. **Add marker image** to `/assets/ar/`:
   ```bash
   /assets/ar/new_marker.jpg
   ```

2. **Register in ARBoot.tsx**:
   ```typescript
   ViroARTrackingTargets.createTargets({
     newMarker: {
       source: require('../../assets/ar/new_marker.jpg'),
       orientation: "Up",
       physicalWidth: 5  // Adjust to real size
     }
   });
   ```

3. **Add to active markers**:
   ```typescript
   const anchorNames = [
     "newMarker",  // Add here
     // ... existing markers
   ];
   ```

### Changing 3D Model

**To use a different model**:

1. Replace the source in `AnchorComponent`:
   ```typescript
   <Viro3DObject
     source={require('../../assets/ar/blackpanther/object_bpanther_anim.vrx')}
     // ... rest of props
   />
   ```

2. Adjust scale and position as needed:
   ```typescript
   position={[0, -1.0, 0]}  // Adjust Y for height
   scale={[0.2, 0.2, 0.2]}   // Adjust for size
   ```

### Adjusting Animation

**Available animations** are embedded in the VRX file. To change:

```typescript
animation={{
  name: "idle",              // Change animation name
  run: state.modelAnim,
  loop: state.loopState,
  onFinish: onFinish
}}
```

---

## Future Improvements

### Phase 1: Enhanced Detection
- [ ] Add multiple angle views for each marker (5 angles: 20°, 50°, 90°, 130°, 160°)
- [ ] Improve lighting normalization
- [ ] Add marker quality validation

### Phase 2: Location-Based AR
- [ ] Implement GPS location checking
- [ ] Create backend API for marker management
- [ ] Dynamic marker streaming based on user location
- [ ] Geofencing for AR experiences

### Phase 3: Content Management
- [ ] Backend system for 3D model storage
- [ ] Dynamic model loading
- [ ] Per-marker content configuration
- [ ] Analytics for AR engagement

### Phase 4: Advanced Features
- [ ] Multi-marker experiences (multiple markers at once)
- [ ] Interactive 3D models (tap to trigger actions)
- [ ] Sound effects and spatial audio
- [ ] Recording/screenshot capabilities
- [ ] Social sharing of AR experiences

---

## Troubleshooting

### "AR is not supported on this device"
**Cause**: Device doesn't support ARKit
**Solution**: 
- Use iPhone 6S or newer
- Update to iOS 11.0 or higher
- Check device compatibility at: https://developer.apple.com/augmented-reality/

### Marker not detecting
**Causes**:
1. Poor lighting
2. Marker too small/far away
3. Marker at wrong angle
4. Reflective surface

**Solutions**:
- Ensure good, even lighting
- Print marker at least 20cm wide (adjust `physicalWidth` accordingly)
- Hold marker flat, facing camera
- Use matte paper (not glossy)

### 3D model not appearing
**Causes**:
1. Model file missing
2. Texture files missing
3. Animation name incorrect

**Solutions**:
- Verify model exists in `/assets/ar/`
- Check all texture files are present
- Confirm animation name matches model's animation data

### App crashes on AR tab
**Causes**:
1. Camera permissions denied
2. ViroReact library not properly installed
3. Memory issues

**Solutions**:
- Check camera permissions in iOS Settings
- Reinstall pods: `cd ios && pod install`
- Close other apps to free memory

---

## API Reference

### ViroARSceneNavigator Props
```typescript
<ViroARSceneNavigator
  initialScene={{
    scene: ARScene  // Function that returns AR content
  }}
/>
```

### ViroARImageMarker Props
```typescript
<ViroARImageMarker
  target="markerId"           // Registered marker ID
  onAnchorFound={callback}    // Marker detected
  onAnchorUpdated={callback}  // Marker position updated
  onAnchorRemoved={callback}  // Marker lost
  pauseUpdates={boolean}      // Freeze position updates
>
  {/* 3D content here */}
</ViroARImageMarker>
```

### Viro3DObject Props
```typescript
<Viro3DObject
  source={require('path/to/model.vrx')}
  position={[x, y, z]}        // 3D coordinates
  scale={[x, y, z]}           // Size multiplier
  rotation={[x, y, z]}        // Rotation in degrees
  animation={{
    name: "animationName",
    run: boolean,
    loop: boolean,
    onFinish: callback
  }}
  type="VRX"                  // Model format
/>
```

---

## Testing Checklist

Before deploying AR features:

- [ ] Test on multiple iPhone models (6S, 7, 8, X, 11, 12+)
- [ ] Test in different lighting conditions (bright, dim, mixed)
- [ ] Test at different distances (0.5m - 5m)
- [ ] Test at different angles (straight-on, 45°, side view)
- [ ] Test with printed markers vs screen display
- [ ] Test marker loss/re-detection
- [ ] Test with multiple markers in view
- [ ] Test app backgrounding/foregrounding
- [ ] Test camera permissions flow
- [ ] Measure performance (FPS, battery drain)

---

## Performance Considerations

### Optimization Tips:
1. **Model Size**: Keep 3D models under 10MB
2. **Texture Resolution**: Use 1024x1024 or lower
3. **Polygon Count**: Keep under 50k triangles
4. **Animation Complexity**: Simpler animations = better performance
5. **Simultaneous Markers**: Limit to 2-3 active markers max

### Current Performance:
- **Model**: ~2MB (samurai_hiphop_dance)
- **Textures**: ~16 PNG files, various sizes
- **Active Markers**: 4 concurrent
- **Frame Rate**: Target 60 FPS (ARKit requirement)

---

## Resources

### Documentation
- **ViroReact Docs**: https://viro-community.readme.io/docs
- **Apple ARKit**: https://developer.apple.com/documentation/arkit
- **Mixamo (Animations)**: https://www.mixamo.com/

### Tools
- **3D Model Conversion**: Use ViroReact CLI to convert FBX/OBJ to VRX
- **Marker Image Creation**: High-contrast, detailed images work best
- **Testing**: Use Xcode's AR debugging tools

---

## Summary

Your AR implementation is a **marker-based AR system** that:
- ✅ Detects specific images in the real world
- ✅ Overlays 3D animated content on detected markers
- ✅ Uses Apple ARKit via ViroReact
- ✅ Supports 8 different markers (4 currently active)
- ✅ Displays animated character with text
- ⚠️ Needs improvements for lighting/angle tolerance
- 📝 Planned for backend integration and GPS location features

The system is **functional** but needs refinement for production use, particularly around:
1. Robust marker detection
2. Backend integration
3. Location-based filtering
4. Multi-angle marker support




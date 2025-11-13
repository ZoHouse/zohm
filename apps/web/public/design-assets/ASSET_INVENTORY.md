# Asset Inventory - Quick Reference

Complete inventory of all design assets for avatar & onboarding system.

---

## 📊 Asset Summary

| **Category** | **Files** | **Total Size** | **Required** |
|--------------|-----------|----------------|--------------|
| Videos | 2 | 13.4 MB | ✅ Yes |
| Images | 2 | 23.4 KB | ✅ Yes |
| Sounds | 2 | 261 KB | ⚠️ Partial |
| Fonts | 4 | 810 KB | ✅ Yes |
| Vectors | 2 (inline) | ~5 KB | ✅ Yes |
| **TOTAL** | **12** | **~14.5 MB** | - |

---

## 🎬 VIDEO ASSETS

### onboarding.mp4
```yaml
Path: videos/onboarding.mp4
Size: 13 MB
Duration: ~25-30 seconds
Format: MP4 (H.264)
Resolution: Optimized for mobile
Frame Rate: 30 fps (estimated)

Purpose: Main onboarding video background

Key Timestamps:
  - 0:00-13.46s: Intro animation
  - 13.46s: PAUSE - Auth/Profile step
  - 13.46s-25.2s: Mid-section
  - 25.2s: PAUSE - Location step
  - 25.5s+: Coin animation trigger
  - END: Redirect to app

Code Usage:
  File: app/onboarding.tsx
  Lines: 335-345, 429-447
  Component: OgVideo

Required: YES - Core experience
Priority: CRITICAL
```

### coinRotation.mp4
```yaml
Path: videos/coinRotation.mp4
Size: 386 KB
Duration: ~2-3 seconds (loop)
Format: MP4 (H.264)
Resolution: Small (16x16 display)
Frame Rate: 30 fps (estimated)

Purpose: Animated Zo token/coin

Platform Specific:
  iOS: Animated video loop
  Android: Fallback to zotoken.png

Code Usage:
  File: components/helpers/common/ZoToken.tsx
  Lines: 46-69
  Component: ZoTokenVideo

Required: YES (iOS), NO (Android with PNG fallback)
Priority: MEDIUM
```

---

## 🖼️ IMAGE ASSETS

### zotoken.png
```yaml
Path: images/zotoken.png
Size: 6.4 KB
Format: PNG with alpha transparency
Dimensions: Small icon (16x16 typical display)
Color: Zo brand colors

Purpose: Static Zo coin/token icon

Use Cases:
  - Android fallback for coin animation
  - Zo credits display
  - Reward indicators
  - Currency icon in UI

Code Usage:
  File: components/helpers/common/ZoToken.tsx
  Line: 9
  Component: ZoToken

Required: YES (Android), OPTIONAL (iOS)
Priority: HIGH
```

### icon-zo.png
```yaml
Path: images/icon-zo.png
Size: 17 KB
Format: PNG
Dimensions: App icon size
Color: Zo brand colors

Purpose: Zo brand icon/logo

Use Cases:
  - App icon
  - Splash screen
  - Branding elements
  - Loading states

Code Usage:
  Various locations across app
  
Required: OPTIONAL (not critical for avatar flow)
Priority: LOW
```

---

## 🎵 AUDIO ASSETS

### onboarding-beats.mp3
```yaml
Path: sounds/onboarding-beats.mp3
Size: 180 KB
Duration: Variable (loops)
Format: MP3
Bitrate: ~128 kbps (estimated)

Purpose: Background music during form steps

Behavior:
  - Plays: When video paused (forms active)
  - Pauses: When video playing
  - Loops: Continuously
  - Mute: User controllable

Code Usage:
  File: app/onboarding.tsx
  Lines: 449-472
  Component: OgAudio

Required: YES (enhances experience)
Priority: HIGH
```

### shine.mp3
```yaml
Path: sounds/shine.mp3
Size: 81 KB
Duration: ~1-2 seconds
Format: MP3

Purpose: Success sound effect

Current Status: NOT USED in avatar flow
Potential Uses:
  - Avatar generation complete
  - Profile milestone achieved
  - Reward received

Code Usage:
  Not currently implemented

Required: NO
Priority: LOW
```

---

## 🔤 FONT ASSETS

### Rubik-Regular.ttf
```yaml
Path: fonts/Rubik-Regular.ttf
Size: 203 KB
Weight: 400 (Regular)
Style: Normal
Format: TrueType Font

Usage:
  - Body text
  - Descriptions
  - Labels
  - Default text

Elements:
  - Form labels
  - Descriptions
  - Placeholder text
  - Body paragraphs

Required: YES
Priority: CRITICAL
```

### Rubik-Medium.ttf
```yaml
Path: fonts/Rubik-Medium.ttf
Size: 203 KB
Weight: 500 (Medium)
Style: Normal
Format: TrueType Font

Usage:
  - Headings
  - Button labels
  - Emphasized text
  - Titles

Elements:
  - "Choose your body shape"
  - "Generate Avatar"
  - "Zo Zo Zo! Let's Go"
  - Circular rotating text

Required: YES
Priority: CRITICAL
```

### Rubik-Italic.ttf
```yaml
Path: fonts/Rubik-Italic.ttf
Size: 202 KB
Weight: 400 (Regular)
Style: Italic
Format: TrueType Font

Usage:
  - Italic body text
  - Notes
  - Captions
  - Annotations

Current Usage: LIMITED

Required: NO (can use CSS italic)
Priority: LOW
```

### Rubik-MediumItalic.ttf
```yaml
Path: fonts/Rubik-MediumItalic.ttf
Size: 202 KB
Weight: 500 (Medium)
Style: Italic
Format: TrueType Font

Usage:
  - Emphasized italic text
  - Special callouts

Current Usage: VERY LIMITED

Required: NO (can combine medium + CSS italic)
Priority: LOW
```

---

## 🎨 VECTOR ASSETS (Inline Code)

### BaseMaleAvatar
```yaml
Type: React Native SVG Component
File: components/helpers/login/BaseAvatars.tsx
Lines: 84-150
Viewport: 222x222
Format: SVG (inline JSX)

Colors:
  Skin: #E08B6E
  Outline/Hair: #121212

Features:
  - Male body silhouette
  - Boxy shoulders
  - Short hair
  - Memoized component
  - Forwarded ref support

Usage: "bro" body type selection

Code:
  <BaseMaleAvatar width="100%" height="100%" />

Bundle Size: ~2-3 KB (inline)
Required: YES
Priority: CRITICAL
```

### BaseFemaleAvatar
```yaml
Type: React Native SVG Component
File: components/helpers/login/BaseAvatars.tsx
Lines: 13-82
Viewport: 222x222
Format: SVG (inline JSX)

Colors:
  Skin: #E08B6E
  Outline/Hair: #121212

Features:
  - Female body silhouette
  - Curved shoulders
  - Long hair
  - Memoized component
  - Forwarded ref support

Usage: "bae" body type selection

Code:
  <BaseFemaleAvatar width="100%" height="100%" />

Bundle Size: ~2-3 KB (inline)
Required: YES
Priority: CRITICAL
```

---

## 📦 Dependency Matrix

### Package Requirements

```json
{
  "react-native-video": "^5.x or ^6.x",
  "expo-video": "^0.4.8",
  "expo-font": "~13.3.2",
  "react-native-svg": "^14.x",
  "expo-image": "~2.4.0"
}
```

### Asset Loading Code

```typescript
// Videos
import Video from 'react-native-video';
const videoSource = require('./videos/onboarding.mp4');

// Images
import { Image } from 'react-native';
const imageSource = require('./images/zotoken.png');

// Fonts
import * as Font from 'expo-font';
await Font.loadAsync({
  'Rubik-Regular': require('./fonts/Rubik-Regular.ttf'),
  'Rubik-Medium': require('./fonts/Rubik-Medium.ttf'),
});

// SVG
import { BaseMaleAvatar, BaseFemaleAvatar } from './BaseAvatars';
```

---

## 🎯 Priority Tiers

### CRITICAL (Must Have)
```
✅ onboarding.mp4           13 MB
✅ Rubik-Regular.ttf        203 KB
✅ Rubik-Medium.ttf         203 KB
✅ BaseMaleAvatar           inline
✅ BaseFemaleAvatar         inline
───────────────────────────────────
   Total:                   ~13.4 MB
```

### HIGH (Strongly Recommended)
```
✅ onboarding-beats.mp3     180 KB
✅ zotoken.png              6.4 KB
✅ coinRotation.mp4         386 KB
───────────────────────────────────
   Total:                   ~573 KB
```

### MEDIUM (Nice to Have)
```
⚠️ icon-zo.png              17 KB
───────────────────────────────────
   Total:                   17 KB
```

### LOW (Optional)
```
❌ shine.mp3                81 KB
❌ Rubik-Italic.ttf         202 KB
❌ Rubik-MediumItalic.ttf   202 KB
───────────────────────────────────
   Total:                   485 KB
```

---

## 📱 Platform-Specific Assets

### iOS Required
```yaml
Videos:
  - onboarding.mp4 (CRITICAL)
  - coinRotation.mp4 (MEDIUM)

Images:
  - zotoken.png (OPTIONAL - used as fallback)
  - icon-zo.png (OPTIONAL)

Sounds:
  - onboarding-beats.mp3 (HIGH)
  - shine.mp3 (LOW)

Fonts:
  - Rubik-Regular.ttf (CRITICAL)
  - Rubik-Medium.ttf (CRITICAL)
  - Rubik-Italic.ttf (LOW)
  - Rubik-MediumItalic.ttf (LOW)

Vectors:
  - BaseMaleAvatar (CRITICAL)
  - BaseFemaleAvatar (CRITICAL)
```

### Android Required
```yaml
Videos:
  - onboarding.mp4 (CRITICAL)
  - coinRotation.mp4 (NOT USED)

Images:
  - zotoken.png (CRITICAL - replaces video)
  - icon-zo.png (OPTIONAL)

Sounds:
  - onboarding-beats.mp3 (HIGH)
  - shine.mp3 (LOW)

Fonts:
  - Rubik-Regular.ttf (CRITICAL)
  - Rubik-Medium.ttf (CRITICAL)
  - Rubik-Italic.ttf (LOW)
  - Rubik-MediumItalic.ttf (LOW)

Vectors:
  - BaseMaleAvatar (CRITICAL)
  - BaseFemaleAvatar (CRITICAL)

Special Notes:
  - Static PNG fallback for coin animation
  - May need manual video resume trigger
```

---

## 🔄 Asset Loading Strategy

### Phase 1: App Launch (Preload)
```typescript
// Load immediately
- Rubik-Regular.ttf
- Rubik-Medium.ttf
- zotoken.png
- icon-zo.png
```

### Phase 2: Onboarding Entry
```typescript
// Load when user enters onboarding
- onboarding.mp4
- onboarding-beats.mp3
- BaseMaleAvatar (inline, already loaded)
- BaseFemaleAvatar (inline, already loaded)
```

### Phase 3: On Demand
```typescript
// Load when actually needed
- coinRotation.mp4 (when coin animation triggers)
- shine.mp3 (if success sound implemented)
```

---

## 💾 Storage & Caching

### Video Caching
```typescript
// React Native Video auto-caches
// No additional config needed for videos
```

### Image Caching
```typescript
import { Image } from 'expo-image';

<Image
  source={require('./images/zotoken.png')}
  cachePolicy="disk"  // Cache to disk
/>
```

### Font Caching
```typescript
// expo-font caches automatically
// Fonts persist between app sessions
```

---

## 🧪 Testing Checklist

### Video Assets
- [ ] onboarding.mp4 plays correctly
- [ ] Video pauses at 13.46s
- [ ] Video pauses at 25.2s
- [ ] Video resumes on user action
- [ ] coinRotation.mp4 loops smoothly (iOS)
- [ ] Video plays in landscape/portrait

### Image Assets
- [ ] zotoken.png displays correctly
- [ ] zotoken.png renders on Android
- [ ] icon-zo.png loads fast
- [ ] Images scale properly

### Audio Assets
- [ ] onboarding-beats.mp3 plays when video paused
- [ ] Audio pauses when video plays
- [ ] Audio loops continuously
- [ ] Mute toggle works for both audio and video
- [ ] No audio glitches or gaps

### Font Assets
- [ ] All Rubik fonts load successfully
- [ ] Text renders in correct font
- [ ] Font weights display correctly
- [ ] No font fallback to system fonts
- [ ] Text is readable at all sizes

### Vector Assets
- [ ] BaseMaleAvatar renders correctly
- [ ] BaseFemaleAvatar renders correctly
- [ ] SVGs scale without pixelation
- [ ] Colors match design (#E08B6E, #121212)
- [ ] SVGs animate smoothly (if animated)

### Platform-Specific
- [ ] iOS: Coin animation video plays
- [ ] Android: Static coin PNG displays
- [ ] iOS: Video controls work
- [ ] Android: Manual resume triggers (if needed)

---

## 🔧 Troubleshooting Guide

### Video Won't Play
```typescript
// Check file path
const source = require('./videos/onboarding.mp4');

// Check video player ref
const videoRef = useRef<VideoRef>(null);

// Android: Add manual resume
if (Platform.OS === "android") {
  setTimeout(() => videoRef.current?.resume(), 50);
}
```

### Fonts Not Loading
```typescript
// Ensure fonts loaded before render
const [fontsLoaded] = useFonts({
  'Rubik-Regular': require('./fonts/Rubik-Regular.ttf'),
});

if (!fontsLoaded) {
  return <AppLoading />;
}
```

### Audio Not Syncing
```typescript
// Ensure audio starts paused
const onAudioLoad = () => {
  audioRef.current?.pause();
};

<Video
  onLoad={onAudioLoad}
  // ...
/>
```

### Image Not Displaying
```typescript
// Check require path
const source = require('./images/zotoken.png');

// Ensure Image component imported
import { Image } from 'react-native';
// or
import { Image } from 'expo-image';
```

### SVG Rendering Issues
```typescript
// Ensure react-native-svg installed
import Svg from 'react-native-svg';

// Check component import
import { BaseMaleAvatar } from './BaseAvatars';

// Verify width/height props passed
<BaseMaleAvatar width="100%" height="100%" />
```

---

## 📈 Performance Metrics

### Load Times (Estimated)

| Asset | Size | Load Time (4G) | Load Time (WiFi) |
|-------|------|----------------|------------------|
| onboarding.mp4 | 13 MB | ~26s | ~2s |
| coinRotation.mp4 | 386 KB | ~0.8s | ~0.1s |
| onboarding-beats.mp3 | 180 KB | ~0.4s | ~0.05s |
| All fonts | 810 KB | ~1.6s | ~0.2s |
| All images | 23 KB | ~0.05s | ~0.01s |

### Bundle Impact

```yaml
JavaScript Bundle:
  Inline SVGs: ~5 KB
  Asset imports: ~2 KB
  Total JS impact: ~7 KB

Native Assets:
  Videos: 13.4 MB
  Images: 23 KB
  Sounds: 261 KB
  Fonts: 810 KB
  Total native: ~14.5 MB

Total App Size Impact: ~14.5 MB
```

---

## 🎯 Optimization Recommendations

### Immediate (Do Now)
1. ✅ Lazy load onboarding.mp4 (only load when entering onboarding)
2. ✅ Use expo-image with disk caching for all images
3. ✅ Preload fonts on app launch

### Short Term (Consider)
1. ⚠️ Compress onboarding.mp4 further (target 8-10 MB)
2. ⚠️ Remove unused font variants (Italic)
3. ⚠️ Implement progressive video loading

### Long Term (Nice to Have)
1. 💡 Host onboarding.mp4 on CDN, download on WiFi only
2. 💡 Use system fonts as fallback (reduce bundle)
3. 💡 Implement video quality selection (HD vs SD)

---

## 📝 Change Log

### Version 1.0 (Current)
- Initial asset collection
- All assets from original codebase
- Complete documentation

### Future Versions
- Compressed video variants
- Additional avatar styles
- Localized fonts (if needed)
- Theme variants (dark mode assets)

---

## 📞 Quick Contact

**Need Assets?**
- See: `docs/design-assets/` folder
- Location: `/Users/samuraizan/zo-zo-main/docs/design-assets/`

**Need Code?**
- Main Doc: `docs/AVATAR_SELECTION_IMPLEMENTATION.md`
- Backend Info: `docs/AVATAR_BACKEND_ANSWERS.md`
- Questions We Can Answer: `docs/AVATAR_QUESTIONS_WE_CAN_ANSWER.md`

**Asset Issues?**
- Check: This document (ASSET_INVENTORY.md)
- Troubleshooting: See section above
- Missing assets: Contact original codebase owner

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Total Assets Documented:** 12  
**Total Size:** ~14.5 MB


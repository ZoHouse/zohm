# Design Assets - Avatar & Onboarding System

This folder contains all design assets required to implement the avatar selection and onboarding experience.

---

## 📁 Folder Structure

```
design-assets/
├── videos/          # Video assets for onboarding flow
├── images/          # Static images and icons
├── sounds/          # Audio files for background music and effects
├── fonts/           # Typography assets
└── vectors/         # SVG components (inline code)
```

---

## 🎬 Videos

### 1. **onboarding.mp4**
**Size:** 13 MB  
**Duration:** ~25-30 seconds  
**Format:** MP4  
**Usage:** Main onboarding video background

**Key Timestamps:**
- **0:00 - 13.46s:** Intro animation
- **13.46s:** Pause point for authentication/profile setup
- **13.46s - 25.2s:** Mid-section with avatar display
- **25.2s:** Pause point for location setup
- **25.5s+:** Coin animation trigger point
- **End:** Redirect to main app

**Implementation:**
```typescript
import Video from 'react-native-video';

<Video
  source={require('./videos/onboarding.mp4')}
  style={styles.video}
  resizeMode="cover"
  repeat={false}
  onProgress={handleProgress}
  onEnd={handleEnd}
/>
```

**States:**
- Playing: During video playback
- Paused: At 13.46s (auth/profile) and 25.2s (location)
- Seeked: Can jump to specific timestamps (13.5s, 25.2s)

---

### 2. **coinRotation.mp4**
**Size:** 386 KB  
**Duration:** ~2-3 seconds (looped)  
**Format:** MP4  
**Usage:** Animated Zo token/coin for rewards display

**Key Features:**
- Looping animation
- Small file size for smooth playback
- Used in avatar header capsule (iOS only)
- Fallback to static PNG on Android

**Implementation:**
```typescript
import { useVideoPlayer, VideoView } from 'expo-video';

const videoPlayer = useVideoPlayer(
  require('./videos/coinRotation.mp4'),
  (player) => {
    player.loop = true;
  }
);

<VideoView
  player={videoPlayer}
  style={{ width: 16, height: 16 }}
  contentFit="contain"
  nativeControls={false}
/>
```

**Platform Behavior:**
- **iOS:** Animated video loop
- **Android:** Static PNG fallback (zotoken.png)

---

## 🎵 Sounds

### 1. **onboarding-beats.mp3**
**Size:** 180 KB  
**Duration:** Variable (loops)  
**Format:** MP3  
**Usage:** Background music during profile/location steps

**Behavior:**
- **Plays:** When video is paused (during form steps)
- **Pauses:** When video is playing
- **Loops:** Continuously while user fills forms
- **Muted:** User can toggle with mute button

**Implementation:**
```typescript
import Video from 'react-native-video';

<Video
  source={require('./sounds/onboarding-beats.mp3')}
  style={styles.audioPlayer}  // hidden
  repeat={true}
  onLoad={() => audioRef.current?.pause()}
/>

// Toggle based on video state
if (videoIsPaused) {
  audioRef.current?.resume();
} else {
  audioRef.current?.pause();
}
```

---

### 2. **shine.mp3**
**Size:** 81 KB  
**Duration:** ~1-2 seconds  
**Format:** MP3  
**Usage:** Success sound effect (not currently used in avatar flow, but available)

**Potential Uses:**
- Avatar generation complete
- Profile completion milestone
- Coin reward received

---

## 🖼️ Images

### 1. **zotoken.png**
**Size:** 6.4 KB  
**Dimensions:** Small icon size  
**Format:** PNG with transparency  
**Usage:** Static Zo coin/token icon

**Use Cases:**
- Android fallback for coin animation
- Zo credits display
- Reward indicators
- Currency icons

**Implementation:**
```typescript
import { Image } from 'react-native';

<Image
  source={require('./images/zotoken.png')}
  style={{ width: 16, height: 16 }}
  resizeMode="contain"
/>
```

---

### 2. **icon-zo.png**
**Size:** 17 KB  
**Format:** PNG  
**Usage:** Zo brand icon/logo

**Use Cases:**
- App icon
- Branding elements
- Splash screen
- Loading states

---

## 🔤 Fonts

### Typography Family: **Rubik**

All onboarding text uses the Rubik font family with 4 variants:

#### 1. **Rubik-Regular.ttf**
**Size:** 203 KB  
**Weight:** 400 (Regular)  
**Style:** Normal  
**Usage:** Body text, descriptions, labels

**CSS:**
```css
font-family: 'Rubik', sans-serif;
font-weight: 400;
```

---

#### 2. **Rubik-Medium.ttf**
**Size:** 203 KB  
**Weight:** 500 (Medium)  
**Style:** Normal  
**Usage:** Headings, emphasized text, button labels

**CSS:**
```css
font-family: 'Rubik', sans-serif;
font-weight: 500;
```

---

#### 3. **Rubik-Italic.ttf**
**Size:** 202 KB  
**Weight:** 400 (Regular)  
**Style:** Italic  
**Usage:** Italic body text, notes, captions

**CSS:**
```css
font-family: 'Rubik', sans-serif;
font-weight: 400;
font-style: italic;
```

---

#### 4. **Rubik-MediumItalic.ttf**
**Size:** 202 KB  
**Weight:** 500 (Medium)  
**Style:** Italic  
**Usage:** Emphasized italic text

**CSS:**
```css
font-family: 'Rubik', sans-serif;
font-weight: 500;
font-style: italic;
```

---

### Font Loading (React Native / Expo)

```typescript
import * as Font from 'expo-font';

const loadFonts = async () => {
  await Font.loadAsync({
    'Rubik-Regular': require('./fonts/Rubik-Regular.ttf'),
    'Rubik-Medium': require('./fonts/Rubik-Medium.ttf'),
    'Rubik-Italic': require('./fonts/Rubik-Italic.ttf'),
    'Rubik-MediumItalic': require('./fonts/Rubik-MediumItalic.ttf'),
  });
};
```

---

## 🎨 Vectors (SVG Components)

These are **inline SVG components** defined in code, not separate files.

### 1. **BaseMaleAvatar.tsx**
**Type:** React Native SVG Component  
**Size:** 222×222 viewport  
**Colors:** 
- Skin: `#E08B6E`
- Outline/Hair: `#121212`

**Features:**
- Male body silhouette
- Boxy shoulders
- Short hair style
- Used in "bro" body type selection

**Implementation:**
```typescript
import { BaseMaleAvatar } from './BaseAvatars';

<BaseMaleAvatar width="100%" height="100%" />
```

---

### 2. **BaseFemaleAvatar.tsx**
**Type:** React Native SVG Component  
**Size:** 222×222 viewport  
**Colors:**
- Skin: `#E08B6E`
- Outline/Hair: `#121212`

**Features:**
- Female body silhouette
- Curved shoulders
- Long hair style
- Used in "bae" body type selection

**Implementation:**
```typescript
import { BaseFemaleAvatar } from './BaseAvatars';

<BaseFemaleAvatar width="100%" height="100%" />
```

---

### SVG Component Code

**Location:** `components/helpers/login/BaseAvatars.tsx`

Both avatars are:
- Memoized for performance
- Forwarded refs for animation
- SVG-based (scalable, small bundle size)
- Self-contained (no external dependencies)

**File Structure:**
```typescript
// BaseAvatars.tsx
export const BaseMaleAvatar = memo(forwardRef(_BaseMaleAvatar));
export const BaseFemaleAvatar = memo(forwardRef(_BaseFemaleAvatar));
```

---

## 📊 Asset Usage Map

### Onboarding Flow

| **Step** | **Assets Used** |
|----------|----------------|
| **Intro (0-13.46s)** | `onboarding.mp4` |
| **Phone/OTP** | `onboarding.mp4` (paused), `onboarding-beats.mp3` |
| **Name Input** | `onboarding.mp4` (paused), `onboarding-beats.mp3` |
| **Avatar Selection** | `BaseMaleAvatar`, `BaseFemaleAvatar`, `onboarding-beats.mp3` |
| **Avatar Display** | `onboarding.mp4` (resumed), Generated avatar image |
| **Location (25.2s)** | `onboarding.mp4` (paused), `onboarding-beats.mp3` |
| **Coin Animation (25.5s+)** | `onboarding.mp4`, `coinRotation.mp4`, `zotoken.png` |
| **End Screen** | `icon-zo.png` |

### Typography Usage

| **Element** | **Font** | **Weight** | **Size (approx)** |
|-------------|----------|-----------|------------------|
| Page Title | Rubik-Medium | 500 | 24-28px |
| Body Text | Rubik-Regular | 400 | 16px |
| Button Labels | Rubik-Medium | 500 | 16-18px |
| Captions | Rubik-Italic | 400 | 14px |
| Avatar Text | Rubik-Medium | 500 | 27px (SVG) |

---

## 🎨 Color Palette

### Avatar Colors

```css
/* Skin Tone */
--avatar-skin: #E08B6E;

/* Outline/Hair */
--avatar-outline: #121212;

/* Background (during selection) */
--selection-bg: #FFFFFF33;  /* 20% white opacity */
--selection-border: rgba(255, 255, 255, 0.2);
```

### UI Colors (from codebase)

```css
/* Primary Text */
--text-primary: #FFFFFF;

/* Button Background */
--button-primary: #007AFF;  /* Generate button */
--button-success: #34C759;  /* Continue button */
--button-secondary: #11111179;  /* Skip button, mute button */

/* Selected State */
--selected-border: #007AFF;
--selected-bg: #E3F2FD;
```

---

## 📐 Dimensions & Layout

### Video Dimensions
- **onboarding.mp4:** Full screen (covers entire viewport)
- **coinRotation.mp4:** 16×16px (small coin icon)

### Avatar Dimensions
- **Selection Cards:** Full width, ~200-250px height
- **Generated Avatar (during onboarding):** 200×200px (center screen)
- **Avatar Header Capsule:** 32×32px (top bar)
- **Circular Text Rings:** 340px, 550px, 820px diameter

### Font Sizes
```typescript
const typography = {
  title: 24,
  subtitle: 18,
  body: 16,
  caption: 14,
  button: 16,
  circularText: 27,  // SVG text on rotating rings
};
```

---

## 🔊 Audio Configuration

### Volume & Playback

```typescript
// Mute State
const [muted, setMuted] = useState(true);  // Starts muted

// Video Audio
<Video
  source={onboardingVideo}
  muted={muted}  // User can toggle
/>

// Background Music
<Video
  source={onboardingBeats}
  muted={muted}  // Same mute state
  repeat={true}
/>
```

### Audio Behavior
- Both video and music respect same mute toggle
- Music loops continuously during paused state
- Video audio plays during video playback
- Music pauses when video plays

---

## 📱 Platform-Specific Behavior

### iOS
- ✅ `coinRotation.mp4` animated video
- ✅ Full video playback support
- ✅ Smooth animations

### Android
- ⚠️ `zotoken.png` static fallback (no coin animation)
- ✅ Video playback support
- ⚠️ May need manual resume on video load

**Conditional Rendering:**
```typescript
Platform.OS === "ios" ? (
  <ZoTokenVideo />  // Animated video
) : (
  <ZoToken />       // Static PNG
)
```

---

## 🚀 Implementation Checklist

### Initial Setup
- [ ] Copy all assets to your project's `assets/` folder
- [ ] Install required packages:
  - `react-native-video` (video playback)
  - `expo-video` (alternative video player)
  - `expo-font` (font loading)
  - `react-native-svg` (SVG components)

### Video Assets
- [ ] Import `onboarding.mp4` with proper path
- [ ] Import `coinRotation.mp4` for coin animation
- [ ] Set up video player with ref
- [ ] Handle video progress events (13.46s, 25.2s, 25.5s)
- [ ] Implement pause/resume logic

### Audio Assets
- [ ] Import `onboarding-beats.mp3`
- [ ] Set up audio player with loop
- [ ] Sync audio with video pause state
- [ ] Implement mute toggle

### Image Assets
- [ ] Import `zotoken.png` for Android fallback
- [ ] Import `icon-zo.png` for branding
- [ ] Set up conditional rendering (iOS/Android)

### Fonts
- [ ] Load all 4 Rubik font variants
- [ ] Set up font families in theme config
- [ ] Apply fonts to text components

### SVG Components
- [ ] Copy `BaseAvatars.tsx` component file
- [ ] Import `BaseMaleAvatar` and `BaseFemaleAvatar`
- [ ] Render in avatar selection UI

---

## 📦 Asset Optimization Tips

### Videos
- ✅ **onboarding.mp4:** Already optimized at 13MB (acceptable for main flow)
- ✅ **coinRotation.mp4:** Small at 386KB (well-optimized loop)
- 💡 **Tip:** Consider lazy loading if bundling separately

### Images
- ✅ Both PNGs are small (6-17KB)
- ✅ Transparency preserved
- 💡 **Tip:** Pre-load on app launch for instant display

### Fonts
- ⚠️ **4 font files = ~800KB total**
- 💡 **Tip:** Consider loading only Regular + Medium if bundle size is critical
- 💡 **Alternative:** Use system fonts with fallback

### Audio
- ✅ MP3 files compressed well (180KB, 81KB)
- 💡 **Tip:** Pre-load music file to avoid delay on first pause

---

## 🔗 External Assets (CDN)

These are **NOT included** in this folder (loaded from server):

### Generated Avatars
- **URL Pattern:** `https://proxy.cdn.zo.xyz/gallery/media/images/{uuid}_{timestamp}.png`
- **Loaded:** After backend generation
- **Cached:** By React Native Image component

### Sample Assets
- **Aadhar samples:** `https://static.cdn.zo.xyz/app-media/samples/aadhar-*.png`
- **Passport samples:** `https://static.cdn.zo.xyz/app-media/samples/passport-*.png`

---

## 📄 File Manifest

```
design-assets/
│
├── videos/
│   ├── onboarding.mp4        (13 MB)
│   └── coinRotation.mp4       (386 KB)
│
├── images/
│   ├── zotoken.png            (6.4 KB)
│   └── icon-zo.png            (17 KB)
│
├── sounds/
│   ├── onboarding-beats.mp3   (180 KB)
│   └── shine.mp3              (81 KB)
│
├── fonts/
│   ├── Rubik-Regular.ttf      (203 KB)
│   ├── Rubik-Medium.ttf       (203 KB)
│   ├── Rubik-Italic.ttf       (202 KB)
│   └── Rubik-MediumItalic.ttf (202 KB)
│
└── vectors/ (inline code)
    └── BaseAvatars.tsx        (See component file)
```

**Total Size:** ~14.8 MB

---

## 🎯 Quick Reference

### Most Important Assets
1. **onboarding.mp4** - Core experience
2. **Rubik-Regular.ttf** + **Rubik-Medium.ttf** - Typography
3. **BaseMaleAvatar** + **BaseFemaleAvatar** - Selection UI
4. **onboarding-beats.mp3** - Audio experience
5. **coinRotation.mp4** / **zotoken.png** - Rewards

### Can Be Skipped (Optional)
- `shine.mp3` - Not actively used
- `Rubik-Italic` variants - Can use regular + CSS italic
- `icon-zo.png` - If you have logo elsewhere

### Must Have
- ✅ `onboarding.mp4`
- ✅ At least one Rubik font
- ✅ BaseAvatar SVG components
- ✅ `onboarding-beats.mp3`
- ✅ `zotoken.png` (Android)

---

## 🛠️ Troubleshooting

### Video Not Playing
```typescript
// Android fix
if (Platform.OS === "android") {
  setTimeout(() => {
    videoRef.current?.resume();
  }, 50);
}
```

### Fonts Not Loading
```typescript
// Ensure fonts loaded before render
const [fontsLoaded] = useFonts({
  'Rubik-Regular': require('./fonts/Rubik-Regular.ttf'),
  'Rubik-Medium': require('./fonts/Rubik-Medium.ttf'),
});

if (!fontsLoaded) return <LoadingScreen />;
```

### Audio Not Syncing
```typescript
// Ensure audio starts paused
const onAudioLoad = useCallback(() => {
  audioRef.current?.pause();
}, []);
```

### Coin Animation Not Smooth
```typescript
// iOS: Use VideoView with loop
// Android: Use static PNG (fallback)
Platform.OS === "ios" ? <VideoAnimation /> : <StaticImage />
```

---

## 📞 Support

For questions about:
- **Asset usage:** See implementation examples above
- **File locations:** Check folder structure
- **Integration:** See main documentation in `docs/AVATAR_SELECTION_IMPLEMENTATION.md`
- **Backend:** See `docs/AVATAR_BACKEND_ANSWERS.md`

---

## 📝 License

These assets are part of the Zo/Zostel application. Ensure you have proper rights to use them in your project.

---

**Last Updated:** November 13, 2025  
**Asset Version:** 1.0  
**Total Assets:** 11 files + 2 SVG components


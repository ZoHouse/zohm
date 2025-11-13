# Quick Start - Design Assets

Get up and running with avatar & onboarding design assets in 5 minutes.

---

## 📦 What You Got

```
design-assets/
├── README.md              ← Full documentation
├── ASSET_INVENTORY.md     ← Detailed asset specs
├── QUICK_START.md         ← This file (you are here)
├── videos/
│   ├── onboarding.mp4     (13 MB) - Main video
│   └── coinRotation.mp4   (386 KB) - Coin animation
├── images/
│   ├── zotoken.png        (6.4 KB) - Zo coin icon
│   └── icon-zo.png        (17 KB) - Zo logo
├── sounds/
│   ├── onboarding-beats.mp3  (180 KB) - Background music
│   └── shine.mp3          (81 KB) - Success sound
└── fonts/
    ├── Rubik-Regular.ttf  (203 KB)
    ├── Rubik-Medium.ttf   (203 KB)
    ├── Rubik-Italic.ttf   (202 KB)
    └── Rubik-MediumItalic.ttf (202 KB)
```

**Total:** 11 files + 2 inline SVG components  
**Size:** ~14.5 MB

---

## ⚡ 5-Minute Setup

### Step 1: Copy Assets (30 seconds)
```bash
# Copy entire folder to your project
cp -r design-assets/ /path/to/your-project/assets/

# Or copy selectively
cp design-assets/videos/* your-project/assets/videos/
cp design-assets/fonts/* your-project/assets/fonts/
cp design-assets/images/* your-project/assets/images/
cp design-assets/sounds/* your-project/assets/sounds/
```

### Step 2: Install Dependencies (2 minutes)
```bash
# Required packages
npm install react-native-video expo-video expo-font react-native-svg

# Or with yarn
yarn add react-native-video expo-video expo-font react-native-svg
```

### Step 3: Load Fonts (2 minutes)
```typescript
// App.tsx or _layout.tsx
import * as Font from 'expo-font';
import { useFonts } from 'expo-font';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Rubik-Regular': require('./assets/fonts/Rubik-Regular.ttf'),
    'Rubik-Medium': require('./assets/fonts/Rubik-Medium.ttf'),
  });

  if (!fontsLoaded) {
    return null; // Or loading screen
  }

  return <YourApp />;
}
```

### Step 4: Use Assets (30 seconds)
```typescript
// Videos
import Video from 'react-native-video';
<Video source={require('./assets/videos/onboarding.mp4')} />

// Images  
import { Image } from 'react-native';
<Image source={require('./assets/images/zotoken.png')} />

// Audio
<Video source={require('./assets/sounds/onboarding-beats.mp3')} />
```

**Done!** 🎉 You're ready to implement the avatar system.

---

## 🎯 Minimum Required Assets

### Essential (Can't skip)
```
✅ videos/onboarding.mp4         - Main experience
✅ fonts/Rubik-Regular.ttf       - Body text
✅ fonts/Rubik-Medium.ttf        - Headings/buttons
✅ SVG: BaseMaleAvatar           - Body type selection
✅ SVG: BaseFemaleAvatar         - Body type selection
```

### Highly Recommended
```
⚠️ sounds/onboarding-beats.mp3   - Background music
⚠️ images/zotoken.png            - Coin icon (Android)
⚠️ videos/coinRotation.mp4       - Coin animation (iOS)
```

### Optional
```
❌ images/icon-zo.png            - Branding
❌ sounds/shine.mp3              - Success sound
❌ fonts/Rubik-Italic variants   - Special styles
```

---

## 🚀 Implementation Examples

### Video Player
```typescript
import Video, { VideoRef } from 'react-native-video';
import { useRef } from 'react';

const OnboardingScreen = () => {
  const videoRef = useRef<VideoRef>(null);

  const handleProgress = ({ currentTime }) => {
    if (currentTime > 13.46 && !userAuthenticated) {
      videoRef.current?.pause();
      // Show auth form
    }
  };

  return (
    <Video
      ref={videoRef}
      source={require('./assets/videos/onboarding.mp4')}
      style={{ flex: 1 }}
      resizeMode="cover"
      onProgress={handleProgress}
      onEnd={() => navigation.navigate('Main')}
    />
  );
};
```

### Avatar Selection
```typescript
// Copy from original codebase
import { BaseMaleAvatar, BaseFemaleAvatar } from './BaseAvatars';

const AvatarSelector = () => {
  const [selected, setSelected] = useState<'bro' | 'bae'>();

  return (
    <View>
      <TouchableOpacity onPress={() => setSelected('bae')}>
        <BaseFemaleAvatar width={200} height={200} />
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => setSelected('bro')}>
        <BaseMaleAvatar width={200} height={200} />
      </TouchableOpacity>
    </View>
  );
};
```

### Background Music
```typescript
const AudioPlayer = ({ videoIsPaused }) => {
  const audioRef = useRef<VideoRef>(null);

  useEffect(() => {
    if (videoIsPaused) {
      audioRef.current?.resume();
    } else {
      audioRef.current?.pause();
    }
  }, [videoIsPaused]);

  return (
    <Video
      ref={audioRef}
      source={require('./assets/sounds/onboarding-beats.mp3')}
      repeat={true}
      style={{ width: 0, height: 0 }}
    />
  );
};
```

### Coin Animation (Platform-Specific)
```typescript
import { Platform } from 'react-native';

const CoinIcon = () => {
  if (Platform.OS === 'ios') {
    return (
      <VideoView
        player={coinPlayer}
        style={{ width: 16, height: 16 }}
      />
    );
  }
  
  return (
    <Image
      source={require('./assets/images/zotoken.png')}
      style={{ width: 16, height: 16 }}
    />
  );
};
```

---

## 🔍 Where to Find More Info

| **Topic** | **Document** |
|-----------|-------------|
| Full asset specs | `README.md` |
| Asset inventory | `ASSET_INVENTORY.md` |
| Implementation guide | `../AVATAR_SELECTION_IMPLEMENTATION.md` |
| Backend integration | `../AVATAR_BACKEND_ANSWERS.md` |
| FAQ | `../AVATAR_QUESTIONS_WE_CAN_ANSWER.md` |

---

## 🎨 SVG Components (Not in Folder)

These are **inline code components** - copy from codebase:

**File:** `components/helpers/login/BaseAvatars.tsx`

```typescript
// Male avatar
export const BaseMaleAvatar = memo(forwardRef(_BaseMaleAvatar));

// Female avatar
export const BaseFemaleAvatar = memo(forwardRef(_BaseFemaleAvatar));
```

**Why inline?**
- Smaller bundle size than separate SVG files
- Better performance (no file loading)
- Easy to customize colors

**Where to get:** See original codebase or ask for `BaseAvatars.tsx` file

---

## ⚙️ Common Issues & Fixes

### Video not playing?
```typescript
// Android needs manual resume
if (Platform.OS === "android") {
  setTimeout(() => videoRef.current?.resume(), 50);
}
```

### Fonts not loading?
```typescript
// Wait for fonts before rendering
if (!fontsLoaded) {
  return <ActivityIndicator />;
}
```

### Audio out of sync?
```typescript
// Start audio paused
const onAudioLoad = () => {
  audioRef.current?.pause();
};
```

### Coin animation choppy?
```typescript
// Use static image on Android
Platform.OS === 'ios' ? <VideoAnimation /> : <StaticImage />
```

---

## 📱 Platform Notes

### iOS
- ✅ All assets work
- ✅ Smooth coin animation
- ✅ Video controls

### Android
- ✅ Video playback works
- ⚠️ Use PNG for coin (not video)
- ⚠️ May need manual video resume

---

## 🎯 Next Steps

1. ✅ Assets copied
2. ✅ Dependencies installed  
3. ✅ Fonts loaded
4. ✅ Basic usage understood

**Now:**
- 📖 Read `README.md` for detailed specs
- 🔧 See `../AVATAR_SELECTION_IMPLEMENTATION.md` for full implementation
- 🧪 Test on both iOS and Android
- 🎨 Customize colors/styles as needed

---

## 💡 Pro Tips

1. **Lazy load video** - Don't load onboarding.mp4 until user enters onboarding
2. **Preload fonts** - Load fonts on app launch for instant display
3. **Cache images** - Use `cachePolicy="disk"` with expo-image
4. **Test on device** - Video playback behaves differently than simulator
5. **Monitor bundle size** - Consider hosting large video on CDN

---

## 📞 Need Help?

**Asset questions:** See `README.md` or `ASSET_INVENTORY.md`  
**Implementation questions:** See main docs folder  
**Missing assets:** Check original codebase at `/Users/samuraizan/zo-zo-main/`

---

## 🎉 You're Ready!

All assets are documented, organized, and ready to use. Start implementing the avatar selection system with confidence!

**Good luck!** 🚀


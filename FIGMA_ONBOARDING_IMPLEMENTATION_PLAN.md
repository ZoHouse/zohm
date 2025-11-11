# Figma to Web App: Onboarding Implementation Plan

## 📐 Overview

This document outlines the strategy for implementing the new Figma-designed onboarding flow into the existing Zo World web application.

**Figma Design URL**: https://www.figma.com/design/I8P5ECz7pOA4aBa4sxOBEM/zo.xyz?node-id=126-3566

---

## ✅ CONFIRMED SCOPE

### Phase 1 Implementation (2 Screens):

**Screen 1: "WHO ARE YOU?"**
- ✅ Username input (2-12 characters)
- ✅ Avatar selector (ALL 14 unicorn options)
- ✅ "Connect X" button (Privy Twitter, replaces Telegram from Figma)
- ✅ Auto-request location (required or default to SF)
- ✅ "Get Citizenship" button
- ❌ NO culture selection (removed, move to profile later)

**Screen 2: "SAY ZO ZO ZO"**
- ✅ Voice authentication using Web Speech API
- ✅ "QUANTUM SYNC" title
- ✅ Microphone visualization with animated rings
- ✅ Listen for "Zo Zo Zo" phrase
- ✅ Success → Proceed to map with space animation

**Database Changes**:
- Save: `name`, `pfp`, `lat`, `lng`, `city` (optional)
- Remove: `culture` (not collected during onboarding)

---

## 🎨 Design Analysis

### Screens in Figma Flow:
1. **Onboarding** (node-id: 126:3903) - "WHO ARE YOU?" username entry
2. **Say Zo Zo Zo** (node-id: 126:4119) - Voice authentication / Quantum Sync intro
3. **Play Game** (node-id: 126:4240) - Quantum Sync ring game
4. **Game Stop** (node-id: 126:3567) - Quest completion with location
5. **Profile** (node-id: 126:3808) - Passport-style profile
6. **Home - Return State** (node-id: 126:3971) - Welcome screen with leaderboard

### Key Visual Elements:
- **Space background**: Stars with gradient overlay
- **Typography**: 
  - Headers: Syne (ExtraBold, 24px, uppercase)
  - Body: Rubik (Regular, 16px)
  - Special: Space Grotesk for stats
- **Colors**:
  - Background: #000000 (black)
  - Primary text: #FFFFFF (white)
  - Secondary text: rgba(255, 255, 255, 0.44)
  - Accent border: rgba(255, 255, 255, 0.44)
  - Success: #CFFF50 (lime green)
  - Card background: rgba(18, 18, 18, 0.2) with backdrop-blur
- **Border radius**: 12px for inputs/buttons, 40px for pills
- **Spacing**: 16px gap between elements
- **Mobile width**: 360px max (designed for mobile-first)

---

## 🔄 Current vs. New Onboarding

### Current Implementation (`SimpleOnboarding.tsx`):
```
1. Name input (12 char max)
2. City dropdown (with search)
3. Culture dropdown (with search)
4. "Use my location" button
5. "Enter Zo World" button
→ Saves to DB → Shows map
```

### New Figma Design:
```
1. "WHO ARE YOU?" - Username input + Avatar selector
2. (Optional) Telegram/X connect button → We'll use Privy X connect
3. "Get Citizenship" button
4. Background location request (no explicit UI needed)
→ Voice auth screen → Game → Map
```

### Key Differences:
| Feature | Current | Figma Design | Implementation Strategy |
|---------|---------|--------------|------------------------|
| **Name Input** | Simple text field | Large centered input with placeholder | Keep, restyle |
| **Location** | Dropdown + "Use my location" | Auto-request in background | Auto-request on mount |
| **Culture** | Dropdown selection | Not in design | Remove from onboarding |
| **Avatar** | Auto-assigned unicorn | Two avatar options to toggle | Add avatar selector |
| **Social Connect** | Not present | Telegram button | Replace with Privy X (Twitter) |
| **Background** | Loading GIF | Space stars with gradient | Update background image/style |
| **Typography** | Space Grotesk everywhere | Syne for headers, Rubik for body | Add Syne font, update styles |

---

## 🛠️ Implementation Strategy

### Phase 1: Full Onboarding Flow (2 Screens)

#### Screen 1: "WHO ARE YOU?" (Username + Avatar + X Connect)
**Component**: `NewOnboarding.tsx`

**Steps**:
1. **Create new component** (`NewOnboarding.tsx`)
2. **Extract design assets** from Figma:
   - Space background image (or use existing `loading background.gif`)
   - Zo logo (already have `/Zo_flexing_white.png`)
   - Avatar images (ALL 14 unicorn PNGs from `/public/unicorn images/`)
3. **Implement layout**:
   - Fixed full-screen overlay (like current onboarding)
   - Centered content with max-width 360px
   - Space background with opacity
4. **Add form elements**:
   - Username input (styled like Figma)
   - Avatar selector (14 unicorn options in scrollable container)
   - **"Connect X" button** (Privy Twitter integration) - replaces Telegram
   - Location auto-request (silent, in useEffect)
   - "Get Citizenship" button
5. **Wire up logic**:
   - Validate username (2-12 chars)
   - Store selected avatar
   - Get location via browser API (required, or default to SF)
   - Connect X via Privy `linkTwitter()`
   - Save to DB via `upsertUserFromPrivy()` (NO culture field)
   - Transition to Voice Auth screen
6. **Styling approach**:
   - Create `NewOnboarding.css` (not Tailwind, match your existing pattern)
   - Use CSS custom properties for colors
   - Mobile-first responsive design

#### Screen 2: "SAY ZO ZO ZO" (Voice Auth)
**Component**: `VoiceAuthScreen.tsx`

**Steps**:
1. **Create component** (`VoiceAuthScreen.tsx`)
2. **Extract design assets**:
   - "QUANTUM SYNC" metallic text image (or CSS text-shadow)
   - Microphone icon with concentric rings
   - Stone platform base image
3. **Implement layout**:
   - Full-screen black background
   - "QUANTUM SYNC" title at top
   - Centered microphone visualization
   - "Tap & say 'Zo Zo Zo'" instruction
   - Stone platform at bottom
4. **Add functionality**:
   - Web Speech API integration
   - Listen for "Zo Zo Zo" phrase
   - Visual feedback on microphone press (rings animate)
   - Success state → proceed to map
   - Fail state → allow retry
5. **State management**:
   - `isListening`, `recognized`, `attempts`, `error`
6. **Transition**:
   - Success → Call `onComplete()` → Show map with space animation

### Phase 2: Advanced Screens (Future)
**Screens to add later**:
- Quantum Sync game (rotating ring)
- Quest completion card
- Welcome/passport reveal

---

## 📦 Assets Needed

### From Figma (Export from Dev Mode):
- ✅ Space background image (or use existing GIF)
- ✅ Zo logo (already have)
- ✅ Unicorn avatars (already have in `/public/unicorn images/`)
- ❌ Microphone icon (for Phase 2)
- ❌ Stone ring assets (for Phase 2)
- ❌ Passport card background (for Phase 2)

### Fonts to Add:
```css
/* Add to globals.css or layout */
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600&display=swap');
```

---

## 🎯 Component Architecture

### File Structure:
```
src/
├── components/
│   ├── NewOnboarding.tsx          ← New component (replaces SimpleOnboarding)
│   ├── NewOnboarding.css          ← Styles for new onboarding
│   ├── SimpleOnboarding.tsx       ← Keep for backup/reference
│   └── ...
├── app/
│   └── page.tsx                   ← Update import + usage
└── ...
```

### Props Interface:
```typescript
interface NewOnboardingProps {
  isVisible: boolean;
  onComplete: (locationData: { lat: number; lng: number; city?: string }) => void;
}
```

### State Management:
```typescript
const [username, setUsername] = useState('');
const [selectedAvatar, setSelectedAvatar] = useState(0); // 0 or 1
const [location, setLocation] = useState<{lat: number; lng: number} | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState('');
const [xConnected, setXConnected] = useState(false);
```

---

## 🔌 Integration Points

### 1. Privy Integration (Twitter/X Connect)
**Current**: Not present
**New**: ✅ "Connect X" button (replaces Telegram from Figma)

```typescript
import { usePrivy } from '@privy-io/react-auth';

const { user, linkTwitter } = usePrivy();

// Check if X is connected
const xAccount = user?.linkedAccounts?.find(acc => acc.type === 'twitter_oauth');
const isXConnected = !!xAccount;

// Connect X button handler
const handleConnectX = async () => {
  try {
    await linkTwitter();
    setXConnected(true);
  } catch (error) {
    console.error('Failed to connect X:', error);
    setError('Failed to connect X. Please try again.');
  }
};
```

**Button State**:
- If NOT connected: Show "Connect X" button
- If connected: Show checkmark + username + "✓ Connected"
- Optional: Allow disconnect/reconnect

**Styling**: Match Figma button style (glass background, rounded, white text)

### 2. Location Capture
**Current**: Manual selection OR "Use my location" button
**New**: Auto-request silently in background

```typescript
useEffect(() => {
  if (navigator.geolocation && !location) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        
        // Optional: Reverse geocode to get city name
        fetchCityFromCoords(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error('Location error:', error);
        // Fallback: Show error or use default location
        setError('Location access denied. Using default location.');
        setLocation({ lat: 37.7749, lng: -122.4194 }); // SF default
      }
    );
  }
}, []);
```

**UX**: Show loading indicator while fetching location. Disable "Get Citizenship" button until location is obtained.

### 3. Avatar Selection
**Current**: Auto-assigned based on hash
**New**: User selects from ALL 14 unicorn options

```typescript
const AVATAR_OPTIONS = [
  '/unicorn images/UnicornMemes_v1-01.png',
  '/unicorn images/UnicornMemes_v1-02.png',
  '/unicorn images/UnicornMemes_v1-03.png',
  '/unicorn images/UnicornMemes_v1-04.png',
  '/unicorn images/UnicornMemes_v1-05.png',
  '/unicorn images/UnicornMemes_v1-06.png',
  '/unicorn images/UnicornMemes_v1-07.png',
  '/unicorn images/Unicorn_Crying.png',
  '/unicorn images/Unicorn_Rainbow.png',
  '/unicorn images/UnicornCool.png',
  '/unicorn images/UnicornMagnifyingGlass.png',
  '/unicorn images/UnicornMemes_poppedeye.png',
  '/unicorn images/UnicornRainbowPuke.png',
  '/unicorn images/UnicornRocket.png'
];

// In component:
<div className="avatar-selector">
  <div className="avatar-grid">
    {AVATAR_OPTIONS.map((avatar, index) => (
      <div
        key={index}
        className={`avatar ${selectedAvatar === index ? 'selected' : ''}`}
        onClick={() => setSelectedAvatar(index)}
      >
        <img src={avatar} alt={`Avatar ${index + 1}`} />
      </div>
    ))}
  </div>
</div>
```

**UI**: Scrollable grid of avatars (3-4 per row), selected avatar gets green border

**Storage**: Save avatar URL to `users.pfp` field

### 4. Database Save
**Current**: Saves name, city, culture, lat, lng
**New**: ✅ Saves name, pfp, lat, lng (NO culture field)

```typescript
const handleSubmit = async () => {
  if (!username.trim() || username.length < 2 || username.length > 12) {
    setError('Username must be 2-12 characters');
    return;
  }

  if (!location) {
    setError('Please allow location access');
    return;
  }

  setIsLoading(true);

  try {
    await upsertUserFromPrivy(privyUser, {
      name: username.trim(),
      pfp: AVATAR_OPTIONS[selectedAvatar],
      lat: location.lat,
      lng: location.lng,
      city: cityName || null, // Optional: from reverse geocoding
      // ❌ NO culture field (removed from onboarding)
      onboarding_completed: true,
      role: 'Member'
    });

    // Store location for immediate map access
    if (typeof window !== 'undefined') {
      window.userLocationCoords = { lat: location.lat, lng: location.lng };
    }

    // Proceed to Voice Auth screen
    setShowVoiceAuth(true);
  } catch (error) {
    console.error('Save error:', error);
    setError('Failed to save profile. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

**Note**: After save, user proceeds to Voice Auth screen (not directly to map)

---

## 🎨 Styling Strategy

### Approach: Custom CSS (Not Tailwind)
**Reason**: Your project uses custom CSS with BEM-like naming, not Tailwind utility classes.

### Color Variables (Already in globals.css):
```css
:root {
  --background-dark: #0A0A0A;
  --foreground-light: #F5F5F7;
  --glass-bg: rgba(28, 28, 30, 0.8);
  --glass-border: rgba(255, 255, 255, 0.1);
  /* Add new ones for onboarding: */
  --onboarding-text-secondary: rgba(255, 255, 255, 0.44);
  --onboarding-accent: #CFFF50;
  --onboarding-input-bg: rgba(0, 0, 0, 0.3);
}
```

### CSS Class Naming Pattern:
```css
.new-onboarding { /* Container */ }
.new-onboarding__background { /* Background layer */ }
.new-onboarding__content { /* Content wrapper */ }
.new-onboarding__title { /* H1 heading */ }
.new-onboarding__subtitle { /* Subtitle text */ }
.new-onboarding__username-input { /* Username field */ }
.new-onboarding__avatar-selector { /* Avatar container */ }
.new-onboarding__avatar { /* Individual avatar */ }
.new-onboarding__avatar--selected { /* Active avatar */ }
.new-onboarding__avatar--dimmed { /* Inactive avatar */ }
.new-onboarding__submit-btn { /* Get Citizenship button */ }
.new-onboarding__error { /* Error message */ }
```

### Responsive Design:
```css
/* Base: Mobile-first (360px) */
.new-onboarding { ... }

/* Tablet */
@media (min-width: 768px) {
  .new-onboarding__content {
    max-width: 400px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .new-onboarding__content {
    max-width: 480px;
  }
}
```

---

## 📝 Component Pseudocode

```typescript
// NewOnboarding.tsx

import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { upsertUserFromPrivy } from '@/lib/privyDb';
import './NewOnboarding.css';

interface NewOnboardingProps {
  isVisible: boolean;
  onComplete: (location: { lat: number; lng: number }) => void;
}

export default function NewOnboarding({ isVisible, onComplete }: NewOnboardingProps) {
  // State
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(0);
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Hooks
  const { user, authenticated, linkTwitter } = usePrivy();

  // Auto-request location on mount
  useEffect(() => {
    requestUserLocation();
  }, []);

  // Handlers
  const handleAvatarSelect = (index) => { ... }
  const handleConnectX = async () => { ... }
  const handleSubmit = async () => { ... }

  // Early return if not visible
  if (!isVisible || !authenticated) return null;

  // Render
  return (
    <div className="new-onboarding">
      {/* Background */}
      <div className="new-onboarding__background" />
      
      {/* Zo Logo */}
      <img src="/Zo_flexing_white.png" className="new-onboarding__logo" />
      
      {/* Content */}
      <div className="new-onboarding__content">
        {/* Title */}
        <h1 className="new-onboarding__title">WHO ARE YOU?</h1>
        
        {/* Subtitle */}
        <p className="new-onboarding__subtitle">
          A difficult question, I know. We'll get to it.
          <br />
          But let's start with choosing a nick.
        </p>

        {/* Username Input */}
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ishaan"
          maxLength={12}
          className="new-onboarding__username-input"
        />

        {/* Avatar Selector */}
        <div className="new-onboarding__avatar-selector">
          {AVATAR_OPTIONS.map((avatar, index) => (
            <div
              key={index}
              className={`new-onboarding__avatar ${selectedAvatar === index ? 'selected' : 'dimmed'}`}
              onClick={() => handleAvatarSelect(index)}
            >
              <img src={avatar} alt={`Avatar ${index + 1}`} />
            </div>
          ))}
        </div>

        {/* Optional: X Connect */}
        {!user?.twitter && (
          <button onClick={handleConnectX} className="new-onboarding__x-connect">
            Connect X (Twitter)
          </button>
        )}

        {/* Location Status */}
        {!location && (
          <p className="new-onboarding__location-status">
            📍 Getting your location...
          </p>
        )}

        {/* Error Message */}
        {error && <p className="new-onboarding__error">{error}</p>}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || !location || !username.trim()}
          className="new-onboarding__submit-btn"
        >
          {isLoading ? 'Saving...' : 'Get Citizenship'}
        </button>
      </div>
    </div>
  );
}
```

---

## 🚀 Migration Plan

### Step 1: Prep Work
- [ ] Export assets from Figma (if needed)
- [ ] Add Syne + Rubik fonts to `layout.tsx` or `globals.css`
- [ ] Create `NewOnboarding.tsx` file (blank)
- [ ] Create `NewOnboarding.css` file (blank)

### Step 2: Build Component
- [ ] Copy structure from Figma code export
- [ ] Convert Tailwind classes to custom CSS
- [ ] Add state management (useState hooks)
- [ ] Add location auto-request (useEffect)
- [ ] Add avatar selection logic
- [ ] Add X connect logic (optional)
- [ ] Add form validation
- [ ] Add database save logic

### Step 3: Style Component
- [ ] Apply CSS based on Figma design specs
- [ ] Test on mobile (360px width)
- [ ] Test on tablet (768px width)
- [ ] Test on desktop (1024px+ width)
- [ ] Add animations/transitions

### Step 4: Test
- [ ] Test with Privy login
- [ ] Test location permission (allow)
- [ ] Test location permission (deny)
- [ ] Test username validation
- [ ] Test avatar selection
- [ ] Test X connect (optional)
- [ ] Test database save
- [ ] Test onComplete callback

### Step 5: Replace Old Onboarding
- [ ] Update `page.tsx` import
- [ ] Replace `<SimpleOnboarding>` with `<NewOnboarding>`
- [ ] Update `handleOnboardingComplete` if needed
- [ ] Test full flow: Login → Onboarding → Map
- [ ] Test space-to-location animation still works

### Step 6: Cleanup
- [ ] Archive `SimpleOnboarding.tsx` (keep for reference)
- [ ] Update documentation
- [ ] Commit to git
- [ ] Deploy to production

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Location Permission Denied
**Problem**: User denies location access
**Solution**: 
- Show error message
- Use default location (San Francisco)
- Add "Try Again" button to re-request
- Allow manual city selection as fallback

### Issue 2: Figma Fonts Not Available
**Problem**: Syne/Rubik fonts increase page load time
**Solution**:
- Use `next/font` for automatic optimization
- Preload fonts in `layout.tsx`
- Fallback to Space Grotesk (already loaded)

### Issue 3: Avatar Images Too Large
**Problem**: High-res unicorn PNGs slow down loading
**Solution**:
- Optimize images (compress to ~50KB each)
- Use Next.js `<Image>` component for auto-optimization
- Lazy load non-selected avatar

### Issue 4: X Connect Adds Complexity
**Problem**: Extra step disrupts flow
**Solution**:
- Make it OPTIONAL (not required)
- Add "Skip" option
- Only show if user hasn't connected yet
- Or remove entirely for MVP

### Issue 5: No Culture Selection
**Problem**: Design doesn't include culture, but DB expects it
**Solution**:
- Set culture to `null` initially
- Add culture selection in profile settings later
- Or add as second onboarding step (after username)

---

## 📊 Success Metrics

### Before Launch:
- [ ] All tests pass
- [ ] No console errors
- [ ] Matches Figma design 95%+
- [ ] Loads in < 2 seconds
- [ ] Works on iOS Safari, Android Chrome, Desktop Chrome

### After Launch:
- Track onboarding completion rate
- Track time-to-complete
- Track location permission grant rate
- Track X connect rate (if implemented)
- Gather user feedback

---

## 🎯 Next Steps (After MVP)

### Phase 2 Screens:
1. **Voice Auth Screen** ("Say Zo Zo Zo")
   - Add Web Speech API integration
   - Create microphone visualization
   - Handle voice recognition
   
2. **Quantum Sync Game**
   - Build rotating ring animation (CSS or Canvas)
   - Add score counter logic
   - Implement "stop at 1111" mechanic
   - Store best score in DB

3. **Quest Completion Card**
   - Show completed sync with location
   - Display multiplier
   - Add "Map your Sync" button
   - Transition to map view

4. **Passport Profile**
   - Create passport-style layout
   - Add profile completion rewards (+$ZO)
   - Show citizen number
   - Add edit functionality

---

## ✅ DECISIONS CONFIRMED

1. **X Connect**: ✅ Replace Telegram button with "Connect X" (Twitter)
   
2. **Culture Selection**: ✅ REMOVED from onboarding (move to profile settings later)
   
3. **Voice Auth**: ✅ INCLUDE in Phase 1 ("Say Zo Zo Zo" screen)
   
4. **Location Fallback**: ✅ Required to move forward OR default to San Francisco if denied
   
5. **Avatar Count**: ✅ ALL 14 unicorn options available

---

## 🔗 References

- Figma Design: https://www.figma.com/design/I8P5ECz7pOA4aBa4sxOBEM/zo.xyz?node-id=126-3566
- Current Onboarding: `src/components/SimpleOnboarding.tsx`
- Privy Docs: https://docs.privy.io
- Geolocation API: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
- Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API

---

**Status**: Planning Complete ✅  
**Next Step**: Review plan → Get approval → Start implementation

**Estimated Time**: 
- Phase 1 (Username screen): 4-6 hours
- Phase 2 (Voice + Game): 8-12 hours
- Total MVP: 1-2 days


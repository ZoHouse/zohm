# 🖥️ Mac Components Library

Classic Macintosh-inspired UI components for the Zo World onboarding experience.

## Components

### 1. `MacBezel`
**Purpose**: Outer frame that holds the entire Mac interface

```tsx
<MacBezel>
  <MacScreen title="Unicorn">
    {/* content */}
  </MacScreen>
</MacBezel>
```

**Visual**:
- Beige/gray bezel color (#d7d7d7)
- 12px solid border (#cfcfcf)
- Rounded corners
- Drop shadow for depth
- Fixed aspect ratio (1.48:1)

---

### 2. `MacScreen`
**Purpose**: Inner screen with classic Mac title bar and traffic lights

```tsx
<MacScreen title="Unicorn Onboarding">
  {/* dialogs, content */}
</MacScreen>
```

**Features**:
- Traffic light buttons (🔴 🟡 🟢)
- Title bar with monospace font
- Off-white screen background (#f6f6f6)
- Scanline overlay for CRT effect
- Subtle noise grain

---

### 3. `MacDialog`
**Purpose**: Stacked dialog windows with depth effect

```tsx
<MacDialog
  title="Step 1 of 5"
  offset={0}
  opacity={1}
  active={true}
  width="480px"
>
  {/* form content */}
</MacDialog>
```

**Props**:
- `title` - Window title
- `offset` - Stacking offset (0, 12, 24px)
- `opacity` - Window opacity (0.3-1.0)
- `blur` - Apply blur filter
- `active` - Enable pointer events
- `width` / `height` - Dialog dimensions

**Usage Pattern**:
```tsx
{/* Background dialog */}
<MacDialog offset={24} opacity={0.3} blur active={false} />

{/* Mid dialog */}
<MacDialog offset={12} opacity={0.6} blur active={false} />

{/* Active dialog */}
<MacDialog offset={0} opacity={1} active={true} />
```

---

### 4. `MacButton`
**Purpose**: Classic beveled Mac buttons

```tsx
<MacButton onClick={handleNext} primary>
  Next →
</MacButton>

<MacButton onClick={handleBack}>
  ← Back
</MacButton>
```

**Props**:
- `primary` - Blue style (true) or gray style (false)
- `disabled` - Disable interaction
- `type` - 'button' or 'submit'
- `onClick` - Click handler

**Styles**:
- **Primary**: Blue (#4a8cff) with darker border
- **Secondary**: Light gray (#e6e6e6) with bevel effect
- Active press state with translate

---

### 5. `MacInput`
**Purpose**: Classic Mac text inputs and textareas

```tsx
<MacInput
  value={name}
  onChange={setName}
  placeholder="Enter name"
  maxLength={12}
/>

<MacInput
  value={bio}
  onChange={setBio}
  multiline
  rows={3}
  maxLength={111}
  error="Bio is required"
/>
```

**Props**:
- `value` / `onChange` - Controlled input
- `placeholder` - Placeholder text
- `maxLength` - Character limit
- `multiline` - Use textarea instead of input
- `rows` - Textarea rows (default: 3)
- `error` - Error message to display

**Features**:
- Character counter (when maxLength set)
- Error display below input
- Inset border style
- Focus ring in Mac blue

---

### 6. `MacProfileSetup`
**Purpose**: Main onboarding wrapper combining all components

```tsx
<MacProfileSetup
  isVisible={true}
  onComplete={() => console.log('Done!')}
  onClose={() => console.log('Closed')}
  onOpenDashboard={() => setDashboardOpen(true)}
/>
```

**Props**:
- `isVisible` - Show/hide onboarding
- `onComplete` - Callback when user finishes
- `onClose` - Callback for close action
- `onOpenDashboard` - Optional dashboard opener

**Features**:
- 5-step form flow
- Validation on each step
- Progress indicator
- Stacked dialog animation
- Privy integration
- Supabase data persistence

---

## Design Tokens

```css
/* Colors */
--mac-bezel: #d7d7d7;
--mac-bezel-border: #cfcfcf;
--mac-screen: #f6f6f6;
--mac-title-bar-top: #efefef;
--mac-title-bar-bottom: #dcdcdc;
--mac-dialog-border: #8a8a8a;
--mac-input-border: #b0b0b0;
--mac-button-primary: #4a8cff;
--mac-button-primary-border: #2b62d6;
--mac-button-secondary: #e6e6e6;
--mac-button-secondary-border: #7a7a7a;

/* Animations */
--animation-duration: 0.4s-0.6s;
--animation-easing: ease-out;

/* Shadows */
--bezel-shadow: 0 20px 60px rgba(0,0,0,0.55);
--dialog-shadow: 0 6px 18px rgba(0,0,0,0.2);
--button-shadow: 0 2px 0 rgba(0,0,0,0.12);
```

---

## Usage Example

```tsx
import { MacProfileSetup } from '@/components/mac';

function OnboardingPage() {
  const handleComplete = () => {
    console.log('User finished onboarding!');
  };

  return (
    <MacProfileSetup
      isVisible={true}
      onComplete={handleComplete}
      onClose={() => {}}
    />
  );
}
```

---

## Animation System

**Entry Animations**:
- `fadeIn` - Bezel fades in over 0.5s
- `slideIn` - Dialogs slide down with 0.4s duration

**Transitions**:
- Dialog stacking uses `transition-all duration-500`
- Button presses use `transition-all duration-150`
- Input focus uses default Tailwind transitions

**Performance**:
- All animations use CSS transforms (GPU-accelerated)
- Opacity changes are hardware-accelerated
- No JavaScript-based animations

---

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (falls back to simple UI)

---

## Future Enhancements

- [ ] Add "close" button to dialogs
- [ ] Add window drag functionality
- [ ] Add minimize/maximize animations
- [ ] Add keyboard navigation
- [ ] Add sound effects (classic Mac beep)
- [ ] Add desktop pattern background option

---

**The unicorns are real.** 🦄



# Glow UI Design System

A cohesive design language for Zo House, inspired by the stats ticker capsule aesthetic.

## Philosophy

The Glow UI system replaces the "paper" motif with a modern, translucent capsule language that feels:
- **Polished** – soft edges, backdrop blur, and subtle shadows
- **Energetic** – pulsing red dots and glow effects
- **Lightweight** – translucent backgrounds that don't compete with the map
- **Game-like** – badge-style chips that feel like unlockable achievements

## Design Tokens

All components reference these CSS custom properties defined in `globals.css`:

```css
--glow-chip-bg: rgba(255, 255, 255, 0.20);
--glow-chip-border: rgba(255, 255, 255, 0.40);
--glow-chip-text: #ff4d6d;
--glow-chip-dot: #ff4d6d;
--glow-chip-dot-shadow: 0 0 10px rgba(255, 77, 109, 0.6);
--glow-chip-radius: 9999px;
--glow-chip-font-weight: 600;
--glow-chip-letter-spacing: 0.02em;
```

## Components

### GlowChip

Small capsule for stats, badges, and labels.

**Usage:**
```tsx
import { GlowChip } from '@/components/ui';

<GlowChip showDot>45 Events</GlowChip>
<GlowChip>Active</GlowChip>
<GlowChip onClick={handleClick}>Clickable</GlowChip>
```

**Props:**
- `children: React.ReactNode` – Content to display
- `showDot?: boolean` – Show pulsing red dot indicator
- `className?: string` – Additional Tailwind classes
- `onClick?: () => void` – Optional click handler

**When to use:**
- Stats displays (event counts, node counts)
- Status badges (Active, Completed, Pending)
- Filter chips
- Small interactive elements

---

### GlowButton

Interactive button with primary and secondary variants.

**Usage:**
```tsx
import { GlowButton } from '@/components/ui';

<GlowButton variant="primary" onClick={handleJoin}>
  Join Quest
</GlowButton>

<GlowButton variant="secondary" showDot>
  Live Now
</GlowButton>
```

**Props:**
- `children: React.ReactNode` – Button text/content
- `onClick?: () => void` – Click handler
- `variant?: 'primary' | 'secondary'` – Visual style (default: 'primary')
- `disabled?: boolean` – Disabled state
- `showDot?: boolean` – Show indicator dot
- `className?: string` – Additional classes
- `type?: 'button' | 'submit' | 'reset'` – Button type

**Variants:**
- **Primary**: Solid red background (`#ff4d6d`) with white text – for main actions
- **Secondary**: Translucent with red text – for secondary actions

**When to use:**
- Primary: Main CTAs (Join Quest, Submit, Confirm)
- Secondary: Secondary actions (View Details, Cancel, Filter)

---

### GlowCard

Larger surface for overlays, modals, and content containers.

**Usage:**
```tsx
import { GlowCard } from '@/components/ui';

<GlowCard>
  <h3>Quest Details</h3>
  <p>Follow @ZoHouse to earn 420 $ZO</p>
</GlowCard>

<GlowCard hoverable onClick={handleClick}>
  <h3>Clickable Card</h3>
</GlowCard>
```

**Props:**
- `children: React.ReactNode` – Card content
- `className?: string` – Additional classes
- `onClick?: () => void` – Optional click handler
- `hoverable?: boolean` – Enable hover lift effect

**When to use:**
- Overlay panels (Events, Nodes, Quests)
- Modal dialogs
- Quest cards
- Profile sections
- Any larger content container

---

## Migration Strategy

### Phase 1: Establish Primitives ✅
- [x] Create design tokens in `globals.css`
- [x] Build `GlowChip`, `GlowButton`, `GlowCard` components
- [x] Create demo and documentation

### Phase 2: Refactor Overlays
Replace paper overlays one by one:

1. **QuestsOverlay** (most visible)
   - Replace `.paper-overlay` with `<GlowCard>`
   - Replace `.paper-button` with `<GlowButton>`
   - Replace status badges with `<GlowChip>`

2. **EventsOverlay**
   - Convert header to `<GlowCard>`
   - Update filter buttons to `<GlowButton variant="secondary">`
   - Event cards become `<GlowCard hoverable>`

3. **NodesOverlay**
   - Same pattern as EventsOverlay

4. **DashboardOverlay**
   - Stats section uses `<GlowChip showDot>`
   - Action buttons become `<GlowButton>`

### Phase 3: Navigation & Filters
- Update desktop navbar to capsule buttons
- Mobile bottom nav gets glow treatment
- Filter chips throughout app

### Phase 4: Cleanup
- Remove unused `.paper-*` classes from `globals.css`
- Archive old paper components
- Update any remaining paper references

---

## Example: Quest Card

**Before (Paper UI):**
```tsx
<div className="paper-card">
  <h3>Quest: Twitter Follow</h3>
  <p>Follow @ZoHouse to earn 420 $ZO</p>
  <button className="paper-button">Join Quest</button>
</div>
```

**After (Glow UI):**
```tsx
<GlowCard>
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="text-xl font-bold text-white">Quest: Twitter Follow</h3>
      <GlowChip showDot>Active</GlowChip>
    </div>
    
    <p className="text-gray-300">
      Follow @ZoHouse to earn 420 $ZO tokens.
    </p>
    
    <div className="flex items-center gap-4">
      <GlowChip>420 $ZO</GlowChip>
      <GlowChip>12 Completions</GlowChip>
    </div>
    
    <div className="flex gap-3">
      <GlowButton variant="primary">Join Quest</GlowButton>
      <GlowButton variant="secondary">View Leaderboard</GlowButton>
    </div>
  </div>
</GlowCard>
```

---

## Design Principles

1. **Consistency**: Use the same capsule shape everywhere (rounded-full for chips/buttons, rounded-3xl for cards)

2. **Hierarchy**: 
   - Primary actions = solid red buttons
   - Secondary actions = translucent buttons
   - Info/stats = chips with optional dots

3. **Motion**: 
   - Dot can pulse on hover or data updates
   - Buttons scale slightly on active
   - Cards lift on hover when interactive

4. **Accessibility**:
   - Maintain color contrast (red on translucent white passes WCAG AA)
   - Touch targets minimum 44x44px on mobile
   - Focus states inherit from Tailwind defaults

5. **Performance**:
   - `backdrop-filter: blur()` is GPU-accelerated
   - Reuse same blur values to leverage browser caching
   - Avoid excessive nesting of blurred elements

---

## Testing the System

To see all components in action, temporarily render the demo:

```tsx
import { GlowUIDemo } from '@/components/ui/GlowUIDemo';

// In your page.tsx or any route:
return <GlowUIDemo />;
```

---

## Questions?

- **Can I mix paper and glow?** During migration, yes. Long-term, aim for consistency.
- **What about dark mode?** Current tokens work on dark backgrounds. For light backgrounds, adjust opacity values.
- **Can I customize colors?** Yes, but maintain the red accent (`#ff4d6d`) for brand consistency. Other elements can use different colors if needed.

---

**Last Updated:** November 9, 2025  
**Status:** Phase 1 Complete ✅ | Ready for Phase 2 (Overlay Refactoring)


# Quests Geolocation Implementation Plan

## 📊 Current Database Structure

### Quests Table
Based on the TypeScript interfaces found in `src/lib/supabase.ts`:

```typescript
export interface QuestEntry {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
}
```

**Current Fields:**
- `id` - Unique identifier
- `title` - Quest name
- `description` - Quest details
- `reward` - Points/reward amount
- `status` - `'active'` | `'completed'` | `'developing'`

**Missing Fields for Map Markers:**
- ❌ No latitude
- ❌ No longitude  
- ❌ No location name
- ❌ No address

### Completed Quests Table
Already exists with tracking:
```sql
create table if not exists completed_quests (
  id text primary key default gen_random_uuid()::text,
  wallet_address text unique,
  quest_id text not null,
  completed_at timestamp with time zone default now(),
  transaction_hash text,
  amount numeric(20, 18),
  metadata jsonb,
  created_at timestamp with time zone default now()
);
```

## 🎯 Implementation Plan

### Phase 1: Add Geolocation Fields to Quests Table

#### 1.1 Create Migration SQL
```sql
-- Add geolocation columns to quests table
ALTER TABLE quests 
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT;

-- Add spatial index for performance (if using PostGIS)
CREATE INDEX IF NOT EXISTS idx_quests_location 
  ON quests USING gist (ST_MakePoint(longitude, latitude));

-- Or use regular index
CREATE INDEX IF NOT EXISTS idx_quests_lat_lng 
  ON quests (latitude, longitude);
```

#### 1.2 Update TypeScript Interface
File: `src/lib/supabase.ts`

```typescript
export interface QuestEntry {
  id: string;
  title: string;
  description: string;
  reward: number;
  status: string;
  // New geolocation fields
  latitude?: number;
  longitude?: number;
  location_name?: string;
  address?: string;
  city?: string;
  country?: string;
}
```

### Phase 2: Add Quest Markers to Map

#### 2.1 Update MapCanvas Component
File: `src/components/MapCanvas.tsx`

Add quest markers similar to how event and node markers are added:

```typescript
interface MapCanvasProps {
  events: ParsedEvent[];
  nodes?: PartnerNodeRecord[];
  quests?: QuestEntry[]; // Add this
  // ... rest of props
}

// In MapCanvas component:
const questMarkers = useRef<mapboxgl.Marker[]>([]);

// Create function to add quest markers
const addQuestMarkers = () => {
  if (!map.current || !quests?.length) return;
  
  // Clear existing markers
  questMarkers.current.forEach(marker => {
    try { marker.remove(); } catch (e) { console.warn('Error removing quest marker:', e); }
  });
  questMarkers.current = [];
  
  quests.forEach((quest) => {
    if (!quest.latitude || !quest.longitude) return;
    
    // Create quest marker element (treasure chest icon)
    const markerEl = document.createElement('div');
    markerEl.textContent = '🏆'; // or use '💎', '⭐', '🎯'
    markerEl.style.fontSize = '40px';
    markerEl.style.cursor = 'pointer';
    markerEl.style.filter = 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))';
    
    // Add pulsing animation for active quests
    if (quest.status === 'active') {
      markerEl.style.animation = 'pulse 2s ease-in-out infinite';
    }
    
    const marker = new mapboxgl.Marker(markerEl)
      .setLngLat([quest.longitude, quest.latitude])
      .addTo(map.current!);
    
    // Create popup
    const popupContent = `
      <div style="padding: 0;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 900; color: #000;">
          🏆 ${quest.title}
        </h3>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #1a1a1a;">
          ${quest.description}
        </p>
        <p style="margin: 0 0 6px 0; font-size: 13px; color: #1a1a1a;">
          📍 ${quest.location_name || 'Location'}
        </p>
        <p style="margin: 0 0 12px 0; font-size: 13px; color: #1a1a1a;">
          💰 Reward: ${quest.reward} $ZO
        </p>
        <button 
          onclick="window.openQuestDetails('${quest.id}')" 
          style="width: 100%; padding: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer;"
        >
          View Quest Details
        </button>
      </div>
    `;
    
    const popup = new mapboxgl.Popup({
      className: 'quest-popup',
      closeButton: false,
      closeOnClick: true,
      offset: [0, -20],
      maxWidth: '280px'
    }).setHTML(popupContent);
    
    marker.setPopup(popup);
    
    markerEl.addEventListener('click', () => {
      closeAllPopups();
      marker.togglePopup();
    });
    
    questMarkers.current.push(marker);
  });
};

// Add useEffect to render quest markers
useEffect(() => {
  if (!map.current || !mapLoaded || !quests?.length) return;
  addQuestMarkers();
}, [map.current, mapLoaded, quests]);
```

#### 2.2 Add CSS Animation
File: `src/app/globals.css`

```css
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8));
  }
  50% {
    transform: scale(1.2);
    filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1));
  }
}

.quest-popup .mapboxgl-popup-content {
  background: white;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Phase 3: Fetch and Display Quests on Map

#### 3.1 Update page.tsx
File: `src/app/page.tsx`

```typescript
// Add state for quests
const [quests, setQuests] = useState<QuestEntry[]>([]);

// Fetch quests
useEffect(() => {
  const loadQuests = async () => {
    const questData = await getQuests();
    if (questData) {
      setQuests(questData);
    }
  };
  loadQuests();
}, []);

// Filter quests by location (local/global mode)
const localQuests = useMemo(() => {
  if (!userHomeLat || !userHomeLng) return quests;
  
  return quests.filter(quest => {
    if (!quest.latitude || !quest.longitude) return false;
    return isWithinRadius(userHomeLat, userHomeLng, quest.latitude, quest.longitude, LOCAL_RADIUS_KM);
  });
}, [quests, userHomeLat, userHomeLng]);

const displayedQuests = mapViewMode === 'local' ? localQuests : quests;
```

#### 3.2 Pass to MapCanvas
```typescript
<MapCanvas 
  events={displayedEvents}
  nodes={displayedNodes}
  quests={displayedQuests} // Add this
  shouldAnimateFromSpace={shouldAnimateFromSpace}
  // ... other props
/>
```

### Phase 4: Manually Add Geolocation to Existing Quests

You can add locations to quests in Supabase dashboard or create a script:

```sql
-- Example: Update specific quests with location data
UPDATE quests 
SET 
  latitude = 37.7817309,
  longitude = -122.401198,
  location_name = 'Zo House SF',
  address = '300 4th St',
  city = 'San Francisco',
  country = 'USA'
WHERE id = 'quest-id-here';

-- For quests tied to nodes/events, you could join and copy locations
UPDATE quests q
SET 
  latitude = n.latitude,
  longitude = n.longitude,
  location_name = n.name,
  address = n.address
FROM partner_nodes n
WHERE q.related_node_id = n.id; -- if you have this relationship
```

## 🚀 Quick Start Steps

1. **Run Migration:**
   ```bash
   # Execute the ALTER TABLE SQL in Supabase SQL Editor
   ```

2. **Update TypeScript Interface:**
   ```bash
   # Update src/lib/supabase.ts with new fields
   ```

3. **Add Quest Markers:**
   ```bash
   # Update MapCanvas.tsx with quest marker logic
   ```

4. **Test with Sample Data:**
   ```sql
   INSERT INTO quests (id, title, description, reward, status, latitude, longitude, location_name)
   VALUES (
     'quest-sf-test',
     'Visit Zo House SF',
     'Check in at the original crypto hub',
     500,
     'active',
     37.7817309,
     -122.401198,
     'Zo House San Francisco'
   );
   ```

5. **Verify on Map:**
   - Load the app
   - Look for 🏆 marker at Zo House SF location
   - Click to see quest details

## 📝 Notes

- **Icon Options:** 🏆 💎 ⭐ 🎯 🎁 💰 🗺️
- **Color Coding:**
  - Active quests: Gold/Yellow glow
  - Completed: Green checkmark
  - Developing: Gray/disabled
  
- **Future Enhancements:**
  - Quest chains (multiple locations)
  - AR/proximity detection
  - Heatmap of quest density
  - Filter quests by category

## ❓ Questions to Answer

1. Should quests be tied to specific nodes/events, or independent?
2. Can quests have multiple locations (quest chains)?
3. Should there be quest categories (social, on-chain, IRL)?
4. Should quests expire or be time-limited?
5. Do quests need difficulty levels?


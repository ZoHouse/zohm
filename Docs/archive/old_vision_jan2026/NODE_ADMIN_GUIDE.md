# Node Management Admin Guide

## Overview

This document outlines the database schema, types, and requirements for building/updating the Node Management Admin page to support the new city coordination layer with **18 node types** and **13 zone types**.

---

## Database Schema

### `nodes` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique identifier (e.g., `blrxzo`) |
| `name` | TEXT | Display name (e.g., "BLRxZo") |
| `type` | TEXT | One of 18 node types (see below) |
| `status` | TEXT | `active`, `developing`, or `planning` |
| `description` | TEXT | Node description |
| `city` | TEXT | City name |
| `country` | TEXT | Country name |
| `latitude` | FLOAT | GPS latitude |
| `longitude` | FLOAT | GPS longitude |
| `website` | TEXT | Website URL (optional) |
| `twitter` | TEXT | Twitter handle (optional) |
| `instagram` | TEXT | Instagram handle (optional) |
| `phone` | TEXT | Contact phone (optional) |
| `address` | TEXT | Physical address (optional) |
| `logo` | TEXT | Logo URL (optional) |
| `image` | TEXT | Cover image URL (optional) |
| `contact_email` | TEXT | Contact email (optional) |
| `opening_hours` | JSONB | Opening hours object (optional) |
| `metadata` | JSONB | Additional metadata (optional) |
| `created_at` | TIMESTAMP | Auto-generated |
| `updated_at` | TIMESTAMP | Auto-generated |

### `node_zones` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Auto-generated UUID |
| `node_id` | TEXT (FK) | References `nodes.id` |
| `zone_type` | TEXT | One of 13 zone types (see below) |
| `name` | TEXT | Custom zone name (optional) |
| `description` | TEXT | Zone description (optional) |
| `capacity` | INTEGER | Max capacity (optional) |
| `floor` | TEXT | Floor location (optional) |
| `is_available` | BOOLEAN | Currently available (default: true) |
| `availability_notes` | TEXT | Availability notes (optional) |
| `metadata` | JSONB | Additional metadata (optional) |
| `created_at` | TIMESTAMP | Auto-generated |
| `updated_at` | TIMESTAMP | Auto-generated |

**Constraint:** `UNIQUE(node_id, zone_type)` - One zone type per node

---

## Node Types (18)

| Type | Icon | Display Name | Description |
|------|------|--------------|-------------|
| `zo_house` | 🏠 (GIF) | Zo House | Zo-owned creative hub |
| `zostel` | 🏨 (Logo) | Zostel | Zostel partner location |
| `food` | 🍱 | Food | Restaurant/cafe |
| `stay` | 🛏️ | Stay | Accommodation |
| `park` | 🌳 | Park | Public park/garden |
| `hospital` | 🏥 | Hospital | Medical facility |
| `fire_station` | 🧯 | Fire Station | Emergency services |
| `post_office` | 📮 | Post Office | Postal services |
| `bar` | 🍺 | Bar | Bar/pub |
| `metro` | 🚊 | Metro | Metro/train station |
| `airport` | ✈️ | Airport | Airport |
| `shopping` | 🛍️ | Shopping | Shopping center/mall |
| `art` | 🎨 | Art | Art gallery/museum |
| `sports_arena` | 🏟️ | Sports Arena | Sports venue |
| `arcade` | 🕹️ | Arcade | Gaming arcade |
| `library` | 📚 | Library | Library |
| `gym` | 🏋️ | Gym | Fitness center |
| `startup_hub` | 👨‍💻 | Startup Hub | Coworking/startup space |

### TypeScript Type

```typescript
type NodeType = 
  | 'zo_house' 
  | 'zostel' 
  | 'food' 
  | 'stay' 
  | 'park' 
  | 'hospital' 
  | 'fire_station' 
  | 'post_office' 
  | 'bar' 
  | 'metro' 
  | 'airport' 
  | 'shopping' 
  | 'art' 
  | 'sports_arena' 
  | 'arcade' 
  | 'library' 
  | 'gym' 
  | 'startup_hub';
```

---

## Zone Types (13)

| Type | Display Name | Description |
|------|--------------|-------------|
| `schelling_point` | Schelling Point | Coordination/meeting space |
| `degen_lounge` | Degen Lounge | Social/trading culture space |
| `zo_studio` | Zo Studio | Recording/production facility |
| `flo_zone` | Flo Zone | Deep work/flow state workspace |
| `liquidity_pool` | Liquidity Pool | Pool/water feature |
| `multiverse` | Multiverse | Multi-purpose flex space |
| `battlefield` | Battlefield | Competition/sports area |
| `bio_hack` | Bio Hack | Health/fitness/biohacking |
| `zo_cafe` | Zo Cafe | Food/coffee service |
| `420` | 420 | Smoking-friendly space |
| `showcase` | Showcase | Exhibition/display area |
| `dorms` | Dorms | Shared accommodation |
| `private_rooms` | Private Rooms | Private accommodation |

### TypeScript Type

```typescript
type ZoneType = 
  | 'schelling_point' 
  | 'degen_lounge' 
  | 'zo_studio' 
  | 'flo_zone' 
  | 'liquidity_pool' 
  | 'multiverse' 
  | 'battlefield' 
  | 'bio_hack' 
  | 'zo_cafe' 
  | '420' 
  | 'showcase' 
  | 'dorms' 
  | 'private_rooms';
```

---

## Admin Page Requirements

### 1. Node List View

Display all nodes with:
- Node name + type icon
- City, Country
- Status badge (active/developing/planning)
- Zone count
- Quick actions: Edit, Delete, View on Map

**Filters:**
- By type (dropdown with all 18 types)
- By status (active/developing/planning)
- By city
- Search by name

### 2. Node Create/Edit Form

#### Basic Info Section
```
┌─────────────────────────────────────────────────┐
│ Node ID*        [blrxzo________________]        │
│ Name*           [BLRxZo__________________]      │
│ Type*           [dropdown: 18 types_____]      │
│ Status*         [dropdown: active/dev/plan]    │
│ Description     [textarea________________]      │
└─────────────────────────────────────────────────┘
```

#### Location Section
```
┌─────────────────────────────────────────────────┐
│ City*           [Bangalore______________]       │
│ Country*        [India__________________]       │
│ Address         [33, 80 Feet Rd, Koramangala__]│
│ Latitude*       [12.93304321____________]       │
│ Longitude*      [77.63463846____________]       │
│                                                 │
│ [📍 Pick on Map]  [🔍 Geocode Address]         │
└─────────────────────────────────────────────────┘
```

#### Contact Section
```
┌─────────────────────────────────────────────────┐
│ Website         [https://zo.xyz_________]       │
│ Email           [hello@zo.xyz___________]       │
│ Phone           [+91 80 4567 8900_______]       │
│ Instagram       [@zo.house______________]       │
│ Twitter         [@zo_house______________]       │
└─────────────────────────────────────────────────┘
```

#### Media Section
```
┌─────────────────────────────────────────────────┐
│ Logo URL        [/logos/zo-house.svg____]       │
│ Cover Image     [Upload or URL__________]       │
└─────────────────────────────────────────────────┘
```

#### Opening Hours Section
```
┌─────────────────────────────────────────────────┐
│ Monday      [09:00] - [22:00]  ☑ Open          │
│ Tuesday     [09:00] - [22:00]  ☑ Open          │
│ Wednesday   [09:00] - [22:00]  ☑ Open          │
│ Thursday    [09:00] - [22:00]  ☑ Open          │
│ Friday      [09:00] - [23:00]  ☑ Open          │
│ Saturday    [10:00] - [23:00]  ☑ Open          │
│ Sunday      [10:00] - [22:00]  ☑ Open          │
└─────────────────────────────────────────────────┘
```

### 3. Zone Management (Sub-section of Node Edit)

#### Zone List for Node
```
┌─────────────────────────────────────────────────────────────┐
│ Zones for BLRxZo                              [+ Add Zone]  │
├─────────────────────────────────────────────────────────────┤
│ ☑ Schelling Point  │ The Schelling Point │ Cap: 100 │ GF   │
│ ☑ Degen Lounge     │ Degen Lounge        │ Cap: 30  │ GF   │
│ ☑ Zo Studio        │ Zo Studio           │ Cap: 6   │ 1F   │
│ ☑ Flo Zone         │ Flo Zone            │ Cap: 40  │ 1F   │
│ ☐ Liquidity Pool   │ Liquidity Pool      │ Cap: 20  │ RF   │
│ ... (expandable)                                            │
└─────────────────────────────────────────────────────────────┘
```

#### Zone Add/Edit Modal
```
┌─────────────────────────────────────────────────┐
│ Add Zone to BLRxZo                          ✕  │
├─────────────────────────────────────────────────┤
│ Zone Type*      [dropdown: 13 types_____]      │
│ Custom Name     [The Schelling Point____]      │
│ Description     [textarea________________]      │
│ Capacity        [100____________________]      │
│ Floor           [Ground Floor___________]      │
│ Available       [✓]                            │
│ Notes           [textarea________________]      │
├─────────────────────────────────────────────────┤
│                      [Cancel]  [Save Zone]     │
└─────────────────────────────────────────────────┘
```

---

## API Endpoints Needed

### Nodes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/nodes` | List all nodes (with zone counts) |
| GET | `/api/admin/nodes/[id]` | Get single node with zones |
| POST | `/api/admin/nodes` | Create new node |
| PUT | `/api/admin/nodes/[id]` | Update node |
| DELETE | `/api/admin/nodes/[id]` | Delete node (cascades to zones) |

### Zones

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/nodes/[id]/zones` | List zones for node |
| POST | `/api/admin/nodes/[id]/zones` | Add zone to node |
| PUT | `/api/admin/zones/[zoneId]` | Update zone |
| DELETE | `/api/admin/zones/[zoneId]` | Delete zone |

### Bulk Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/nodes/[id]/zones/bulk` | Add multiple zones at once |
| DELETE | `/api/admin/nodes/bulk` | Delete multiple nodes |

---

## Example API Payloads

### Create Node

```json
POST /api/admin/nodes
{
  "id": "blrxzo",
  "name": "BLRxZo",
  "type": "zo_house",
  "status": "active",
  "description": "The flagship Zo House in Koramangala, Bangalore.",
  "city": "Bangalore",
  "country": "India",
  "latitude": 12.93304321,
  "longitude": 77.63463846,
  "address": "33, 80 Feet Rd, Koramangala 4th Block",
  "website": "https://zo.xyz",
  "instagram": "@zo.house",
  "phone": "+91 80 4567 8900",
  "opening_hours": {
    "monday": "09:00-22:00",
    "tuesday": "09:00-22:00",
    "wednesday": "09:00-22:00",
    "thursday": "09:00-22:00",
    "friday": "09:00-23:00",
    "saturday": "10:00-23:00",
    "sunday": "10:00-22:00"
  }
}
```

### Add Zone

```json
POST /api/admin/nodes/blrxzo/zones
{
  "zone_type": "schelling_point",
  "name": "The Schelling Point",
  "description": "Main coordination and event space.",
  "capacity": 100,
  "floor": "Ground Floor",
  "is_available": true
}
```

### Bulk Add Zones

```json
POST /api/admin/nodes/blrxzo/zones/bulk
{
  "zones": [
    { "zone_type": "schelling_point", "name": "The Schelling Point", "capacity": 100 },
    { "zone_type": "degen_lounge", "name": "Degen Lounge", "capacity": 30 },
    { "zone_type": "zo_cafe", "name": "Zo Cafe", "capacity": 35 }
  ]
}
```

---

## Supabase Queries Reference

### Get all nodes with zone counts

```typescript
const { data, error } = await supabase
  .from('nodes')
  .select(`
    *,
    zones:node_zones(count)
  `)
  .order('name');
```

### Get single node with all zones

```typescript
const { data, error } = await supabase
  .from('nodes')
  .select(`
    *,
    zones:node_zones(*)
  `)
  .eq('id', nodeId)
  .single();
```

### Create node

```typescript
const { data, error } = await supabase
  .from('nodes')
  .insert(nodeData)
  .select()
  .single();
```

### Add zone to node

```typescript
const { data, error } = await supabase
  .from('node_zones')
  .insert({
    node_id: nodeId,
    zone_type: 'schelling_point',
    name: 'The Schelling Point',
    capacity: 100
  })
  .select()
  .single();
```

### Update zone availability

```typescript
const { data, error } = await supabase
  .from('node_zones')
  .update({ is_available: false, availability_notes: 'Under renovation' })
  .eq('id', zoneId);
```

### Delete node (zones cascade automatically)

```typescript
const { error } = await supabase
  .from('nodes')
  .delete()
  .eq('id', nodeId);
```

---

## Existing Code References

### Type Definitions
- `apps/web/src/lib/nodeTypes.ts` - All node/zone types and helper functions

### Database Functions
- `apps/web/src/lib/supabase.ts` - Contains:
  - `getNodesFromDB()` - Fetch all nodes
  - `getNodeZones(nodeId)` - Fetch zones for a node
  - `getAllNodeZones()` - Fetch all zones
  - `getNodesWithZones()` - Fetch nodes with their zones

### UI Components
- `apps/web/src/components/NodesOverlay.tsx` - Public nodes list
- `apps/web/src/components/MobileNodesListOverlay.tsx` - Mobile nodes list

---

## Admin Page File Structure (Suggested)

```
apps/web/src/app/admin/
├── nodes/
│   ├── page.tsx              # Node list view
│   ├── [id]/
│   │   ├── page.tsx          # Node edit view
│   │   └── zones/
│   │       └── page.tsx      # Zone management
│   └── new/
│       └── page.tsx          # Create new node
└── components/
    ├── NodeForm.tsx          # Node create/edit form
    ├── NodeList.tsx          # Node list component
    ├── ZoneList.tsx          # Zone list for a node
    ├── ZoneForm.tsx          # Zone add/edit modal
    └── NodeTypeSelect.tsx    # Type selector with icons
```

---

## Current Data

### BLRxZo (Zo House Bangalore)

**Node:**
- ID: `blrxzo`
- Type: `zo_house`
- Status: `active`
- Location: 12.93304321, 77.63463846
- City: Bangalore, India

**Zones (13):**
1. Schelling Point - Ground Floor, Cap: 100
2. Degen Lounge - Ground Floor, Cap: 30
3. Zo Studio - 1st Floor, Cap: 6
4. Flo Zone - 1st Floor, Cap: 40
5. Liquidity Pool - Rooftop, Cap: 20
6. Multiverse - 2nd Floor, Cap: 25
7. Battlefield - Basement, Cap: 16
8. Bio Hack - Ground Floor, Cap: 8
9. Zo Cafe - Ground Floor, Cap: 35
10. 420 - Terrace, Cap: 10
11. Showcase - Ground Floor, Cap: 40
12. Dorms - 3rd Floor, Cap: 24
13. Private Rooms - 3rd Floor, Cap: 12

---

## RLS Policies (Already Applied)

```sql
-- Public read access (for map display)
CREATE POLICY "Public can read nodes" ON nodes FOR SELECT USING (true);
CREATE POLICY "Public can read node_zones" ON node_zones FOR SELECT USING (true);

-- Admin write access (add these for admin page)
CREATE POLICY "Admin can insert nodes" ON nodes FOR INSERT WITH CHECK (auth.role() = 'admin');
CREATE POLICY "Admin can update nodes" ON nodes FOR UPDATE USING (auth.role() = 'admin');
CREATE POLICY "Admin can delete nodes" ON nodes FOR DELETE USING (auth.role() = 'admin');

-- Same for node_zones...
```

---

## Questions to Consider

1. **Authentication:** How will admin access be controlled? (Privy roles? Supabase auth?)
2. **Image uploads:** Use Supabase Storage or external CDN?
3. **Geocoding:** Integrate Mapbox geocoding for address → coordinates?
4. **Validation:** What fields are truly required vs optional?
5. **Audit trail:** Track who created/modified nodes?

---

*Last Updated: 2025-01-21*

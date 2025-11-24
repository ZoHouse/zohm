# 🏠 Node Management Scripts

Programmatically manage Zo House nodes in the database.

---

## 📋 Quick Start

### 1️⃣ **Add Deepak's Zo House** (From Google Maps Link)

```bash
node scripts/add-node.mjs \
  --url "https://maps.app.goo.gl/6TKeKZSGH7fBF5f29?g_st=ipc" \
  --name "Deepak's Zo House"
```

✅ **Automatically extracts:**
- Latitude & Longitude from Google Maps
- City & Country (via reverse geocoding)
- Full address

---

### 2️⃣ **Add Node** (Manual Coordinates)

```bash
node scripts/add-node.mjs \
  --lat 12.932658 \
  --lng 77.634402 \
  --name "My Zo House" \
  --city "Bangalore" \
  --country "India"
```

---

### 3️⃣ **List All Nodes**

```bash
# List all nodes
node scripts/list-nodes.mjs

# Filter by city
node scripts/list-nodes.mjs --city "Bangalore"

# Filter by type
node scripts/list-nodes.mjs --type "culture_house"
```

---

### 4️⃣ **Delete a Node**

```bash
node scripts/delete-node.mjs --id "deepak-zo-house"
```

---

## 🛠️ Setup

### Install Dependencies

```bash
npm install @supabase/supabase-js
```

### Environment Variables

Ensure your `.env.local` has:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token  # Optional, for address lookup
```

---

## 📖 Full Options

### `add-node.mjs`

**Required:**
- `--name` - Node name (e.g., "Deepak's Zo House")

**Location (choose one):**
- `--url` - Google Maps link (auto-extracts coordinates)
- `--lat` + `--lng` - Manual coordinates

**Optional:**
- `--city` - City name (auto-detected if not provided)
- `--country` - Country name (auto-detected if not provided)
- `--type` - Node type: `culture_house` (default), `hacker_space`, `schelling_point`, `flo_zone`, `staynode`
- `--description` - Custom description
- `--website` - Website URL
- `--twitter` - Twitter handle (without @)
- `--email` - Contact email
- `--status` - Status: `active` (default), `developing`, `planning`
- `--image` - Image URL
- `--features` - Comma-separated features (e.g., "coworking,coliving,events")

**Examples:**

```bash
# Full example with all options
node scripts/add-node.mjs \
  --url "https://maps.app.goo.gl/..." \
  --name "Deepak's Zo House" \
  --type "culture_house" \
  --description "Community hub and coworking space" \
  --website "https://deepak.zo.house" \
  --twitter "deepakzohouse" \
  --email "deepak@zo.house" \
  --features "coworking,coliving,events,blockchain"

# Quick add (minimal)
node scripts/add-node.mjs \
  --url "https://maps.app.goo.gl/..." \
  --name "Quick Node"
```

---

### `list-nodes.mjs`

**Optional Filters:**
- `--city` - Filter by city
- `--type` - Filter by type
- `--status` - Filter by status

**Examples:**

```bash
# All nodes
node scripts/list-nodes.mjs

# Only Bangalore nodes
node scripts/list-nodes.mjs --city "Bangalore"

# Only active culture houses
node scripts/list-nodes.mjs --type "culture_house" --status "active"
```

---

### `delete-node.mjs`

**Required:**
- `--id` - Node ID (slug, e.g., "deepak-zo-house")

**Example:**

```bash
node scripts/delete-node.mjs --id "deepak-zo-house"
```

---

## 🗺️ How It Works

### 1. Google Maps URL Processing

The script:
1. Follows the shortened `maps.app.goo.gl` redirect
2. Extracts coordinates from the full URL (e.g., `@12.932,77.634,15z`)
3. Reverse geocodes to get city/country (via Mapbox API)

### 2. Database Insertion

Inserts into `nodes` table with:
```sql
{
  id: 'deepak-zo-house',           -- Auto-generated slug
  name: "Deepak's Zo House",
  type: 'culture_house',
  latitude: 12.932658,
  longitude: 77.634402,
  city: 'Bangalore',
  country: 'India',
  status: 'active',
  features: ['coworking', 'events'],
  inserted_at: '2025-11-17T...',
  updated_at: '2025-11-17T...'
}
```

### 3. Map Display

Node appears automatically on the map at:
- Desktop: Right sidebar "Nodes" section
- Mobile: Bottom nav → Nodes
- Map: Unicorn marker with Zo logo

---

## 🐛 Troubleshooting

### "Could not extract coordinates from URL"

**Fix 1:** Use direct coordinates instead:
```bash
node scripts/add-node.mjs \
  --lat 12.932658 \
  --lng 77.634402 \
  --name "My Node" \
  --city "Bangalore" \
  --country "India"
```

**Fix 2:** Get coordinates manually:
1. Open Google Maps link
2. Right-click on location → "What's here?"
3. Copy the latitude/longitude

### "Missing Supabase credentials"

Make sure `.env.local` has:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
```

### Node doesn't appear on map

1. **Restart dev server** (`npm run dev`)
2. **Hard refresh** browser (Cmd+Shift+R / Ctrl+Shift+R)
3. **Check database:**
   ```bash
   node scripts/list-nodes.mjs
   ```

---

## 📊 Node Types

| Type | Description | Example |
|------|-------------|---------|
| `culture_house` | Community hub, events space | Zo House SF, Deepak's |
| `hacker_space` | Tech-focused coworking | Web3 Hacker House |
| `schelling_point` | Coordination meetup spot | Conference venue |
| `flo_zone` | Flow state workspace | Quiet library space |
| `staynode` | Coliving + coworking | Zostel, Outsite |

---

## 🚀 Next Steps

After adding a node:

1. **View on map:**
   - Open `http://localhost:3001`
   - Click "Nodes" in nav
   - Look for your new node!

2. **Add to hardcoded list** (for immediate visibility):
   - Edit `apps/web/src/components/MapCanvas.tsx`
   - Add to `ZO_HOUSES` array (line 22)

3. **Add image:**
   - Upload image to `/public/nodes/`
   - Update node: `--image "/nodes/deepak-house.jpg"`

4. **Create quest:**
   - Link node to a "Visit Node" quest
   - Award tokens for checking in

---

## 💡 Pro Tips

1. **Batch Add Nodes:**
   ```bash
   # Create a shell script
   for node in "Node1" "Node2" "Node3"; do
     node scripts/add-node.mjs --lat X --lng Y --name "$node" --city "City"
   done
   ```

2. **Export to CSV:**
   ```bash
   node scripts/list-nodes.mjs | grep "Name:" | cut -d: -f2 > nodes.csv
   ```

3. **Backup Before Delete:**
   ```bash
   node scripts/list-nodes.mjs > nodes_backup.txt
   node scripts/delete-node.mjs --id "old-node"
   ```

---

## 🎯 Summary

**Quick Add Deepak's Zo House:**

```bash
node scripts/add-node.mjs \
  --url "https://maps.app.goo.gl/6TKeKZSGH7fBF5f29?g_st=ipc" \
  --name "Deepak's Zo House"
```

Done! 🎉


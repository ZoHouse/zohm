-- ============================================
-- MIGRATION: Nodes & Zones v2
-- Purpose: Implement city coordination layer
-- Date: 2025-01-21
-- ============================================

-- ============================================
-- STEP 1: Add new columns to nodes table
-- ============================================

ALTER TABLE nodes ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS opening_hours JSONB DEFAULT '{}';
ALTER TABLE nodes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- ============================================
-- STEP 2: Replace ENUM column with TEXT column
-- (Since table is empty, we can drop and recreate)
-- ============================================

-- Drop the type column entirely (it uses an ENUM)
ALTER TABLE nodes DROP COLUMN IF EXISTS type;

-- Recreate as TEXT with check constraint
ALTER TABLE nodes ADD COLUMN type TEXT NOT NULL DEFAULT 'zo_house';

-- Add check constraint for allowed types
ALTER TABLE nodes ADD CONSTRAINT nodes_type_check CHECK (
  type IN (
    'zo_house',
    'zostel',
    'food',
    'stay',
    'park',
    'hospital',
    'fire_station',
    'post_office',
    'bar',
    'metro',
    'airport',
    'shopping',
    'art',
    'sports_arena',
    'arcade',
    'library',
    'gym',
    'startup_hub'
  )
);

-- Drop the old enum type (cleanup)
DROP TYPE IF EXISTS node_type;

-- ============================================
-- STEP 4: Create node_zones table
-- ============================================

CREATE TABLE IF NOT EXISTS node_zones (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Key
  node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
  
  -- Zone Type
  zone_type TEXT NOT NULL,
  
  -- Zone Details
  name TEXT,
  description TEXT,
  capacity INTEGER,
  floor TEXT,
  
  -- Availability
  is_available BOOLEAN DEFAULT TRUE,
  availability_notes TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- One zone type per node
  UNIQUE(node_id, zone_type)
);

-- Zone type constraint (13 types)
ALTER TABLE node_zones ADD CONSTRAINT node_zones_type_check CHECK (
  zone_type IN (
    'schelling_point',
    'degen_lounge',
    'zo_studio',
    'flo_zone',
    'liquidity_pool',
    'multiverse',
    'battlefield',
    'bio_hack',
    'zo_cafe',
    '420',
    'showcase',
    'dorms',
    'private_rooms'
  )
);

-- ============================================
-- STEP 5: Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_node_zones_node_id ON node_zones(node_id);
CREATE INDEX IF NOT EXISTS idx_node_zones_type ON node_zones(zone_type);
CREATE INDEX IF NOT EXISTS idx_node_zones_available ON node_zones(is_available) WHERE is_available = TRUE;

-- ============================================
-- STEP 6: Migrate features to zones (best effort)
-- ============================================

-- Create zones based on existing features array
INSERT INTO node_zones (node_id, zone_type)
SELECT id, 'zo_cafe' FROM nodes 
WHERE 'cafe' = ANY(features) OR 'food' = ANY(features)
ON CONFLICT (node_id, zone_type) DO NOTHING;

INSERT INTO node_zones (node_id, zone_type)
SELECT id, 'flo_zone' FROM nodes 
WHERE 'coworking' = ANY(features) OR 'workspace' = ANY(features)
ON CONFLICT (node_id, zone_type) DO NOTHING;

INSERT INTO node_zones (node_id, zone_type)
SELECT id, 'dorms' FROM nodes 
WHERE 'coliving' = ANY(features) OR 'dorms' = ANY(features)
ON CONFLICT (node_id, zone_type) DO NOTHING;

INSERT INTO node_zones (node_id, zone_type)
SELECT id, 'schelling_point' FROM nodes 
WHERE 'events' = ANY(features)
ON CONFLICT (node_id, zone_type) DO NOTHING;

-- ============================================
-- STEP 7: Drop features column (replaced by node_zones)
-- ============================================

ALTER TABLE nodes DROP COLUMN IF EXISTS features;

-- ============================================
-- DONE
-- ============================================

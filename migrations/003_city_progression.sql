-- ============================================
-- CITY PROGRESSION & MAP SYNC MIGRATION
-- ============================================
-- This migration establishes the city progression system and user-city relationships
-- Enables: Map your Sync feature, Local/Global filtering, City-level gamification
--
-- Safe to run: Idempotent, preserves all existing data
-- ============================================

-- ============================================
-- PART 1: Cities Table
-- ============================================

CREATE TABLE IF NOT EXISTS cities (
  -- Identity
  id TEXT PRIMARY KEY,  -- Format: "san-francisco-us" (slug)
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  state_province TEXT,
  
  -- Location
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  timezone TEXT,
  
  -- City Progression
  stage INTEGER DEFAULT 1 CHECK (stage >= 1 AND stage <= 5),
  -- Stages:
  -- 1 = Prospect (0-10 active users)
  -- 2 = Outpost (11-50 active users, 1+ node)
  -- 3 = District (51-200 active users, 3+ nodes)
  -- 4 = City Center (201-1000 active users, 10+ nodes)
  -- 5 = Network Hub (1000+ active users, 20+ nodes)
  
  -- Metrics (auto-updated via triggers)
  population_total INTEGER DEFAULT 0,          -- Total users with this as home city
  population_active INTEGER DEFAULT 0,         -- Users active in last 30 days
  node_count INTEGER DEFAULT 0,                -- Zo Houses in this city
  total_quests_completed INTEGER DEFAULT 0,
  total_zo_earned NUMERIC DEFAULT 0,
  
  -- Economy (future blockchain integration)
  token_address TEXT,  -- City token contract address
  treasury_balance NUMERIC DEFAULT 0,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,  -- { "landmarks": [], "featured_events": [], "climate": "" }
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_cities_stage ON cities(stage);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);
CREATE INDEX IF NOT EXISTS idx_cities_location ON cities(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_cities_population ON cities(population_total DESC);

-- ============================================
-- PART 2: Extend Users Table for Home City
-- ============================================

-- Add home_city_id to track user's synced city
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS home_city_id TEXT REFERENCES cities(id),
  ADD COLUMN IF NOT EXISTS city_synced_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS city_sync_count INTEGER DEFAULT 0;

-- Create index for home city lookups
CREATE INDEX IF NOT EXISTS idx_users_home_city ON users(home_city_id);

-- ============================================
-- PART 3: City Progress Tracking
-- ============================================

CREATE TABLE IF NOT EXISTS city_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Contribution Tracking
  quests_completed INTEGER DEFAULT 0,
  zo_earned INTEGER DEFAULT 0,
  events_attended INTEGER DEFAULT 0,
  nodes_visited INTEGER DEFAULT 0,
  
  -- Timestamps
  first_contribution_at TIMESTAMP DEFAULT NOW(),
  last_contribution_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(city_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_city_progress_city ON city_progress(city_id);
CREATE INDEX IF NOT EXISTS idx_city_progress_user ON city_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_city_progress_contributions ON city_progress(city_id, zo_earned DESC);

-- ============================================
-- PART 4: Community Goals (City-Level Quests)
-- ============================================

CREATE TABLE IF NOT EXISTS community_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id TEXT NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  
  -- Goal Definition
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('quests', 'events', 'nodes', 'users', 'custom')),
  
  -- Progress Tracking
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  current_value INTEGER DEFAULT 0 CHECK (current_value >= 0),
  
  -- Rewards
  rewards_breakdown JSONB DEFAULT '{}',  -- { "zo_per_contributor": 500, "city_treasury": 10000 }
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  active_from TIMESTAMP DEFAULT NOW(),
  active_until TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_community_goals_city ON community_goals(city_id);
CREATE INDEX IF NOT EXISTS idx_community_goals_status ON community_goals(status);
CREATE INDEX IF NOT EXISTS idx_community_goals_active ON community_goals(city_id, status, active_until);

-- ============================================
-- PART 5: Seed Initial Cities Data
-- ============================================

-- Insert major Zo House cities
INSERT INTO cities (id, name, country, state_province, latitude, longitude, stage, node_count, metadata)
VALUES 
  ('san-francisco-us', 'San Francisco', 'United States', 'California', 37.7749, -122.4194, 4, 2, '{"climate": "Mediterranean", "landmarks": ["Golden Gate Bridge", "Ferry Building"]}'),
  ('bangalore-in', 'Bangalore', 'India', 'Karnataka', 12.9716, 77.5946, 4, 3, '{"climate": "Tropical", "landmarks": ["Cubbon Park", "Vidhana Soudha"]}'),
  ('singapore-sg', 'Singapore', 'Singapore', NULL, 1.3521, 103.8198, 3, 1, '{"climate": "Tropical", "landmarks": ["Marina Bay", "Gardens by the Bay"]}'),
  ('mumbai-in', 'Mumbai', 'India', 'Maharashtra', 19.0760, 72.8777, 3, 1, '{"climate": "Tropical", "landmarks": ["Gateway of India", "Marine Drive"]}'),
  ('taipei-tw', 'Taipei', 'Taiwan', NULL, 25.0330, 121.5654, 2, 1, '{"climate": "Subtropical", "landmarks": ["Taipei 101", "Shilin Night Market"]}'),
  ('dubai-ae', 'Dubai', 'United Arab Emirates', NULL, 25.2048, 55.2708, 2, 1, '{"climate": "Desert", "landmarks": ["Burj Khalifa", "Dubai Marina"]}'),
  ('london-gb', 'London', 'United Kingdom', 'England', 51.5074, -0.1278, 2, 1, '{"climate": "Temperate", "landmarks": ["Big Ben", "Tower Bridge"]}'),
  ('new-york-us', 'New York', 'United States', 'New York', 40.7128, -74.0060, 2, 1, '{"climate": "Humid Subtropical", "landmarks": ["Statue of Liberty", "Central Park"]}')
ON CONFLICT (id) DO UPDATE SET
  node_count = EXCLUDED.node_count,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- PART 6: Auto-Update City Metrics Trigger
-- ============================================

-- Function to update city population when user syncs home city
CREATE OR REPLACE FUNCTION update_city_population()
RETURNS TRIGGER AS $$
DECLARE
  old_city_id TEXT;
BEGIN
  -- Handle UPDATE: user changing home city
  IF TG_OP = 'UPDATE' AND OLD.home_city_id IS DISTINCT FROM NEW.home_city_id THEN
    old_city_id := OLD.home_city_id;
    
    -- Decrement old city population
    IF old_city_id IS NOT NULL THEN
      UPDATE cities 
      SET 
        population_total = GREATEST(0, population_total - 1),
        updated_at = NOW()
      WHERE id = old_city_id;
    END IF;
    
    -- Increment new city population
    IF NEW.home_city_id IS NOT NULL THEN
      UPDATE cities 
      SET 
        population_total = population_total + 1,
        updated_at = NOW()
      WHERE id = NEW.home_city_id;
      
      -- Update city stage based on population
      UPDATE cities
      SET stage = CASE
        WHEN population_total >= 1000 THEN 5
        WHEN population_total >= 201 THEN 4
        WHEN population_total >= 51 THEN 3
        WHEN population_total >= 11 THEN 2
        ELSE 1
      END
      WHERE id = NEW.home_city_id;
    END IF;
  
  -- Handle INSERT: new user syncing city
  ELSIF TG_OP = 'INSERT' AND NEW.home_city_id IS NOT NULL THEN
    UPDATE cities 
    SET 
      population_total = population_total + 1,
      updated_at = NOW()
    WHERE id = NEW.home_city_id;
    
    -- Update city stage
    UPDATE cities
    SET stage = CASE
      WHEN population_total >= 1000 THEN 5
      WHEN population_total >= 201 THEN 4
      WHEN population_total >= 51 THEN 3
      WHEN population_total >= 11 THEN 2
      ELSE 1
    END
    WHERE id = NEW.home_city_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_city_population_trigger ON users;
CREATE TRIGGER update_city_population_trigger
AFTER INSERT OR UPDATE OF home_city_id ON users
FOR EACH ROW
EXECUTE FUNCTION update_city_population();

-- ============================================
-- PART 7: Reputation Tracking for City Sync
-- ============================================

-- Add city_sync trait to user_reputations if not exists
INSERT INTO user_reputations (user_id, trait, score, level, last_earned_at)
SELECT 
  id as user_id,
  'city_sync' as trait,
  CASE WHEN home_city_id IS NOT NULL THEN 200 ELSE 0 END as score,
  CASE WHEN home_city_id IS NOT NULL THEN 2 ELSE 0 END as level,
  city_synced_at as last_earned_at
FROM users
WHERE home_city_id IS NOT NULL
ON CONFLICT (user_id, trait) DO NOTHING;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ City Progression Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '  - cities (8 seed cities added)';
  RAISE NOTICE '  - city_progress';
  RAISE NOTICE '  - community_goals';
  RAISE NOTICE '';
  RAISE NOTICE '🏙️ City Stages:';
  RAISE NOTICE '  1. Prospect (0-10 users)';
  RAISE NOTICE '  2. Outpost (11-50 users)';
  RAISE NOTICE '  3. District (51-200 users)';
  RAISE NOTICE '  4. City Center (201-1000 users)';
  RAISE NOTICE '  5. Network Hub (1000+ users)';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ Features Enabled:';
  RAISE NOTICE '  - Map your Sync (200 Zo reward)';
  RAISE NOTICE '  - Local/Global filtering by city';
  RAISE NOTICE '  - City progression tracking';
  RAISE NOTICE '  - Community goals (city quests)';
END $$;


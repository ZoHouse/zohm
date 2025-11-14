-- Migration: Add Spatial Indexes for GeoJSON Clustering (Safe Version)
-- Created: 2025-11-14
-- Purpose: Optimize bbox queries for map clustering performance
-- Note: Only creates indexes if tables exist

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Check and add spatial index for events table (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'events'
  ) THEN
    -- Add spatial index for events
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_events_location'
    ) THEN
      EXECUTE 'CREATE INDEX idx_events_location ON events USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))';
      RAISE NOTICE '✅ Created spatial index: idx_events_location';
    ELSE
      RAISE NOTICE 'ℹ️  Index idx_events_location already exists';
    END IF;

    -- Add composite index for events with time filtering
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_events_location_time'
    ) THEN
      EXECUTE 'CREATE INDEX idx_events_location_time ON events (latitude, longitude, starts_at, ends_at) WHERE latitude IS NOT NULL AND longitude IS NOT NULL';
      RAISE NOTICE '✅ Created composite index: idx_events_location_time';
    ELSE
      RAISE NOTICE 'ℹ️  Index idx_events_location_time already exists';
    END IF;

    -- Add GIN index for metadata
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_events_metadata'
    ) THEN
      EXECUTE 'CREATE INDEX idx_events_metadata ON events USING GIN (metadata) WHERE metadata IS NOT NULL';
      RAISE NOTICE '✅ Created metadata index: idx_events_metadata';
    ELSE
      RAISE NOTICE 'ℹ️  Index idx_events_metadata already exists';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Table "events" does not exist - skipping events indexes';
  END IF;
END $$;

-- Check and add spatial index for nodes table (only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'nodes'
  ) THEN
    -- Add spatial index for nodes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_nodes_location'
    ) THEN
      EXECUTE 'CREATE INDEX idx_nodes_location ON nodes USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326))';
      RAISE NOTICE '✅ Created spatial index: idx_nodes_location';
    ELSE
      RAISE NOTICE 'ℹ️  Index idx_nodes_location already exists';
    END IF;

    -- Add composite index for nodes
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_nodes_location_active'
    ) THEN
      EXECUTE 'CREATE INDEX idx_nodes_location_active ON nodes (latitude, longitude, name) WHERE latitude IS NOT NULL AND longitude IS NOT NULL';
      RAISE NOTICE '✅ Created composite index: idx_nodes_location_active';
    ELSE
      RAISE NOTICE 'ℹ️  Index idx_nodes_location_active already exists';
    END IF;

    -- Add GIN index for metadata
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'idx_nodes_metadata'
    ) THEN
      EXECUTE 'CREATE INDEX idx_nodes_metadata ON nodes USING GIN (metadata) WHERE metadata IS NOT NULL';
      RAISE NOTICE '✅ Created metadata index: idx_nodes_metadata';
    ELSE
      RAISE NOTICE 'ℹ️  Index idx_nodes_metadata already exists';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  Table "nodes" does not exist - skipping nodes indexes';
  END IF;
END $$;

RAISE NOTICE '✅ Migration completed';

-- Down migration (rollback)
-- DROP INDEX IF EXISTS idx_events_location;
-- DROP INDEX IF EXISTS idx_nodes_location;
-- DROP INDEX IF EXISTS idx_events_location_time;
-- DROP INDEX IF EXISTS idx_nodes_location_active;
-- DROP INDEX IF EXISTS idx_events_metadata;
-- DROP INDEX IF EXISTS idx_nodes_metadata;


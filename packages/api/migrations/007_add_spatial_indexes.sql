-- Migration: Add Spatial Indexes for GeoJSON Clustering
-- Created: 2025-11-14
-- Purpose: Optimize bbox queries for map clustering performance

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add spatial index for events table
-- This enables fast bounding box queries for map viewport
CREATE INDEX IF NOT EXISTS idx_events_location 
ON events USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Add spatial index for nodes table
CREATE INDEX IF NOT EXISTS idx_nodes_location 
ON nodes USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
);

-- Add composite index for events with time filtering
CREATE INDEX IF NOT EXISTS idx_events_location_time 
ON events (latitude, longitude, starts_at, ends_at)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add composite index for nodes
CREATE INDEX IF NOT EXISTS idx_nodes_location_active 
ON nodes (latitude, longitude, name)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add GIN index for faster JSON queries on metadata (if needed)
CREATE INDEX IF NOT EXISTS idx_events_metadata 
ON events USING GIN (metadata)
WHERE metadata IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nodes_metadata 
ON nodes USING GIN (metadata)
WHERE metadata IS NOT NULL;

-- Verify indexes
DO $$
BEGIN
  RAISE NOTICE '✅ Spatial indexes created successfully';
  RAISE NOTICE 'Events spatial index: idx_events_location';
  RAISE NOTICE 'Nodes spatial index: idx_nodes_location';
  RAISE NOTICE 'Events time index: idx_events_location_time';
  RAISE NOTICE 'Nodes active index: idx_nodes_location_active';
END $$;

-- Down migration (rollback)
-- DROP INDEX IF EXISTS idx_events_location;
-- DROP INDEX IF EXISTS idx_nodes_location;
-- DROP INDEX IF EXISTS idx_events_location_time;
-- DROP INDEX IF EXISTS idx_nodes_location_active;
-- DROP INDEX IF EXISTS idx_events_metadata;
-- DROP INDEX IF EXISTS idx_nodes_metadata;


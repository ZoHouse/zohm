-- Migration 008: Add Deepak's Zo House
-- Adds Deepak's Zo House node to the map
-- Date: 2025-11-17

BEGIN;

-- Insert Deepak's Zo House node
-- TODO: Replace LATITUDE and LONGITUDE with actual coordinates from Google Maps
INSERT INTO nodes (
  id,
  name,
  type,
  description,
  city,
  country,
  latitude,
  longitude,
  website,
  twitter,
  features,
  status,
  image,
  contact_email,
  inserted_at,
  updated_at
)
VALUES (
  'deepak-zo-house',                      -- Unique ID
  'Deepak''s Zo House',                   -- Name (note: escaped apostrophe)
  'culture_house',                        -- Type: culture_house, hacker_space, schelling_point, flo_zone, or staynode
  'Deepak''s Zo House - Community hub',  -- Description
  'CITY_NAME',                            -- TODO: Replace with actual city name (e.g., 'Bangalore', 'Mumbai')
  'COUNTRY_NAME',                         -- TODO: Replace with actual country (e.g., 'India', 'United States')
  NULL,                                   -- TODO: Replace with actual latitude (e.g., 12.932658)
  NULL,                                   -- TODO: Replace with actual longitude (e.g., 77.634402)
  NULL,                                   -- Website (optional)
  NULL,                                   -- Twitter handle (optional)
  ARRAY['coworking', 'coliving', 'events'], -- Features
  'active',                               -- Status: active, developing, or planning
  NULL,                                   -- Image URL (optional)
  NULL,                                   -- Contact email (optional)
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  description = EXCLUDED.description,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  website = EXCLUDED.website,
  twitter = EXCLUDED.twitter,
  features = EXCLUDED.features,
  status = EXCLUDED.status,
  image = EXCLUDED.image,
  contact_email = EXCLUDED.contact_email,
  updated_at = NOW();

-- Verify insertion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM nodes WHERE id = 'deepak-zo-house') THEN
    RAISE NOTICE '✅ Deepak''s Zo House node added/updated successfully';
    RAISE NOTICE '   - ID: deepak-zo-house';
    RAISE NOTICE '   - Name: Deepak''s Zo House';
  ELSE
    RAISE EXCEPTION '❌ Failed to add Deepak''s Zo House node';
  END IF;
END $$;

COMMIT;

-- ============================================
-- INSTRUCTIONS FOR COMPLETING THIS MIGRATION
-- ============================================
-- 
-- 1. Get coordinates from Google Maps:
--    https://maps.app.goo.gl/6TKeKZSGH7fBF5f29?g_st=ipc
--    - Open the link
--    - Right-click on location pin → "What's here?"
--    - Copy the latitude and longitude
--
-- 2. Update the following fields in this file:
--    - latitude: Replace NULL with actual latitude (e.g., 12.932658)
--    - longitude: Replace NULL with actual longitude (e.g., 77.634402)
--    - city: Replace 'CITY_NAME' with actual city (e.g., 'Bangalore')
--    - country: Replace 'COUNTRY_NAME' with actual country (e.g., 'India')
--
-- 3. Optional: Add more details
--    - website: Deepak's website URL
--    - twitter: Twitter handle (without @)
--    - contact_email: Contact email
--    - image: Image URL for the node
--
-- 4. Run the migration:
--    psql $DATABASE_URL -f packages/api/migrations/008_add_deepak_zo_house.sql
--
-- 5. Verify on map:
--    - Restart dev server
--    - Open map
--    - Look for "Deepak's Zo House" marker
--
-- ============================================


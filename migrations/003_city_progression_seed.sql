-- ============================================
-- CITY PROGRESSION - SEED DATA (53 CityxZo Cities)
-- ============================================
-- This seeds all CityxZo cities from the spreadsheet data
-- Run this AFTER 003_city_progression.sql
-- ============================================

INSERT INTO cities (id, name, country, latitude, longitude, stage, node_count, metadata) VALUES

-- Major Zo House Cities (Stage 4 - City Center)
('bangalore-in', 'Bangalore', 'India', 12.9716, 77.5946, 4, 3, '{"climate": "Tropical"}'),
('san-francisco-us', 'San Francisco', 'United States', 37.7749, -122.4194, 4, 2, '{"climate": "Mediterranean"}'),
('singapore-sg', 'Singapore', 'Singapore', 1.3521, 103.8198, 4, 1, '{"climate": "Tropical"}'),
('dubai-ae', 'Dubai', 'United Arab Emirates', 25.276987, 55.296249, 4, 1, '{"climate": "Desert"}'),

-- Active Zo Communities (Stage 3 - District)
('barcelona-es', 'Barcelona', 'Spain', 41.3851, 2.1734, 3, 1, '{"climate": "Mediterranean"}'),
('amsterdam-nl', 'Amsterdam', 'Netherlands', 52.3676, 4.9041, 3, 1, '{"climate": "Temperate"}'),
('berlin-de', 'Berlin', 'Germany', 52.52, 13.405, 3, 1, '{"climate": "Temperate"}'),
('london-gb', 'London', 'United Kingdom', 51.5074, -0.1278, 3, 1, '{"climate": "Temperate"}'),
('paris-fr', 'Paris', 'France', 48.8566, 2.3522, 3, 1, '{"climate": "Temperate"}'),
('mumbai-in', 'Mumbai', 'India', 19.0760, 72.8777, 3, 1, '{"climate": "Tropical"}'),
('tokyo-jp', 'Tokyo', 'Japan', 35.6895, 139.6917, 3, 1, '{"climate": "Humid Subtropical"}'),
('new-york-us', 'New York', 'United States', 40.7128, -74.0060, 3, 1, '{"climate": "Humid Subtropical"}'),

-- Emerging Communities (Stage 2 - Outpost)
('prague-cz', 'Prague', 'Czech Republic', 50.0755, 14.4378, 2, 0, '{"climate": "Temperate"}'),
('istanbul-tr', 'Istanbul', 'Turkey', 41.0082, 28.9784, 2, 0, '{"climate": "Mediterranean"}'),
('helsinki-fi', 'Helsinki', 'Finland', 60.1699, 24.9384, 2, 0, '{"climate": "Continental"}'),
('tallinn-ee', 'Tallinn', 'Estonia', 59.437, 24.7536, 2, 0, '{"climate": "Continental"}'),
('lagos-ng', 'Lagos', 'Nigeria', 6.5244, 3.3792, 2, 0, '{"climate": "Tropical"}'),
('buenos-aires-ar', 'Buenos Aires', 'Argentina', -34.6037, -58.3816, 2, 0, '{"climate": "Humid Subtropical"}'),
('santiago-cl', 'Santiago', 'Chile', -33.4489, -70.6693, 2, 0, '{"climate": "Mediterranean"}'),
('montreal-ca', 'Montreal', 'Canada', 45.5017, -73.5673, 2, 0, '{"climate": "Continental"}'),
('mexico-city-mx', 'Mexico City', 'Mexico', 19.4326, -99.1332, 2, 0, '{"climate": "Subtropical"}'),
('las-vegas-us', 'Las Vegas', 'United States', 36.1699, -115.1398, 2, 0, '{"climate": "Desert"}'),
('lisbon-pt', 'Lisbon', 'Portugal', 38.7223, -9.1393, 2, 0, '{"climate": "Mediterranean"}'),
('melbourne-au', 'Melbourne', 'Australia', -37.8136, 144.9631, 2, 0, '{"climate": "Temperate"}'),
('warsaw-pl', 'Warsaw', 'Poland', 52.2297, 21.0122, 2, 0, '{"climate": "Continental"}'),
('ljubljana-si', 'Ljubljana', 'Slovenia', 46.0569, 14.5058, 2, 0, '{"climate": "Continental"}'),
('stockholm-se', 'Stockholm', 'Sweden', 59.3293, 18.0686, 2, 0, '{"climate": "Continental"}'),
('cairo-eg', 'Cairo', 'Egypt', 30.0444, 31.2357, 2, 0, '{"climate": "Desert"}'),
('zurich-ch', 'Zurich', 'Switzerland', 47.3769, 8.5417, 2, 0, '{"climate": "Temperate"}'),
('bangkok-th', 'Bangkok', 'Thailand', 13.7563, 100.5018, 2, 0, '{"climate": "Tropical"}'),
('shanghai-cn', 'Shanghai', 'China', 31.2304, 121.4737, 2, 0, '{"climate": "Humid Subtropical"}'),
('hong-kong-hk', 'Hong Kong', 'Hong Kong', 22.3193, 114.1694, 2, 0, '{"climate": "Humid Subtropical"}'),
('seoul-kr', 'Seoul', 'South Korea', 37.5665, 126.9780, 2, 0, '{"climate": "Humid Continental"}'),
('tel-aviv-il', 'Tel Aviv', 'Israel', 32.0853, 34.7818, 2, 0, '{"climate": "Mediterranean"}'),
('manila-ph', 'Manila', 'Philippines', 14.5995, 120.9842, 2, 0, '{"climate": "Tropical"}'),
('moscow-ru', 'Moscow', 'Russia', 55.7558, 37.6173, 2, 0, '{"climate": "Continental"}'),
('kuala-lumpur-my', 'Kuala Lumpur', 'Malaysia', 3.1390, 101.6869, 2, 0, '{"climate": "Tropical"}'),
('sao-paulo-br', 'São Paulo', 'Brazil', -23.5505, -46.6333, 2, 0, '{"climate": "Subtropical"}'),
('miami-us', 'Miami', 'United States', 25.7617, -80.1918, 2, 0, '{"climate": "Tropical"}'),
('cape-town-za', 'Cape Town', 'South Africa', -33.9249, 18.4241, 2, 0, '{"climate": "Mediterranean"}'),
('bogota-co', 'Bogota', 'Colombia', 4.7110, -74.0721, 2, 0, '{"climate": "Tropical"}'),
('vancouver-ca', 'Vancouver', 'Canada', 49.2827, -123.1207, 2, 0, '{"climate": "Temperate"}'),
('los-angeles-us', 'Los Angeles', 'United States', 34.0522, -118.2437, 2, 0, '{"climate": "Mediterranean"}'),
('seattle-us', 'Seattle', 'United States', 47.6062, -122.3321, 2, 0, '{"climate": "Temperate"}'),
('auckland-nz', 'Auckland', 'New Zealand', -36.8485, 174.7633, 2, 0, '{"climate": "Temperate"}'),
('toronto-ca', 'Toronto', 'Canada', 43.6532, -79.3832, 2, 0, '{"climate": "Continental"}'),

-- Prospect Cities (Stage 1)
('goa-in', 'Goa', 'India', 15.2993, 74.1240, 1, 0, '{"climate": "Tropical"}'),
('ho-chi-minh-vn', 'Ho Chi Minh City', 'Vietnam', 10.7769, 106.7009, 1, 0, '{"climate": "Tropical"}'),
('canggu-id', 'Canggu', 'Indonesia', -8.6478, 115.1385, 1, 0, '{"climate": "Tropical"}'),
('bali-id', 'Bali', 'Indonesia', -8.3405, 115.092, 1, 0, '{"climate": "Tropical"}'),
('phuket-th', 'Phuket', 'Thailand', 7.8804, 98.3923, 1, 0, '{"climate": "Tropical"}'),
('madeira-pt', 'Madeira', 'Portugal', 32.7607, -16.9595, 1, 0, '{"climate": "Mediterranean"}'),
('bitcoin-city-sv', 'Bitcoin City', 'El Salvador', 13.6929, -89.2182, 1, 0, '{"climate": "Tropical", "special": "Bitcoin Hub"}')

ON CONFLICT (id) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  node_count = EXCLUDED.node_count,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Seeded 53 CityxZo cities!';
  RAISE NOTICE '';
  RAISE NOTICE '🏙️ City Distribution:';
  RAISE NOTICE '  - Stage 4 (City Center): 4 cities';
  RAISE NOTICE '  - Stage 3 (District): 8 cities';
  RAISE NOTICE '  - Stage 2 (Outpost): 34 cities';
  RAISE NOTICE '  - Stage 1 (Prospect): 7 cities';
  RAISE NOTICE '';
  RAISE NOTICE '🌍 Ready for Map your Sync feature!';
END $$;


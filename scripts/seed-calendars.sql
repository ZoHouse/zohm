-- Seed calendar URLs for event worker
-- Run this in Supabase SQL Editor

BEGIN;

-- Create calendars table if it doesn't exist
CREATE TABLE IF NOT EXISTS calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default calendar URLs
INSERT INTO calendars (name, url, is_active)
VALUES 
  ('Zo House Bangalore', 'https://api2.luma.com/ics/get?entity=calendar&id=cal-ZVonmjVxLk7F2oM', true),
  ('Zo House Bangalore (Discover)', 'https://api2.luma.com/ics/get?entity=discover&id=discplace-BDj7GNbGlsF7Cka', true),
  ('Zo House San Francisco', 'https://api2.luma.com/ics/get?entity=calendar&id=cal-3YNnBTToy9fnnjQ', true),
  ('ETHGlobal Events', 'https://api2.luma.com/ics/get?entity=calendar&id=cal-4BIGfE8WhTFQj9H', true)
ON CONFLICT (url) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verify
SELECT * FROM calendars WHERE is_active = true;

COMMIT;

-- Expected output: 4 calendar entries






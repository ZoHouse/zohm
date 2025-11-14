-- Migration 004: Rename gender to body_type
-- Simple column rename + constraint update
-- Date: 2025-11-13

BEGIN;

-- Step 1: Rename the column
ALTER TABLE users 
RENAME COLUMN gender TO body_type;

-- Step 2: Add constraint for bro/bae values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_body_type'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT check_body_type 
    CHECK (body_type IS NULL OR body_type IN ('bro', 'bae', 'male', 'female'));
  END IF;
END $$;

-- Step 3: Update any existing 'male'/'female' values to 'bro'/'bae'
UPDATE users 
SET body_type = 'bro' 
WHERE body_type = 'male';

UPDATE users 
SET body_type = 'bae' 
WHERE body_type = 'female';

-- Step 4: Update constraint to only allow bro/bae (remove male/female)
ALTER TABLE users DROP CONSTRAINT IF EXISTS check_body_type;

ALTER TABLE users
ADD CONSTRAINT check_body_type 
CHECK (body_type IS NULL OR body_type IN ('bro', 'bae'));

-- Step 5: Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_body_type 
ON users(body_type) 
WHERE body_type IS NOT NULL;

-- Step 6: Verify
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'body_type'
  ) THEN
    RAISE NOTICE '✅ Successfully renamed gender to body_type';
  ELSE
    RAISE EXCEPTION '❌ Failed to rename column';
  END IF;
END $$;

COMMIT;


-- Rollback Migration: Remove phone and birthdate fields from users table
-- Created: 2025-11-19
-- Description: Rolls back the addition of phone and birthdate columns

-- Remove birthdate column
ALTER TABLE users 
DROP COLUMN IF EXISTS birthdate;

-- Remove phone column
ALTER TABLE users 
DROP COLUMN IF EXISTS phone;



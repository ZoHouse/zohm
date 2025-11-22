-- Migration: Add phone and birthdate fields to users table
-- Created: 2025-11-19
-- Description: Adds phone number and birthdate columns to support complete user profiles in Zo Passport

-- Add phone column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL;

-- Add birthdate column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS birthdate DATE NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.phone IS 'User phone number for contact and verification';
COMMENT ON COLUMN users.birthdate IS 'User date of birth for profile completion';



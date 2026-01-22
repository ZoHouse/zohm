-- ============================================
-- Migration: Create event-covers storage bucket
-- Date: 2026-01-22
-- Purpose: Storage bucket for event cover images
-- ============================================

-- NOTE: This migration must be run via the Supabase Dashboard or CLI
-- Storage buckets cannot be created via SQL directly.
-- 
-- To create this bucket:
--
-- Option 1: Via Supabase Dashboard
-- 1. Go to Storage in your Supabase project
-- 2. Click "New bucket"
-- 3. Name: event-covers
-- 4. Public bucket: Yes (checked)
-- 5. File size limit: 5242880 (5MB)
-- 6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
--
-- Option 2: Via Supabase CLI
-- Run: supabase storage create event-covers --public
--
-- Option 3: Via JavaScript (run once in server/script)
-- const { error } = await supabase.storage.createBucket('event-covers', {
--   public: true,
--   fileSizeLimit: 5242880,
--   allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
-- });

-- ============================================
-- Storage Policies (run these in SQL Editor)
-- ============================================

-- Allow authenticated users to upload files
-- INSERT policy: Users can upload to their own folder
DO $$ 
BEGIN
  -- Check if the policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload event covers'
  ) THEN
    -- This needs to be run as raw SQL in the dashboard
    -- CREATE POLICY "Users can upload event covers"
    -- ON storage.objects FOR INSERT
    -- WITH CHECK (
    --   bucket_id = 'event-covers'
    --   AND auth.role() = 'authenticated'
    -- );
    RAISE NOTICE 'Storage policy needs to be created via Dashboard';
  END IF;
END $$;

-- ============================================
-- Alternative: Use service role for all uploads
-- ============================================
-- Since we use supabaseAdmin (service role) for uploads,
-- the bucket just needs to be public for reads.
-- No additional RLS policies are needed for uploads.

-- ============================================
-- Bucket Creation Script (run via node/ts)
-- ============================================
-- 
-- Save this as a script and run it once:
--
-- ```typescript
-- import { createClient } from '@supabase/supabase-js';
--
-- const supabase = createClient(
--   process.env.NEXT_PUBLIC_SUPABASE_URL!,
--   process.env.SUPABASE_SERVICE_ROLE_KEY!
-- );
--
-- async function createEventCoversBucket() {
--   const { data, error } = await supabase.storage.createBucket('event-covers', {
--     public: true,
--     fileSizeLimit: 5242880, // 5MB
--     allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
--   });
--
--   if (error) {
--     if (error.message?.includes('already exists')) {
--       console.log('Bucket already exists');
--     } else {
--       console.error('Error creating bucket:', error);
--     }
--   } else {
--     console.log('Bucket created:', data);
--   }
-- }
--
-- createEventCoversBucket();
-- ```

-- ============================================
-- Verify bucket exists (manual check)
-- ============================================
-- SELECT * FROM storage.buckets WHERE id = 'event-covers';
